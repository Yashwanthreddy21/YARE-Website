'use client';

import { format } from 'date-fns';
import { useAppStore } from '@/store/useAppStore';
import { dailyScore, isTaskScheduled, taskProgress } from '@/utils/progress';
import { TaskCard } from '@/components/TaskCard';
import { Flame, Target } from 'lucide-react';

export default function TodayPage() {
  const tasks = useAppStore((s) => s.tasks); const logs = useAppStore((s) => s.logs);
  const now = new Date(); const date = now.toISOString().slice(0, 10); const scheduled = tasks.filter((t) => isTaskScheduled(t, now)).sort((a,b) => a.sortOrder-b.sortOrder); const score = dailyScore(tasks, logs, now);
  const completed = scheduled.filter((t) => taskProgress(t, logs.find((l) => l.taskId === t.id && l.date === date)) >= 1).length;
  return <div>
    <header className="mb-6"><p className="text-sm font-medium text-slate-500">{format(now, 'EEEE, MMMM d')}</p><h1 className="mt-1 text-3xl font-black tracking-tight">Today</h1></header>
    <section className="card mb-6 p-5"><div className="flex items-center justify-between gap-5"><div><div className="text-sm text-slate-500">Daily completion</div><div className="mt-1 text-4xl font-black tabular-nums">{score}%</div><div className="mt-2 text-sm text-slate-500">{completed} complete · {Math.max(scheduled.length-completed,0)} remaining</div></div><div className="relative grid h-24 w-24 place-items-center rounded-full" style={{background:`conic-gradient(currentColor ${score}%, rgb(226 232 240) 0)`}}><div className="grid h-19 w-19 h-20 w-20 place-items-center rounded-full bg-white text-sm font-bold dark:bg-slate-900">{score}%</div></div></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><Flame size={18}/><div className="mt-2 text-xs text-slate-500">Current streak</div><div className="font-bold">Start today</div></div><div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><Target size={18}/><div className="mt-2 text-xs text-slate-500">Tasks today</div><div className="font-bold">{scheduled.length}</div></div></div></section>
    <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Your day</h2><span className="text-xs text-slate-500">Tap and update inline</span></div>
    <div className="grid gap-3 lg:grid-cols-2">{scheduled.map((task) => <TaskCard key={task.id} task={task} date={date} log={logs.find((l) => l.taskId === task.id && l.date === date)}/>)}</div>
    {!scheduled.length && <div className="card p-8 text-center text-slate-500">No tasks scheduled today. Enjoy your rest day.</div>}
    <div className="mt-6 text-center text-sm font-semibold">Daily Score: {score}%</div>
  </div>;
}
