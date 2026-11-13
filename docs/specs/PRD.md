# Spin The Wheels — Product Requirements Document

**Status:** Draft — product decisions noted below need confirmation  
**Last updated:** 2026-11-13  
**Product scope:** MVP Implementation only

## 1. Purpose

Define the user-visible product behavior for a three-letter spelling game intended for young literacy learners. The game presents a configured word by spinning three letter wheels to a correctly spelled target, then showing the word's picture and playing its pronunciation.

This document, together with [DEVSPEC.md](./DEVSPEC.md), [UISPEC.md](./UISPEC.md), and [TESTSPEC.md](./TESTSPEC.md), is the source of truth for a new implementation. Requirement IDs are stable references for the other specifications.

## 2. Audience and learning objective

- **Primary user:** a child practicing English letter order and word recognition.
- **Supporting user:** an educator, caregiver, or content creator who supplies a level's word and media data.
- **Pedagogical objective (source):** put letters in order to spell a word, using independently spinning letter slots.

## 3. Scope

### In scope

- Three fixed letter positions/wheels for three-letter English words.
- A configured letter set for each position; the middle position is vowel-only.
- Loading the level and spellable word list from JSON.
- A user action that randomly chooses a target word, animates the wheels, and settles on the target's letters.
- Display of the spelled word's picture and playback of its pronunciation.
- English-only level content.
- Compatibility with the Curious Reader offline WebView and its standalone content packaging/reporting contract, as specified in DEVSPEC.

### Out of scope

The following are explicitly not MVP requirements, because they appear only in other implementation tiers or are not specified as MVP behavior:

- Manually changing a single wheel/letter.
- Showing a confused character or playing gibberish for a non-word.
- Advancing to another level after completing a proportion of the word list.
- Flick/velocity-based wheel operation.
- Words longer than three letters.
- Scoring, hints, user accounts, leaderboards, a level editor, or network-backed features.

## 4. Product requirements

### PRD-01 — Three-position spelling game

The playable screen MUST present exactly three ordered letter positions. The settled letters, read left-to-right, MUST form the selected target word.

### PRD-02 — Configured letter sets and vowel constraint

Each position MUST use its own configured letter set. The middle position MUST contain only vowels and MUST settle on a vowel. The MVP's vowel set is provisionally `a, e, i, o, u`; see Open Questions.

### PRD-03 — Random target selection and spin

When the player activates the word-selection mechanism, the game MUST select a word from the loaded level's configured spellable words and animate the three wheels before settling on that word's letters. A second activation MUST NOT interrupt an in-progress spin. The next selection is available once the current result is presented.

The source does not specify whether a target may repeat. The initial proposed behavior is uniform random selection with replacement; this is a decision to confirm.

### PRD-04 — Word result, picture, and pronunciation

After the wheels settle, the game MUST present the correctly spelled target, display its associated picture, and play its associated pronunciation. A media loading or playback failure MUST NOT prevent the letters and word from being shown or prevent a later word selection.

### PRD-05 — Level data

The game MUST load a level identifier, three spinner letter sets, and a word list from JSON. Every configured word MUST be spellable using the letters in the corresponding positions. Each word MUST have associated image and audio assets. The canonical data shape and validation rules are defined in DEVSPEC.

### PRD-06 — English-only content

The MVP MUST use English words, letters, images, and pronunciations. The launch language is read from the Curious Reader `cr_lang` query parameter; supported content for this MVP is the English catalog code agreed with Curious Learning.

### PRD-07 — Offline/container operation

The MVP MUST reach a playable state from a local `file://` entry point without network access. No external service may be necessary for startup, gameplay, media, or reporting. All runtime assets MUST be local and referenced relatively. Detailed requirements are in DEVSPEC.

## 5. User journey and observable behavior

1. The game opens and loads its local level data and assets.
2. While loading, the UI indicates progress or a loading state and does not offer a playable selection action.
3. If level data is invalid or unavailable, the UI shows an understandable blocking error; it does not display a fabricated target.
4. Once ready, the player activates the word-selection mechanism.
5. The three wheels animate and settle on letters spelling the selected word.
6. The word and picture are shown and the pronunciation is played (subject to browser audio permission and asset availability).
7. The result remains visible until the player starts another selection.
8. A failed image or audio asset produces a non-blocking fallback/status and does not crash the game.

The mechanism's visual form and exact label are not specified by the source. UISPEC proposes one accessible primary control and identifies the label as a decision.

## 6. Acceptance criteria

The MVP is acceptable when all of the following are true:

1. A valid level with exactly three wheel definitions and at least one valid word reaches the ready state.
2. The middle wheel's configured set and every settled middle letter contain only the accepted vowel characters.
3. Each selection is a word from the configured list, and after the animation the three displayed letters equal that word in order.
4. For a valid word with available media, its image is visible and its pronunciation is audibly played after selection.
5. Invalid or missing level data causes an explicit error state instead of a partial playable state.
6. Missing/corrupt image or audio does not prevent the settled word from being read or a subsequent selection.
7. With the browser/device offline and the game opened from `file://`, the game reaches ready/playable or an explicit local-data error within 10 seconds; it makes zero external network requests.
8. The build, language pack, launch parameters, and event messages satisfy applicable ThirdPartySpec checks in TESTSPEC.
9. No behavior listed as out of scope is required for MVP acceptance.

## 7. Assumptions and open questions

These are explicit proposals/unknowns, not claims made by the source brief. Resolve them before treating the specifications as final:

1. **Word-selection control:** Is a single “Spin”/“Choose a word” button the intended interaction, and what should its label be?
2. **Vowels:** Should the middle-wheel vowel set be exactly `a, e, i, o, u` (excluding `y`)?
3. **Randomization:** Is uniform selection with replacement acceptable, or should the game avoid repeating words until the list is exhausted?
4. **Level behavior:** Does one launch represent one fixed level, with the player able to request words indefinitely? The MVP brief does not define completion or level transitions.
5. **Media fallback:** Is a neutral missing-image/audio indication acceptable, or should product artwork/audio be supplied for fallbacks?
6. **Language code and reporting ID:** Confirm the Curious Reader catalog code for English and the stable `sub_app_id` with Curious Learning.
7. **Telemetry events:** Confirm whether `game_started` and `word_presented` are the desired events, and which fields the data team requires. These are proposed integration events, not game mechanics.
8. **Animation/accessibility:** Confirm proposed default spin duration and reduced-motion behavior in UISPEC.
9. **Audio policy:** Confirm whether audio should play automatically after the first player gesture (proposed), or require a separate sound control.

## 8. Source references

- [**GameSpecBrief**](https://docs.google.com/document/d/1MWGOzbIT0L_k6DkbJx-zyBHK1l9PvwqZ7D6SVCB8iEk/edit?tab=t.0), “Purpose/objective” and “MVP Implementation.” Only MVP scope is used; “Better Implementation” and “Great Implementation” are excluded.
- [**ThirdPartySpec**](https://docs.google.com/document/d/1GHSxckarR4x6ERPmKJlM3IL34-3LuplQ/edit#heading=h.xbi1mcqif22u), v1.8: applicable runtime, offline compliance, media, packaging, event, and self-verification requirements.
- [**SDAD**](https://medium.com/@guruduth.banavar/spec-driven-ai-development-engineering-discipline-for-the-ai-coding-era-22a678067b1c), “Spec-Driven AI Development: Engineering Discipline for the AI Coding Era”: specification-first, traceability, built-in testability, and intentional versioned change.

## 9. Change log

2026-11-13 — Copilot — Created the initial MVP product requirements and recorded source gaps as open questions.
