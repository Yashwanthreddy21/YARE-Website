'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, ChartNoAxesCombined, CheckSquare2, CircleEllipsis, House } from 'lucide-react';

const items = [
  { href: '/', label: 'Today', icon: House },
  { href: '/month', label: 'Month', icon: CalendarDays },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare2 },
  { href: '/stats', label: 'Stats', icon: ChartNoAxesCombined },
  { href: '/more', label: 'More', icon: CircleEllipsis },
];

export function Navigation() {
  const pathname = usePathname();
  return <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:left-4 md:top-4 md:right-auto md:bottom-4 md:w-52 md:rounded-2xl md:border md:p-3">
    <div className="mx-auto flex max-w-2xl justify-around md:flex-col md:justify-start md:gap-1">
      <div className="mb-5 hidden px-3 pt-2 md:block"><div className="text-xl font-black">YARE</div><div className="text-xs text-slate-500">Personal Operating System</div></div>
      {items.map(({ href, label, icon: Icon }) => { const active = href === '/' ? pathname === '/' : pathname.startsWith(href); return <Link key={href} href={href} className={`flex min-w-14 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium md:flex-row md:text-sm ${active ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'}`}><Icon size={20}/><span>{label}</span></Link>; })}
    </div>
  </nav>;
}
