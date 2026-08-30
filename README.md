# YARE — Personal Operating System

YARE is a mobile-first personal operating system for daily productivity, health, nutrition, fitness, job searching, spending, routines, goals, and monthly progress. It is designed as a flexible tracker rather than a hard-coded habit list: tasks, schedules, targets, dates, reminders, and scoring rules are stored as data and can be changed without rebuilding the app.

## Stack

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS
- Zustand with persistent browser storage
- Supabase Auth + PostgreSQL + Row Level Security
- date-fns
- Lucide icons

## Run locally

Install Node.js 20 or newer, then clone the repository and open a terminal **inside the `YARE-Website` folder**.

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

Open the localhost address printed by Next.js, normally `http://localhost:3000`.

## Demo / local-only mode

Supabase is optional during development. If `.env.local` is missing, YARE runs in demo mode and stores data in browser localStorage.

Local mode currently persists:

- Tasks and custom schedules
- Historical task logs and target snapshots
- Expenses
- Detailed job applications
- Daily routines
- Overall goals
- Theme preference

Refreshing or restarting the browser does not clear this data. Settings also provides a JSON export and a demo-data reset.

## Supabase setup

1. Create a new Supabase project.
2. Open **SQL Editor**.
3. Run the complete contents of `supabase/schema.sql`.
4. In Supabase Authentication, enable Email authentication.
5. Add your local and production website URLs to the Authentication URL / Redirect URL settings. For local development include `http://localhost:3000/account`.
6. Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Restart the development server after adding environment variables.

### Security design

Every user-data table has Row Level Security enabled. Policies restrict reads and writes to `auth.uid()`. Application IDs such as `gym`, `steps`, or `health` are keyed together with `user_id`, so the same stable IDs can safely exist for multiple accounts.

Do **not** place the Supabase service-role key in this website or in any `NEXT_PUBLIC_*` environment variable.

## Authentication

Cloud mode includes:

- Email signup
- Email/password login
- Persistent Supabase session
- Forgot-password email
- Password update after a recovery link
- Logout
- Authentication gate when cloud mode is enabled
- Cross-account local-data protection

The first account that signs into a browser containing demo data can migrate that local data to its empty cloud account. If a different account later signs in on the same browser, YARE will not upload the previous account's local dataset into the new account.

## Offline behavior

All user changes are written to Zustand/localStorage immediately. When signed in, changes are also sent to Supabase. If a cloud write fails because the browser is offline, the local state remains available and YARE retries the current local snapshot when the browser fires the `online` event.

This is an offline-first MVP, not a full conflict-resolution engine. Simultaneous edits on multiple offline devices are a recommended future improvement.

## Historical targets

Each task log stores `targetSnapshot`, `minSnapshot`, and `maxSnapshot`. If a goal changes later, previously logged days keep the target that existed when that day was recorded.

Tasks use soft deletion/tombstones for the task definition so historical logs remain readable. Archive and restore do not erase history.

## Daily scoring and rest days

Only tasks with `includeInScore = true` contribute to Daily Completion.

- Checkbox / yes-no: complete or incomplete
- Numeric / counter / duration: `current ÷ historical target`, capped at 100%
- Range: 100% when the historical minimum/maximum range is achieved
- Unscheduled days are excluded from scoring
- Gym shows an explicit **Rest Day** when it is outside its configured schedule

The current overall streak counts consecutive 100% scored days. An unfinished current day does not immediately erase the streak earned through yesterday; once today reaches 100%, today is added to the streak.

## Main website sections

### Today
Fast inline logging for checkbox, numeric, duration, time, currency, text, rating, yes/no, counter, and range tasks. Includes daily completion, progress ring, current streak, completed/remaining counts, progress bars, and rest-day handling.

### Month
Calendar view with per-day completion percentages. Select any date to open and edit that historical daily record.

### Tasks
Create, edit, pause, duplicate, archive, restore, soft-delete, and reorder tasks. Supports custom weekdays, one-time tasks, targets/ranges, units, categories, reminders, start/end dates, notes, and Daily Score inclusion.

### Stats
Monthly analytics for daily completion, gym attendance, job applications, steps, sleep, protein, fiber, calories, expenses, spending categories, best day, and longest 100% streak. Separate charts are shown for completion, steps, sleep, applications, and expenses.

### Expenses
Multiple entries per day, date, amount, category, custom category, description and note, plus today/week/month totals and inline record editing.

### Job Applications
Optional detailed pipeline with company, role, applied date, URL, location, salary, work type, notes, and statuses from Applied through Offer/Rejected/Withdrawn. Daily application totals can still be entered directly from Today without detailed records.

### Routine
Separate Sunday-Saturday schedules with add/edit/delete, start/end times, mobile-friendly reorder controls, and copy-one-day-to-other-days support. Routine changes persist locally and sync to Supabase.

### Goals
Task-based goals link directly to the task editor. Standalone overall goals support things such as monthly spending or other custom targets and sync with the rest of the account.

### Settings
Account/sync status, System/Light/Dark appearance, offline status explanation, JSON data export, and safe demo reset.

## Production deployment with Vercel

1. Push or keep this repository on GitHub.
2. In Vercel choose **Add New → Project** and import `Yashwanthreddy21/YARE-Website`.
3. Leave the framework preset as Next.js.
4. Add these environment variables if using Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy.
6. Copy the resulting Vercel URL.
7. Add `https://YOUR_VERCEL_DOMAIN/account` to the allowed redirect URLs in Supabase Authentication.
8. Redeploy if you changed production environment variables.

## Current implementation status

### Complete in the current website MVP

- Mobile-first Today experience and bottom navigation
- Flexible task types and editable schedules
- Historical target snapshots
- Daily scoring and weekend/rest-day handling
- Task create/edit/pause/archive/restore/duplicate/delete/reorder
- Month calendar and daily detail editing
- Monthly analytics and separate charts
- Expense tracker
- Detailed job-application tracker
- Persistent per-day routines
- Overall goals
- Local persistence across browser restarts
- Supabase email authentication
- Supabase cloud load/save synchronization
- Row Level Security
- Multi-user-safe database keys
- Password reset/update
- Offline local writes and reconnect retry
- System/Light/Dark themes
- JSON data export
- Demo reset

### Still recommended / partially complete

- Custom category-management screen
- True drag-and-drop task/routine reordering (current mobile-friendly up/down controls work)
- Browser/PWA push notifications for reminders when the website is closed
- First-run multi-step onboarding wizard
- Import/restore from exported JSON
- Advanced multi-device offline conflict resolution
- User-configurable first day of week and unit preferences
- More granular job/expense delete history controls
- Full browser end-to-end test suite

## Validation

The repository includes `.github/workflows/ci.yml` for dependency installation, TypeScript checking, and a production Next.js build. If GitHub Actions is enabled for the repository, pushes and pull requests run these checks automatically.

During this build session GitHub accepted a validation pull request, but no Actions run was started by the connected GitHub integration. Because of that, the current code should still be run once with `npm install`, `npm run typecheck`, and `npm run build` on a normal local machine or through Vercel before calling the deployment fully verified.
