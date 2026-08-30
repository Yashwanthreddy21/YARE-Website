'use client';

import Link from 'next/link';
import { Archive, Copy, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function TasksPage() {
  const { tasks, categories, archiveTask, duplicateTask, deleteTask } = useAppStore();
  const visibleTasks = tasks.filter((t) => !t.deleted);

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Customize everything</p>
          <h1 className="text-3xl font-black">Tasks</h1>
        </div>
        <Link href="/tasks/new" className="btn-primary"><Plus size={18} /> Add task</Link>
      </div>

      {categories.map((category) => {
        const list = visibleTasks.filter((t) => t.categoryId === category.id && !t.archived).sort((a, b) => a.sortOrder - b.sortOrder);
        if (!list.length) return null;
        return (
          <section key={category.id} className="mb-6">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">{category.name}</h2>
            <div className="space-y-2">
              {list.map((task) => (
                <div key={task.id} className="card flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{task.name}</div>
                    <div className="text-xs text-slate-500">{task.taskType} · {task.daysOfWeek.length} day(s)/week {task.targetValue ? `· Goal ${task.targetValue} ${task.unit ?? ''}` : ''}{!task.active ? ' · Paused' : ''}</div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Link aria-label={`Edit ${task.name}`} href={`/tasks/${task.id}`} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil size={17} /></Link>
                    <button aria-label={`Duplicate ${task.name}`} onClick={() => duplicateTask(task.id)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Copy size={17} /></button>
                    <button aria-label={`Archive ${task.name}`} onClick={() => archiveTask(task.id, true)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Archive size={17} /></button>
                    <button aria-label={`Delete ${task.name}`} onClick={() => { if (confirm(`Permanently remove “${task.name}” from your task list? Historical logs will be retained.`)) deleteTask(task.id); }} className="rounded-lg p-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"><Trash2 size={17} /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {visibleTasks.some((t) => t.archived) && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">Archived</h2>
          <div className="space-y-2">
            {visibleTasks.filter((t) => t.archived).map((task) => (
              <div key={task.id} className="card flex items-center justify-between gap-3 p-4 opacity-70">
                <span className="truncate">{task.name}</span>
                <button className="btn-secondary shrink-0" onClick={() => archiveTask(task.id, false)}><RotateCcw size={16} /> Restore</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {!visibleTasks.some((t) => !t.archived) && <div className="card p-8 text-center text-slate-500">No active tasks yet. Add one to start tracking.</div>}
    </div>
  );
}
