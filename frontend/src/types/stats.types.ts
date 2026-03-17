export interface PeriodStats {
  date?: string;
  week?: string;
  month?: string;
  planned: number;
  completed: number;
  inProgress: number;
  completionPct: number;
  studyMinutes: number;
  streak: number;
}

export type DayStats = PeriodStats & { date: string };
export type WeekStats = PeriodStats & { week: string };
export type MonthStats = PeriodStats & { month: string };
