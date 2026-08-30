'use client';

import { useMemo, useState } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, format, isAfter, isSameMonth, startOfMonth, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { dailyScore, matchesTaskCalendar, taskProgress } from '@/utils/progress';
import { localDateKey } from '@/utils/date';

type ChartPoint = { label: string; value: number };

function MiniBarChart({ title, data, suffix = '' }: { title: string; data: ChartPoint[]; suffix?: string }) {
  const max = Math.max(1, ...data.map((point) => point.value));
  return (
    <section className="card p-5">
      <h2 className="font-bold">{title}</h2>
      <div className="mt-5 flex h-40 items-end gap-1" aria-label={`${title} chart`}>
        {data.map((point) => (
          <div key={point.label} className="group relative flex min-w-0 flex-1 items-end" title={`${point.label}: ${point.value}${suffix}`}>
            <div className="w-full rounded-t bg-slate-800 transition-opacity group-hover:opacity-70 dark:bg-slate-200" style={{ height: `${Math.max((point.value / max) * 100, point.value > 0 ? 3 : 1)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-400"><span>{data[0]?.label ?? ''}</span><span>{data.at(-1)?.label ?? ''}</span></div>
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="card p-4"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 text-2xl font-black">{value}</div>{detail && <div className="mt-1 text-xs text-slate-500">{detail}</div>}</div>;
}

export default function StatsPage() {
  const { tasks, logs, expenses, jobs } = useAppStore();
  const [cursor, setCursor] = useState(new Date());
  const now = new Date();
  const start = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const end = isSameMonth(cursor, now) ? now : isAfter(start, now) ? start : monthEnd;
  const days = eachDayOfInterval({ start, end });
  const monthKey = format(cursor, 'yyyy-MM');

  const stats = useMemo(() => {
    const getTask = (id: string) => tasks.find((task) => task.id === id);
    const getLog = (taskId: string, date: Date) => logs.find((log) => log.taskId === taskId && log.date === localDateKey(date));
    const values = (taskId: string) => days.map((date) => ({ date, log: getLog(taskId, date) })).filter((entry) => entry.log?.numericValue != null);
    const avg = (numbers: number[]) => numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : 0;

    const completion = days.map((date) => ({ label: format(date, 'd'), value: dailyScore(tasks, logs, date) }));
    const avgCompletion = Math.round(avg(completion.map((point) => point.value)));

    const gym = getTask('gym');
    const gymPlannedDays = gym ? days.filter((date) => matchesTaskCalendar(gym, date)) : [];
    const gymCompleted = gym ? gymPlannedDays.filter((date) => taskProgress(gym, getLog(gym.id, date)) >= 1).length : 0;

    const appTask = getTask('applications');
    const appDaily = days.map((date) => ({ label: format(date, 'd'), value: getLog('applications', date)?.numericValue ?? 0 }));
    const appValues = appDaily.map((point) => point.value);
    const appTotal = appValues.reduce((sum, value) => sum + value, 0);
    const appGoalDays = appTask ? days.filter((date) => taskProgress(appTask, getLog(appTask.id, date)) >= 1).length : 0;

    const stepsTask = getTask('steps');
    const stepsDaily = days.map((date) => ({ label: format(date, 'd'), value: getLog('steps', date)?.numericValue ?? 0 }));
    const stepValues = stepsDaily.map((point) => point.value);
    const stepTracked = stepValues.filter((value) => value > 0);
    const stepsGoalDays = stepsTask ? days.filter((date) => taskProgress(stepsTask, getLog(stepsTask.id, date)) >= 1).length : 0;

    const sleepTask = getTask('sleep');
    const sleepDaily = days.map((date) => ({ label: format(date, 'd'), value: getLog('sleep', date)?.numericValue ?? 0 }));
    const sleepTracked = sleepDaily.map((point) => point.value).filter((value) => value > 0);
    const sleepGoalDays = sleepTask ? days.filter((date) => taskProgress(sleepTask, getLog(sleepTask.id, date)) >= 1).length : 0;

    const proteinTask = getTask('protein');
    const proteinTracked = values('protein').map((entry) => entry.log!.numericValue!);
    const proteinGoalDays = proteinTask ? days.filter((date) => taskProgress(proteinTask, getLog(proteinTask.id, date)) >= 1).length : 0;

    const fiberTask = getTask('fiber');
    const fiberTracked = values('fiber').map((entry) => entry.log!.numericValue!);
    const fiberGoalDays = fiberTask ? days.filter((date) => taskProgress(fiberTask, getLog(fiberTask.id, date)) >= 1).length : 0;

    const caloriesTracked = values('calories').map((entry) => entry.log!.numericValue!);

    const monthExpenses = expenses.filter((expense) => expense.date.startsWith(monthKey));
    const expenseDaily = days.map((date) => {
      const key = localDateKey(date);
      return { label: format(date, 'd'), value: monthExpenses.filter((expense) => expense.date === key).reduce((sum, expense) => sum + expense.amount, 0) };
    });
    const expenseTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const categoryTotals = Array.from(monthExpenses.reduce((map, expense) => map.set(expense.category, (map.get(expense.category) ?? 0) + expense.amount), new Map<string, number>()).entries()).sort((a, b) => b[1] - a[1]);

    const bestDay = completion.length ? completion.reduce((best, point) => point.value > best.value ? point : best, completion[0]) : null;
    let longestStreak = 0;
    let currentStreak = 0;
    for (const point of completion) {
      if (point.value === 100) { currentStreak += 1; longestStreak = Math.max(longestStreak, currentStreak); } else currentStreak = 0;
    }

    const detailedJobs = jobs.filter((job) => job.dateApplied.startsWith(monthKey)).length;

    return {
      completion, avgCompletion, gymCompleted, gymPlanned: gymPlannedDays.length,
      appDaily, appTotal, appAverage: avg(appValues), appGoalDays, appHighest: Math.max(0, ...appValues), detailedJobs,
      stepsDaily, stepsTotal: stepValues.reduce((sum, value) => sum + value, 0), stepsAverage: avg(stepTracked), stepsGoalDays,
      sleepDaily, sleepAverage: avg(sleepTracked), sleepBest: Math.max(0, ...sleepTracked), sleepLowest: sleepTracked.length ? Math.min(...sleepTracked) : 0, sleepGoalDays,
      proteinAverage: avg(proteinTracked), proteinGoalDays,
      fiberAverage: avg(fiberTracked), fiberGoalDays,
      calorieAverage: avg(caloriesTracked), calorieHigh: Math.max(0, ...caloriesTracked), calorieLow: caloriesTracked.length ? Math.min(...caloriesTracked) : 0, calorieTotal: caloriesTracked.reduce((sum, value) => sum + value, 0),
      expenseDaily, expenseTotal, expenseAverage: days.length ? expenseTotal / days.length : 0, expenseHighest: Math.max(0, ...expenseDaily.map((point) => point.value)), categoryTotals,
      bestDay, longestStreak,
    };
  }, [tasks, logs, expenses, jobs, days, monthKey]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div><p className="text-sm text-slate-500">Monthly analytics</p><h1 className="text-3xl font-black">{format(cursor, 'MMMM yyyy')}</h1></div>
        <div className="flex gap-1">
          <button className="btn-secondary px-3" aria-label="Previous month" onClick={() => setCursor(subMonths(cursor, 1))}><ChevronLeft size={18} /></button>
          <button className="btn-secondary px-3" onClick={() => setCursor(new Date())}>Today</button>
          <button className="btn-secondary px-3" aria-label="Next month" disabled={isSameMonth(cursor, now) || isAfter(cursor, now)} onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Daily completion" value={`${stats.avgCompletion}%`} />
        <Metric label="Gym" value={`${stats.gymCompleted} / ${stats.gymPlanned}`} detail={stats.gymPlanned ? `${Math.round((stats.gymCompleted / stats.gymPlanned) * 100)}% attendance` : 'No sessions planned'} />
        <Metric label="Job applications" value={String(stats.appTotal)} detail={`${stats.appAverage.toFixed(1)}/day · ${stats.appGoalDays} goal days`} />
        <Metric label="10K steps" value={`${stats.stepsGoalDays} / ${days.length}`} detail={`${Math.round(stats.stepsAverage).toLocaleString()} avg`} />
        <Metric label="Average sleep" value={`${stats.sleepAverage.toFixed(1)}h`} detail={`${stats.sleepGoalDays} days in range`} />
        <Metric label="Average protein" value={`${Math.round(stats.proteinAverage)}g`} detail={`${stats.proteinGoalDays} target days`} />
        <Metric label="Average fiber" value={`${Math.round(stats.fiberAverage)}g`} detail={`${stats.fiberGoalDays} target days`} />
        <Metric label="Expenses" value={`$${stats.expenseTotal.toFixed(2)}`} detail={`$${stats.expenseAverage.toFixed(2)}/day`} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Highest applications" value={String(stats.appHighest)} detail={`${stats.detailedJobs} detailed entries`} />
        <Metric label="Sleep range" value={`${stats.sleepLowest.toFixed(1)}–${stats.sleepBest.toFixed(1)}h`} />
        <Metric label="Calories" value={`${Math.round(stats.calorieAverage).toLocaleString()} avg`} detail={`${Math.round(stats.calorieTotal).toLocaleString()} total`} />
        <Metric label="Highest spending day" value={`$${stats.expenseHighest.toFixed(2)}`} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <MiniBarChart title="Daily completion" data={stats.completion} suffix="%" />
        <MiniBarChart title="Steps" data={stats.stepsDaily} />
        <MiniBarChart title="Sleep" data={stats.sleepDaily} suffix="h" />
        <MiniBarChart title="Job applications" data={stats.appDaily} />
        <MiniBarChart title="Expenses" data={stats.expenseDaily} suffix="$" />
        <section className="card p-5">
          <h2 className="font-bold">Spending by category</h2>
          <div className="mt-4 space-y-3">
            {stats.categoryTotals.map(([category, value]) => (
              <div key={category}>
                <div className="flex justify-between gap-4 text-sm"><span>{category}</span><b>${value.toFixed(2)}</b></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-slate-800 dark:bg-slate-200" style={{ width: `${stats.expenseTotal ? (value / stats.expenseTotal) * 100 : 0}%` }} /></div>
              </div>
            ))}
            {!stats.categoryTotals.length && <p className="text-sm text-slate-500">No expenses this month.</p>}
          </div>
        </section>
      </div>

      <section className="card mt-5 p-5">
        <h2 className="font-bold">Monthly summary</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div><span className="text-slate-500">Daily Completion</span><div className="font-bold">{stats.avgCompletion}%</div></div>
          <div><span className="text-slate-500">Gym</span><div className="font-bold">{stats.gymCompleted} / {stats.gymPlanned} sessions</div></div>
          <div><span className="text-slate-500">Job Applications</span><div className="font-bold">{stats.appTotal} total</div></div>
          <div><span className="text-slate-500">Average Sleep</span><div className="font-bold">{stats.sleepAverage.toFixed(1)}h</div></div>
          <div><span className="text-slate-500">Total Calories</span><div className="font-bold">{Math.round(stats.calorieTotal).toLocaleString()} kcal</div></div>
          <div><span className="text-slate-500">Total Expenses</span><div className="font-bold">${stats.expenseTotal.toFixed(2)}</div></div>
          <div><span className="text-slate-500">Best Day</span><div className="font-bold">{stats.bestDay ? `Day ${stats.bestDay.label} · ${stats.bestDay.value}%` : '—'}</div></div>
          <div><span className="text-slate-500">Longest 100% Streak</span><div className="font-bold">{stats.longestStreak} days</div></div>
        </div>
      </section>
    </div>
  );
}
