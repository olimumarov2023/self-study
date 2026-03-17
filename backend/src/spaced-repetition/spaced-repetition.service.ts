import { Injectable, NotFoundException } from '@nestjs/common';
import type { SpacedRepetition } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const learningItemSelect = {
  id: true,
  title: true,
  categoryId: true,
  category: {
    select: { name: true },
  },
} as const;

export type SpacedRepetitionWithItem = SpacedRepetition & {
  learningItem: {
    id: string;
    title: string;
    categoryId: string | null;
    category: { name: string } | null;
  };
};

export interface ScheduleDay {
  date: string;
  items: SpacedRepetitionWithItem[];
}

// ---------------------------------------------------------------------------
// SM-2 helpers
// ---------------------------------------------------------------------------

function mapScoreToQuality(score: number): number {
  if (score >= 95) return 5;
  if (score >= 80) return 4;
  if (score >= 65) return 3;
  if (score >= 50) return 2;
  if (score >= 30) return 1;
  return 0;
}

interface Sm2Input {
  easeFactor: number;
  intervalDays: number;
  reviewCount: number;
  quality: number;
}

interface Sm2Result {
  easeFactor: number;
  intervalDays: number;
  reviewCount: number;
  nextReviewAt: Date;
  lastReviewAt: Date;
}

function applySm2(input: Sm2Input): Sm2Result {
  const { quality } = input;
  let { easeFactor, intervalDays, reviewCount } = input;

  if (quality < 3) {
    // SM-2: reset repetitions on failure
    reviewCount = 0;
    intervalDays = 1;
  } else {
    if (reviewCount === 0) {
      intervalDays = 1;
    } else if (reviewCount === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
  );

  const now = new Date();
  const nextReviewAt = new Date(now);
  nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

  return {
    easeFactor,
    intervalDays,
    reviewCount: reviewCount + 1,
    nextReviewAt,
    lastReviewAt: now,
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class SpacedRepetitionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Called after an assessment run completes. Creates or updates the
   * SpacedRepetition record for the given learningItem using the SM-2 algorithm.
   */
  async upsertFromAssessment(
    userId: string,
    learningItemId: string,
    assessmentRunId: string,
    score: number,
  ): Promise<SpacedRepetition> {
    const quality = mapScoreToQuality(score);

    const existing = await this.prisma.spacedRepetition.findFirst({
      where: { learningItemId, userId },
    });

    if (existing) {
      const sm2 = applySm2({
        easeFactor: existing.easeFactor,
        intervalDays: existing.intervalDays,
        reviewCount: existing.reviewCount,
        quality,
      });

      return this.prisma.spacedRepetition.update({
        where: { id: existing.id },
        data: {
          assessmentRunId,
          easeFactor: sm2.easeFactor,
          intervalDays: sm2.intervalDays,
          reviewCount: sm2.reviewCount,
          nextReviewAt: sm2.nextReviewAt,
          lastReviewAt: sm2.lastReviewAt,
        },
      });
    }

    // No existing record — apply SM-2 from defaults
    const defaults = { easeFactor: 2.5, intervalDays: 1, reviewCount: 0 };
    const sm2 = applySm2({ ...defaults, quality });

    return this.prisma.spacedRepetition.create({
      data: {
        userId,
        learningItemId,
        assessmentRunId,
        easeFactor: sm2.easeFactor,
        intervalDays: sm2.intervalDays,
        reviewCount: sm2.reviewCount,
        nextReviewAt: sm2.nextReviewAt,
        lastReviewAt: sm2.lastReviewAt,
      },
    });
  }

  /**
   * Returns all SpacedRepetition records due for review today or overdue.
   */
  async getDueItems(userId: string): Promise<SpacedRepetitionWithItem[]> {
    const now = new Date();

    return this.prisma.spacedRepetition.findMany({
      where: {
        userId,
        nextReviewAt: { lte: now },
      },
      include: {
        learningItem: {
          select: learningItemSelect,
        },
      },
      orderBy: { nextReviewAt: 'asc' },
    }) as Promise<SpacedRepetitionWithItem[]>;
  }

  /**
   * Returns upcoming reviews for the next 30 days grouped by date (YYYY-MM-DD).
   */
  async getSchedule(userId: string): Promise<ScheduleDay[]> {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 30);

    const records = (await this.prisma.spacedRepetition.findMany({
      where: {
        userId,
        nextReviewAt: { gte: start, lte: end },
      },
      include: {
        learningItem: {
          select: learningItemSelect,
        },
      },
      orderBy: { nextReviewAt: 'asc' },
    })) as SpacedRepetitionWithItem[];

    // Group by YYYY-MM-DD
    const map = new Map<string, SpacedRepetitionWithItem[]>();

    for (const record of records) {
      const dateKey = record.nextReviewAt.toISOString().slice(0, 10);
      const bucket = map.get(dateKey);
      if (bucket) {
        bucket.push(record);
      } else {
        map.set(dateKey, [record]);
      }
    }

    const schedule: ScheduleDay[] = [];
    for (const [date, items] of map) {
      schedule.push({ date, items });
    }

    // Already ordered by nextReviewAt from DB, but sort keys to be safe
    schedule.sort((a, b) => a.date.localeCompare(b.date));

    return schedule;
  }

  /**
   * Apply SM-2 directly with a caller-supplied quality value (0-5).
   * Used for manual "I reviewed this" without a full assessment.
   */
  async recordManualReview(
    userId: string,
    learningItemId: string,
    quality: number,
  ): Promise<SpacedRepetition> {
    const item = await this.prisma.learningItem.findFirst({
      where: { id: learningItemId, userId },
    });

    if (!item) {
      throw new NotFoundException('Learning item not found');
    }

    const existing = await this.prisma.spacedRepetition.findFirst({
      where: { learningItemId, userId },
    });

    if (existing) {
      const sm2 = applySm2({
        easeFactor: existing.easeFactor,
        intervalDays: existing.intervalDays,
        reviewCount: existing.reviewCount,
        quality,
      });

      return this.prisma.spacedRepetition.update({
        where: { id: existing.id },
        data: {
          easeFactor: sm2.easeFactor,
          intervalDays: sm2.intervalDays,
          reviewCount: sm2.reviewCount,
          nextReviewAt: sm2.nextReviewAt,
          lastReviewAt: sm2.lastReviewAt,
        },
      });
    }

    // No prior record — create from defaults then apply SM-2
    const defaults = { easeFactor: 2.5, intervalDays: 1, reviewCount: 0 };
    const sm2 = applySm2({ ...defaults, quality });

    return this.prisma.spacedRepetition.create({
      data: {
        userId,
        learningItemId,
        easeFactor: sm2.easeFactor,
        intervalDays: sm2.intervalDays,
        reviewCount: sm2.reviewCount,
        nextReviewAt: sm2.nextReviewAt,
        lastReviewAt: sm2.lastReviewAt,
      },
    });
  }
}
