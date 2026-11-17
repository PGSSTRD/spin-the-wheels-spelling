# Spin The Wheels — Product Requirements Document

**Status:** Synchronized through 2026-11-17, including Curious Reader language-audio folder naming; release integration, licensing, and device validation remain outstanding
**Last updated:** 2026-11-17
**Product scope:** MVP-derived game with explicitly approved manual-spelling changes

## 1. Purpose

Provide a local, offline three-letter English spelling game for young literacy
learners. The player finds a target, sees its word and picture, hears its
pronunciation, and manually sets letter wheels to spell that exact target.

This document, [DEVSPEC.md](./DEVSPEC.md), [UISPEC.md](./UISPEC.md), and
[TESTSPEC.md](./TESTSPEC.md) define the current product for recreation and testing
from scratch. Stable requirement IDs link requirements to acceptance tests.

The original GameSpecBrief MVP described automatically settling wheels.
Subsequent user-approved changes deliberately replace that interaction with
manual spelling, evaluation, and feedback. These approved requirements take
precedence over the original automatic-spin proposals; they are not claims
that the source brief itself prescribed the later design.

## 2. Audience and learning objective

- **Primary user:** a child practicing English letter order and word recognition.
- **Supporting user:** an educator, caregiver, or content creator supplying
  valid level data and appropriately licensed local media.
- **Objective:** match three ordered letters to a displayed target, using its
  picture and pronunciation as reinforcement.

## 3. Scope

### In scope

- Three letter positions, configurable choices, fixed single-letter wheels,
  and a vowel-only middle position.
- Five supplied levels, selected manually; JSON-defined word and letter sets.
- Random target selection without immediately repeating the current target
  when the level offers an alternative.
- Manual pointer/touch and keyboard wheel movement, explicit spelling checks,
  retry feedback, correct-answer feedback, and a feedback-completion lock.
- Local word images, recorded narration, mute control, bundled Lexend font,
  persistent picture space, and an asset-license inventory.
- Standalone `file://` operation and an optional Curious Reader reporting bridge.

### Out of scope

- Automatic wheel-solving, flick/velocity-based operation, or randomized
  movement that reveals the answer by setting the wheels.
- Automatic level advancement, completion thresholds, scoring, hints,
  leaderboards, accounts, a level editor, or network-backed gameplay.
- Words longer than three letters, a confused character, or gibberish narration.
- Startup instruction playback, a Play instructions control, or the retained
  generated fanfare.
- Automatic image indexing or probing formats beyond SVG and JPG.

## 4. Product requirements

### PRD-01 — Three-position manual spelling

- Present exactly three ordered wheels, each using its own configured letters.
- Fixed wheels show their sole letter. Adjustable wheels initially show `?`
  and remain inactive until a target's picture or fallback is ready.
- Finding a word MUST NOT move the wheels to its answer.
- On the first actual adjustable-letter change, offer **Spell**. It remains
  disabled until every adjustable wheel has a letter, the picture is ready,
  no wheel is being dragged, and previous submission feedback is complete.
- Compare the complete selection to the exact target. Another configured word
  is incorrect if it is not the selected target.
- Correct spelling locks the wheels until a new target or level. An incorrect
  answer preserves the target and letters for retry; editing clears retry
  feedback without choosing another target.
- An all-fixed level can offer Spell immediately after picture readiness.

### PRD-02 — Configured letter sets and vowels

Use the configured order, wrapping at both ends. The accepted middle vowels
are `a, e, i, o, u`, excluding `y`. Fixed middle wheels obey the same constraint.
Displayed letters are uppercase; comparisons use normalized configured letters.
Source validation and the complete five-level catalog are defined in DEVSPEC.
Level 5 has three adjustable wheels, including the middle `a/i` wheel.

### PRD-03 — Target selection, retries, and levels

- **Find a word** is available initially and after completed correct feedback.
  Choose from the current level's words, excluding the current target if the
  list contains more than one word. A single-word level may repeat.
- Choose uniformly among the remaining candidates with a controllable random
  seam for testing. This is not a no-repeat-until-exhaustion bag.
- Show the new target and reset adjustable wheels to `?`, retaining fixed
  letters. The placeholder cannot be selected again during that word cycle.
- Incorrect submissions do not change targets. Start a new cycle only through
  an enabled Find a word action or an actual level change.
- Selecting another level resets the attempt, feedback, target, and wheels.
  Selecting the current level does nothing. Do not advance levels automatically.

### PRD-04 — Pictures, narration, and evaluation feedback

