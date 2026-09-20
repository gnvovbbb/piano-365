#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / "course"

errors: list[str] = []
warnings: list[str] = []

DAY_RE = re.compile(r"^## День (\d+)\s*[—-]\s*(.+)$", re.M)
MD_LINK_RE = re.compile(r"\[[^\]]+\]\(([^)]+)\)")


def fail(message: str) -> None:
    errors.append(message)


def warn(message: str) -> None:
    warnings.append(message)


def words(text: str) -> int:
    return len(re.findall(r"[A-Za-zА-Яа-яІіЇїЄєҐґ0-9#♭]+", text))


# 1) Every weekly file must exist and contain exactly its seven days.
all_days: list[int] = []
day_sections: dict[int, str] = {}

for week in range(1, 53):
    path = COURSE / f"week-{week:02d}.md"
    if not path.exists():
        fail(f"Missing {path.relative_to(ROOT)}")
        continue

    text = path.read_text(encoding="utf-8")
    matches = list(DAY_RE.finditer(text))
    expected = list(range((week - 1) * 7 + 1, week * 7 + 1))
    found = [int(m.group(1)) for m in matches]

    if found != expected:
        fail(
            f"{path.relative_to(ROOT)} has day headers {found}; expected {expected}"
        )

    if len(matches) != 7:
        fail(f"{path.relative_to(ROOT)} must contain exactly 7 day sections")

    for idx, match in enumerate(matches):
        day = int(match.group(1))
        start = match.start()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        section = text[start:end].strip()
        all_days.append(day)
        day_sections[day] = section

        wc = words(section)
        if wc < 18:
            warn(f"Day {day} is unusually short ({wc} words)")

        actionable = (
            re.search(r"^###?\s", section, re.M)
            or re.search(r"^[-*]\s", section, re.M)
            or re.search(r"^\d+[.)]\s", section, re.M)
        )
        if not actionable:
            fail(f"Day {day} has no actionable list/subsection")

# 2) Exact global day sequence.
expected_days = list(range(1, 365))
counts = Counter(all_days)
missing = [d for d in expected_days if counts[d] == 0]
duplicates = [d for d, c in counts.items() if c > 1]
extra = [d for d in counts if d < 1 or d > 364]

if all_days != expected_days:
    fail(
        "Global daily sequence is not exactly 1..364 "
        f"(missing={missing}, duplicates={duplicates}, extra={extra})"
    )

# 3) Final day.
day365_path = COURSE / "day-365.md"
if not day365_path.exists():
    fail("Missing course/day-365.md")
else:
    day365 = day365_path.read_text(encoding="utf-8")
    if not re.search(r"^# День 365\b", day365, re.M):
        fail("course/day-365.md must start with a Day 365 heading")
    if words(day365) < 400:
        warn(f"Day 365 is unexpectedly short ({words(day365)} words)")

# 4) Minimum curriculum gates. These catch accidental removal/reordering.
gates = {
    1: ["C-position", "60 BPM"],
    29: ["C major", "1–3–5"],
    57: ["C major", "ступені"],
    92: ["A minor"],
    120: ["Roman numerals"],
    155: ["Block", "broken"],
    183: ["ostinato"],
    225: ["аранжування", "секції"],
    274: ["мотив"],
    302: ["tonic"],
    309: ["Sing", "Find first note"],
    330: ["checkpoint"],
    364: ["Dress Rehearsal"],
}

for day, needles in gates.items():
    section = day_sections.get(day, "")
    low = section.lower()
    for needle in needles:
        if needle.lower() not in low:
            fail(f"Day {day} lost curriculum gate text: {needle!r}")

# 5) Canonical theory facts that must remain correct.
required_facts = [
    ("course/week-05.md", "C major = C E G"),
    ("course/week-05.md", "F major = F A C"),
    ("course/week-05.md", "G major = G B D"),
    ("course/week-06.md", "Am = A C E"),
    ("course/week-06.md", "Dm = D F A"),
    ("course/week-06.md", "Em = E G B"),
    ("course/week-10.md", "G A B C D E F# G"),
    ("course/week-11.md", "F G A Bb C D E F"),
    ("course/week-14.md", "A B C D E F G# A"),
    ("course/week-15.md", "D E F G A Bb C# D"),
    ("course/week-15.md", "E F# G A B C D# E"),
    ("course/week-22.md", "D E F# G A B C# D"),
    ("course/week-22.md", "Bb C D Eb F G A Bb"),
    ("course/week-42.md", "C-E-G-B"),
    ("course/week-42.md", "D-F-A-C"),
    ("course/week-42.md", "G-B-D-F"),
]

