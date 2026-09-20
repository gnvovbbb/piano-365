# Piano 365 🎹

**Piano 365** — повний курс із **365 навчальних днів** для дорослого початківця, який хоче не просто завчити кілька творів, а побудувати самостійну музичну базу.

Головні цілі:
- впевнено грати двома руками;
- розуміти клавіатуру, акорди й функціональну гармонію;
- читати базовий нотний текст;
- користуватися pedal, dynamics, phrasing і voicing;
- імпровізувати на знайомій harmony;
- підбирати прості melodies, bass і chords на слух;
- підготувати один великий **Dream Piece** рівня доступного аранжування музики на кшталт *Interstellar*;
- зіграти фінальний set із 3–5 номерів;
- навчитися **самостійно вчити наступну музику** після завершення курсу.

## Важливо про «365 днів»

Це **365 навчальних занять**, а не вимога перескакувати матеріал за календарем.

- 7 занять/тиждень ≈ 1 календарний рік;
- 6 занять/тиждень ≈ 14 місяців;
- 5 занять/тиждень ≈ 17 місяців.

Якщо твоя ціль — вкластися приблизно в рік, потрібна дуже регулярна практика. Якщо життя розтягує курс довше — краще продовжити з наступного навчального дня, ніж формально пропустити навички.

Детально: [ADAPTIVE_PACING.md](ADAPTIVE_PACING.md).

## Формат заняття

### Full — 45–60 хв
- 8–12 хв техніка;
- 5–10 хв слух / rhythm / reading;
- 20–30 хв repertoire або головна навичка;
- 5–10 хв improvisation / recording / контроль.

### Minimum 20
- 5 хв техніка;
- 5 хв слух або reading;
- 10 хв головний фрагмент.

### Recovery
Після перерви, хвороби або сильного навантаження — легше заняття без tempo records і без спроб «надолужити» кілька днів за один вечір.

## Структура курсу

- [START_HERE.md](START_HERE.md) — посадка, місце, baseline перед Днем 1.
- [COURSE_INDEX.md](COURSE_INDEX.md) — навігація по всіх 365 днях.
- [ROADMAP.md](ROADMAP.md) — 12 фаз року.
- [ADAPTIVE_PACING.md](ADAPTIVE_PACING.md) — коли рухатися далі, затримувати skill або спрощувати material.
- [PRACTICE_SYSTEM.md](PRACTICE_SYSTEM.md) — slow practice, loops, metronome, Minimum 20.
- [TECHNIQUE.md](TECHNIQUE.md) — посадка, кисть, pedal, balance, speed.
- [CHORDS_AND_KEYS.md](CHORDS_AND_KEYS.md) — chords, keys і базові scale fingerings.
- [EAR_TRAINING.md](EAR_TRAINING.md) — система розвитку відносного слуху.
- [PLAYING_BY_EAR_PATH.md](PLAYING_BY_EAR_PATH.md) — повний шлях tonic → melody → bass → harmony.
- [SIGHT_READING.md](SIGHT_READING.md) — система читання з листа.
- [METRONOME_PROTOCOL.md](METRONOME_PROTOCOL.md) — як працювати з tempo.
- [REPERTOIRE.md](REPERTOIRE.md) — як вести repertoire.
- [REPERTOIRE_LADDER.md](REPERTOIRE_LADDER.md) — типи творів на 12 місяців.
- [INTERSTELLAR_PROJECT.md](INTERSTELLAR_PROJECT.md) — методика великого Dream Piece без публікації захищених нот.
- [ASSESSMENTS.md](ASSESSMENTS.md) — контрольні точки й scoring rubrics.
- [PROGRESS_TRACKER.md](PROGRESS_TRACKER.md) — як оцінювати прогрес.
- [PRACTICE_JOURNAL.md](PRACTICE_JOURNAL.md) — короткий journal.
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — що робити, коли щось системно не виходить.
- [PERFORMANCE_CHECKLIST.md](PERFORMANCE_CHECKLIST.md) — підготовка до камери/аудиторії.
- [QA_REPORT.md](QA_REPORT.md) — що перевірено автоматично й вручну.
- [course/](course/) — 52 тижні, Дні 1–364 + окремий День 365.

## 12 фаз

1. **1–28:** фундамент.
2. **29–56:** chords, inversions, accompaniment, pedal.
3. **57–91:** C/G/F major, reading, eighths/rests.
4. **92–119:** minor, phrasing, voicing.
5. **120–154:** functional harmony, bass, harmonization, transposition.
6. **155–182:** arpeggios, hand independence, syncopation, Half-Year Exam.
7. **183–224:** cinematic technique.
8. **225–273:** Dream Piece.
9. **274–301:** improvisation, 7th chords, ii–V–I, rubato.
10. **302–329:** systematic playing by ear.
11. **330–343:** memory + performance recovery.
12. **344–365:** final set + Final Piano Day.

## Інтерактивна веб-версія

У корені репозиторію є статичний web app, який:
- сам завантажує потрібний урок із Markdown;
- показує Day 1–365 і карту року;
- зберігає completed days, streak, notes і minutes у браузері;
- має practice timer;
- має metronome 40–220 BPM;
- має ear trainer «вище / нижче / та сама нота»;
- має **major/minor chord trainer**;
- має **interval trainer**;
- має microphone **Practice Recorder**;
- показує phase progress і achievements;
- дозволяє export/import progress JSON;
- працює як PWA та кешує вже відкриті матеріали.

## Локальний запуск на Windows

Найпростіше:
1. клонуй або завантаж репозиторій;
2. запусти `start-local.bat`;
3. відкриється `http://localhost:8000/`.

Докладніше: [LOCAL_RUN.md](LOCAL_RUN.md).

## GitHub Pages

Deployment workflow уже є в:
`.github/workflows/pages.yml`.

Через обмеження GitHub App перше ввімкнення Pages треба зробити власнику репозиторію один раз:

1. **Settings → Pages**;
2. **Build and deployment → Source: GitHub Actions**;
3. **Actions → Deploy Piano 365 to GitHub Pages → Run workflow**.

Після цього адреса має бути:
`https://gnvovbbb.github.io/piano-365/`

## Автоматичний QA

`.github/workflows/validate.yml` запускає:
- JavaScript syntax checks;
- перевірку 52 weekly files;
- точну послідовність Днів 1–364;
- окремий День 365;
- curriculum gates;
- canonical theory facts;
- scale fingering facts;
- local Markdown links;
- milestone integration;
- web-app references;
- перевірки PWA/audio/recorder functionality.

Основний скрипт:
`scripts/validate_course.py`.

## Головне правило практики

Якщо складне місце не виходить:

1. не грай весь твір із початку;
2. зменш tempo;
3. окремо RH/LH, якщо потрібно;
4. візьми 1–2 такти;
5. зроби 3 контрольовані повтори;
6. додай 1 такт до і після;
7. лише потім поверни фрагмент у context.

## Фізична безпека

Гострий біль, оніміння, повторюване печіння або сильне напруження, яке не зникає після паузи, — це причина зупинити конкретну вправу й перевірити техніку/навантаження.

Курс не замінює очного викладача для індивідуальної постановки рук.

## Авторське право

Репозиторій **не публікує ноти сучасних захищених авторським правом творів**.

Для Dream Piece використовуй:
- легально придбане/доступне аранжування;
- public-domain material, де застосовно;
- або власний підбір на слух.

## Початок

1. [START_HERE.md](START_HERE.md)
2. [Тиждень 01 — Дні 1–7](course/week-01.md)
3. Веб-додаток: `index.html` через локальний server або GitHub Pages.
