import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

import { SpacedRepetitionService } from './spaced-repetition.service.js';
import { RecordReviewSchema } from './dto/record-review.dto.js';

import type { RecordReviewDto } from './dto/record-review.dto.js';

@Controller('spaced-repetition')
@UseGuards(JwtAuthGuard)
export class SpacedRepetitionController {
  constructor(
    private readonly spacedRepetitionService: SpacedRepetitionService,
  ) {}

  @Get('due')
  async getDueItems(@CurrentUser() userId: string) {
    return this.spacedRepetitionService.getDueItems(userId);
  }

  @Get('schedule')
  async getSchedule(@CurrentUser() userId: string) {
    return this.spacedRepetitionService.getSchedule(userId);
  }

  @Post('review')
  async recordManualReview(
    @CurrentUser() userId: string,
    @Body(new ZodValidationPipe(RecordReviewSchema)) dto: RecordReviewDto,
  ) {
    return this.spacedRepetitionService.recordManualReview(
      userId,
      dto.learningItemId,
      dto.quality,
    );
  }
}
