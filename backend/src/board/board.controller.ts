import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

import { BoardService } from './board.service.js';
import { DragSchema } from './dto/drag.dto.js';

import type { DragDto } from './dto/drag.dto.js';

@Controller('board')
@UseGuards(JwtAuthGuard)
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Get('today')
  async getToday(@CurrentUser() userId: string) {
    return this.boardService.getToday(userId);
  }

  @Get('date/:yyyyMMdd')
  async getByDate(
    @CurrentUser() userId: string,
    @Param('yyyyMMdd') date: string,
  ) {
    return this.boardService.getByDate(userId, date);
  }

  @Get('week')
  async getWeek(@CurrentUser() userId: string) {
    return this.boardService.getWeek(userId);
  }

  @Patch('drag')
  async drag(
    @CurrentUser() userId: string,
    @Body(new ZodValidationPipe(DragSchema)) dto: DragDto,
  ) {
    return this.boardService.drag(userId, dto);
  }
}
