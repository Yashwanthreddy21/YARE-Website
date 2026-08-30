# YARE — Personal Operating System

A mobile-first web application for daily productivity, health, nutrition, fitness, job-search, spending, routines, goals, and monthly tracking.

## Stack
- Next.js + React + TypeScript
- Tailwind CSS
- Zustand persistent local state
- Supabase schema/RLS ready
- date-fns

## Run locally
1. Install Node.js 20+.
2. Clone this repository.
3. Open a terminal **inside the YARE-Website project folder**.
4. Run:

```bash
npm install
npm run typecheck
npm run dev
```

Then open the localhost address printed in the terminal.

## Demo mode
No `.env.local` is required. Without Supabase credentials the app uses browser localStorage, so tasks, logs, expenses, and applications survive browser refreshes/restarts on the same browser/device.

## Supabase
Create a Supabase project, open SQL Editor, and run `supabase/schema.sql`.

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The SQL enables Row Level Security on every user-data table and restricts rows to `auth.uid()`.

## Deployment
The easiest production deployment is Vercel:
1. Import this GitHub repository into Vercel.
2. Add the two Supabase environment variables if using cloud mode.
3. Deploy.

## Current MVP
Complete: responsive Today dashboard, inline task logging, flexible task types/models, M/W/F-style custom scheduling, automatic rest days, historical target snapshots, task add/edit/archive/restore/duplicate/delete, persistent local storage, monthly calendar, daily detail, expenses, optional job applications, goals, routine editor, basic monthly analytics, dark appearance, responsive bottom/desktop navigation, Supabase schema and RLS.

Partially complete: Supabase client is wired/configurable but local-to-cloud synchronization/auth UI is the next integration step; routine currently persists only for the current page session; advanced charts, drag reordering, reminders/PWA push notifications, custom category editor, data export, onboarding, and full automated end-to-end tests remain.

## Historical targets
Every task log stores `targetSnapshot`, `minSnapshot`, and `maxSnapshot`. Changing a task goal later does not change previously logged targets.

## Rest days
A task only enters the daily score when the selected date matches its configured `daysOfWeek`. Unscheduled days never count as incomplete.
