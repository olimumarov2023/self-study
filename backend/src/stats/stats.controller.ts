import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

import { StatsService } from './stats.service.js';
import {
  DayQuerySchema,
  WeekQuerySchema,
  MonthQuerySchema,
  ScoreTrendQuerySchema,
} from './dto/stats-query.dto.js';

import type {
  DayQueryDto,
  WeekQueryDto,
  MonthQueryDto,
  ScoreTrendQueryDto,
} from './dto/stats-query.dto.js';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('day')
  async day(
    @CurrentUser() userId: string,
    @Query(new ZodValidationPipe(DayQuerySchema)) query: DayQueryDto,
  ) {
    return this.statsService.getDayStats(userId, query.date);
  }

  @Get('week')
  async week(
    @CurrentUser() userId: string,
    @Query(new ZodValidationPipe(WeekQuerySchema)) query: WeekQueryDto,
  ) {
    return this.statsService.getWeekStats(userId, query.week);
  }

  @Get('month')
  async month(
    @CurrentUser() userId: string,
    @Query(new ZodValidationPipe(MonthQuerySchema)) query: MonthQueryDto,
  ) {
    return this.statsService.getMonthStats(userId, query.month);
  }

  @Get('category-progress')
  async categoryProgress(@CurrentUser() userId: string) {
    return this.statsService.getCategoryProgress(userId);
  }

  @Get('score-trend')
  async scoreTrend(
    @CurrentUser() userId: string,
    @Query(new ZodValidationPipe(ScoreTrendQuerySchema)) query: ScoreTrendQueryDto,
  ) {
    return this.statsService.getScoreTrend(
      userId,
      query.learningItemId,
      query.from,
      query.to,
    );
  }
}
