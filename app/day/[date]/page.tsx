'use client';

import { useParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { useAppStore } from '@/store/useAppStore';
import { dailyScore, isTaskScheduled, matchesTaskCalendar } from '@/utils/progress';
import { localDateKey } from '@/utils/date';
import { TaskCard } from '@/components/TaskCard';

export default function DayPage() {
  const { date } = useParams<{ date: string }>();
  const day = parseISO(date);
  const { tasks, logs } = useAppStore();
  const historical = date < localDateKey();
  const logsForDate = logs.filter((log) => log.date === date);
  const loggedTaskIds = new Set(logsForDate.map((log) => log.taskId));
  const list = tasks
    .filter((task) => loggedTaskIds.has(task.id) || (historical ? matchesTaskCalendar(task, day) : isTaskScheduled(task, day)))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div>
      <header className="mb-6">
        <p className="text-sm text-slate-500">Daily record · {dailyScore(tasks, logs, day)}% complete</p>
        <h1 className="text-3xl font-black">{format(day, 'EEEE, MMMM d')}</h1>
      </header>
      <div className="grid gap-3 lg:grid-cols-2">
        {list.map((task) => <TaskCard key={task.id} task={task} date={date} log={logs.find((log) => log.taskId === task.id && log.date === date)} />)}
      </div>
      {!list.length && <div className="card p-8 text-center text-slate-500">Nothing was scheduled for this date.</div>}
    </div>
  );
}