- Show the target word above a persistent picture frame, with wheels and the
  primary action below. Keep the frame empty before selection and after a
  level reset.
- For a target, try its SVG, then its JPG only if SVG fails. If both fail,
  show a grayscale painting fallback without an emoji or visible error
  sentence. Retain an accessible unavailable-picture description.
- Center the complete image inside 80% of both frame dimensions, preserving
  aspect ratio without cropping or stretching.
- Find a word pronounces the target once. Correct spelling plays the
  correct-answer clip fully, then pronounces the same target.
- Correct feedback flashes all three selected letters gold three times.
  Start these flashes when success pronunciation actually starts, or on its
  completion/failure fallback if no playing event occurs.
- Incorrect spelling plays the retry clip while only mismatched letters
  flash red three times.
- After either submission, the primary button MUST remain disabled until
  both feedback audio and all active letter flashes have finished. If audio
  is muted/unavailable, wait only for flashes.
- Wrong-answer wheels remain editable. Editing cancels their red feedback,
  but the button still waits for any ongoing retry audio. Level changes
  cancel feedback and its lock.
- Missing/corrupt media or denied playback must not fabricate success or
  permanently block the attempt. Report genuine audio failures non-blockingly.

### PRD-05 — Level and content data

Load all levels from one local English JSON array. Each level defines its ID,
three ordered spinner definitions, and a non-empty spellable word list.
Infer image and recording filenames from the target; no per-word media map
or image index is required. Missing individual media is permitted at runtime
and uses the specified fallback, whereas malformed level data is blocking.
Keep English recordings under `lang/english/audios/`, including its `words/`
subfolder, matching Curious Reader's required language-audio layout.

The current catalog has five levels and 40 unique configured words; DEVSPEC
contains the full catalog and exact validation rules, including the difference
between case-normalized spinner letters and strictly lowercase source words.

### PRD-06 — English launch behavior

Support `cr_lang=english`. In a plain browser, an absent language parameter
defaults to `english`. A Curious Reader bridge launch must supply `cr_lang`;
absence is a configuration error. Unsupported codes produce an explicit error
without silently substituting another language.

### PRD-07 — Offline operation and deployment

Reach playable ready or an explicit local-data error from a local `file://`
entry without an external service. Runtime media, data, font, and UI assets
must be local; references must not depend on a filesystem-root URL.

The current build produces a combined standalone directory. Curious Reader
engine/language ZIP separation, agreed catalog identifiers, and actual
container delivery remain release obligations, not already completed features.
Preserve the ThirdPartySpec 10-second offline startup acceptance budget; a
never-completing XHR currently has no enforced timeout and is a known gap.

### PRD-08 — Audio control and bounded availability checks

- Start silently with written instructions; do not play an initial level-1 cue.
  Actual level changes announce the selected level, including returning to 1.
- Fresh navigation starts unmuted. Preserve the choice across level changes;
  same-tab reload restores it. Blocked storage is logged and must not break play.
- Muting immediately cancels current audio and pending playlist callbacks.
  Continue visual feedback, starting correct flashes immediately if needed.
  Unmuting affects future events only and does not replay canceled cues.
- The toggle remains enabled while availability is pending and if any relevant
  clip is usable. Disable it in gray only after all relevant clips fail.
  Autoplay denial and one missing word clip are not proof that all audio is absent.
- Check one clip at a time, stop at the first usable clip, and cancel stale
  checks. Avoid decoder pressure from a parallel scan of all recordings.
- Audio on is green, mute is red, and unavailable is gray, with accessible
  names, pressed state, and disabled semantics independent of color.

### PRD-09 — Presentation and accessible operation

Use the supplied local Lexend font and the approved layout/palette in UISPEC.
Keep the enlarged level selector right-aligned without a separate visible
Level caption. Support narrow screens from 320 CSS pixels, keyboard focus,
native level selection, and pointer/touch wheels.

Suppress accidental text selection throughout the game card using CSS without
blocking button activation, wheel gestures, keyboard operation, or accessible
text. Detailed dimensions, timing, icon geometry, and reduced-motion behavior
are specified in UISPEC; no unverified accessibility certification is implied.

### PRD-10 — Asset provenance and release rights

Inventory every supplied source media asset, including retained unused files,
with path, creator, license, source, and notes. Preserve required license notices
in distribution. Record unknown rights as `NOASSERTION`, not as permission.

ElevenLabs free-plan recordings retain the contributor-supplied restrictions
and outstanding distribution approval. The supplied pictures and original
generated WAV have unresolved rights/license decisions. A complete inventory
does not make the product cleared for commercial use or redistribution.

