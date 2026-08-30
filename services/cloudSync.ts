import type { SupabaseClient } from '@supabase/supabase-js';
import type { Category, Expense, JobApplication, ScheduleItem, Task, TaskLog, UserGoal } from '@/types';

export interface CloudSnapshot {
  categories: Category[];
  tasks: Task[];
  logs: TaskLog[];
  expenses: Expense[];
  jobs: JobApplication[];
  scheduleItems: ScheduleItem[];
  goals: UserGoal[];
}

const toTask = (row: any, days: number[]): Task => ({
  id: row.id,
  name: row.name,
  categoryId: row.category_id ?? 'personal',
  taskType: row.task_type,
  icon: row.icon ?? 'Circle',
  themeTag: row.theme_tag ?? undefined,
  unit: row.unit ?? undefined,
  targetValue: row.target_value == null ? undefined : Number(row.target_value),
  minValue: row.min_value == null ? undefined : Number(row.min_value),
  maxValue: row.max_value == null ? undefined : Number(row.max_value),
  frequency: row.frequency_type ?? 'daily',
  daysOfWeek: days,
  startDate: row.start_date,
  endDate: row.end_date ?? undefined,
  active: row.active,
  archived: row.archived,
  deleted: row.deleted ?? false,
  includeInScore: row.include_in_score,
  reminderEnabled: row.reminder_enabled,
  reminderTime: row.reminder_time?.slice(0, 5) ?? undefined,
  notes: row.notes ?? undefined,
  sortOrder: row.sort_order ?? 0,
});

export async function loadCloudSnapshot(supabase: SupabaseClient, userId: string): Promise<CloudSnapshot> {
  const [categoriesRes, tasksRes, schedulesRes, logsRes, expensesRes, jobsRes, routineRes, goalsRes] = await Promise.all([
    supabase.from('categories').select('*').eq('user_id', userId).order('sort_order'),
    supabase.from('tasks').select('*').eq('user_id', userId).order('sort_order'),
    supabase.from('task_schedules').select('*').eq('user_id', userId),
    supabase.from('task_logs').select('*').eq('user_id', userId),
    supabase.from('expenses').select('*').eq('user_id', userId),
    supabase.from('job_applications').select('*').eq('user_id', userId),
    supabase.from('schedule_items').select('*').eq('user_id', userId).order('day_of_week').order('sort_order'),
    supabase.from('user_goals').select('*').eq('user_id', userId),
  ]);

  for (const result of [categoriesRes, tasksRes, schedulesRes, logsRes, expensesRes, jobsRes, routineRes, goalsRes]) {
    if (result.error) throw result.error;
  }

  const schedules = new Map<string, number[]>();
  for (const row of schedulesRes.data ?? []) {
    const current = schedules.get(row.task_id) ?? [];
    current.push(row.day_of_week);
    schedules.set(row.task_id, current);
  }

  return {
    categories: (categoriesRes.data ?? []).map((row: any) => ({ id: row.id, name: row.name, icon: row.icon ?? 'Folder', sortOrder: row.sort_order ?? 0, deleted: row.deleted ?? false })),
    tasks: (tasksRes.data ?? []).map((row: any) => toTask(row, schedules.get(row.id) ?? [])),
    logs: (logsRes.data ?? []).map((row: any) => ({ id: row.id, taskId: row.task_id, date: row.date, completed: row.completed, numericValue: row.numeric_value == null ? undefined : Number(row.numeric_value), textValue: row.text_value ?? undefined, timeValue: row.time_value?.slice(0, 5) ?? undefined, durationMinutes: row.duration_minutes ?? undefined, targetSnapshot: row.target_snapshot == null ? undefined : Number(row.target_snapshot), minSnapshot: row.min_snapshot == null ? undefined : Number(row.min_snapshot), maxSnapshot: row.max_snapshot == null ? undefined : Number(row.max_snapshot), notes: row.notes ?? undefined })),
    expenses: (expensesRes.data ?? []).map((row: any) => ({ id: row.id, date: row.date, amount: Number(row.amount), category: row.category, description: row.description ?? '', notes: row.notes ?? undefined })),
    jobs: (jobsRes.data ?? []).map((row: any) => ({ id: row.id, company: row.company, role: row.role, dateApplied: row.date_applied, jobUrl: row.job_url ?? undefined, location: row.location ?? undefined, salary: row.salary ?? undefined, workType: row.work_type ?? undefined, status: row.status, notes: row.notes ?? undefined })),
    scheduleItems: (routineRes.data ?? []).map((row: any) => ({ id: row.id, dayOfWeek: row.day_of_week, title: row.title, startTime: row.start_time?.slice(0, 5) ?? '', endTime: row.end_time?.slice(0, 5) ?? undefined, sortOrder: row.sort_order ?? 0 })),
    goals: (goalsRes.data ?? []).map((row: any) => ({ id: row.id, goalName: row.goal_name, goalValue: row.goal_value == null ? undefined : Number(row.goal_value), unit: row.unit ?? undefined })),
  };
}

