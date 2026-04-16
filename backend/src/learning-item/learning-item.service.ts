import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';

import type { CreateLearningItemDto } from './dto/create-learning-item.dto.js';
import type { UpdateLearningItemDto } from './dto/update-learning-item.dto.js';
import type { QueryLearningItemsDto } from './dto/query-learning-items.dto.js';
import type { MoveStatusDto } from './dto/move-status.dto.js';
import type { CreateSubItemDto } from './dto/create-sub-item.dto.js';
import type { UpdateSubItemDto } from './dto/update-sub-item.dto.js';
import type { ReorderSubItemsDto } from './dto/reorder-sub-items.dto.js';

@Injectable()
export class LearningItemService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: QueryLearningItemsDto) {
    const where: Prisma.LearningItemWhereInput = { userId, parentId: null };

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
        include: {
          category: true,
          subItems: { orderBy: { sortOrder: 'asc' } },
        },
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
      include: {
        category: true,
        subItems: { orderBy: { sortOrder: 'asc' } },
      },
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

    // Delete sub-items and their plan assignments first
    const subItemIds = (
      await this.prisma.learningItem.findMany({
        where: { parentId: id },
        select: { id: true },
      })
    ).map((s) => s.id);

    if (subItemIds.length > 0) {
      await this.prisma.planAssignment.deleteMany({
        where: { learningItemId: { in: subItemIds } },
      });
      await this.prisma.learningItem.deleteMany({
        where: { parentId: id },
      });
    }

    // Delete this item's plan assignments
    await this.prisma.planAssignment.deleteMany({
      where: { learningItemId: id },
    });

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

    const updated = await this.prisma.learningItem.update({
      where: { id },
      data: { status: dto.status },
      include: { category: true },
    });

    if (item.parentId && dto.status === 'LEARNED') {
      await this.checkAndCompleteParent(userId, item.parentId);
    }

    return updated;
  }

  // --- Sub-item methods ---

  async findSubItems(userId: string, parentId: string) {
    await this.findOne(userId, parentId);

    return this.prisma.learningItem.findMany({
      where: { parentId, userId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createSubItem(userId: string, parentId: string, dto: CreateSubItemDto) {
    const parent = await this.findOne(userId, parentId);

    if (parent.parentId) {
      throw new NotFoundException('Cannot nest sub-items more than one level');
    }

    const maxOrder = await this.prisma.learningItem.aggregate({
      where: { parentId, userId },
      _max: { sortOrder: true },
    });

    const sortOrder = dto.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1;

    return this.prisma.learningItem.create({
      data: {
        userId,
        parentId,
        categoryId: parent.categoryId,
        title: dto.title,
        description: dto.description,
        notes: dto.notes,
        priority: dto.priority,
        difficulty: dto.difficulty,
        estimatedHours: dto.estimatedHours,
        tags: dto.tags,
        sortOrder,
      },
    });
  }

  async updateSubItem(userId: string, parentId: string, subItemId: string, dto: UpdateSubItemDto) {
    await this.findOne(userId, parentId);

    const subItem = await this.prisma.learningItem.findFirst({
      where: { id: subItemId, parentId, userId },
    });

    if (!subItem) {
      throw new NotFoundException('Sub-item not found');
    }

    return this.prisma.learningItem.update({
      where: { id: subItemId },
      data: dto,
    });
  }

  async removeSubItem(userId: string, parentId: string, subItemId: string) {
    await this.findOne(userId, parentId);

    const subItem = await this.prisma.learningItem.findFirst({
      where: { id: subItemId, parentId, userId },
    });

    if (!subItem) {
      throw new NotFoundException('Sub-item not found');
    }

    await this.prisma.learningItem.delete({ where: { id: subItemId } });

    await this.checkAndCompleteParent(userId, parentId);

    return { deleted: true };
  }

  async moveSubItemStatus(userId: string, parentId: string, subItemId: string, dto: MoveStatusDto) {
    await this.findOne(userId, parentId);

    const subItem = await this.prisma.learningItem.findFirst({
      where: { id: subItemId, parentId, userId },
    });

    if (!subItem) {
      throw new NotFoundException('Sub-item not found');
    }

    const updated = await this.prisma.learningItem.update({
      where: { id: subItemId },
      data: { status: dto.status },
    });

    if (dto.status === 'LEARNED') {
      await this.checkAndCompleteParent(userId, parentId);
    }

    return updated;
  }

  async reorderSubItems(userId: string, parentId: string, dto: ReorderSubItemsDto) {
    await this.findOne(userId, parentId);

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.learningItem.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    return { updated: dto.items.length };
  }

  // --- Auto-completion ---

  private async checkAndCompleteParent(userId: string, parentId: string) {
    const subItems = await this.prisma.learningItem.findMany({
      where: { parentId, userId },
      select: { status: true },
    });

    if (subItems.length === 0) return;

    const allLearned = subItems.every((s) => s.status === 'LEARNED');

    if (allLearned) {
      await this.prisma.learningItem.update({
        where: { id: parentId },
        data: { status: 'LEARNED' },
      });
    }
  }
}
