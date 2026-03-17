import { Injectable, NotFoundException } from '@nestjs/common';
import { ResourceType, ResourceStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import { computeProgressPercent, computeResumePosition } from './library.utils.js';

import type { CreateResourceDto } from './dto/create-resource.dto.js';
import type { UpdateResourceDto } from './dto/update-resource.dto.js';
import type { CreateSessionDto } from './dto/create-session.dto.js';

@Injectable()
export class LibraryService {
  constructor(private readonly prisma: PrismaService) {}

  private buildResourceResponse(
    resource: any,
    includeResumePosition: boolean,
  ) {
    const sessions: Array<{
      startPage?: number | null;
      endPage?: number | null;
      startMinute?: number | null;
      endMinute?: number | null;
    }> = resource.sessions ?? [];

    const progressPercent = computeProgressPercent(
      resource.type as 'BOOK' | 'VIDEO',
      sessions,
      resource.type === 'BOOK' ? resource.totalPages : resource.totalMinutes,
    );

    const resumePosition = includeResumePosition
      ? computeResumePosition(
          resource.type as 'BOOK' | 'VIDEO',
          sessions,
          resource.type === 'BOOK' ? resource.totalPages : resource.totalMinutes,
        )
      : null;

    return {
      id: resource.id,
      type: resource.type,
      status: resource.status,
      title: resource.title,
      author: resource.author,
      url: resource.url,
      totalPages: resource.totalPages,
      currentPage: resource.currentPage,
      totalMinutes: resource.totalMinutes,
      watchedMinutes: resource.watchedMinutes,
      categoryId: resource.categoryId,
      notes: resource.notes,
      progressPercent,
      resumePosition,
      sessionCount: sessions.length,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
    };
  }

  async listResources(
    userId: string,
    filters?: { type?: ResourceType; status?: ResourceStatus },
  ) {
    const resources = await this.prisma.libraryResource.findMany({
      where: {
        userId,
        ...(filters?.type && { type: filters.type }),
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        sessions: {
          select: {
            startPage: true,
            endPage: true,
            startMinute: true,
            endMinute: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return resources.map((r) => this.buildResourceResponse(r, false));
  }

  async getResource(userId: string, id: string) {
    const resource = await this.prisma.libraryResource.findFirst({
      where: { id, userId },
      include: {
        sessions: {
          orderBy: { sessionDate: 'desc' },
        },
      },
    });

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    return this.buildResourceResponse(resource, true);
  }

  async createResource(userId: string, dto: CreateResourceDto) {
    const resource = await this.prisma.libraryResource.create({
      data: {
        userId,
        type: dto.type as ResourceType,
        title: dto.title,
        author: dto.author,
        url: dto.url,
        totalPages: dto.totalPages,
        totalMinutes: dto.totalMinutes,
        categoryId: dto.categoryId,
        notes: dto.notes,
      },
      include: {
        sessions: true,
      },
    });

    return this.buildResourceResponse(resource, false);
  }

  async updateResource(userId: string, id: string, dto: UpdateResourceDto) {
    const existing = await this.prisma.libraryResource.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Resource not found');
    }

    // Auto-set status to IN_PROGRESS if progress fields are being set
    let autoStatus: ResourceStatus | undefined;
    if (
      (dto.currentPage != null && dto.currentPage > 0) ||
      (dto.watchedMinutes != null && dto.watchedMinutes > 0)
    ) {
      if (existing.status === ResourceStatus.NOT_STARTED) {
        autoStatus = ResourceStatus.IN_PROGRESS;
      }
    }

    const resource = await this.prisma.libraryResource.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.author !== undefined && { author: dto.author }),
        ...(dto.url !== undefined && { url: dto.url }),
        ...(dto.totalPages !== undefined && { totalPages: dto.totalPages }),
        ...(dto.currentPage !== undefined && { currentPage: dto.currentPage }),
        ...(dto.totalMinutes !== undefined && { totalMinutes: dto.totalMinutes }),
        ...(dto.watchedMinutes !== undefined && { watchedMinutes: dto.watchedMinutes }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        status: dto.status ? (dto.status as ResourceStatus) : (autoStatus ?? existing.status),
      },
      include: {
        sessions: {
          select: {
            startPage: true,
            endPage: true,
            startMinute: true,
            endMinute: true,
          },
        },
      },
    });

    return this.buildResourceResponse(resource, false);
  }

  async deleteResource(userId: string, id: string) {
    const existing = await this.prisma.libraryResource.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Resource not found');
    }

    await this.prisma.libraryResource.delete({ where: { id } });

    return { deleted: true };
  }

  async listSessions(userId: string, resourceId: string) {
    const resource = await this.prisma.libraryResource.findFirst({
      where: { id: resourceId, userId },
    });

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    return this.prisma.resourceSession.findMany({
      where: { resourceId },
      orderBy: { sessionDate: 'desc' },
    });
  }

  async createSession(userId: string, resourceId: string, dto: CreateSessionDto) {
    const resource = await this.prisma.libraryResource.findFirst({
      where: { id: resourceId, userId },
    });

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    const sessionDate = dto.sessionDate ? new Date(dto.sessionDate) : new Date();

    const session = await this.prisma.$transaction(async (tx) => {
      const newSession = await tx.resourceSession.create({
        data: {
          resourceId,
          userId,
          startPage: dto.startPage,
          endPage: dto.endPage,
          startMinute: dto.startMinute,
          endMinute: dto.endMinute,
          notes: dto.notes,
          sessionDate,
          durationMin: dto.durationMin,
        },
      });

      // Auto-update resource progress fields and status
      const updates: Record<string, unknown> = {};

      if (resource.type === ResourceType.BOOK && dto.endPage != null) {
        if (resource.currentPage == null || dto.endPage > resource.currentPage) {
          updates.currentPage = dto.endPage;
        }
      }

      if (resource.type === ResourceType.VIDEO && dto.endMinute != null) {
        if (resource.watchedMinutes == null || dto.endMinute > resource.watchedMinutes) {
          updates.watchedMinutes = dto.endMinute;
        }
      }

      // Auto-transition status
      if (resource.status === ResourceStatus.NOT_STARTED) {
        updates.status = ResourceStatus.IN_PROGRESS;
      }

      if (Object.keys(updates).length > 0) {
        await tx.libraryResource.update({
          where: { id: resourceId },
          data: updates,
        });
      }

      return newSession;
    });

    return session;
  }
}
