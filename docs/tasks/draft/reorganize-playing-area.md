# Task: reorganize-playing-area

**Status:** Complete — implemented, tested, and approved

**Created:** 2026-11-16

**Approved for implementation:** 2026-11-16

**Implementation approved:** 2026-11-16

## Objective

Move the three spinners beneath the picture area, immediately above the primary Spin button.

## Specification references

- [PRD](../../specs/PRD.md): PRD-01 through PRD-04 — preserve spelling, spin, and result behavior.
- [DEVSPEC](../../specs/DEVSPEC.md): DVS-06 and DVS-07 — preserve game states and media handling.
- [UISPEC](../../specs/UISPEC.md): UI-01 through UI-07 — intentional change to screen order; preserve other interaction, accessibility, and responsive requirements.
- [TESTSPEC](../../specs/TESTSPEC.md): TST-04 through TST-10 — verify gameplay, states, layout, and accessibility.

## Implementation scope

1. Move the existing spinner group in [App.tsx](../../../src/App.tsx) after the picture area and immediately before the primary action.
2. Keep the existing word-result area above the picture. The resulting order is header/instructions, word-result area, picture (when displayed), spinners, primary action, and existing status/footer content.
3. Use DOM order to match the visual order, rather than a CSS-only rearrangement.
4. Adjust only necessary spacing in [styles.css](../../../src/styles.css) so the picture, spinners, and button do not overlap and remain usable in narrow portrait and landscape layouts.
5. Preserve the existing conditional visibility of the picture, including its unavailable-image fallback. Do not introduce a new placeholder or change game-state behavior.
6. Preserve three-letter order, animation, primary-action enablement, level selection, pronunciation, reporting, and language handling.

## Acceptance and verification

- In the result state, the picture or its fallback appears before the spinner group, which appears immediately before the Spin button in DOM and visual order.
- In ready and spinning states, the spinner group remains immediately above the button even when no picture is displayed.
- The word-result text remains available independently of the picture.
- Keyboard operation, focus visibility, live announcements, and reduced-motion behavior remain unchanged.
- No clipping or overlap occurs at narrow portrait or landscape viewport sizes.
- Add a focused regression test to [App.test.tsx](../../../src/App.test.tsx) verifying picture/fallback → spinners → button order.
- Run `npm test` and `npm run build`; fix failures caused by this change.
- Visually verify the result and missing-image fallback at portrait and landscape sizes.

## Approval and spec follow-up

This task creates a plan only; do not implement it until approved.

After implementation is tested and approved, prompt for a separate spec-update task to align UI-01 and the corresponding test expectations with the new layout. That task must update Status and Last updated in each affected spec, append a change-log entry in the format `2026-MM-DD — <author> — <one-sentence description of change>`, and report everything added and removed.

## Implementation and verification

- Moved the existing spinners after the picture and directly before the button in DOM order; added 24px of spacing above the button.
- Added a regression test covering ready, spinning, result, and missing-image fallback order.
- `npm test`: all 18 tests passed.
- `npm run build`: passed; `git diff --check`: passed.
- Browser verification of the production build at 375x812 and 812x375 confirmed picture/fallback → spinners → button order without overlap or horizontal spinner clipping. The available-image case used an intercepted test image because production image assets are not supplied.
- User review and approval received on 2026-11-16; specification updates remain a separate follow-up.
