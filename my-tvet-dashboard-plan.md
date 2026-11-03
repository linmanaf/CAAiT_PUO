# MY TVET Dashboard — Plan

## Top-Level Overview

Build a single self-contained `index.html` file — no frameworks, no build tools — that displays the **MY TVET Dashboard** page. The page renders three summary cards (Students Registered, Tasks Remaining, Workshop Status) and one interactive Preparation Checklist. All data is hard-coded sample data. The checklist items are checkable/uncheckable, and all progress indicators update live in the browser.

**Scope:** One file (`index.html`) with embedded CSS and JavaScript.  
**Non-goals:** No backend, no persistence, no routing, no external dependencies.

---

## Sub-Tasks

---

### Sub-Task 1 — Page Shell and Header

**Intent**  
Create the `index.html` file with the base HTML structure, embedded `<style>` and `<script>` blocks, a responsive page layout, and the dashboard header.

**Expected Outcomes**
- File `index.html` exists and opens in a browser.
- A styled header displays the title **MY TVET Dashboard**, a subtitle, and the current date (set dynamically via JS).
- The overall page background and font are consistent.

**Todo List**
1. Create `index.html` with standard HTML5 boilerplate.
2. Embed a `<style>` block with CSS reset, base font (system font stack), color variables, and page background.
3. Add a `<header>` section containing: page title, subtitle, and a `<span>` for the current date populated by JS.
4. Add a `<main>` wrapper for the cards and checklist sections.
5. Add an empty `<script>` block and write one line to inject today's date into the header span.

**Relevant Context**
- No existing files — this is a greenfield page.
- Color palette suggestion: dark navy header, white card backgrounds, accent blue for progress bars.

**Status:** [x] done

---

### Sub-Task 2 — Three Summary Cards

**Intent**  
Add the three summary cards in a responsive row below the header. Each card displays its own sample data and a styled progress bar where applicable.

**Expected Outcomes**
- Three cards render side-by-side on wide screens and stack vertically on narrow screens.
- **Card 1 — Students Registered:** shows 34 registered out of 40 capacity, 28 confirmed, 6 pending, progress bar at 85%.
- **Card 2 — Tasks Remaining:** shows 4 tasks remaining out of 12 total, 8 complete, progress bar at 67%.
- **Card 3 — Workshop Status:** shows status label "In Preparation" with a yellow badge, workshop date 25 July 2025, days-until-workshop count (calculated live by JS), 3 sessions planned, facilitator name Ms. Rahel Tesfaye.
- Cards are visually distinct with icons, bold numbers, and subtle shadows.

**Todo List**
1. Add a `.cards-row` CSS grid or flexbox container inside `<main>`.
2. Create the HTML markup for Card 1 with icon, headline number, sub-stats, and a `<div class="progress-bar">` filled to 85%.
3. Create the HTML markup for Card 2 with icon, headline number, sub-stats, and a progress bar filled to 67%.
4. Create the HTML markup for Card 3 with icon, status badge, date, days-remaining span, sessions count, and facilitator name.
5. Add CSS for `.card`, `.progress-bar`, `.badge`, and responsive breakpoint so cards stack on screens narrower than 700px.
6. Add JS to calculate and inject the number of days until 25 July 2025 into the Workshop Status card.

**Relevant Context**
- Cards live inside the `<main>` block created in Sub-Task 1.
- Progress bars are pure CSS — a fixed-width outer div and a colored inner div whose `width` is set inline.
- Badge color logic: "In Preparation" = yellow (`#f1c21b`), "Ready" = green (`#24a148`).

**Status:** [x] done

---

### Sub-Task 3 — Preparation Checklist

**Intent**  
Add an interactive checklist section below the cards. Users can check and uncheck items; the header progress count and progress bar update instantly.

**Expected Outcomes**
- A section titled **Preparation Checklist** renders below the cards.
- 12 checklist items are displayed, 8 pre-checked and 4 unchecked, matching the sample data.
- A live counter reads "8 of 12 tasks complete" and updates whenever a checkbox is toggled.
- A progress bar in the checklist header also updates live to reflect the current completion percentage.
- Checked items display with a strikethrough or muted style; unchecked items appear normal.

**Checklist Sample Data**

| # | Task | Initial State |
|---|---|---|
| 1 | Send confirmation emails to all registered students | Checked |
| 2 | Book and confirm the venue / lab | Checked |
| 3 | Upload all exercise materials to shared folder | Checked |
| 4 | Test all tools and environments students will use | Checked |
| 5 | Assign a TA or helper for each session block | Checked |
| 6 | Prepare printed handouts for Day 1 | Checked |
| 7 | Set up attendance tracking sheet | Checked |
| 8 | Confirm catering / refreshments | Checked |
| 9 | Brief all facilitators on the schedule | Unchecked |
| 10 | Test the projector and audio in the room | Unchecked |
| 11 | Send a reminder SMS/email 48 hours before | Unchecked |
| 12 | Prepare a backup plan for no-shows | Unchecked |

**Todo List**
1. Add a `<section class="checklist">` below the cards row inside `<main>`.
2. Add a checklist header with the title, a live counter span (e.g. `<span id="check-count">8 of 12</span>`), and a progress bar div.
3. Render 12 `<label>` + `<input type="checkbox">` pairs inside a `<ul>`, with items 1–8 set to `checked`.
4. Add CSS for `.checklist`, checked item strikethrough, hover state, and checklist progress bar.
5. Add a JS function `updateChecklist()` that reads all checkbox states, recalculates the count, updates the counter span text, and updates the progress bar width.
6. Attach an `onchange` event listener to each checkbox that calls `updateChecklist()`.
7. Call `updateChecklist()` once on page load to initialize the display correctly.

**Relevant Context**
- The checklist progress bar uses the same CSS pattern as the card progress bars from Sub-Task 2.
- The JS counter and bar update must be synchronous and instant — no animations required unless trivially added.

**Status:** [x] done

---

## File Output

| File | Purpose |
|---|---|
| `index.html` | Single self-contained dashboard page |

---

## Completion Criteria

- `index.html` opens in any modern browser with no console errors.
- All three cards display correct sample data.
- The Workshop Status card shows the correct number of days until 25 July 2025.
- Checking and unchecking items in the Preparation Checklist updates the counter and progress bar live.
- The page is readable on both desktop and mobile screen widths.
