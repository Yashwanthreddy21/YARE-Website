'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Category, Expense, JobApplication, Task, TaskLog } from '@/types';
import type { CloudSnapshot } from '@/services/cloudSync';

const today = () => new Date().toISOString().slice(0, 10);
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

const base = { frequency: 'daily' as const, startDate: today(), active: true, archived: false, includeInScore: true, reminderEnabled: false };
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

export type SyncStatus = 'local' | 'pending' | 'synced' | 'error';

interface AppState {
  categories: Category[];
  tasks: Task[];
  logs: TaskLog[];
  expenses: Expense[];
  jobs: JobApplication[];
  syncStatus: SyncStatus;
  addTask: (task: Task) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  archiveTask: (id: string, archived: boolean) => void;
  deleteTask: (id: string) => void;
  duplicateTask: (id: string) => void;
  upsertLog: (log: TaskLog) => void;
  addExpense: (expense: Expense) => void;
  addJob: (job: JobApplication) => void;
  replaceFromCloud: (snapshot: CloudSnapshot) => void;
  setSyncStatus: (status: SyncStatus) => void;
}

export const useAppStore = create<AppState>()(persist((set) => ({
  categories,
  tasks: defaultTasks,
  logs: [],
  expenses: [],
  jobs: [],
  syncStatus: 'local',
  addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),
  updateTask: (id, patch) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, ...patch } : t) })),
  archiveTask: (id, archived) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, archived, active: archived ? false : t.active } : t) })),
  deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
  duplicateTask: (id) => set((s) => {
    const t = s.tasks.find((x) => x.id === id);
    return t ? { tasks: [...s.tasks, { ...t, id: crypto.randomUUID(), name: `${t.name} Copy`, sortOrder: s.tasks.length + 1 }] } : s;
  }),
  upsertLog: (log) => set((s) => ({ logs: [...s.logs.filter((l) => !(l.taskId === log.taskId && l.date === log.date)), log] })),
  addExpense: (expense) => set((s) => ({ expenses: [...s.expenses, expense] })),
  addJob: (job) => set((s) => ({ jobs: [...s.jobs, job] })),
  replaceFromCloud: (snapshot) => set({ ...snapshot }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
}), {
  name: 'yare-personal-os-v1',
  partialize: (state) => ({ categories: state.categories, tasks: state.tasks, logs: state.logs, expenses: state.expenses, jobs: state.jobs }),
}));