for rel, fact in required_facts:
    path = ROOT / rel
    if not path.exists() or fact not in path.read_text(encoding="utf-8"):
        fail(f"Canonical theory fact missing/changed in {rel}: {fact}")

# 6) Fingering facts explicitly taught by the course.
required_fingerings = [
    ("course/week-09.md", "1 2 3 1 2 3 4 5"),
    ("course/week-09.md", "5 4 3 2 1 3 2 1"),
    ("course/week-11.md", "1 2 3 4 1 2 3 4"),
]

for rel, fingering in required_fingerings:
    text = (ROOT / rel).read_text(encoding="utf-8")
    if fingering not in text:
        fail(f"Expected fingering missing in {rel}: {fingering}")

# 7) Local Markdown links should resolve.
for path in ROOT.rglob("*.md"):
    text = path.read_text(encoding="utf-8")
    for target in MD_LINK_RE.findall(text):
        if (
            target.startswith(("http://", "https://", "#", "mailto:"))
            or target.strip() == ""
        ):
            continue
        clean = target.split("#", 1)[0]
        if not clean:
            continue
        resolved = (path.parent / clean).resolve()
        try:
            resolved.relative_to(ROOT.resolve())
        except ValueError:
            fail(f"{path.relative_to(ROOT)} links outside repo: {target}")
            continue
        if not resolved.exists():
            fail(f"Broken local link in {path.relative_to(ROOT)}: {target}")

# 8) Web-app integration.
index = (ROOT / "index.html").read_text(encoding="utf-8")
app = (ROOT / "app.js").read_text(encoding="utf-8")
course_map = (ROOT / "course-map.js").read_text(encoding="utf-8")

for literal, rel in [
    ("styles.css", "index.html"),
    ("course-map.js", "index.html"),
    ("app.js", "index.html"),
    ("manifest.webmanifest", "index.html"),
]:
    if literal not in index:
        fail(f"{rel} missing reference to {literal}")

if "\\n" in index:
    fail("index.html contains a literal escaped newline artifact")

for day in (28, 56, 91, 119, 154, 182, 210, 238, 273, 301, 329, 343, 364, 365):
    if str(day) not in course_map:
        fail(f"course-map.js appears to have lost milestone {day}")

if "localStorage" not in app:
    fail("app.js no longer persists progress")
if "MediaRecorder" not in app:
    fail("app.js no longer contains practice recorder support")
if "AudioContext" not in app:
    fail("app.js no longer contains audio/ear-training support")

# 9) Pacing sanity checks.
# Heavy concepts must not migrate into the beginner month by accident.
early = "\n".join(day_sections[d] for d in range(1, 29))
if re.search(r"ii.?V.?I|major7|minor7|dominant 7|wide arpeggio|ostinato", early, re.I):
    fail("Advanced harmony/cinematic material leaked into Days 1–28")

# Concepts are expected no earlier than these curriculum gates.
concept_first_day = {
    "full scales": (57, r"гама C major|C major scale"),
    "functional harmony": (120, r"Roman numerals|функці"),
    "syncopation": (169, r"синкоп|offbeat"),
    "cinematic ostinato": (183, r"ostinato"),
    "Dream Piece build": (225, r"Dream Piece"),
    "7th chords": (288, r"maj7|minor 7|dominant 7|септакорд"),
    "systematic tonic finding": (302, r"tonic"),
}
full_course = "\n".join(day_sections[d] for d in range(1, 365))
for label, (expected_start, pattern) in concept_first_day.items():
    first = None
    rx = re.compile(pattern, re.I)
    for day in range(1, 365):
        if rx.search(day_sections[day]):
            first = day
            break
    if first is not None and first < expected_start:
        fail(f"{label} appears too early on Day {first}; gate is Day {expected_start}")

# Flag only extreme day-size anomalies; normal concise practice days are intentional.
for day in range(2, 364):
    a = words(day_sections[day - 1])
    b = words(day_sections[day])
    c_next = words(day_sections[day + 1])
    neighbour_avg = (a + c_next) / 2
    if neighbour_avg and b > max(220, neighbour_avg * 3.5):
        warn(f"Day {day} is much longer than both neighbours ({b} words)")

print(f"Validated {len(all_days) + 1} days across 52 weeks.")
if warnings:
    print(f"Warnings: {len(warnings)}")
    for item in warnings:
        print(f"WARNING: {item}")

if errors:
    print(f"Errors: {len(errors)}", file=sys.stderr)
    for item in errors:
        print(f"ERROR: {item}", file=sys.stderr)
    sys.exit(1)

print("Piano 365 QA passed.")
