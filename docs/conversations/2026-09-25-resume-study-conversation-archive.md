# Conversation archive: DCSPD Resume Study context

Date archived: 2026-09-25

Repository: `Parris-Tech-Services/DCSPD`

This archive captures the useful project context from a ChatGPT conversation about improving DCSPD / ITPrep. It is not a verbatim dump of hidden assistant/system context. It preserves the user-facing decisions, requirements, implementation history, and next development task.

---

## Why this belongs in DCSPD

The conversation centred on the DCSPD / ITPrep app and its `Resume Study` feature at `/resume-study`.

Main goal:

> Create a one-click, interruption-safe study workflow for first-level IT support professional development.

Josh's core requirement was not just “make a study plan.” It was:

> I need to go to the DCSPD app, click `Resume Study`, and immediately continue where I left off, because IT support work is interrupt-driven.

This was treated as a valid workflow and accessibility-style requirement, not as avoidance.

---

## Key user preference captured

When Josh gives a clear practical reason, especially around ADHD, accessibility, interruption, or workflow friction, do not keep reframing it as avoidance. Briefly flag risk once if needed, then help implement the smallest useful version.

For this project, the valid practical reason is:

- First-level IT support involves frequent interruptions.
- A chat thread, note, or external study system is too easy to lose.
- The app needs to remember the exact study day, step, and note.
- The user should not have to hunt through books, modules, chats, or dashboards to resume.

---

## Feature implemented during the conversation

A new Resume Study feature was created for DCSPD.

Files involved:

- `app/resume-study/page.tsx`
- `src/components/study/ResumeStudyCard.tsx`
- `src/data/resumeStudyPlan.ts`
- `src/lib/resumeStudyProgress.ts`
- `src/components/shell/navigation.ts`
- `app/page.tsx`

Initial feature scope:

- Add `/resume-study` route.
- Add `Resume Study` navigation/dashboard entry.
- Store progress in `localStorage`.
- Track current day and current step.
- Show progress like `Day X of 16 — Step Y of 5`.
- Save scratch notes.
- Provide `Mark Step Complete`, `Next Step`, and reset behaviour.
- Avoid accounts, database work, AI scoring, or a large redesign.

Initial validation reported by Copilot:

- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run build` passed.

One implementation fix made:

- `NotebookPen` was not exported by `lucide-react`, so it was replaced with `Pencil`.

---

## Content bug discovered

After the feature was added, Josh opened `/resume-study` and saw vague instructions such as:

- “Open the matching resource and read only the section for this topic.”
- “Read the ITIL/service desk section on incidents and service requests, or review the DCSPrep module most closely related to service desk foundations.”

Problem:

- The app did not tell Josh where that ITIL/service desk section was.
- This defeated the whole purpose of a one-click resume flow.
- The task still required hunting through some other resource.

Decision:

- The `Read` step should contain an in-app mini-lesson.
- The user should not need to leave the page to complete the step.
- External resources can be optional, but the Resume Study step itself must be self-contained.

Day 1 was changed to teach the distinction directly:

- Incident = something is broken, degraded, or not working as expected, and the goal is to restore normal service.
- Service request = nothing is broken; the user needs something standard provided, changed, or set up.
- The step asks Josh to write one sentence explaining the distinction in his own words.

Copilot later updated `src/data/resumeStudyPlan.ts` so all read steps used self-contained in-app mini-lessons rather than vague external references.

Validation reported:

- `npm run typecheck` passed.

---

## Playwright logical consistency testing

Josh identified that normal Playwright smoke tests would not catch this issue because the page rendered correctly. The bug was content logic and usability.

New QA principle:

> Every Resume Study step must pass the interrupted support worker test: if Josh returns after a ticket, can he immediately know exactly what to do without searching anywhere else?

A Playwright logical consistency spec was added:

- `e2e/resume-study-logical-consistency.spec.ts`

Reported coverage:

- The Resume Study dashboard card opens the page.
- The Day 1 step flow works.
- The Read step is self-contained.
- Vague wording is rejected.
- Scratch note persistence works after navigation/reload.
- Reset returns the plan to Day 1 and 0% progress.

Other files changed for test support:

- `next.config.mjs`
- `playwright.config.ts`

Reported validation:

- `npm run typecheck` passed.
- `npx playwright test e2e/resume-study-logical-consistency.spec.ts` passed with all 4 tests.

---

## Deployment / Git issue resolved

Josh noticed the live page at `https://dcspd.vercel.app/resume-study` still showed the old vague wording.

Cause:

- The fixes were local but not yet on `main` / deployed.

Copilot then:

- Found the repo was in a detached HEAD state.
- Created branch `resume-study-self-contained`.
- Restored unrelated local artifacts.
- Committed only intended files.
- Rebased onto latest `origin/main`.
- Pushed to `origin/main`.

Commit verified in the conversation:

- `c4256d2 — Make resume study self-contained and add logical QA tests`

Files included in that commit:

- `src/data/resumeStudyPlan.ts`
- `e2e/resume-study-logical-consistency.spec.ts`
- `next.config.mjs`
- `playwright.config.ts`

Remaining check at that time:

- Wait for Vercel to deploy the commit.
- Hard refresh `/resume-study`.
- Confirm old wording is gone.

---

## Current next requested upgrade: real-time study feedback

Josh then noted:

> The Resume Study section has no LLM/API feedback. It should give realtime feedback as I type.

Design direction agreed:

Do not call an LLM on every keystroke. Instead:

1. Provide instant local feedback while typing.
2. Provide optional debounced AI feedback after the user pauses.
3. Keep scratch note saving independent from feedback.
4. Ensure the app still works without an AI configuration.

Recommended behaviour:

- Local feedback is always available.
- AI feedback is extra coaching when configured.
- Scratch notes are always saved.
- API failures should not break the study flow.

Suggested feedback panel states:

- `Write a note to get feedback`
- `Thinking…`
- `Feedback unavailable — your note is still saved`
- Feedback result

Suggested local feedback examples:

- Empty note: prompt the user to start with one plain sentence.
- Very short note: suggest adding a concrete help desk example.
- Missing topic keyword: suggest naming the topic clearly.
- Ticket-note step: remind the user to include issue, checks, result, and next action.

Suggested AI feedback should be short and practical:

- What is good.
- What to improve.
- A suggested rewrite.
- Confidence / quality signal.

Privacy requirement:

- The UI should warn users not to enter real school, person, credential, or network-sensitive details.
- The page should remain suitable for professional development, not live support records.

Testing requested for the feedback upgrade:

- Feedback panel appears.
- Empty note does not trigger remote feedback.
- Typing a useful note shows local feedback.
- Mocked API response displays feedback.
- API failure shows graceful fallback.
- Scratch note still persists after refresh.

Validation should include:

- `npm run typecheck`
- `npm run lint`
- `npx playwright test`
- `npm run build`

Suggested branch:

- `resume-study-feedback`

Suggested commit message:

- `Add realtime resume study feedback`

---

## Product principle to preserve

DCSPD Resume Study should always answer this:

> If Josh is interrupted by a ticket, closes the browser, and comes back later, can he click once and immediately know exactly what to do next?

This principle should guide future Resume Study work.

---

## Final status at time of archive

Done:

- Resume Study feature created.
- Self-contained lessons added.
- Playwright logical consistency tests added.
- Changes pushed to `origin/main`.

Next:

- Verify live Vercel deployment is updated.
- Add local + optional AI study feedback while typing.
- Add Playwright coverage for feedback behaviours.
