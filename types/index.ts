export type TaskType = 'checkbox' | 'numeric' | 'duration' | 'time' | 'currency' | 'text' | 'rating' | 'yes_no' | 'counter' | 'range';
export type FrequencyType = 'daily' | 'weekly' | 'custom' | 'once';

export interface Category {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
}

export interface Task {
  id: string;
  name: string;
  categoryId: string;
  taskType: TaskType;
  icon: string;
  themeTag?: string;
  unit?: string;
  targetValue?: number;
  minValue?: number;
  maxValue?: number;
  frequency: FrequencyType;
  daysOfWeek: number[];
  startDate: string;
  endDate?: string;
  active: boolean;
  archived: boolean;
  deleted?: boolean;
  includeInScore: boolean;
  reminderEnabled: boolean;
  reminderTime?: string;
  notes?: string;
  sortOrder: number;
}

export interface TaskLog {
  id: string;
  taskId: string;
  date: string;
  completed: boolean;
  numericValue?: number;
  textValue?: string;
  timeValue?: string;
  durationMinutes?: number;
  targetSnapshot?: number;
  minSnapshot?: number;
  maxSnapshot?: number;
  notes?: string;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  notes?: string;
}

export type JobStatus = 'Applied' | 'Recruiter Contact' | 'Interview' | 'Assessment' | 'Final Interview' | 'Offer' | 'Rejected' | 'Withdrawn';
export interface JobApplication {
  id: string;
  company: string;
  role: string;
  dateApplied: string;
  jobUrl?: string;
  location?: string;
  salary?: string;
  workType?: string;
  status: JobStatus;
  notes?: string;
}
