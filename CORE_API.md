# Core API — models, storage and quiz

Pure ES modules under `public/js/`; no DOM, network, runtime dependencies or module-load access to browser storage. Public signatures in `IMPLEMENTATION_PLAN.md` are preserved. Only quiz scheduling/timer functions default `now` to `Date.now()`; pass epoch milliseconds for deterministic tests. Shuffle uses `Math.random()` and does not alter source arrays or question objects.

## Scientific models

### `transitCurve({starRadius, planetRadius, inclination, period, stellarMass, samples = 401})`

Returns `{samples:[{time,flux}], depth, impactParameter, semiMajorAxisAU, period}`.

- Both radii are **solar radii**, not a planet/star ratio. Inclination is degrees, period is days, stellar mass is solar masses; planetary mass is neglected.
- Circular Kepler orbit: `a/AU = cbrt(stellarMass * (period/365.25)^2)`. Uses AU = 149597870700 m and solar radius = 695700000 m. This is the solar-unit Kepler approximation, not an ephemeris.
- Uniform stellar disk, exact geometric two-circle overlap, no limb darkening/noise/planet light. Only the front half of the orbit blocks starlight; the opposite conjunction has flux 1.
- Samples are equally spaced over **0 through 2 periods inclusive**. Front conjunctions are at `period/2` and `1.5*period`; count `4n+1` includes both centers exactly. Other counts can undersample a narrow dip. `depth` is the analytic center depth, not the maximum of the sampled points. `impactParameter` is projected conjunction separation divided by stellar radius.
- Validation bounds: star radius 0.0001–1000; planet radius 0.000001–100; inclination 0–180; period 0.001–1000000 days; stellar mass 0.001–1000. All must be finite numbers, not numeric strings. Integer sample count is 5–10000. The orbit must exceed the sum of both radii. Invalid inputs throw.
- Input object has no defaults except sample count. Output flux is normalized, in [0,1].

### `radiation({distance, luminosity, albedo})`

Returns `{flux, temperature, relativeFlux}`. Distance is AU, luminosity is solar luminosities, albedo is dimensionless Bond albedo.

`relativeFlux = luminosity/distance²`; `flux = 1361*relativeFlux` W/m²; `temperature = [flux*(1-albedo)/(4*5.670374419e-8)]^(1/4)` K.

This is full-redistribution equilibrium blackbody temperature, **not surface temperature or evidence of habitability**. No atmosphere, greenhouse, internal heat or tidal model. Distance is bounded 1e-6–1e6; luminosity 1e-9–1e9; albedo 0–1, all finite numbers. Invalid inputs throw.

## Storage and backups

`STORAGE_KEY = 'orbital-fieldbook-state-v1'` is exported for explicit backup/reset UI. Storage is injected; pass `localStorage` or an object implementing `getItem` / `setItem`.

- `defaultState()` returns a fresh independent state.
- `validateState(value)` returns a newly reconstructed normalized state or **throws**. It is not a boolean predicate.
- `loadState(storage)` returns **`{state,error}`**, with `error:null` on success. Missing key returns defaults. Malformed/future data or read denial returns defaults and an error **string**. It never writes, deletes or replaces a corrupt original. UI should not autosave over an error without an explicit recovery choice/backup.
- `saveState(storage,state)` validates before writing and returns **`{ok,error}`**, `ok:true,error:null` only after `setItem` succeeds. Validation/quota/access failures are visible error strings. This is an explicit write and can replace an existing value; no implicit backup is made.
- `exportState(state)` returns validated compact JSON. `importState(text)` returns validated state or throws; neither changes storage. UI owns confirmation and backup-before-import.
- `validateSchedule(rows)` returns a new array sorted by numeric week; it requires **exactly 11** unique weeks 1 through 11. Only `validateState` accepts `schedule:[]` as the sentinel meaning use original schedule.

### Schema v1

All top-level fields are required. Unknown fields are stripped, never spread into normalized objects. No additional hidden fields are required by the current UI.

```js
{
  schemaVersion: 1,
  missions: { // optional keys "1" through "11" only
    "1": {steps:[false,false,false,false], evidence:""}
  },
  schedule: [], // or exactly 11 rows, shape below
  notes: ["", "", "", ""],
  attempts: [],
  recall: {},
  settings: {theme:"dark"}, // "dark" | "light"
  exam: null
}
```