## 5. User journey

1. Load and validate local levels; show a loading indication or blocking error.
2. Show level 1, written instructions, an empty picture frame, fixed letters,
   and `?` on adjustable wheels; enable Find a word.
3. Find a target: show its word, resolve its picture, and pronounce it unless
   sound is intentionally suppressed. Do not solve the wheels.
4. Move adjustable wheels. Spell becomes available only with a complete
   selection and no active drag or submission feedback.
5. Submit. Keep the primary action disabled through audio and flashes.
6. If incorrect, retain the target/selection for retry. If correct, lock the
   wheels and enable Find a word only after feedback completes.
7. Change level at any time on the playable screen to reset the attempt;
   preserve mute preference and announce the new level if sound is enabled.

## 6. Acceptance criteria

1. The supplied catalog loads into five selectable levels; invalid data never
   produces a fabricated playable level.
2. Selection does not solve wheels; fixed/adjustable placeholders, ordered
   wrapping, 40px wheel steps, and keyboard equivalents match UISPEC.
3. No incomplete submission is accepted, including all three adjustable
   positions in level 5.
4. Only an exact target match succeeds; retries do not silently select a word.
5. Word/image/narration ordering, both image formats, fallback, three flashes,
   and the audio-plus-animation lock satisfy TESTSPEC.
6. Muting, availability failure, audio errors, and level cancellation preserve
   playable state without stale callbacks or a permanently disabled button.
7. Local font/image/audio loading works offline with no external requests;
   actual older-device and container checks remain required before release.
8. Presentation, accessible names, no accidental text selection, source
   inventory, and applicable packaging/reporting checks pass their tests.

## 7. Remaining decisions and specification maintenance

### Release gaps, not undecided gameplay

- Confirm the Curious Learning engine slug, English catalog code, permanent
  `sub_app_id`, event acceptance, upload icon, and deployment metadata.
  Current local values are documented in DEVSPEC, not evidence of assignment.
- Produce and validate separate Layout A ZIPs and actual container delivery.
- Resolve ElevenLabs publication/distribution conditions and rights for the
  two supplied pictures; explicitly license the generated fanfare if used.
- Validate older Android hardware, WebView behavior, and accessibility
  requirements. Current reduced-motion mode retains the letter flashes.
- Address never-completing local requests before asserting the full startup
  time guarantee under that fault; do not silently relax the 10-second target.

### Maintenance workflow

Every new task plan must reference all four specs. After a task is complete,
tested, and approved, propose a separate specification-update task and obtain
approval before editing specs. For every altered spec update Status and
Last updated, append `2026-MM-DD — <author> — <one-sentence description of change>`
at the bottom change log, and report additions, removals, and replacements.

## 8. Source references

- [**GameSpecBrief**](https://docs.google.com/document/d/1MWGOzbIT0L_k6DkbJx-zyBHK1l9PvwqZ7D6SVCB8iEk/edit?tab=t.0), original MVP baseline; unapproved Better/Great tiers remain excluded.
- [**ThirdPartySpec**](https://docs.google.com/document/d/1GHSxckarR4x6ERPmKJlM3IL34-3LuplQ/edit#heading=h.xbi1mcqif22u), v1.8: offline runtime, packaging, media, reporting, and release validation.
- [**SDAD**](https://medium.com/@guruduth.banavar/spec-driven-ai-development-engineering-discipline-for-the-ai-coding-era-22a678067b1c), specification-first traceability and controlled changes.
- Approved follow-ups: [manual gameplay](../tasks/draft/reworked-game-logic.md), [audio](../tasks/draft/mutable-audio.md), [font/licensing synchronization](../tasks/spec/update-font-and-licensing-specifications.md), and [images/selector synchronization](../tasks/spec/update-images-licenses-and-level-selector-specifications.md); final feedback-lock, icon-color, and selection changes approved in the session.

## 9. Change log

2026-11-13 — Copilot — Created the initial MVP product requirements and recorded source gaps as open questions.
2026-11-16 — Copilot — Specified that plain-browser launches default to English when cr_lang is absent while container launches still require it.
2026-11-17 — Copilot — Replaced automatic spinning and resolved gameplay proposals with approved manual spelling, feedback locking, local media, mute controls, presentation, and licensing requirements while retaining explicit release gaps.
2026-11-17 — Copilot — Aligned the English language-audio folder name with Curious Reader's required audios convention without changing its location or gameplay.
