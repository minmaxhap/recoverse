# Recoverse Design System

Recoverse is a group-reflection product that turns a shared session into one published issue. The product should feel less like a diary app and more like an editorial ritual: friends gather, take turns asking questions, write fragmented but honest answers, reveal them together, then rediscover the same question across years.

## 1. Product Position

Recoverse is not Notion, Apple Journal, Day One, or a memo app. It is for people who already have reflection rituals, especially year-end reflections with friends, but want them to be easier to run, harder to lose, and more fun to revisit.

Core promise:

- Gather friends with a short code.
- Take turns asking one question at a time.
- Everyone answers before the spread opens.
- The session becomes an issue in the shelf.
- Years later, the same question becomes a rediscovery timeline.

Prioritize group ritual, paper-reflection preservation, and rediscovery. Avoid generic productivity, habit tracking, dashboards, or “write a beautiful essay” pressure.

## 2. Visual Direction

Current UI direction: editorial magazine, not cream-letter skeuomorphism.

- Paper background, strong ink lines, direct layout.
- One vermilion accent for primary actions and editorial marks.
- Gold only for award/ceremony moments.
- Participant colors act as stamps.
- Rectangular inputs and cards are intentional. Do not round everything.
- No dark “night post office”, wax-seal-heavy, ribbon, or decorative envelope scenes.

## 3. Tokens

These tokens match `recoverse-frontend/src/style.css` and are the source of truth.

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Paper base | `--paper` | `#FAF7F0` | App background |
| Paper card | `--paper-card` | `#FFFEFA` | Inputs, cards, panels |
| Ink | `--ink` | `#191511` | Primary text, rules, borders |
| Vermilion | `--vermilion` | `#D8451F` | Primary CTA, active editorial marks |
| CTA ink | `--vermilion-ink` | `#FFF6F0` | Text on vermilion |
| Gold | `--gold` | `#E7B355` | Awards and reveal highlights |
| Hairline | `--hairline` | `#DED8CB` | Internal dividers |
| Dim text | `--dim` | `#7A736A` | Captions, waiting copy |
| Strong dim | `--dim-strong` | `#5A544C` | Secondary body |

Participant stamps:

`--p1 #D8451F`, `--p2 #B98A2A`, `--p3 #3D7A5C`, `--p4 #4E6E93`, `--p5 #7D5578`, `--p6 #8C4B3A`.

## 4. Typography

- UI font: Pretendard.
- Display and quotes: Gowun Batang.
- Headlines use editorial rhythm, not app-dashboard density.
- Korean text uses `word-break: keep-all`.
- Body text should stay readable on 375px screens.

Core levels:

| Level | Size | Weight | Use |
| --- | --- | --- | --- |
| Page title | 25px | 700 | Mobile screen titles |
| Quote/body emphasis | 17px | 400-700 | Answers and reveal spreads |
| Body | 14-16px | 400-700 | Inputs, rows, helper text |
| Caption | 11-12px | 800 | Eyebrows, stamps, labels |

## 5. Layout Rules

- Mobile-first, single writing column around 480-560px.
- Reading/reveal screens may expand into a two-page spread on desktop.
- Use 1px ink or hairline borders as the main structure.
- Use `gap` and stacked forms rather than nested cards.
- Primary action is full-width in writing flows.
- Avoid card grids for text-heavy reflection history; lists and spreads are stronger.

## 6. Components

### Issue Cover

The first screen should communicate “publish an issue with friends” immediately. Entry actions are: create issue, join code, solo write, paper import, rediscover.

### Live Session

Phases are lobby, question, answer, guess, reveal, ended. The phase should be visually obvious through the top issue bar and the main editorial headline.

### Answer Expansion Chips

Answer writing must help fragmented notes become more meaningful. Prompts such as “그때 가장 선명한 장면은?” are allowed because they reduce blank-page friction without forcing polished writing.

### Paper Import

Paper import is preservation, not just manual entry. Always allow the user to record source context such as where the paper came from or who still has the original.

### Rediscovery

Rediscovery groups by normalized question. It should show how answers change across years and participants, not just list old notes.

## 7. Motion

- Use `transform` and `opacity` only.
- `rise` for page/spread entrance.
- `pulse` only for waiting/current-turn emphasis.
- `stampIn` only for reveal/closure moments.
- Respect `prefers-reduced-motion`.

## 8. Content Rules

Good Recoverse copy is concrete and ceremonial.

Use:

- “이번 호 시작하기”
- “헤드라인 확정”
- “내 답 싣기”
- “지난 호로 꽂기”
- “다시 발견”

Avoid:

- “작성 관리”
- “템플릿 선택” as the first value
- “생산성”, “저널링”, “대시보드”
- Copy that assumes the user wrote a moving essay

Recoverse must work even when the answer is a rough memo.
