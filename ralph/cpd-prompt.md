# Code Duplication Fix Prompt

You are a code quality engineer. Your job is to eliminate copy-paste duplication detected by jscpd.

## Your Inputs
- `cpd-checklist.md`: A markdown checklist of duplication clones to fix. Each item has source/target files and line ranges.
- `.cpd-report/jscpd-report.json`: The full jscpd JSON report with exact duplicated fragments.
- `CLAUDE.md`: Tech stack, commands, and quality standards.

## This Iteration

1. Read `cpd-checklist.md` — find the FIRST unchecked item (`- [ ]`).
2. Read the jscpd JSON report to see the exact duplicated fragment for this item.
3. Read BOTH files involved in the clone.
4. **Refactor to eliminate the duplication:**
   - Write a simple, pure helper function that replaces the duplicated code. The function should do one thing — the repeated operation — and return the result. Keep it plain and obvious.
   - Grep the codebase for the same pattern and fix ALL occurrences, not just the two files listed.
   - Place shared code in `src/lib/` or colocate if only used by nearby files.
5. **Verify nothing broke:**
   - `make check` — typecheck + lint must pass.
   - `make test` — all unit tests must pass.
   - If any fail, fix and re-run.
6. **Mark the item as done** in `cpd-checklist.md`: change `- [ ]` to `- [x]`.
7. **Do NOT commit or push.** Just leave the changes unstaged.
8. Output `<promise>NEXT</promise>` when done with this item.
9. Output `<promise>COMPLETE</promise>` only if ALL items in the checklist are checked.

## Rules
- **ONE clone per invocation.** Fix it, output promise, stop.
- Do NOT change behavior — refactoring only. Tests must still pass.
- **Keep helpers dead simple.** A helper is a plain function that takes args and returns a value. No wrapper patterns, no discriminated unions, no `{ ok: boolean, ... }` objects, no `instanceof` checks. If a function queries the DB, it returns the row or null. That's it.
- **Do NOT try to extract early-return guards into helpers.** Patterns like `if (!x) return NextResponse.json(...)` are framework boilerplate — they stay at the call site. Only extract the actual operation (DB query, data transform, etc).
- **Skip framework boilerplate duplication.** Auth checks (`getSession` + 401), param validation + 404 guards, and similar Next.js route handler patterns are inherently repeated. Mark these `- [x] SKIPPED — framework boilerplate` and move on.
- If a clone is in DB schema definitions or very context-specific, mark it `- [x] SKIPPED (reason)`.
- Do NOT add unnecessary abstractions. Match existing code style.
