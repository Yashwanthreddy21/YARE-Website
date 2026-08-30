'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function GoalsPage() {
  const { tasks, goals, upsertGoal, deleteGoal } = useAppStore();
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');

  const taskGoals = useMemo(() => tasks.filter((task) => !task.deleted && (task.targetValue != null || task.minValue != null || task.maxValue != null)), [tasks]);

  function addGoal() {
    const numericValue = value === '' ? undefined : Number(value);
    if (!name.trim() || (numericValue != null && !Number.isFinite(numericValue))) return;
    upsertGoal({ id: crypto.randomUUID(), goalName: name.trim(), goalValue: numericValue, unit: unit.trim() || undefined });
    setName('');
    setValue('');
    setUnit('');
  }

  return (
    <div>
      <p className="text-sm text-slate-500">Overall targets</p>
      <h1 className="mb-6 text-3xl font-black">Goals</h1>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">Task goals</h2>
        <div className="space-y-2">
          {taskGoals.map((task) => (
            <Link href={`/tasks/${task.id}`} className="card flex items-center justify-between gap-4 p-4" key={task.id}>
              <div className="min-w-0"><b className="block truncate">{task.name}</b><div className="text-xs text-slate-500">Tap to edit target or range</div></div>
              <b className="shrink-0">{task.targetValue ?? `${task.minValue ?? '—'}–${task.maxValue ?? '—'}`} {task.unit}</b>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-3"><h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Overall goals</h2><span className="text-xs text-slate-400">Monthly, financial, or custom</span></div>
        <div className="space-y-2">
          {goals.map((goal) => (
            <div className="card flex items-center gap-3 p-4" key={goal.id}>
              <input aria-label="Goal name" className="input min-w-0 flex-1" value={goal.goalName} onChange={(e) => upsertGoal({ ...goal, goalName: e.target.value })} />
              <input aria-label={`${goal.goalName} value`} className="input max-w-28" type="number" step="any" value={goal.goalValue ?? ''} onChange={(e) => upsertGoal({ ...goal, goalValue: e.target.value === '' ? undefined : Number(e.target.value) })} />
              <input aria-label={`${goal.goalName} unit`} className="input max-w-24" value={goal.unit ?? ''} onChange={(e) => upsertGoal({ ...goal, unit: e.target.value || undefined })} placeholder="unit" />
              <button aria-label={`Delete ${goal.goalName}`} onClick={() => deleteGoal(goal.id)} className="rounded-lg p-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"><Trash2 size={17} /></button>
            </div>
          ))}
          {!goals.length && <div className="card p-6 text-center text-sm text-slate-500">No standalone goals yet.</div>}
        </div>

        <form className="card mt-4 grid gap-3 p-4 sm:grid-cols-[1fr_140px_110px_auto]" onSubmit={(event) => { event.preventDefault(); addGoal(); }}>
          <input className="input" placeholder="Monthly spending" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="input" type="number" step="any" placeholder="1500" value={value} onChange={(e) => setValue(e.target.value)} />
          <input className="input" placeholder="$ / times" value={unit} onChange={(e) => setUnit(e.target.value)} />
          <button className="btn-primary"><Plus size={17} /> Add</button>
        </form>
      </section>
    </div>
  );
}
