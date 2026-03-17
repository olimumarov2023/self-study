import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';

import type { CreateLearningItemDto } from './dto/create-learning-item.dto.js';
import type { UpdateLearningItemDto } from './dto/update-learning-item.dto.js';
import type { QueryLearningItemsDto } from './dto/query-learning-items.dto.js';
import type { MoveStatusDto } from './dto/move-status.dto.js';

@Injectable()
export class LearningItemService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: QueryLearningItemsDto) {
    const where: Prisma.LearningItemWhereInput = { userId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    if (query.tags && query.tags.length > 0) {
      where.tags = { hasSome: query.tags };
    }

    const [data, total] = await Promise.all([
      this.prisma.learningItem.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      this.prisma.learningItem.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(userId: string, id: string) {
    const item = await this.prisma.learningItem.findFirst({
      where: { id, userId },
      include: { category: true },
    });

    if (!item) {
      throw new NotFoundException('Learning item not found');
    }

    return item;
  }

  async create(userId: string, dto: CreateLearningItemDto) {
    return this.prisma.learningItem.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        notes: dto.notes,
        categoryId: dto.categoryId,
        priority: dto.priority,
        difficulty: dto.difficulty,
        estimatedHours: dto.estimatedHours,
        tags: dto.tags,
        targetRole: dto.targetRole,
        dueDate: dto.dueDate,
        status: dto.status,
      },
      include: { category: true },
    });
  }

  async update(userId: string, id: string, dto: UpdateLearningItemDto) {
    const item = await this.prisma.learningItem.findFirst({
      where: { id, userId },
    });

    if (!item) {
      throw new NotFoundException('Learning item not found');
    }

    return this.prisma.learningItem.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  async remove(userId: string, id: string) {
    const item = await this.prisma.learningItem.findFirst({
      where: { id, userId },
    });

    if (!item) {
      throw new NotFoundException('Learning item not found');
    }

    await this.prisma.learningItem.delete({ where: { id } });

    return { deleted: true };
  }

  async moveStatus(userId: string, id: string, dto: MoveStatusDto) {
    const item = await this.prisma.learningItem.findFirst({
      where: { id, userId },
    });

    if (!item) {
      throw new NotFoundException('Learning item not found');
    }

    return this.prisma.learningItem.update({
      where: { id },
      data: { status: dto.status },
      include: { category: true },
    });
  }
}
