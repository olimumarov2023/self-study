import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import {
  getFullWeekDates,
  getMonthDates,
  formatDateUTC,
} from '../common/utils/date.util.js';

export interface HeatmapDay {
  date: string;    // YYYY-MM-DD
  count: number;   // total sessions (study + resource)
  minutes: number; // total minutes
}

export interface RadarDataPoint {
  category: string;
  actual: number;
  target: number;
}

export interface ForecastData {
  totalItems: number;
  completedItems: number;
  completionPercentage: number;
  avgCompletionPerWeek: number;
  estimatedWeeksRemaining: number | null;
  estimatedCompletionDate: string | null;
}

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

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDayStats(userId: string, date: string): Promise<PeriodStats> {
    const stats = await this.getStatsForDates(userId, [date]);
    const streak = await this.calculateStreak(userId);

    return {
      date,
      ...stats,
      streak,
    };
  }

  async getWeekStats(userId: string, week: string): Promise<PeriodStats> {
    const dates = getFullWeekDates(week);
    const stats = await this.getStatsForDates(userId, dates);
    const streak = await this.calculateStreak(userId);

    return {
      week,
      ...stats,
      streak,
    };
  }

  async getMonthStats(userId: string, month: string): Promise<PeriodStats> {
    const dates = getMonthDates(month);
    const stats = await this.getStatsForDates(userId, dates);
    const streak = await this.calculateStreak(userId);

    return {
      month,
      ...stats,
      streak,
    };
  }

  /**
   * Compute planned/completed/inProgress/completionPct/studyMinutes
   * for the given set of date strings.
   */
  private async getStatsForDates(
    userId: string,
    dates: string[],
  ): Promise<{
    planned: number;
    completed: number;
    inProgress: number;
    completionPct: number;
    studyMinutes: number;
  }> {
    // Get all daily plan assignments for the given dates
    const assignments = await this.prisma.planAssignment.findMany({
      where: {
        userId,
        level: 'DAILY',
        periodKey: { in: dates },
      },
      include: {
        learningItem: { select: { status: true } },
      },
    });

    const planned = assignments.length;
    const completed = assignments.filter(
      (a) => a.learningItem.status === 'LEARNED',
    ).length;
    const inProgress = assignments.filter(
      (a) => a.learningItem.status === 'IN_PROGRESS',
    ).length;
    const completionPct = planned > 0 ? Math.round((completed / planned) * 100) : 0;

    // Sum study minutes for sessions starting on those dates
    const dateRanges = this.datesToRanges(dates);
    let studyMinutes = 0;

    for (const range of dateRanges) {
      const result = await this.prisma.studySession.aggregate({
        where: {
          userId,
          startedAt: {
            gte: range.start,
            lt: range.end,
          },
        },
        _sum: { durationMin: true },
      });
      studyMinutes += result._sum.durationMin ?? 0;
    }

    return { planned, completed, inProgress, completionPct, studyMinutes };
  }

  /**
   * Convert an array of YYYY-MM-DD date strings into contiguous UTC date ranges
   * to minimize queries. Each range is [start, end) where end is the next day.
   */
  private datesToRanges(
    dates: string[],
  ): Array<{ start: Date; end: Date }> {
    if (dates.length === 0) return [];

    const sorted = [...dates].sort();
    const ranges: Array<{ start: Date; end: Date }> = [];

    let rangeStart = new Date(sorted[0]! + 'T00:00:00.000Z');
    let rangeEnd = new Date(sorted[0]! + 'T00:00:00.000Z');
    rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 1);

    for (let i = 1; i < sorted.length; i++) {
      const dayStart = new Date(sorted[i]! + 'T00:00:00.000Z');
      const dayEnd = new Date(sorted[i]! + 'T00:00:00.000Z');
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

      if (dayStart.getTime() === rangeEnd.getTime()) {
        // Contiguous — extend range
        rangeEnd = dayEnd;
      } else {
        ranges.push({ start: rangeStart, end: rangeEnd });
        rangeStart = dayStart;
        rangeEnd = dayEnd;
      }
    }

    ranges.push({ start: rangeStart, end: rangeEnd });
    return ranges;
  }

  async getCategoryProgress(userId: string): Promise<CategoryProgress[]> {
    // 1. Fetch all categories for the user
    const categories = await this.prisma.category.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    // 2. Count total user assessmentRuns to decide imbalanceFlag threshold
    const totalAssessmentRuns = await this.prisma.assessmentRun.count({
      where: { userId },
    });
    const hasEnoughAssessments = totalAssessmentRuns >= 5;

    // 3. Per-category: count items, sessions sum, assessmentRun aggregates
    const result: CategoryProgress[] = [];

    for (const category of categories) {
      // Item counts
      const [itemCount, completedCount, needsRevisionCount] = await Promise.all([
        this.prisma.learningItem.count({
          where: { userId, categoryId: category.id },
        }),
        this.prisma.learningItem.count({
          where: { userId, categoryId: category.id, status: 'LEARNED' },
        }),
        this.prisma.learningItem.count({
          where: { userId, categoryId: category.id, status: 'NEEDS_REVISION' },
        }),
      ]);

      // Study minutes for sessions linked to items in this category
      const sessionAgg = await this.prisma.studySession.aggregate({
        where: {
          userId,
          learningItem: { categoryId: category.id },
        },
        _sum: { durationMin: true },
      });
      const totalStudyMinutes = sessionAgg._sum.durationMin ?? 0;

      // AssessmentRun aggregates via assessment -> learningItem.categoryId
      const runAgg = await this.prisma.assessmentRun.aggregate({
        where: {
          userId,
          assessment: { learningItem: { categoryId: category.id } },
        },
        _count: { id: true },
        _avg: { score: true },
      });
      const assessmentCount = runAgg._count.id;
      const averageScore =
        runAgg._avg.score !== null
          ? Math.round(runAgg._avg.score * 100) / 100
          : null;

      const imbalanceFlag =
        itemCount > 2 && assessmentCount === 0 && hasEnoughAssessments;

      result.push({
        categoryId: category.id,
        categoryName: category.name,
        itemCount,
        completedCount,
        needsRevisionCount,
        totalStudyMinutes,
        assessmentCount,
        averageScore,
        imbalanceFlag,
      });
    }

    return result;
  }

  async getScoreTrend(
    userId: string,
    learningItemId?: string,
    from?: string,
    to?: string,
  ): Promise<ScoreTrendPoint[]> {
    const completedAtFilter: { gte?: Date; lte?: Date } = {};
    if (from) {
      completedAtFilter.gte = new Date(from + 'T00:00:00.000Z');
    }
    if (to) {
      completedAtFilter.lte = new Date(to + 'T23:59:59.999Z');
    }

    const runs = await this.prisma.assessmentRun.findMany({
      where: {
        userId,
        ...(Object.keys(completedAtFilter).length > 0 && {
          completedAt: completedAtFilter,
        }),
        ...(learningItemId && {
          assessment: { learningItemId },
        }),
      },
      include: {
        assessment: {
          select: {
            mode: true,
            learningItemId: true,
            learningItem: { select: { title: true } },
          },
        },
      },
      orderBy: { completedAt: 'asc' },
      take: 100,
    });

    return runs.map((run) => ({
      assessmentId: run.assessmentId,
      learningItemId: run.assessment.learningItemId,
      learningItemTitle: run.assessment.learningItem.title,
      mode: run.assessment.mode,
      score: run.score,
      completedAt: run.completedAt.toISOString(),
    }));
  }

  async getRadarData(userId: string): Promise<RadarDataPoint[]> {
    // Fetch all categories that have at least one item for this user
    const categories = await this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    const result: RadarDataPoint[] = [];

    for (const category of categories) {
      const [totalCount, completedCount] = await Promise.all([
        this.prisma.learningItem.count({
          where: { userId, categoryId: category.id },
        }),
        this.prisma.learningItem.count({
          where: { userId, categoryId: category.id, status: 'LEARNED' },
        }),
      ]);

      const actual =
        totalCount > 0
          ? Math.round((completedCount / totalCount) * 1000) / 10
          : 0;

      result.push({
        category: category.name,
        actual,
        target: category.weightGoal ?? 20,
      });
    }

    return result;
  }

  async getForecast(userId: string): Promise<ForecastData> {
    const [totalItems, completedItems] = await Promise.all([
      this.prisma.learningItem.count({ where: { userId } }),
      this.prisma.learningItem.count({ where: { userId, status: 'LEARNED' } }),
    ]);

    const completionPercentage =
      totalItems > 0
        ? Math.round((completedItems / totalItems) * 1000) / 10
        : 0;

    // Count completions in the last 4 weeks
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setUTCDate(fourWeeksAgo.getUTCDate() - 28);

    const recentlyLearned = await this.prisma.learningItem.count({
      where: {
        userId,
        status: 'LEARNED',
        updatedAt: { gte: fourWeeksAgo },
      },
    });

    const avgCompletionPerWeek =
      Math.round((recentlyLearned / 4) * 100) / 100;

    if (avgCompletionPerWeek === 0) {
      return {
        totalItems,
        completedItems,
        completionPercentage,
        avgCompletionPerWeek: 0,
        estimatedWeeksRemaining: null,
        estimatedCompletionDate: null,
      };
    }

    const remaining = totalItems - completedItems;
    const estimatedWeeksRemaining = Math.ceil(remaining / avgCompletionPerWeek);

    const completionDate = new Date();
    completionDate.setUTCDate(
      completionDate.getUTCDate() + estimatedWeeksRemaining * 7,
    );

    return {
      totalItems,
      completedItems,
      completionPercentage,
      avgCompletionPerWeek,
      estimatedWeeksRemaining,
      estimatedCompletionDate: completionDate.toISOString(),
    };
  }

  async getHeatmapData(userId: string, year: number): Promise<HeatmapDay[]> {
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year + 1, 0, 1));

    // Build the full map of every day in the year
    const dayMap = new Map<string, { count: number; minutes: number }>();
    const cursor = new Date(yearStart);
    while (cursor < yearEnd) {
      const key = cursor.toISOString().slice(0, 10);
      dayMap.set(key, { count: 0, minutes: 0 });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    // StudySession: fetch all sessions for the year
    const studySessions = await this.prisma.studySession.findMany({
      where: {
        userId,
        startedAt: { gte: yearStart, lt: yearEnd },
      },
      select: { startedAt: true, durationMin: true },
    });

    for (const session of studySessions) {
      const key = session.startedAt.toISOString().slice(0, 10);
      const entry = dayMap.get(key);
      if (entry) {
        entry.count += 1;
        entry.minutes += session.durationMin ?? 0;
      }
    }

    // ResourceSession: fetch all resource sessions for the year
    const resourceSessions = await this.prisma.resourceSession.findMany({
      where: {
        userId,
        sessionDate: { gte: yearStart, lt: yearEnd },
      },
      select: { sessionDate: true, durationMin: true },
    });

    for (const session of resourceSessions) {
      const key = session.sessionDate.toISOString().slice(0, 10);
      const entry = dayMap.get(key);
      if (entry) {
        entry.count += 1;
        entry.minutes += session.durationMin ?? 0;
      }
    }

    // Return sorted array of all days
    return Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { count, minutes }]) => ({ date, count, minutes }));
  }

  /**
   * Calculate streak: consecutive days going backward from today where the user
   * had at least 1 completed item (LEARNED with updatedAt on that date)
   * or 1 study session (startedAt on that date).
   */
  async calculateStreak(userId: string): Promise<number> {
    const today = new Date();
    const todayStr = formatDateUTC(today);

    // Look back up to 365 days
    const lookbackStart = new Date(today);
    lookbackStart.setUTCDate(lookbackStart.getUTCDate() - 365);

    // Get all dates with completed items (LEARNED status, updatedAt on that date)
    const learnedItems = await this.prisma.learningItem.findMany({
      where: {
        userId,
        status: 'LEARNED',
        updatedAt: {
          gte: lookbackStart,
        },
      },
      select: { updatedAt: true },
    });

    const activeDates = new Set<string>();
    for (const item of learnedItems) {
      activeDates.add(formatDateUTC(item.updatedAt));
    }

    // Get all dates with study sessions
    const sessions = await this.prisma.studySession.findMany({
      where: {
        userId,
        startedAt: {
          gte: lookbackStart,
        },
      },
      select: { startedAt: true },
    });

    for (const session of sessions) {
      activeDates.add(formatDateUTC(session.startedAt));
    }

    // Walk backward from today
    let streak = 0;
    const cursor = new Date(Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
    ));

    for (let i = 0; i < 366; i++) {
      const dateStr = formatDateUTC(cursor);
      if (activeDates.has(dateStr)) {
        streak++;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      } else if (i === 0) {
        // Today not active yet — still check yesterday onward
        cursor.setUTCDate(cursor.getUTCDate() - 1);
        continue;
      } else {
        break;
      }
    }

    return streak;
  }
}
