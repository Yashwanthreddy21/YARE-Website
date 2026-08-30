'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Category, Expense, JobApplication, ScheduleItem, Task, TaskLog, UserGoal } from '@/types';
import type { CloudSnapshot } from '@/services/cloudSync';
import { localDateKey } from '@/utils/date';

const today = () => localDateKey(new Date());
const weekdays = [1, 2, 3, 4, 5];
const daily = [0, 1, 2, 3, 4, 5, 6];

const categories: Category[] = [
  { id: 'health', name: 'Health', icon: 'HeartPulse', sortOrder: 1 },
  { id: 'fitness', name: 'Fitness', icon: 'Dumbbell', sortOrder: 2 },
  { id: 'career', name: 'Career', icon: 'BriefcaseBusiness', sortOrder: 3 },
  { id: 'nutrition', name: 'Nutrition', icon: 'Apple', sortOrder: 4 },
  { id: 'financial', name: 'Financial', icon: 'WalletCards', sortOrder: 5 },
  { id: 'personal', name: 'Personal', icon: 'Sparkles', sortOrder: 6 },
];

const base = { frequency: 'daily' as const, startDate: today(), active: true, archived: false, deleted: false, includeInScore: true, reminderEnabled: false };
const defaultTasks: Task[] = [
  { ...base, id: 'wake', name: 'Wake Up', categoryId: 'health', taskType: 'time', icon: 'Sunrise', daysOfWeek: daily, reminderEnabled: true, reminderTime: '06:00', sortOrder: 1 },
  { ...base, id: 'gym', name: 'Gym', categoryId: 'fitness', taskType: 'checkbox', icon: 'Dumbbell', daysOfWeek: weekdays, sortOrder: 2 },
  { ...base, id: 'applications', name: 'Job Applications', categoryId: 'career', taskType: 'numeric', icon: 'Send', unit: 'applications', targetValue: 30, daysOfWeek: daily, sortOrder: 3 },
  { ...base, id: 'prep', name: 'Job / Interview Preparation', categoryId: 'career', taskType: 'duration', icon: 'BookOpenCheck', unit: 'min', targetValue: 60, daysOfWeek: daily, sortOrder: 4 },
  { ...base, id: 'protein', name: 'Protein', categoryId: 'nutrition', taskType: 'numeric', icon: 'Beef', unit: 'g', targetValue: 130, daysOfWeek: daily, sortOrder: 5 },
  { ...base, id: 'fiber', name: 'Fiber', categoryId: 'nutrition', taskType: 'numeric', icon: 'Wheat', unit: 'g', targetValue: 30, daysOfWeek: daily, sortOrder: 6 },
  { ...base, id: 'lunch', name: 'Lunch', categoryId: 'nutrition', taskType: 'checkbox', icon: 'Utensils', daysOfWeek: daily, sortOrder: 7 },
  { ...base, id: 'dinner', name: 'Dinner', categoryId: 'nutrition', taskType: 'checkbox', icon: 'Utensils', daysOfWeek: daily, sortOrder: 8 },
  { ...base, id: 'steps', name: 'Steps', categoryId: 'fitness', taskType: 'numeric', icon: 'Footprints', unit: 'steps', targetValue: 10000, daysOfWeek: daily, sortOrder: 9 },
  { ...base, id: 'calories', name: 'Calories', categoryId: 'nutrition', taskType: 'range', icon: 'Flame', unit: 'kcal', minValue: 1800, maxValue: 2200, daysOfWeek: daily, sortOrder: 10 },
  { ...base, id: 'expenses', name: 'Expenses', categoryId: 'financial', taskType: 'currency', icon: 'CircleDollarSign', daysOfWeek: daily, includeInScore: false, sortOrder: 11 },
  { ...base, id: 'sleep', name: 'Sleep', categoryId: 'health', taskType: 'range', icon: 'Moon', unit: 'hours', minValue: 7, maxValue: 8, daysOfWeek: daily, sortOrder: 12 },
  { ...base, id: 'bedtime', name: 'Bedtime', categoryId: 'health', taskType: 'time', icon: 'BedDouble', daysOfWeek: daily, sortOrder: 13 },
];

const weekdayRoutine = [
  ['06:00', 'Wake Up'], ['06:15', 'Morning Routine'], ['06:30', 'Gym / Workout'], ['08:00', 'Breakfast'], ['08:30', 'Job Applications'], ['11:00', 'Preparation / Study'], ['13:00', 'Lunch'], ['14:00', 'Job Applications'], ['16:00', 'Interview Prep / Learning'], ['18:00', 'Steps / Walk'], ['19:30', 'Dinner'], ['20:30', 'Daily Review'], ['21:30', 'Prepare for Bed'],
];
const defaultScheduleItems: ScheduleItem[] = weekdays.flatMap((day) => weekdayRoutine.map(([startTime, title], index) => ({ id: `schedule-${day}-${index}`, dayOfWeek: day, title, startTime, sortOrder: index + 1 })));

