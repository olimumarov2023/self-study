import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

import { TimeTrackingService } from './time-tracking.service.js';
import { StartSessionSchema } from './dto/start-session.dto.js';
import { StopSessionSchema } from './dto/stop-session.dto.js';
import { ManualSessionSchema } from './dto/manual-session.dto.js';
import { QuerySessionsSchema } from './dto/query-sessions.dto.js';

import type { StartSessionDto } from './dto/start-session.dto.js';
import type { StopSessionDto } from './dto/stop-session.dto.js';
import type { ManualSessionDto } from './dto/manual-session.dto.js';
import type { QuerySessionsDto } from './dto/query-sessions.dto.js';

@Controller('time/sessions')
@UseGuards(JwtAuthGuard)
export class TimeTrackingController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  @Post('start')
  @UsePipes(new ZodValidationPipe(StartSessionSchema))
  async start(
    @CurrentUser() userId: string,
    @Body() dto: StartSessionDto,
  ) {
    return this.timeTrackingService.startSession(userId, dto);
  }

  @Post(':id/stop')
  @HttpCode(HttpStatus.OK)
  async stop(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(StopSessionSchema)) dto: StopSessionDto,
  ) {
    return this.timeTrackingService.stopSession(userId, id, dto);
  }

  @Post('manual')
  @UsePipes(new ZodValidationPipe(ManualSessionSchema))
  async manual(
    @CurrentUser() userId: string,
    @Body() dto: ManualSessionDto,
  ) {
    return this.timeTrackingService.createManualSession(userId, dto);
  }

  @Get()
  async findAll(
    @CurrentUser() userId: string,
    @Query(new ZodValidationPipe(QuerySessionsSchema)) query: QuerySessionsDto,
  ) {
    return this.timeTrackingService.findSessions(userId, query);
  }

  @Get('active')
  async findActive(@CurrentUser() userId: string) {
    return this.timeTrackingService.findActiveSession(userId);
  }
}
