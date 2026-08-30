import type { Task, TaskLog } from '@/types';

export function isTaskScheduled(task: Task, date: Date) {
  const iso = date.toISOString().slice(0, 10);
  if (!task.active || task.archived || iso < task.startDate || (task.endDate && iso > task.endDate)) return false;
  return task.daysOfWeek.includes(date.getDay());
}

export function taskProgress(task: Task, log?: TaskLog) {
  if (!log) return 0;
  if (task.taskType === 'checkbox' || task.taskType === 'yes_no') return log.completed ? 1 : 0;
  if (task.taskType === 'numeric' || task.taskType === 'counter' || task.taskType === 'duration') {
    const target = log.targetSnapshot ?? task.targetValue ?? 0;
    const value = task.taskType === 'duration' ? log.durationMinutes ?? 0 : log.numericValue ?? 0;
    return target > 0 ? Math.min(value / target, 1) : 0;
  }
  if (task.taskType === 'range') {
    const value = log.numericValue ?? 0;
    const min = log.minSnapshot ?? task.minValue ?? 0;
    const max = log.maxSnapshot ?? task.maxValue ?? Number.MAX_SAFE_INTEGER;
    return value >= min && value <= max ? 1 : min > 0 ? Math.min(value / min, 1) : 0;
  }
  return log.completed ? 1 : 0;
}

export function dailyScore(tasks: Task[], logs: TaskLog[], date: Date) {
  const iso = date.toISOString().slice(0, 10);
  const scored = tasks.filter((t) => t.includeInScore && isTaskScheduled(t, date));
  if (!scored.length) return 100;
  const total = scored.reduce((sum, task) => sum + taskProgress(task, logs.find((l) => l.taskId === task.id && l.date === iso)), 0);
  return Math.round((total / scored.length) * 100);
}
