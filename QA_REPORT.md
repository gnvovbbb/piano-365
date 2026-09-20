# Piano 365 — QA Report

## Поточний статус

Гілка `main` проходить автоматичний validation workflow.

Курс структурно складається з:
- **52 weekly files**;
- **364 щоденних секцій** у `course/week-01.md` … `course/week-52.md`;
- окремого **Дня 365** у `course/day-365.md`;
- точної послідовності **1 → 365** без навмисних пропусків;
- 12 послідовних фаз;
- контрольних точок на Днях 28, 56, 91, 119, 154, 182, 210, 238, 273, 301, 329, 343, 364 і 365.

## Що було перевірено й виправлено

### 1. Цілісність 365-денного курсу
Автоматичний QA перевіряє:
- наявність усіх 52 weekly files;
- рівно 7 day sections у кожному;
- відповідність номера дня конкретному тижню;
- глобальну послідовність 1–364;
- наявність окремого Day 365;
- локальні Markdown links.

### 2. Синхронізація curriculum
Після поглиблення всіх уроків були синхронізовані:
- `ROADMAP.md`;
- `COURSE_INDEX.md`;
- `PROGRESS_TRACKER.md`;
- `ASSESSMENTS.md`;
- `course-map.js`;
- web phase labels;
- milestone list.

Це виправило старі розбіжності, коли рання версія roadmap називала Дні 274–301 ear-training phase, хоча фінальний курс використовує їх для improvisation / 7th chords / ii–V–I / rubato.

### 3. Dream Piece progression
Фінальна послідовність:
- 183–224 — cinematic technique;
- 225–238 — Dream Piece preparation + early checkpoint;
- 239–273 — повна збірка, full draft, dynamic architecture і performance.

Day 238 більше **не вимагає готового повного твору**. Повний no-stop draft формується пізніше.

### 4. Playing by ear progression
Фінальна послідовність:
- 274–301 — improvisation, advanced harmony, timing/rubato;
- 302–308 — tonic;
- 309–315 — melody;
- 316–322 — bass + chords;
- 323–329 — full Ear Piece arrangement.

Day 329 = **Ear Arrangement Check**.

### 5. Performance progression
- 330–336 — memory layers + random starts;
- 337–343 — recovery після помилки;
- Day 343 = **Performance Stability & Recovery Check**;
- 344–364 — final set;
- Day 365 — Final Piano Day.

### 6. Theory audit
Виправлено ambiguity в A minor:
- natural minor і harmonic minor chords тепер розділені;
- natural minor має `v = Em`;
- harmonic minor має `V = E`, `III+ = Caug`, `vii° = G#dim`.

`CHORDS_AND_KEYS.md` містить базові one-octave fingerings для гам, які реально використовуються в курсі.

### 7. Adaptive pacing
Додано `ADAPTIVE_PACING.md`.

Важлива зміна:
**номер дня = номер навчального заняття, а не жорстка календарна дата.**

Документ містить:
- Full / Minimum 20 / Recovery;
- gates 0/1/2;
- повернення після перерв;
- support blocks;
- правила спрощення Dream Piece;
- реалістичні строки при 5/6/7 заняттях на тиждень.

### 8. Web app QA
Перевіряється:
- JavaScript syntax;
- HTML IDs;
- відсутність duplicate IDs;
- кожен `$("#id")` має реальний HTML element;
- navigation panels існують;
- course phases покривають 1–365 без overlap/gaps;
- 52 week titles;
- milestone integration;
- localStorage;
- AudioContext;
- MediaRecorder;
- PWA shell references.

### 9. Виправлені web bugs
- прибрано можливість подвійно зарахувати завершену timer session;
- activity history обрізається до контрольованого розміру;
- import progress JSON очищається й перевіряється;
- invalid day keys не імпортуються;
- notes мають size limit;
- negative/absurd minutes не проходять;
- recorder використовує extension відповідно до MIME type;
- achievement **Play by Ear** перенесено з Day 301 на Day 329;
- додано Recovery achievement для Day 343.

### 10. Markdown hygiene
QA відхиляє literal escaped-newline artifacts у Markdown.

README був переписаний начисто після виявлення старих `\n`-артефактів.

---

## Що автоматично перевіряє GitHub Actions

Основний validator:
`scripts/validate_course.py`

Workflow:
`.github/workflows/validate.yml`

Він перевіряє:
1. JavaScript syntax.
2. Course file count.
3. Exact day sequence.
4. Curriculum gates.
5. Canonical theory facts.
6. Fingerings.
7. Broken local links.
8. Markdown hygiene.
9. HTML ↔ JS integrity.
10. Phase coverage.
11. Week-title count.
12. PWA/audio/recorder integration.
13. Pacing sanity.

---

## Що автоматична перевірка принципово не може гарантувати

Навіть зелений workflow не означає, що:
- одна аплікатура буде ідеальною для руки кожної людини;
- конкретне Dream Piece arrangement підходить саме тобі;
- акустичне piano відрегульоване;
- посадка фізично правильна без перегляду викладачем;
- будь-який учень пройде курс за точно однаковий календарний час.

Для індивідуальної техніки відеоконтроль або хороший викладач може суттєво скоротити кількість помилкових звичок.

---

## GitHub Pages — єдина зовнішня ручна дія

Web app уже готовий до deployment.

Але GitHub App не має permission **вперше створити Pages site** для цього repo.

Власнику треба один раз:

1. `Settings → Pages`;
2. `Build and deployment → Source: GitHub Actions`;
3. `Actions → Deploy Piano 365 to GitHub Pages → Run workflow`.

Після цього очікувана адреса:

`https://gnvovbbb.github.io/piano-365/`

До цього web app можна запускати локально через:
`start-local.bat`.

---

# QA verdict

Piano 365 зараз має:
- завершений curriculum Day 1–365;
- узгоджені phases й milestones;
- окремий Dream Piece track;
- системний playing-by-ear track;
- adaptive pacing;
- web practice tools;
- автоматичний regression QA.

Наступні зміни в repo бажано робити тільки зі збереженням зеленого `Validate Piano 365`.
