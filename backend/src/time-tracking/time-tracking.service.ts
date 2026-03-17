import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

import type { StartSessionDto } from './dto/start-session.dto.js';
import type { StopSessionDto } from './dto/stop-session.dto.js';
import type { ManualSessionDto } from './dto/manual-session.dto.js';
import type { QuerySessionsDto } from './dto/query-sessions.dto.js';

@Injectable()
export class TimeTrackingService {
  constructor(private readonly prisma: PrismaService) {}

  async startSession(userId: string, dto: StartSessionDto) {
    // Check if there's already an active session
    const active = await this.prisma.studySession.findFirst({
      where: { userId, endedAt: null },
    });

    if (active) {
      throw new ConflictException('There is already an active session. Stop it before starting a new one.');
    }

    return this.prisma.studySession.create({
      data: {
        userId,
        learningItemId: dto.learningItemId,
        startedAt: new Date(),
      },
      include: {
        learningItem: { select: { id: true, title: true } },
      },
    });
  }

  async stopSession(userId: string, sessionId: string, dto: StopSessionDto) {
    const session = await this.prisma.studySession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.endedAt) {
      throw new BadRequestException('Session is already stopped');
    }

    const endedAt = new Date();
    const durationMin = Math.round(
      (endedAt.getTime() - session.startedAt.getTime()) / 60000,
    );

    return this.prisma.studySession.update({
      where: { id: sessionId },
      data: {
        endedAt,
        durationMin,
        ...(dto.note !== undefined && { note: dto.note }),
      },
      include: {
        learningItem: { select: { id: true, title: true } },
      },
    });
  }

  async createManualSession(userId: string, dto: ManualSessionDto) {
    const startedAt = new Date(dto.startedAt);
    const endedAt = new Date(dto.endedAt);
    const durationMin = Math.round(
      (endedAt.getTime() - startedAt.getTime()) / 60000,
    );

    return this.prisma.studySession.create({
      data: {
        userId,
        learningItemId: dto.learningItemId,
        startedAt,
        endedAt,
        durationMin,
        note: dto.note,
      },
      include: {
        learningItem: { select: { id: true, title: true } },
      },
    });
  }

  async findSessions(userId: string, query: QuerySessionsDto) {
    const where: Record<string, unknown> = { userId };

    if (query.from || query.to) {
      const startedAt: Record<string, Date> = {};
      if (query.from) startedAt.gte = new Date(query.from);
      if (query.to) startedAt.lte = new Date(query.to);
      where.startedAt = startedAt;
    }

    return this.prisma.studySession.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      include: {
        learningItem: { select: { id: true, title: true } },
      },
    });
  }

  async findActiveSession(userId: string) {
    const session = await this.prisma.studySession.findFirst({
      where: { userId, endedAt: null },
      include: {
        learningItem: { select: { id: true, title: true } },
      },
    });

    return session ?? null;
  }
}
