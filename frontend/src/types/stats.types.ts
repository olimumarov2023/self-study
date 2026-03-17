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

export interface CategoryProgress {
  categoryId: string;
  categoryName: string;
  itemCount: number;
  completedCount: number;
  needsRevisionCount: number;
  totalStudyMinutes: number;
  assessmentCount: number;
  averageScore: number | null;
  imbalanceFlag: boolean;
}

export interface ScoreTrendPoint {
  assessmentId: string;
  learningItemId: string;
  learningItemTitle: string;
  mode: string;
  score: number;
  completedAt: string;
}