export async function pushLocalSnapshot(supabase: SupabaseClient, userId: string, snapshot: CloudSnapshot) {
  if (snapshot.categories.length) {
    const { error } = await supabase.from('categories').upsert(snapshot.categories.map(c => ({ id: c.id, user_id: userId, name: c.name, icon: c.icon, sort_order: c.sortOrder, deleted: c.deleted ?? false })), { onConflict: 'user_id,id' });
    if (error) throw error;
  }

  if (snapshot.tasks.length) {
    const { error } = await supabase.from('tasks').upsert(snapshot.tasks.map(t => ({ id: t.id, user_id: userId, name: t.name, category_id: t.categoryId, task_type: t.taskType, icon: t.icon, theme_tag: t.themeTag ?? null, unit: t.unit ?? null, target_value: t.targetValue ?? null, min_value: t.minValue ?? null, max_value: t.maxValue ?? null, frequency_type: t.frequency, start_date: t.startDate, end_date: t.endDate ?? null, active: t.active, archived: t.archived, deleted: t.deleted ?? false, include_in_score: t.includeInScore, reminder_enabled: t.reminderEnabled, reminder_time: t.reminderTime ?? null, notes: t.notes ?? null, sort_order: t.sortOrder })), { onConflict: 'user_id,id' });
    if (error) throw error;
    const { error: clearScheduleError } = await supabase.from('task_schedules').delete().eq('user_id', userId);
    if (clearScheduleError) throw clearScheduleError;
    const schedules = snapshot.tasks.filter(t => !t.deleted).flatMap(t => t.daysOfWeek.map(day => ({ user_id: userId, task_id: t.id, day_of_week: day, frequency_type: t.frequency })));
    if (schedules.length) {
      const { error: scheduleError } = await supabase.from('task_schedules').insert(schedules);
      if (scheduleError) throw scheduleError;
    }
  }

  if (snapshot.logs.length) {
    const { error } = await supabase.from('task_logs').upsert(snapshot.logs.map(l => ({ id: l.id, user_id: userId, task_id: l.taskId, date: l.date, completed: l.completed, numeric_value: l.numericValue ?? null, text_value: l.textValue ?? null, time_value: l.timeValue ?? null, duration_minutes: l.durationMinutes ?? null, target_snapshot: l.targetSnapshot ?? null, min_snapshot: l.minSnapshot ?? null, max_snapshot: l.maxSnapshot ?? null, notes: l.notes ?? null })), { onConflict: 'user_id,task_id,date' });
    if (error) throw error;
  }

  if (snapshot.expenses.length) {
    const { error } = await supabase.from('expenses').upsert(snapshot.expenses.map(e => ({ id: e.id, user_id: userId, date: e.date, amount: e.amount, category: e.category, description: e.description, notes: e.notes ?? null })), { onConflict: 'user_id,id' });
    if (error) throw error;
  }

  if (snapshot.jobs.length) {
    const { error } = await supabase.from('job_applications').upsert(snapshot.jobs.map(j => ({ id: j.id, user_id: userId, company: j.company, role: j.role, date_applied: j.dateApplied, job_url: j.jobUrl ?? null, location: j.location ?? null, salary: j.salary ?? null, work_type: j.workType ?? null, status: j.status, notes: j.notes ?? null })), { onConflict: 'user_id,id' });
    if (error) throw error;
  }

  const { error: clearRoutineError } = await supabase.from('schedule_items').delete().eq('user_id', userId);
  if (clearRoutineError) throw clearRoutineError;
  if (snapshot.scheduleItems.length) {
    const { error } = await supabase.from('schedule_items').insert(snapshot.scheduleItems.map(item => ({ id: item.id, user_id: userId, day_of_week: item.dayOfWeek, title: item.title, start_time: item.startTime || null, end_time: item.endTime ?? null, sort_order: item.sortOrder })));
    if (error) throw error;
  }

  const { error: clearGoalsError } = await supabase.from('user_goals').delete().eq('user_id', userId);
  if (clearGoalsError) throw clearGoalsError;
  if (snapshot.goals.length) {
    const { error } = await supabase.from('user_goals').insert(snapshot.goals.map(goal => ({ id: goal.id, user_id: userId, goal_name: goal.goalName, goal_value: goal.goalValue ?? null, unit: goal.unit ?? null })));
    if (error) throw error;
  }
}
