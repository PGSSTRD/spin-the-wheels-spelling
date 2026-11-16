# Spin The Wheels — User Interface Specification

**Status:** Draft — playing-area order approved and implemented; remaining design choices need confirmation
**Last updated:** 2026-11-16
**Product scope:** MVP Implementation only

## 1. Purpose and conventions

Define the user-visible layout, states, and interaction feedback for the MVP. Product requirements are in [PRD.md](./PRD.md), implementation contracts in [DEVSPEC.md](./DEVSPEC.md), and UI acceptance tests in [TESTSPEC.md](./TESTSPEC.md).

UI requirement IDs use `UI-`. **Source** identifies a direct requirement from GameSpecBrief or ThirdPartySpec; **Derived proposal** is a testable usability decision where the sources do not dictate a design. Proposals remain subject to review.

## 2. Screen and hierarchy

### UI-01 — Main game screen (Source: PRD-01, PRD-02, PRD-04; approved layout decision)

The main screen contains, in visual and reading order:

1. A level/game title or accessible name (no title text/branding is prescribed).
2. A word-result area showing the settled word.
3. A picture area associated with the selected word, when displayed.
4. A central row of exactly three ordered letter-wheel slots, beneath the picture and immediately above the primary action.
5. One primary word-selection action.
6. Status feedback for loading, errors, and unavailable media as needed.

The screen MUST make the left-to-right reading order of the three letters unambiguous. The word-result text MUST remain available independently of the picture.

DOM order MUST match this visual order. The missing-image fallback occupies the same picture area above the spinners. Preserve existing picture visibility: when no picture area is displayed in ready or spinning states, the spinners MUST still appear immediately above the primary action. Provide enough spacing to prevent overlap in portrait and landscape layouts.

### UI-02 — Letter wheels (Source: PRD-01, PRD-02)

- Render exactly three slots with a visually clear boundary between slots.
- During a spin, show changing configured letters with motion that communicates rotation/spinning; settle each slot on its target letter.
- The settled letters MUST be legible and form the target word in left-to-right order.
- The middle slot's selected and intermediate letters MUST come from its configured vowel set.
- The interface MUST NOT suggest that the user can manually adjust a wheel; that is outside MVP.

### UI-03 — Word, picture, and pronunciation (Source: PRD-04)

- On result, show the spelled word as selectable/readable text and show its associated picture in the picture area.
- Provide meaningful alternative text for a loaded image using the target word (or supplied accessible description if the schema is deliberately extended).
- On completion of the spin, request playback of the word's pronunciation.
- The result remains visible until the next selection begins.
- If an image fails, show a neutral unavailable-image fallback with an accessible text equivalent; do not replace the target word.
- If audio fails or autoplay is denied, keep the word/picture and show a concise “Audio unavailable” status (localized English for MVP). Do not communicate that audio played when it did not.

## 3. Interaction and state feedback

### UI-04 — Loading, ready, spinning, result, and error (Source: PRD-03, PRD-05; Derived proposal for presentation)

- **Loading:** show a non-interactive loading indication. Prevent selection until valid data is ready.
- **Ready:** enable the primary action and show three wheel slots ready to spin. No target is required to be presented before the first selection.
- **Spinning:** disable the primary action; animate all three wheels. Do not expose partial letters as a completed word.
- **Result:** show target letters, word, picture, and media status. Enable the next selection action.
- **Data error:** show a clear, non-technical error that local game data could not be loaded and no playable level is available. Keep selection disabled. A reload/retry mechanism is not prescribed.
- **Media error:** keep game in result state; show the unaffected word/picture/audio result and a non-blocking status only for the failed media.

### UI-05 — Primary action (Source: PRD-03; Derived proposal)

The source requires a mechanism for randomly choosing a word, but does not define its shape or label. Proposed MVP control:

- One large, clearly labeled primary button; provisional label: **“Spin”**.
- It is enabled in ready/result and disabled while loading, spinning, or in data-error.
- Activating it starts exactly one word selection and one spin.
- It is keyboard-operable and exposed to assistive technology as a button with a meaningful accessible name.

Confirm the control form and final label in PRD Open Questions before visual design is considered final.

## 4. Motion, responsive behavior, accessibility

### UI-06 — Motion (Source: PRD-03; Derived proposal)

- All three wheels visibly animate before settling. Animation MUST end with the selected word; motion MUST NOT change the target after selection starts.
- Proposed initial default duration: 1.5 seconds for the complete spin; stagger between wheels is a visual tuning choice. The timing is not specified in the source and needs confirmation.
- Respect `prefers-reduced-motion`: replace continuous rotation with a brief, low-motion transition while preserving the visible start-to-final change and result timing. This is a derived accessibility requirement.
- The action remains unavailable until the animation finishes and the result is ready.

### UI-07 — Responsive and accessible presentation (Derived proposal)

- Adapt the screen to narrow portrait and landscape viewports without clipping the three letters, action, result text, or status.
- Preserve letter order and readable word text when resizing; the picture MAY scale/crop within its area but MUST retain an appropriate accessible description.
- Use semantic headings, button semantics, visible focus, and sufficient contrast for text and control states.
- Ensure the selected word is exposed as text to screen readers. Announce a completed word once after the spin, not on every intermediate wheel frame.
- Do not convey loading, spinning, unavailable, or disabled state by color alone.
- The player must be able to operate the primary action by keyboard and touch/pointer. No swipe/flick gesture is required.

## 5. Visual style

No palette, typography, art style, exact spacing, branded artwork, or fixed screen dimensions are defined by the sources. The implementation team may select an age-appropriate, high-contrast visual design, subject to UI-01 through UI-07. Treat exact styling as a design decision, not a requirement traceable to GameSpecBrief.

## 6. Excluded UI features

Do not add as required MVP UI:

- Individual wheel controls or manual letter changes.
- A confused character or gibberish result.
- Progress/completion percentage or automatic level change.
- A flick-to-spin interaction or speed control.
- Four-or-more letter slots.
- Score display or success/failure evaluation of manually formed non-words.

## 7. Decisions needing confirmation

1. Primary control form and final label.
2. Default animation duration and wheel staggering.
3. Whether a first explicit player gesture should unlock audio and whether any separate sound control is expected.
4. Final image/audio fallback design and whether fallback assets are available.
5. Any fixed branding, palette, typography, supported minimum viewport, or accessibility standard beyond the derived baseline above.

## 8. References

- [**GameSpecBrief**](https://docs.google.com/document/d/1MWGOzbIT0L_k6DkbJx-zyBHK1l9PvwqZ7D6SVCB8iEk/edit?tab=t.0), “MVP Implementation” — three slots, word selection mechanism, picture and pronunciation.
- [**ThirdPartySpec v1.8**](https://docs.google.com/document/d/1GHSxckarR4x6ERPmKJlM3IL34-3LuplQ/edit#heading=h.xbi1mcqif22u) — file-origin operation and supported media constraints, reflected in DEVSPEC.
- [**SDAD**](https://medium.com/@guruduth.banavar/spec-driven-ai-development-engineering-discipline-for-the-ai-coding-era-22a678067b1c) — make assumptions visible and tie UI expectations to testable acceptance criteria.
- [PRD.md](./PRD.md), [DEVSPEC.md](./DEVSPEC.md), [TESTSPEC.md](./TESTSPEC.md).

## 9. Change log

2026-11-13 — Copilot — Created the initial screen, interaction-state, motion, and accessibility specification.
2026-11-16 — Copilot — Replaced the wheels-first hierarchy with the approved word-result, picture, spinners, and button order in both DOM and visual presentation.
