# Help & User Guide

1.  [Quick start](#quickstart)
2.  [Core concepts](#concepts)
3.  [Scheduler](#scheduler)
4.  [Kids](#kids)
5.  [Matters](#matters)
6.  [Today & Now/Next](#today)
7.  [Settings](#settings)
8.  [Share / Export & Import](#share)
9.  [Install & Offline](#pwa)
10. [FAQ & Troubleshooting](#faq)
11. [Data & Privacy](#privacy)
12. [Contact](#contact)

## Quick start

1.  Go to [Matters](/matters) and create your subjects/activities. Give them a name, a color, and (optionally) a date range during which they’re active.
2.  Go to [Kids](/kids), add each kid (the app generates an avatar automatically).
3.  Open the [Scheduler](/timetable-scheduler), pick a kid, then click on empty grid cells to add matters. Drag to move; drag the thin bars at the top or bottom to resize.
4.  Tune your week in [Settings](/settings) (start/end hours, hidden weekdays, start of week).
5.  Use [Today](/today) to see a day-at-a-glance (or the Now/Next summary on Home).

## Core concepts

### Kids

People you plan for. Each kid has a name and an avatar. Timetables are per-kid.

### Matters

Subjects/activities with a color and optional active dates (start/end). Blocks in the schedule reference a matter.

### Config

Global settings: visible hours, hidden weekdays, and the start of the week. These shape the scheduler grid.

## Scheduler

The scheduler shows a week grid. Columns are weekdays (respecting hidden days and the chosen start-of-week). Rows are time slots (5-minute steps). Visible vertical range is controlled by Settings.

-   **Add a block:** click an empty cell → select a matter in the popup.
-   **Move:** drag the block anywhere, even across days.
-   **Resize:** drag the thin handle at the top or bottom. Blocks snap to 5-minute increments.
-   **Delete:** click the 🗑️ icon on a block and confirm.
-   **Hover highlight:** the row under your cursor is subtly highlighted to make dropping easier.
-   **Matter dates:** a matter is only considered “ongoing” between its start and end dates; that affects Today/Now views.

Tip: if you can’t see morning/evening slots you expect, raise the visible range in [Settings](/settings).

## Kids

-   **Add / edit / delete** kids in [Kids](/kids).
-   Avatars are auto-generated; the selection picker shows avatars and names—click one to select.
-   Schedules are per-kid. Switch kids using the avatar picker at the top of the Scheduler.

## Matters

-   Create/edit matters in [Matters](/matters).
-   Optional **date range** (Start/End) controls when the matter is considered active.
-   Color is used to style blocks; keep a consistent palette for readability.

## Today & Now/Next

The [Today](/today) view shows a single day with a live “current time” marker. Each kid’s card also shows **Now** (with a progress bar) and **Next** matter—only if those matters are within their date ranges.

-   Jump between days using ◀︎ / ▶︎ in the Today view; use “Today” to return to the current date.
-   If nothing is happening “now”, you’ll only see the “next” matter (if any).

## Settings

-   **Scheduler hours:** set the visible start/end time for the grid.
-   **Visible weekdays:** hide/show days (e.g., weekends).
-   **Start of week:** choose which day your week begins on; the scheduler reorders columns accordingly.

The app validates times so end time is always after start time.

## Share / Export & Import

Use the **Share** button (share icon) to export selected kids’ timetables plus the used matters and global config into a link. On supported browsers, the native share sheet opens; otherwise a link is shown for copying.

### What’s exported

-   Selected kids
-   Only the _matters used_ in their timetables
-   Global config (hours, hidden weekdays, start of week)

### Import behavior

-   **Kids:** added if new; if a kid already exists (by name or ID depending on your implementation), they remain, and their timetable is _overwritten_ by the imported one.
-   **Matters:** matched by name; new ones are added, existing ones reused. Start/end dates are widened only if the incoming range extends earlier/later.
-   **Config:** start hour lowers only if the incoming one is earlier; end hour raises only if the incoming one is later; hidden weekdays and start-of-week merge sensibly.

You can also paste a link with `#data=…` into the address bar; the app’s import gate will let you choose what to bring in.

## Install & Offline

-   Click **Install App** (when offered) to add it to your device.
-   The app works offline; your data stays on this device (local storage).

## FAQ & Troubleshooting

**My blocks don’t show early/late times.** Increase the visible hours in [Settings](/settings).

**I can’t drop a block exactly where I want.** Blocks snap to 5-minute increments. Try dropping close to the desired time.

**Nothing shows in Now/Next.** Check the matter’s start/end dates and today’s date. Matters outside their range are ignored.

**I can’t see/share the export link.** Some browsers block the native share sheet; the app falls back to a copyable link in the modal.

**How do I reset everything?** Use your browser’s site storage controls to clear local storage for this app (this wipes all data).

## Data & Privacy

All data (kids, matters, timetables, settings) is saved in your browser’s local storage. Nothing is sent to a server unless you explicitly share an export link with someone.

## Contact

Questions, ideas, or bug reports? Reach out anytime:

-   [📧 Email — jmtalarn+timetablepwa@gmail.com](mailto:jmtalarn+timetablepwa@gmail.com)
-   [𝕏 / Twitter — @jmtalarn](https://x.com/jmtalarn)
-   [Bluesky — @jmtalarn.com](https://bsky.app/profile/jmtalarn.com)
-   [LinkedIn — /in/jmtalarn](https://www.linkedin.com/in/jmtalarn)
