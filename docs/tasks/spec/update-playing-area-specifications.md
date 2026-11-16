# Task: Update playing-area specifications

**Status:** Complete — approved and implemented

**Created and approved:** 2026-11-16

## Scope

Synchronize [UISPEC](../../specs/UISPEC.md) UI-01 and [TESTSPEC](../../specs/TESTSPEC.md) TST-08/TST-10 with the implemented and approved [reorganize-playing-area](../draft/reorganize-playing-area.md) task.

- Replace the old wheels-first hierarchy with word result, picture (when displayed), spinners, then primary action.
- Require matching DOM and visual order, including missing-image fallback.
- Retain picture visibility rules and keep the spinners directly above the button when no picture is shown.
- Update Status and Last updated in both affected specs and append dated change-log entries.
- Report additions and removals without changing gameplay or unrelated requirements.

## Verification

Compared the updated requirements with the implemented DOM and regression test. The implementation task passed 18 tests, the production build, and portrait/landscape browser layout checks. This follow-up changes documentation only; checked formatting with `git diff --check`.
