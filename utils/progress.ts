import type { Task, TaskLog } from '@/types';
import { localDateKey } from '@/utils/date';

export function matchesTaskCalendar(task: Task, date: Date) {
  const iso = localDateKey(date);
  if (iso < task.startDate || (task.endDate && iso > task.endDate)) return false;
  if (task.frequency === 'once') return iso === task.startDate;
  return task.daysOfWeek.includes(date.getDay());
}

export function isTaskScheduled(task: Task, date: Date) {
  if (!task.active || task.archived || task.deleted) return false;
  return matchesTaskCalendar(task, date);
}

export function taskProgress(task: Task, log?: TaskLog) {
  if (!log) return 0;
  if (task.taskType === 'checkbox' || task.taskType === 'yes_no') return log.completed ? 1 : 0;
  if (task.taskType === 'numeric' || task.taskType === 'counter' || task.taskType === 'duration' || task.taskType === 'currency') {
    const target = log.targetSnapshot ?? task.targetValue ?? 0;
    const value = task.taskType === 'duration' ? log.durationMinutes ?? 0 : log.numericValue ?? 0;
    if (task.taskType === 'currency' && !target) return log.completed ? 1 : 0;
    return target > 0 ? Math.min(Math.max(value, 0) / target, 1) : log.completed ? 1 : 0;
  }
  if (task.taskType === 'range') {
    const value = log.numericValue ?? 0;
    const min = log.minSnapshot ?? task.minValue ?? 0;
    const max = log.maxSnapshot ?? task.maxValue ?? Number.MAX_SAFE_INTEGER;
    return value >= min && value <= max ? 1 : min > 0 ? Math.min(Math.max(value, 0) / min, 1) : 0;
  }
  return log.completed ? 1 : 0;
}

export function dailyScore(tasks: Task[], logs: TaskLog[], date: Date) {
  const iso = localDateKey(date);
  const today = localDateKey();
  const historical = iso < today;
  const scored = tasks.filter((task) => task.includeInScore && (historical ? matchesTaskCalendar(task, date) : isTaskScheduled(task, date)));
  if (!scored.length) return 100;
  const total = scored.reduce((sum, task) => sum + taskProgress(task, logs.find((log) => log.taskId === task.id && log.date === iso)), 0);
  return Math.round((total / scored.length) * 100);
}

export function overallStreak(tasks: Task[], logs: TaskLog[], from = new Date()) {
  let streak = 0;
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (let i = 0; i < 3660; i += 1) {
    const iso = localDateKey(cursor);
    const historical = iso < localDateKey();
    const scheduled = tasks.filter((task) => task.includeInScore && (historical ? matchesTaskCalendar(task, cursor) : isTaskScheduled(task, cursor)));
    if (!scheduled.length) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (dailyScore(tasks, logs, cursor) < 100) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
