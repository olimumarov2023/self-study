import { Injectable, NotFoundException } from '@nestjs/common';
import { StudyBookStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';

import type { CreateBookDto } from './dto/create-book.dto.js';
import type { UpdateBookDto } from './dto/update-book.dto.js';
import type { CreateChapterDto } from './dto/create-chapter.dto.js';
import type { UpdateChapterDto } from './dto/update-chapter.dto.js';
import type { CreateTopicDto } from './dto/create-topic.dto.js';
import type { UpdateTopicDto } from './dto/update-topic.dto.js';

@Injectable()
export class StudyTrackerService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private buildBookSummary(book: {
    id: string;
    userId: string;
    title: string;
    author: string | null;
    description: string | null;
    status: StudyBookStatus;
    createdAt: Date;
    updatedAt: Date;
    chapters: Array<{
      topics: Array<{ learned: boolean }>;
    }>;
  }) {
    let totalTopics = 0;
    let learnedTopics = 0;
    let completedChapters = 0;

    for (const chapter of book.chapters) {
      const chapterTotal = chapter.topics.length;
      const chapterLearned = chapter.topics.filter((t) => t.learned).length;
      totalTopics += chapterTotal;
      learnedTopics += chapterLearned;
      if (chapterTotal > 0 && chapterLearned === chapterTotal) {
        completedChapters++;
      }
    }

    const progressPercent =
      totalTopics > 0 ? Math.round((learnedTopics / totalTopics) * 100) : 0;

    return {
      id: book.id,
      userId: book.userId,
      title: book.title,
      author: book.author,
      description: book.description,
      status: book.status,
      totalChapters: book.chapters.length,
      completedChapters,
      totalTopics,
      learnedTopics,
      progressPercent,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
    };
  }

  /** After any topic change, check if the whole book is complete and update status. */
  private async syncBookStatus(bookId: string) {
    const book = await this.prisma.studyBook.findUnique({
      where: { id: bookId },
      include: {
        chapters: {
          include: { topics: { select: { learned: true } } },
        },
      },
    });

    if (!book) return;

    const allTopics = book.chapters.flatMap((c) => c.topics);

    // Never auto-complete a book that has no topics at all
    if (allTopics.length === 0) return;

    const allLearned = allTopics.every((t) => t.learned);
    const targetStatus: StudyBookStatus = allLearned
      ? StudyBookStatus.COMPLETED
      : book.status === StudyBookStatus.COMPLETED
        ? StudyBookStatus.IN_PROGRESS
        : book.status;

    if (targetStatus !== book.status) {
      await this.prisma.studyBook.update({
        where: { id: bookId },
        data: { status: targetStatus },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Books
  // ---------------------------------------------------------------------------

  async listBooks(userId: string) {
    const books = await this.prisma.studyBook.findMany({
      where: { userId },
      include: {
        chapters: {
          include: {
            topics: { select: { learned: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return books.map((b) => this.buildBookSummary(b));
  }

  async getBook(userId: string, id: string) {
    const book = await this.prisma.studyBook.findFirst({
      where: { id, userId },
      include: {
        chapters: {
          orderBy: { sortOrder: 'asc' },
          include: {
            topics: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!book) {
      throw new NotFoundException('Study book not found');
    }

    const summary = this.buildBookSummary(book);

    return {
      ...summary,
      chapters: book.chapters,
    };
  }

  async createBook(userId: string, dto: CreateBookDto) {
    return this.prisma.studyBook.create({
      data: {
        userId,
        title: dto.title,
        author: dto.author,
        description: dto.description,
        status: (dto.status as StudyBookStatus) ?? StudyBookStatus.IN_PROGRESS,
      },
    });
  }

  async updateBook(userId: string, id: string, dto: UpdateBookDto) {
    const existing = await this.prisma.studyBook.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Study book not found');
    }

    return this.prisma.studyBook.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.author !== undefined && { author: dto.author }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status as StudyBookStatus }),
      },
    });
  }

  async deleteBook(userId: string, id: string) {
    const existing = await this.prisma.studyBook.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Study book not found');
    }

    await this.prisma.studyBook.delete({ where: { id } });
  }

  // ---------------------------------------------------------------------------
  // Chapters
  // ---------------------------------------------------------------------------

  /** Verify the book exists and belongs to the user, then return it. */
  private async assertBookOwnership(userId: string, bookId: string) {
    const book = await this.prisma.studyBook.findFirst({
      where: { id: bookId, userId },
    });

    if (!book) {
      throw new NotFoundException('Study book not found');
    }

    return book;
  }

  async createChapter(userId: string, bookId: string, dto: CreateChapterDto) {
    await this.assertBookOwnership(userId, bookId);

    return this.prisma.studyChapter.create({
      data: {
        bookId,
        title: dto.title,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateChapter(userId: string, id: string, dto: UpdateChapterDto) {
    const chapter = await this.prisma.studyChapter.findFirst({
      where: { id },
      include: { book: { select: { userId: true } } },
    });

    if (!chapter || chapter.book.userId !== userId) {
      throw new NotFoundException('Chapter not found');
    }

    return this.prisma.studyChapter.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async deleteChapter(userId: string, id: string) {
    const chapter = await this.prisma.studyChapter.findFirst({
      where: { id },
      include: { book: { select: { userId: true } } },
    });

    if (!chapter || chapter.book.userId !== userId) {
      throw new NotFoundException('Chapter not found');
    }

    await this.prisma.studyChapter.delete({ where: { id } });
  }

  // ---------------------------------------------------------------------------
  // Topics
  // ---------------------------------------------------------------------------

  private async assertChapterOwnership(userId: string, chapterId: string) {
    const chapter = await this.prisma.studyChapter.findFirst({
      where: { id: chapterId },
      include: { book: { select: { userId: true, id: true } } },
    });

    if (!chapter || chapter.book.userId !== userId) {
      throw new NotFoundException('Chapter not found');
    }

    return chapter;
  }

  async createTopic(userId: string, chapterId: string, dto: CreateTopicDto) {
    await this.assertChapterOwnership(userId, chapterId);

    return this.prisma.studyTopic.create({
      data: {
        chapterId,
        title: dto.title,
        notes: dto.notes,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateTopic(userId: string, id: string, dto: UpdateTopicDto) {
    const topic = await this.prisma.studyTopic.findFirst({
      where: { id },
      include: {
        chapter: {
          include: { book: { select: { userId: true, id: true } } },
        },
      },
    });

    if (!topic || topic.chapter.book.userId !== userId) {
      throw new NotFoundException('Topic not found');
    }

    const learnedChanged = dto.learned !== undefined && dto.learned !== topic.learned;

    const updated = await this.prisma.studyTopic.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.learned !== undefined && {
          learned: dto.learned,
          learnedAt: dto.learned ? new Date() : null,
        }),
      },
    });

    if (learnedChanged) {
      await this.syncBookStatus(topic.chapter.book.id);
    }

    return updated;
  }

  async deleteTopic(userId: string, id: string) {
    const topic = await this.prisma.studyTopic.findFirst({
      where: { id },
      include: {
        chapter: {
          include: { book: { select: { userId: true } } },
        },
      },
    });

    if (!topic || topic.chapter.book.userId !== userId) {
      throw new NotFoundException('Topic not found');
    }

    await this.prisma.studyTopic.delete({ where: { id } });
  }

  async toggleTopicLearned(userId: string, id: string) {
    const topic = await this.prisma.studyTopic.findFirst({
      where: { id },
      include: {
        chapter: {
          include: { book: { select: { userId: true, id: true } } },
        },
      },
    });

    if (!topic || topic.chapter.book.userId !== userId) {
      throw new NotFoundException('Topic not found');
    }

    const newLearned = !topic.learned;

    const updated = await this.prisma.studyTopic.update({
      where: { id },
      data: {
        learned: newLearned,
        learnedAt: newLearned ? new Date() : null,
      },
    });

    await this.syncBookStatus(topic.chapter.book.id);

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------------

  async exportBookAsCsv(userId: string, id: string): Promise<string> {
    const book = await this.getBook(userId, id);

    const rows: string[] = [
      'Chapter,Topic,Learned,LearnedAt,Notes',
    ];

    for (const chapter of book.chapters) {
      for (const topic of chapter.topics) {
        const chapterTitle = `"${chapter.title.replace(/"/g, '""')}"`;
        const topicTitle = `"${topic.title.replace(/"/g, '""')}"`;
        const learned = topic.learned ? 'Yes' : 'No';
        const learnedAt = topic.learnedAt
          ? topic.learnedAt.toISOString().slice(0, 10)
          : '';
        const notes = topic.notes
          ? `"${topic.notes.replace(/"/g, '""')}"`
          : '';

        rows.push(`${chapterTitle},${topicTitle},${learned},${learnedAt},${notes}`);
      }
    }

    return rows.join('\r\n');
  }
}
