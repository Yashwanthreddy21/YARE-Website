'use client';

import { useMemo } from 'react';
import type { Task, TaskLog } from '@/types';
import { taskProgress } from '@/utils/progress';
import { useAppStore } from '@/store/useAppStore';
import { Check, Minus, Plus, Star } from 'lucide-react';

export function TaskCard({ task, date, log }: { task: Task; date: string; log?: TaskLog }) {
  const upsertLog = useAppStore((s) => s.upsertLog);
  const progress = Math.round(taskProgress(task, log) * 100);
  const effectiveTarget = log?.targetSnapshot ?? task.targetValue;
  const effectiveMin = log?.minSnapshot ?? task.minValue;
  const effectiveMax = log?.maxSnapshot ?? task.maxValue;

  const save = (patch: Partial<TaskLog>) => upsertLog({
    id: log?.id ?? crypto.randomUUID(),
    taskId: task.id,
    date,
    completed: false,
    targetSnapshot: log?.targetSnapshot ?? task.targetValue,
    minSnapshot: log?.minSnapshot ?? task.minValue,
    maxSnapshot: log?.maxSnapshot ?? task.maxValue,
    ...log,
    ...patch,
  });

  const categoryLabel = useMemo(() => task.categoryId.replace(/(^|[-_])\w/g, (m) => m.replace(/[-_]/, '').toUpperCase()), [task.categoryId]);

  const saveNumeric = (raw: string) => {
    if (raw === '') {
      save({ numericValue: undefined, completed: false });
      return;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    const completed = effectiveTarget ? value >= effectiveTarget : value > 0;
    save({ numericValue: value, completed });
  };

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate font-semibold">{task.name}</div>
          <div className="mt-0.5 text-xs text-slate-500">{categoryLabel}</div>
        </div>
        {task.includeInScore && <span className="text-sm font-bold tabular-nums">{progress}%</span>}
      </div>

      <div className="mt-4">
        {(task.taskType === 'checkbox' || task.taskType === 'yes_no') && (
          <button
            aria-label={`Mark ${task.name} ${log?.completed ? 'incomplete' : 'complete'}`}
            onClick={() => save({ completed: !log?.completed })}
            className={`btn w-full ${log?.completed ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900'}`}
          >
            <Check size={18} />
            {log?.completed ? 'Done' : task.taskType === 'yes_no' ? 'Yes' : 'Mark done'}
          </button>
        )}

        {['numeric', 'currency'].includes(task.taskType) && (
          <div className="flex items-center gap-2">
            {task.taskType === 'currency' && <span className="text-sm font-semibold">$</span>}
            <input
              aria-label={`${task.name} value`}
              className="input"
              inputMode="decimal"
              type="number"
              min="0"
              step="any"
              value={log?.numericValue ?? ''}
              placeholder="0"
              onChange={(e) => saveNumeric(e.target.value)}
            />
            <span className="whitespace-nowrap text-sm text-slate-500">
              {task.taskType === 'currency' ? '' : task.unit}{effectiveTarget ? ` / ${effectiveTarget}` : ''}
            </span>
          </div>
        )}

        {task.taskType === 'counter' && (
          <div className="flex items-center justify-between gap-3">
            <button className="btn-secondary px-3" aria-label={`Decrease ${task.name}`} onClick={() => saveNumeric(String(Math.max((log?.numericValue ?? 0) - 1, 0)))}><Minus size={18} /></button>
            <div className="min-w-24 text-center text-xl font-black tabular-nums">{log?.numericValue ?? 0}{effectiveTarget ? <span className="text-sm font-medium text-slate-400"> / {effectiveTarget}</span> : null}</div>
            <button className="btn-secondary px-3" aria-label={`Increase ${task.name}`} onClick={() => saveNumeric(String((log?.numericValue ?? 0) + 1))}><Plus size={18} /></button>
          </div>
        )}

        {task.taskType === 'duration' && (
          <div className="flex items-center gap-2">
            <input
              aria-label={`${task.name} duration in minutes`}
              className="input"
              inputMode="numeric"
              type="number"
              min="0"
              value={log?.durationMinutes ?? ''}
              placeholder="Minutes"
              onChange={(e) => {
                if (e.target.value === '') return save({ durationMinutes: undefined, completed: false });
                const value = Number(e.target.value);
                save({ durationMinutes: value, completed: effectiveTarget ? value >= effectiveTarget : value > 0 });
              }}
            />
            <span className="text-sm text-slate-500">min{effectiveTarget ? ` / ${effectiveTarget}` : ''}</span>
          </div>
        )}

        {task.taskType === 'time' && (
          <input className="input" aria-label={`${task.name} time`} type="time" value={log?.timeValue ?? ''} onChange={(e) => save({ timeValue: e.target.value || undefined, completed: Boolean(e.target.value) })} />
        )}

        {task.taskType === 'range' && (
          <div className="flex items-center gap-2">
            <input
              className="input"
              aria-label={`${task.name} value`}
              type="number"
              min="0"
              step="0.1"
              value={log?.numericValue ?? ''}
              onChange={(e) => {
                if (e.target.value === '') return save({ numericValue: undefined, completed: false });
                const value = Number(e.target.value);
                save({ numericValue: value, completed: value >= (effectiveMin ?? 0) && value <= (effectiveMax ?? Infinity) });
              }}
            />
            <span className="whitespace-nowrap text-sm text-slate-500">{effectiveMin ?? '—'}–{effectiveMax ?? '—'} {task.unit}</span>
          </div>
        )}

        {task.taskType === 'text' && (
          <textarea
            className="input min-h-20 resize-y"
            aria-label={`${task.name} notes`}
            placeholder="Add a note…"
            value={log?.textValue ?? ''}
            onChange={(e) => save({ textValue: e.target.value || undefined, completed: Boolean(e.target.value.trim()) })}
          />
        )}

        {task.taskType === 'rating' && (
          <div className="flex gap-1" role="radiogroup" aria-label={`${task.name} rating`}>
            {[1, 2, 3, 4, 5].map((rating) => {
              const selected = (log?.numericValue ?? 0) >= rating;
              return <button key={rating} type="button" role="radio" aria-checked={(log?.numericValue ?? 0) === rating} aria-label={`${rating} stars`} onClick={() => save({ numericValue: rating, completed: true })} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Star size={21} fill={selected ? 'currentColor' : 'none'} /></button>;
            })}
          </div>
        )}
      </div>

      {task.includeInScore && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-label={`${progress}% complete`}>
          <div className="h-full rounded-full bg-slate-900 transition-all dark:bg-white" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
