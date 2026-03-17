import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { getWeekDates } from '../common/utils/date.util.js';

import type { AssignDto } from './dto/assign.dto.js';
import type { ReorderDto } from './dto/reorder.dto.js';
import type { AutoDistributeDto } from './dto/auto-distribute.dto.js';

@Injectable()
export class PlanningService {
  constructor(private readonly prisma: PrismaService) {}

  async assign(userId: string, dto: AssignDto) {
    const learningItem = await this.prisma.learningItem.findFirst({
      where: { id: dto.learningItemId, userId },
    });

    if (!learningItem) {
      throw new NotFoundException('Learning item not found');
    }

    const existing = await this.prisma.planAssignment.findFirst({
      where: {
        userId,
        learningItemId: dto.learningItemId,
        level: dto.level,
        periodKey: dto.periodKey,
      },
    });

    if (existing) {
      throw new ConflictException('Item is already assigned to this period');
    }

    const maxRank = await this.prisma.planAssignment.aggregate({
      where: { userId, level: dto.level, periodKey: dto.periodKey },
      _max: { rank: true },
    });

    const nextRank = (maxRank._max.rank ?? -1) + 1;

    return this.prisma.planAssignment.create({
      data: {
        userId,
        learningItemId: dto.learningItemId,
        level: dto.level,
        periodKey: dto.periodKey,
        rank: nextRank,
      },
      include: {
        learningItem: { include: { category: true } },
      },
    });
  }

  async findByPeriod(
    userId: string,
    level: 'MONTHLY' | 'WEEKLY' | 'DAILY',
    periodKey: string,
  ) {
    return this.prisma.planAssignment.findMany({
      where: { userId, level, periodKey },
      include: {
        learningItem: { include: { category: true } },
      },
      orderBy: { rank: 'asc' },
    });
  }

  async reorder(userId: string, dto: ReorderDto) {
    const ids = dto.assignments.map((a) => a.id);

    const existing = await this.prisma.planAssignment.findMany({
      where: { id: { in: ids }, userId },
      select: { id: true },
    });

    const existingIds = new Set(existing.map((a) => a.id));
    const missing = ids.filter((id) => !existingIds.has(id));

    if (missing.length > 0) {
      throw new BadRequestException(
        `Assignments not found: ${missing.join(', ')}`,
      );
    }

    await this.prisma.$transaction(
      dto.assignments.map((a) =>
        this.prisma.planAssignment.update({
          where: { id: a.id },
          data: { rank: a.rank },
        }),
      ),
    );

    return { updated: dto.assignments.length };
  }

  async autoDistribute(userId: string, dto: AutoDistributeDto) {
    const weeklyAssignments = await this.prisma.planAssignment.findMany({
      where: { userId, level: 'WEEKLY', periodKey: dto.weekPeriodKey },
      include: { learningItem: true },
      orderBy: { rank: 'asc' },
    });

    if (weeklyAssignments.length === 0) {
      return { created: 0, assignments: [] };
    }

    const weekDates = getWeekDates(dto.weekPeriodKey);

    const existingDaily = await this.prisma.planAssignment.findMany({
      where: {
        userId,
        level: 'DAILY',
        periodKey: { in: weekDates },
        learningItemId: {
          in: weeklyAssignments.map((a) => a.learningItemId),
        },
      },
      select: { learningItemId: true, periodKey: true },
    });

    const existingSet = new Set(
      existingDaily.map((e) => `${e.learningItemId}:${e.periodKey}`),
    );

    const toCreate: Array<{
      learningItemId: string;
      periodKey: string;
      dayIndex: number;
    }> = [];

    weeklyAssignments.forEach((assignment, index) => {
      const dayIndex = index % 5;
      const periodKey = weekDates[dayIndex]!;
      const key = `${assignment.learningItemId}:${periodKey}`;

      if (!existingSet.has(key)) {
        toCreate.push({
          learningItemId: assignment.learningItemId,
          periodKey,
          dayIndex,
        });
      }
    });

    if (toCreate.length === 0) {
      return { created: 0, assignments: [] };
    }

    // Get max ranks for each target day
    const dayRanks = new Map<string, number>();
    for (const date of weekDates) {
      const max = await this.prisma.planAssignment.aggregate({
        where: { userId, level: 'DAILY', periodKey: date },
        _max: { rank: true },
      });
      dayRanks.set(date, (max._max.rank ?? -1) + 1);
    }

    const created = await this.prisma.$transaction(
      toCreate.map((item) => {
        const rank = dayRanks.get(item.periodKey)!;
        dayRanks.set(item.periodKey, rank + 1);

        return this.prisma.planAssignment.create({
          data: {
            userId,
            learningItemId: item.learningItemId,
            level: 'DAILY',
            periodKey: item.periodKey,
            rank,
          },
          include: {
            learningItem: { include: { category: true } },
          },
        });
      }),
    );

    return { created: created.length, assignments: created };
  }
}

