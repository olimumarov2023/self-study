// ---------------------------------------------------------------------------
// GET /spaced-repetition/due — response shapes
// ---------------------------------------------------------------------------

export interface DueReviewItem {
  reviewScheduleId: string;
  learningItemId: string;
  learningItemTitle: string;
  categoryName: string | null;
  lastScore: number;
  lastMode: string;
  easeFactor: number;
  intervalDays: number;
  repetitionCount: number;
  nextReviewDate: string; // ISO 8601
  lastReviewedAt: string; // ISO 8601
  daysOverdue: number;    // 0 if due today, positive if overdue
}

export interface DueReviewsMeta {
  totalDue: number;
  overdueCount: number;
}

export interface DueReviewsResponse {
  data: DueReviewItem[];
  meta: DueReviewsMeta;
}

// ---------------------------------------------------------------------------
// GET /spaced-repetition/schedule — response shapes
// ---------------------------------------------------------------------------

export interface ScheduleItem {
  reviewScheduleId: string;
  learningItemId: string;
  learningItemTitle: string;
  categoryName: string | null;
  easeFactor: number;
  intervalDays: number;
  repetitionCount: number;
}

export interface ScheduleEntry {
  date: string; // YYYY-MM-DD
  items: ScheduleItem[];
}

export interface ReviewScheduleMeta {
  totalScheduled: number;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface ReviewScheduleResponse {
  data: ScheduleEntry[];
  meta: ReviewScheduleMeta;
}

// ---------------------------------------------------------------------------
// POST /spaced-repetition/review — request + response shapes
// ---------------------------------------------------------------------------

export interface RecordReviewPayload {
  learningItemId: string;
  assessmentId?: string;
  manualQuality?: number; // 0-5
}

export interface RecordReviewResponse {
  reviewScheduleId: string;
  learningItemId: string;
  quality: number;
  previousInterval: number;
  newInterval: number;
  previousEaseFactor: number;
  newEaseFactor: number;
  repetitionCount: number;
  nextReviewDate: string; // ISO 8601
}
