import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import { JwtAuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

import { StudyTrackerService } from './study-tracker.service.js';
import { CreateBookSchema } from './dto/create-book.dto.js';
import { UpdateBookSchema } from './dto/update-book.dto.js';
import { CreateChapterSchema } from './dto/create-chapter.dto.js';
import { UpdateChapterSchema } from './dto/update-chapter.dto.js';
import { CreateTopicSchema } from './dto/create-topic.dto.js';
import { UpdateTopicSchema } from './dto/update-topic.dto.js';

import type { CreateBookDto } from './dto/create-book.dto.js';
import type { UpdateBookDto } from './dto/update-book.dto.js';
import type { CreateChapterDto } from './dto/create-chapter.dto.js';
import type { UpdateChapterDto } from './dto/update-chapter.dto.js';
import type { CreateTopicDto } from './dto/create-topic.dto.js';
import type { UpdateTopicDto } from './dto/update-topic.dto.js';

@Controller('study-tracker')
@UseGuards(JwtAuthGuard)
export class StudyTrackerController {
  constructor(private readonly studyTrackerService: StudyTrackerService) {}

  // ---------------------------------------------------------------------------
  // Books
  // ---------------------------------------------------------------------------

  @Get()
  async listBooks(@CurrentUser() userId: string) {
    return this.studyTrackerService.listBooks(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBook(
    @CurrentUser() userId: string,
    @Body(new ZodValidationPipe(CreateBookSchema)) dto: CreateBookDto,
  ) {
    return this.studyTrackerService.createBook(userId, dto);
  }

  @Get(':id')
  async getBook(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ) {
    return this.studyTrackerService.getBook(userId, id);
  }

  @Patch(':id')
  async updateBook(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateBookSchema)) dto: UpdateBookDto,
  ) {
    return this.studyTrackerService.updateBook(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBook(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ) {
    await this.studyTrackerService.deleteBook(userId, id);
  }

  // ---------------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------------

  @Get(':id/export')
  async exportBook(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const book = await this.studyTrackerService.getBook(userId, id);
    const csv = await this.studyTrackerService.exportBookAsCsv(userId, id);

    const filename = `${book.title.replace(/[^a-z0-9]/gi, '_')}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.send(csv);
  }

  // ---------------------------------------------------------------------------
  // Chapters
  // ---------------------------------------------------------------------------

  @Post(':bookId/chapters')
  @HttpCode(HttpStatus.CREATED)
  async createChapter(
    @CurrentUser() userId: string,
    @Param('bookId') bookId: string,
    @Body(new ZodValidationPipe(CreateChapterSchema)) dto: CreateChapterDto,
  ) {
    return this.studyTrackerService.createChapter(userId, bookId, dto);
  }

  @Patch('chapters/:id')
  async updateChapter(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateChapterSchema)) dto: UpdateChapterDto,
  ) {
    return this.studyTrackerService.updateChapter(userId, id, dto);
  }

  @Delete('chapters/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteChapter(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ) {
    await this.studyTrackerService.deleteChapter(userId, id);
  }

  // ---------------------------------------------------------------------------
  // Topics
  // ---------------------------------------------------------------------------

  @Post('chapters/:chapterId/topics')
  @HttpCode(HttpStatus.CREATED)
  async createTopic(
    @CurrentUser() userId: string,
    @Param('chapterId') chapterId: string,
    @Body(new ZodValidationPipe(CreateTopicSchema)) dto: CreateTopicDto,
  ) {
    return this.studyTrackerService.createTopic(userId, chapterId, dto);
  }

  @Patch('topics/:id')
  async updateTopic(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateTopicSchema)) dto: UpdateTopicDto,
  ) {
    return this.studyTrackerService.updateTopic(userId, id, dto);
  }

  @Delete('topics/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTopic(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ) {
    await this.studyTrackerService.deleteTopic(userId, id);
  }

  @Patch('topics/:id/toggle-learned')
  async toggleTopicLearned(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ) {
    return this.studyTrackerService.toggleTopicLearned(userId, id);
  }
}