export type SyncStatus = 'local' | 'pending' | 'synced' | 'error';

interface AppState {
  categories: Category[];
  tasks: Task[];
  logs: TaskLog[];
  expenses: Expense[];
  jobs: JobApplication[];
  scheduleItems: ScheduleItem[];
  goals: UserGoal[];
  syncStatus: SyncStatus;
  addTask: (task: Task) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  archiveTask: (id: string, archived: boolean) => void;
  deleteTask: (id: string) => void;
  duplicateTask: (id: string) => void;
  upsertLog: (log: TaskLog) => void;
  addExpense: (expense: Expense) => void;
  addJob: (job: JobApplication) => void;
  addScheduleItem: (item: ScheduleItem) => void;
  updateScheduleItem: (id: string, patch: Partial<ScheduleItem>) => void;
  deleteScheduleItem: (id: string) => void;
  copyScheduleDay: (sourceDay: number, targetDays: number[]) => void;
  moveScheduleItem: (id: string, direction: -1 | 1) => void;
  replaceFromCloud: (snapshot: CloudSnapshot) => void;
  setSyncStatus: (status: SyncStatus) => void;
}

export const useAppStore = create<AppState>()(persist((set) => ({
  categories,
  tasks: defaultTasks,
  logs: [],
  expenses: [],
  jobs: [],
  scheduleItems: defaultScheduleItems,
  goals: [],
  syncStatus: 'local',
  addTask: (task) => set((s) => ({ tasks: [...s.tasks, { ...task, deleted: false }] })),
  updateTask: (id, patch) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, ...patch } : t) })),
  archiveTask: (id, archived) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, archived, active: archived ? false : true } : t) })),
  deleteTask: (id) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, deleted: true, archived: false, active: false } : t) })),
  duplicateTask: (id) => set((s) => {
    const t = s.tasks.find((x) => x.id === id && !x.deleted);
    return t ? { tasks: [...s.tasks, { ...t, id: crypto.randomUUID(), name: `${t.name} Copy`, archived: false, deleted: false, active: true, sortOrder: s.tasks.length + 1 }] } : s;
  }),
  upsertLog: (log) => set((s) => ({ logs: [...s.logs.filter((l) => !(l.taskId === log.taskId && l.date === log.date)), log] })),
  addExpense: (expense) => set((s) => ({ expenses: [...s.expenses, expense] })),
  addJob: (job) => set((s) => ({ jobs: [...s.jobs, job] })),
  addScheduleItem: (item) => set((s) => ({ scheduleItems: [...s.scheduleItems, item] })),
  updateScheduleItem: (id, patch) => set((s) => ({ scheduleItems: s.scheduleItems.map((item) => item.id === id ? { ...item, ...patch } : item) })),
  deleteScheduleItem: (id) => set((s) => ({ scheduleItems: s.scheduleItems.filter((item) => item.id !== id) })),
  copyScheduleDay: (sourceDay, targetDays) => set((s) => {
    const source = s.scheduleItems.filter((item) => item.dayOfWeek === sourceDay).sort((a, b) => a.sortOrder - b.sortOrder);
    const keep = s.scheduleItems.filter((item) => !targetDays.includes(item.dayOfWeek));
    const copies = targetDays.flatMap((day) => source.map((item, index) => ({ ...item, id: crypto.randomUUID(), dayOfWeek: day, sortOrder: index + 1 })));
    return { scheduleItems: [...keep, ...copies] };
  }),
  moveScheduleItem: (id, direction) => set((s) => {
    const current = s.scheduleItems.find((item) => item.id === id);
    if (!current) return s;
    const sameDay = s.scheduleItems.filter((item) => item.dayOfWeek === current.dayOfWeek).sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sameDay.findIndex((item) => item.id === id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sameDay.length) return s;
    const target = sameDay[targetIndex];
    return { scheduleItems: s.scheduleItems.map((item) => item.id === current.id ? { ...item, sortOrder: target.sortOrder } : item.id === target.id ? { ...item, sortOrder: current.sortOrder } : item) };
  }),
  replaceFromCloud: (snapshot) => set({ ...snapshot }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
}), {
  name: 'yare-personal-os-v1',
  partialize: (state) => ({ categories: state.categories, tasks: state.tasks, logs: state.logs, expenses: state.expenses, jobs: state.jobs, scheduleItems: state.scheduleItems, goals: state.goals }),
}));
