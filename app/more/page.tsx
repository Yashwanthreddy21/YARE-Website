import Link from 'next/link';
import { BriefcaseBusiness, CalendarClock, Flag, FolderCog, ReceiptText, Settings } from 'lucide-react';

const items = [
  ['Expenses', 'Track daily spending', '/expenses', ReceiptText],
  ['Job Applications', 'Manage detailed applications', '/jobs', BriefcaseBusiness],
  ['Routine', 'Build your daily schedule', '/schedule', CalendarClock],
  ['Goals', 'Edit overall targets', '/goals', Flag],
  ['Categories', 'Create and organize task groups', '/categories', FolderCog],
  ['Settings', 'Account, theme and data', '/settings', Settings],
] as const;

export default function MorePage() {
  return (
    <div>
      <p className="text-sm text-slate-500">Everything else</p>
      <h1 className="mb-6 text-3xl font-black">More</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(([title, sub, href, Icon]) => (
          <Link key={href} href={href} className="card flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
            <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800"><Icon /></div>
            <div><div className="font-bold">{title}</div><div className="text-sm text-slate-500">{sub}</div></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
