import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ReminderType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class RemindersService {
  constructor(private readonly prisma: PrismaService) {}

  async generateDailySummary(userId: string) {
    const today = new Date();
    const periodKey = today.toISOString().slice(0, 10); // YYYY-MM-DD
    const startOfDay = new Date(periodKey + 'T00:00:00.000Z');
    const endOfDay = new Date(periodKey + 'T23:59:59.999Z');
    const now = new Date();

    const plannedCount = await this.prisma.planAssignment.count({
      where: {
        userId,
        level: 'DAILY',
        periodKey,
      },
    });

    const dueCount = await this.prisma.spacedRepetition.count({
      where: {
        userId,
        nextReviewAt: { lte: now },
      },
    });

    const todaySessionCount = await this.prisma.studySession.count({
      where: {
        userId,
        startedAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    const streakActive = todaySessionCount > 0;
    const body = `Today: ${plannedCount} items planned · ${dueCount} reviews due${streakActive ? ' · Streak active' : ''}`;

    return this.prisma.reminder.create({
      data: {
        userId,
        type: ReminderType.DAILY_SUMMARY,
        title: 'Daily Summary',
        body,
      },
    });
  }

  async generateSpacedRepDueAlert(userId: string) {
    const now = new Date();

    const count = await this.prisma.spacedRepetition.count({
      where: {
        userId,
        nextReviewAt: { lte: now },
      },
    });

    if (count === 0) {
      throw new BadRequestException('No reviews due');
    }

    return this.prisma.reminder.create({
      data: {
        userId,
        type: ReminderType.SPACED_REP_DUE,
        title: 'Reviews Due',
        body: `${count} items ready for review`,
      },
    });
  }

  async listReminders(userId: string, unreadOnly?: boolean) {
    return this.prisma.reminder.findMany({
      where: {
        userId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markRead(userId: string, id: string) {
    const reminder = await this.prisma.reminder.findFirst({
      where: { id, userId },
    });

    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    return this.prisma.reminder.update({
      where: { id },
      data: { read: true },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.reminder.count({
      where: { userId, read: false },
    });
  }
}