- Schedule row: `{week:number, date:null|"YYYY-MM-DD", topic:string, mode:null|"LIVE"|"SELF", source_status:string}`. Dates must be real calendar dates, with no guessed dates for missing rows. Topic and source status each max 500 characters. Caller labels edits `user_entered` or another provenance string; it is preserved, not fabricated.
- Mission record: exactly four boolean steps, evidence string max 20000 characters. Unknown mission IDs and malformed records throw.
- Notes: exactly four strings, max 100000 characters per face in the full-state schema. The notes-only UI can impose its stricter 20000-character limit independently. Text is preserved as plain text, **not HTML-sanitized**; render with textContent/escaping.
- Attempt: `{questionId,lessonId,correct:boolean|null,score:number,timestamp:number}`. Score is 0–1; timestamp is nonnegative epoch milliseconds. Max 10000 records. **Written grading returns score:null, but persistence requires an explicit numeric self-rating** (e.g. quality/2) before recording an attempt; do not save an unassessed written grade as a scored attempt.
- Recall map: question ID → `{due:number,interval:number,repetitions:number}`. Due is nonnegative epoch milliseconds; interval is **days**, 0–36500; repetitions is an integer 0–1000000. Max 10000 entries.
- Exam: `{questionIds:string[],answers:object,startedAt:number,endsAt:number,submitted:boolean}`. Unique max 20 IDs. End must be exactly start + 3000000 ms. Answers are learner responses only, keyed by a selected question ID: null, integer option index 0–99, or text max 20000 characters. Missing keys mean unanswered. No answer keys, explanations, question objects, scores or feedback are retained in exam state.
- Question/lesson identifiers are nonempty strings max 120 characters. `__proto__`, `prototype`, and `constructor` are forbidden anywhere as keys or identifiers. No coercion of malformed identifiers.
- Backup input and serialized state max 2000000 JavaScript string code units. Max nesting depth 12, max 150000 visited values; arrays max 10000 elements. Reject cycles, sparse arrays, symbols, accessors, functions, nonfinite numbers, non-plain objects and unsafe keys, even inside unknown fields. Only safe recognized fields survive reconstruction. This validates data; it does not sandbox hostile JavaScript Proxy objects supplied by trusted code.

## Quiz

### `gradeQuestion(question, answer)`

For `type:'mcq'`, answer is a zero-based integer option index. Returns `{correct:boolean,score:0|1,explanation:string}`. `null`/`undefined` mean unanswered and score zero. Out-of-range/fractional/string indexes, invalid answer key/options or explanation throw.

For `type:'written'`, returns **`{correct:null,score:null,explanation,rubric:[...strings]}`**, regardless of response. Requires a rubric array and returns a copy. No pretend grading or keyword scoring. Unsupported types throw.

### `selectQuestions(questions, {count=5, lessonIds} = {})`

Returns a new shuffled subset of question references without replacement. Does not modify source arrays, questions, or option order. Omitted `lessonIds` means all lessons; `[]` means no lessons. Counts are integers 0–1000; requesting more than available returns available items, never duplicates. Input bank max 10000; IDs must be unique. Invalid inputs throw. Random shuffle is bounded Fisher–Yates, not sort-by-random or an unbounded retry loop.

### `createExam(questions, now = Date.now())`

Returns `{questionIds,answers:{},startedAt:now,endsAt:now+3000000,submitted:false}`; no solutions or question objects. At most 20 questions, with rounds across lessons so a large lesson cannot monopolize a category. Category selection follows repeated world / other / world / other / system slots, filling from remaining eligible pools. Worlds strictly outnumber systems whenever world questions exist; a severely world-scarce bank can therefore produce fewer than 20 questions rather than pad with systems. Empty bank returns an empty exam; UI should disable starting it.

Classification recognizes explicit `category:'world'|'system'`, then `lesson_id` prefixes `world-`/`world_` or `system-`/`system_`, then rule refs `3.a.i` versus `3.a.ii` (including child-clause forms). Other questions share the other pool. No new required question fields are introduced.

### `remainingSeconds(exam, now = Date.now())`

Returns ceiling wall-clock seconds left, clamped 0–3000; submitted/null exam returns 0. Validates 50-minute clock fields. Reload does not restart the clock. This pure function **does not set submitted**; UI must submit/lock answers when it returns zero and persist that change. Local wall-clock time is not secure proctoring and cannot prevent deliberate clock edits.

### `scheduleReview(previous, quality, now = Date.now())`

Returns `{due,interval,repetitions}`; input is never mutated. Quality must be integer **0,1,2**:

- 0 (Again): interval 1 day, repetitions reset to 0.
- 1 (Hard): retain previous interval, minimum 1 day; increment repetitions.
- 2 (Recalled): first successful repetition 1 day, second 3 days, later double previous interval.

Interval capped at 36500 days, repetitions at 1000000; `due=now+interval*86400000`. Missing previous record is allowed; malformed records/nonfinite or overflowing time throw. This is a simple transparent study heuristic, not an evidence-validated mastery estimate.

## Verification

Each behavior slice was added as a failing Node test, executed RED, minimally implemented, and rerun GREEN before the next slice. Verification command:

```sh
node --test tests/{models,storage,quiz}.test.mjs
```

Tests cover central/grazing/backside/missed transits, Kepler scale and period recurrence, radiation physics, bounded inputs; schema reconstruction and unsafe structures; malformed/future/oversized imports, corruption preservation and quota failures; grading, immutable bounded selection, balanced exam state, review scheduling, and timeout after export/import reload. No browser or external dependencies are needed.
