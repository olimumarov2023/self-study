import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

import type { DragDto } from './dto/drag.dto.js';
import type { LearnStatus } from '@prisma/client';

const BOARD_STATUSES: LearnStatus[] = [
  'TO_LEARN',
  'PLANNED',
  'IN_PROGRESS',
  'LEARNED',
  'NEEDS_REVISION',
];

const itemInclude = {
  learningItem: {
    include: { category: true },
  },
} as const;

@Injectable()
export class BoardService {
  constructor(private readonly prisma: PrismaService) {}

  async getToday(userId: string) {
    const today = toDateString(new Date());

    const assignments = await this.prisma.planAssignment.findMany({
      where: { userId, level: 'DAILY', periodKey: today },
      include: itemInclude,
      orderBy: { rank: 'asc' },
    });

    return {
      columns: groupByStatus(assignments),
      date: today,
    };
  }

  async getWeek(userId: string) {
    const weekDates = getCurrentWeekDates();

    const assignments = await this.prisma.planAssignment.findMany({
      where: {
        userId,
        level: 'DAILY',
        periodKey: { in: weekDates },
      },
      include: itemInclude,
      orderBy: { rank: 'asc' },
    });

    return {
      columns: groupByStatus(assignments),
      weekDates,
    };
  }

  async drag(userId: string, dto: DragDto) {
    const learningItem = await this.prisma.learningItem.findFirst({
      where: { id: dto.learningItemId, userId },
    });

    if (!learningItem) {
      throw new NotFoundException('Learning item not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update learning item status
      const updatedItem = await tx.learningItem.update({
        where: { id: dto.learningItemId },
        data: { status: dto.newStatus },
        include: { category: true },
      });

      // Optionally update rank on the daily plan assignment
      if (dto.newRank !== undefined) {
        const assignment = await tx.planAssignment.findFirst({
          where: {
            userId,
            learningItemId: dto.learningItemId,
            level: 'DAILY',
          },
          orderBy: { createdAt: 'desc' },
        });

        if (assignment) {
          await tx.planAssignment.update({
            where: { id: assignment.id },
            data: { rank: dto.newRank },
          });
        }
      }

      return updatedItem;
    });
  }
}

/** Format a Date as YYYY-MM-DD in UTC. */
function toDateString(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Get Mon-Fri date strings for the current ISO week. */
function getCurrentWeekDates(): string[] {
  const now = new Date();
  const utcDay = now.getUTCDay(); // 0=Sun, 1=Mon, ...
  const daysSinceMonday = utcDay === 0 ? 6 : utcDay - 1;

  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - daysSinceMonday);

  const dates: string[] = [];
  for (let i = 0; i < 5; i++) {
    const day = new Date(monday);
    day.setUTCDate(monday.getUTCDate() + i);
    dates.push(toDateString(day));
  }
  return dates;
}

/** Group plan assignments into board columns by learning item status. */
function groupByStatus(
  assignments: Array<{
    rank: number;
    learningItem: {
      id: string;
      title: string;
      description: string | null;
      priority: string;
      difficulty: number;
      estimatedHours: number | null;
      status: string;
      tags: string[];
      category: { id: string; name: string; color: string | null } | null;
    };
  }>,
): Record<string, Array<Record<string, unknown>>> {
  const columns: Record<string, Array<Record<string, unknown>>> = {};

  for (const status of BOARD_STATUSES) {
    columns[status] = [];
  }

  for (const assignment of assignments) {
    const item = assignment.learningItem;
    const status = item.status as LearnStatus;

    if (!columns[status]) {
      columns[status] = [];
    }

    columns[status]!.push({
      id: item.id,
      title: item.title,
      description: item.description,
      priority: item.priority,
      difficulty: item.difficulty,
      estimatedHours: item.estimatedHours,
      status: item.status,
      tags: item.tags,
      category: item.category
        ? { id: item.category.id, name: item.category.name, color: item.category.color }
        : null,
      rank: assignment.rank,
    });
  }

  return columns;
}
