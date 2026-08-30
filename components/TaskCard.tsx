'use client';

import type { Task, TaskLog } from '@/types';
import { taskProgress } from '@/utils/progress';
import { useAppStore } from '@/store/useAppStore';
import { Check } from 'lucide-react';

export function TaskCard({ task, date, log }: { task: Task; date: string; log?: TaskLog }) {
  const upsertLog = useAppStore((s) => s.upsertLog);
  const progress = Math.round(taskProgress(task, log) * 100);
  const save = (patch: Partial<TaskLog>) => upsertLog({ id: log?.id ?? crypto.randomUUID(), taskId: task.id, date, completed: false, targetSnapshot: log?.targetSnapshot ?? task.targetValue, minSnapshot: log?.minSnapshot ?? task.minValue, maxSnapshot: log?.maxSnapshot ?? task.maxValue, ...log, ...patch });

  return <div className="card p-4">
    <div className="flex items-start justify-between gap-4"><div><div className="font-semibold">{task.name}</div><div className="mt-0.5 text-xs text-slate-500">{task.categoryId}</div></div><span className="text-sm font-bold tabular-nums">{progress}%</span></div>
    <div className="mt-4">
      {(task.taskType === 'checkbox' || task.taskType === 'yes_no') && <button aria-label={`Mark ${task.name} complete`} onClick={() => save({ completed: !log?.completed })} className={`btn w-full ${log?.completed ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900'}`}><Check size={18}/>{log?.completed ? 'Done' : 'Mark done'}</button>}
      {['numeric','counter','currency'].includes(task.taskType) && <div className="flex items-center gap-2"><input className="input" inputMode="decimal" type="number" value={log?.numericValue ?? ''} placeholder="0" onChange={(e) => { const v = Number(e.target.value); save({ numericValue: v, completed: task.targetValue ? v >= task.targetValue : v > 0 }); }}/><span className="whitespace-nowrap text-sm text-slate-500">{task.taskType === 'currency' ? '$' : task.unit}{task.targetValue ? ` / ${task.targetValue}` : ''}</span></div>}
      {task.taskType === 'duration' && <div className="flex items-center gap-2"><input className="input" inputMode="numeric" type="number" value={log?.durationMinutes ?? ''} placeholder="Minutes" onChange={(e) => { const v = Number(e.target.value); save({ durationMinutes: v, completed: task.targetValue ? v >= task.targetValue : v > 0 }); }}/><span className="text-sm text-slate-500">min</span></div>}
      {task.taskType === 'time' && <input className="input" type="time" value={log?.timeValue ?? ''} onChange={(e) => save({ timeValue: e.target.value, completed: !!e.target.value })}/>} 
      {task.taskType === 'range' && <div className="flex items-center gap-2"><input className="input" type="number" step="0.1" value={log?.numericValue ?? ''} onChange={(e) => { const v = Number(e.target.value); save({ numericValue: v, completed: v >= (task.minValue ?? 0) && v <= (task.maxValue ?? Infinity) }); }}/><span className="whitespace-nowrap text-sm text-slate-500">{task.minValue}–{task.maxValue} {task.unit}</span></div>}
    </div>
    {task.includeInScore && <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-slate-900 transition-all dark:bg-white" style={{ width: `${progress}%` }}/></div>}
  </div>;
}
