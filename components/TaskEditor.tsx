'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import type { FrequencyType, Task, TaskType } from '@/types';
import { localDateKey } from '@/utils/date';

const types: { value: TaskType; label: string }[] = [
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'numeric', label: 'Numeric target' },
  { value: 'duration', label: 'Duration' },
  { value: 'time', label: 'Time' },
  { value: 'currency', label: 'Currency' },
  { value: 'text', label: 'Text / notes' },
  { value: 'rating', label: 'Rating' },
  { value: 'yes_no', label: 'Yes / No' },
  { value: 'counter', label: 'Counter' },
  { value: 'range', label: 'Range target' },
];
const frequencies: { value: FrequencyType; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom days' },
  { value: 'once', label: 'One time' },
];
const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TaskEditor({ existing }: { existing?: Task }) {
  const router = useRouter();
  const { categories, addTask, updateTask, tasks } = useAppStore();
  const [error, setError] = useState('');
  const [task, setTask] = useState<Task>(existing ?? {
    id: crypto.randomUUID(),
    name: '',
    categoryId: categories[0]?.id ?? 'personal',
    taskType: 'checkbox',
    icon: 'CheckCircle2',
    frequency: 'daily',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    startDate: localDateKey(),
    active: true,
    archived: false,
    deleted: false,
    includeInScore: true,
    reminderEnabled: false,
    sortOrder: Math.max(0, ...tasks.map((t) => t.sortOrder)) + 1,
  });

  const patch = (value: Partial<Task>) => setTask((current) => ({ ...current, ...value }));
  const needsGoal = ['numeric', 'duration', 'counter'].includes(task.taskType);
  const needsRange = task.taskType === 'range';
  const supportsUnit = ['numeric', 'duration', 'counter', 'range'].includes(task.taskType);

  function changeFrequency(frequency: FrequencyType) {
    if (frequency === 'daily') return patch({ frequency, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] });
    if (frequency === 'once') return patch({ frequency, daysOfWeek: [new Date(`${task.startDate}T12:00:00`).getDay()] });
    patch({ frequency });
  }

  function submit() {
    setError('');
    if (!task.name.trim()) return setError('Please enter a task name.');
    if (!task.startDate) return setError('Please choose a start date.');
    if (task.endDate && task.endDate < task.startDate) return setError('End date cannot be before the start date.');
    if (task.frequency !== 'once' && task.daysOfWeek.length === 0) return setError('Choose at least one scheduled day.');
    if (needsRange && task.minValue != null && task.maxValue != null && task.minValue > task.maxValue) return setError('Minimum target cannot be greater than maximum target.');

    const normalized = {
      ...task,
      name: task.name.trim(),
      icon: task.icon.trim() || 'CheckCircle2',
      unit: task.unit?.trim() || undefined,
      notes: task.notes?.trim() || undefined,
      reminderTime: task.reminderEnabled ? task.reminderTime : undefined,
    };
    existing ? updateTask(existing.id, normalized) : addTask(normalized);
    router.push('/tasks');
  }

  return (
    <form className="mx-auto max-w-2xl space-y-5" onSubmit={(event) => { event.preventDefault(); submit(); }}>
      <div>
        <label className="mb-1 block text-sm font-semibold">Task name</label>
        <input className="input" required value={task.name} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. Study SQL" autoFocus />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold">Category</label>
          <select className="input" value={task.categoryId} onChange={(e) => patch({ categoryId: e.target.value })}>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Task type</label>
          <select className="input" value={task.taskType} onChange={(e) => patch({ taskType: e.target.value as TaskType })}>
            {types.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold">Icon name</label>
          <input className="input" value={task.icon} onChange={(e) => patch({ icon: e.target.value })} placeholder="e.g. Footprints" />
          <p className="mt-1 text-xs text-slate-500">Uses Lucide icon names. A default icon is used if blank.</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Theme tag</label>
          <input className="input" value={task.themeTag ?? ''} onChange={(e) => patch({ themeTag: e.target.value || undefined })} placeholder="Optional tag" />
        </div>
      </div>

      {(needsGoal || needsRange) && (
        <div className={`grid gap-4 ${needsRange ? 'sm:grid-cols-2' : ''}`}>
          {needsGoal && <div><label className="mb-1 block text-sm font-semibold">Goal</label><input className="input" min="0" step="any" type="number" value={task.targetValue ?? ''} onChange={(e) => patch({ targetValue: e.target.value === '' ? undefined : Number(e.target.value) })} /></div>}
          {needsRange && <><div><label className="mb-1 block text-sm font-semibold">Minimum</label><input className="input" min="0" step="any" type="number" value={task.minValue ?? ''} onChange={(e) => patch({ minValue: e.target.value === '' ? undefined : Number(e.target.value) })} /></div><div><label className="mb-1 block text-sm font-semibold">Maximum</label><input className="input" min="0" step="any" type="number" value={task.maxValue ?? ''} onChange={(e) => patch({ maxValue: e.target.value === '' ? undefined : Number(e.target.value) })} /></div></>}
        </div>
      )}

      {supportsUnit && <div><label className="mb-1 block text-sm font-semibold">Unit</label><input className="input" value={task.unit ?? ''} onChange={(e) => patch({ unit: e.target.value })} placeholder="steps, grams, minutes…" /></div>}

      <div>
        <label className="mb-1 block text-sm font-semibold">Frequency</label>
        <select className="input" value={task.frequency} onChange={(e) => changeFrequency(e.target.value as FrequencyType)}>
          {frequencies.map((frequency) => <option key={frequency.value} value={frequency.value}>{frequency.label}</option>)}
        </select>
      </div>

      {task.frequency !== 'once' && (
        <div>
          <label className="mb-2 block text-sm font-semibold">Days of week</label>
          <div className="grid grid-cols-7 gap-1.5">
            {dayLabels.map((label, day) => (
              <button type="button" key={label} aria-pressed={task.daysOfWeek.includes(day)} onClick={() => patch({ daysOfWeek: task.daysOfWeek.includes(day) ? task.daysOfWeek.filter((value) => value !== day) : [...task.daysOfWeek, day].sort() })} className={`rounded-xl px-1 py-2 text-xs font-bold ${task.daysOfWeek.includes(day) ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="mb-1 block text-sm font-semibold">Start date</label><input className="input" type="date" value={task.startDate} onChange={(e) => patch({ startDate: e.target.value, ...(task.frequency === 'once' ? { daysOfWeek: [new Date(`${e.target.value}T12:00:00`).getDay()] } : {}) })} /></div>
        <div><label className="mb-1 block text-sm font-semibold">End date</label><input className="input" type="date" min={task.startDate} value={task.endDate ?? ''} onChange={(e) => patch({ endDate: e.target.value || undefined })} disabled={task.frequency === 'once'} /></div>
      </div>

      <div className="card p-4">
        <label className="flex items-center justify-between gap-4">
          <span><b>Reminder</b><small className="block text-slate-500">Show a reminder for this task.</small></span>
          <input type="checkbox" checked={task.reminderEnabled} onChange={(e) => patch({ reminderEnabled: e.target.checked })} />
        </label>
        {task.reminderEnabled && <div className="mt-4"><label className="mb-1 block text-sm font-semibold">Reminder time</label><input className="input" type="time" value={task.reminderTime ?? ''} onChange={(e) => patch({ reminderTime: e.target.value || undefined })} /></div>}
      </div>

      <label className="card flex items-center justify-between gap-4 p-4">
        <span><b>Include in Daily Score</b><small className="block text-slate-500">Unscheduled rest days are automatically excluded.</small></span>
        <input type="checkbox" checked={task.includeInScore} onChange={(e) => patch({ includeInScore: e.target.checked })} />
      </label>

      <label className="card flex items-center justify-between gap-4 p-4">
        <span><b>Active</b><small className="block text-slate-500">Pause a task without deleting its history.</small></span>
        <input type="checkbox" checked={task.active} onChange={(e) => patch({ active: e.target.checked })} />
      </label>

      <div><label className="mb-1 block text-sm font-semibold">Notes</label><textarea className="input min-h-24 resize-y" value={task.notes ?? ''} onChange={(e) => patch({ notes: e.target.value })} placeholder="Optional instructions or context" /></div>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}

      <div className="sticky bottom-20 flex gap-3 rounded-2xl bg-white/95 py-3 backdrop-blur dark:bg-slate-950/95 md:bottom-0">
        <button className="btn-primary flex-1" type="submit">{existing ? 'Save changes' : 'Create task'}</button>
        <button className="btn-secondary" type="button" onClick={() => router.back()}>Cancel</button>
      </div>
    </form>
  );
}
