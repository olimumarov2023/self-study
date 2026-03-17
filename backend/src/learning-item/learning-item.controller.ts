import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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

import { LearningItemService } from './learning-item.service.js';
import { CreateLearningItemSchema } from './dto/create-learning-item.dto.js';
import { UpdateLearningItemSchema } from './dto/update-learning-item.dto.js';
import { QueryLearningItemsSchema } from './dto/query-learning-items.dto.js';
import { MoveStatusSchema } from './dto/move-status.dto.js';

import type { CreateLearningItemDto } from './dto/create-learning-item.dto.js';
import type { UpdateLearningItemDto } from './dto/update-learning-item.dto.js';
import type { QueryLearningItemsDto } from './dto/query-learning-items.dto.js';
import type { MoveStatusDto } from './dto/move-status.dto.js';

@Controller('learning-items')
@UseGuards(JwtAuthGuard)
export class LearningItemController {
  constructor(private readonly learningItemService: LearningItemService) {}

  @Get()
  async findAll(
    @CurrentUser() userId: string,
    @Query(new ZodValidationPipe(QueryLearningItemsSchema))
    query: QueryLearningItemsDto,
  ) {
    return this.learningItemService.findAll(userId, query);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(CreateLearningItemSchema))
  async create(
    @CurrentUser() userId: string,
    @Body() dto: CreateLearningItemDto,
  ) {
    return this.learningItemService.create(userId, dto);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ) {
    return this.learningItemService.findOne(userId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateLearningItemSchema)) dto: UpdateLearningItemDto,
  ) {
    return this.learningItemService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ) {
    await this.learningItemService.remove(userId, id);
  }

  @Post(':id/move-status')
  async moveStatus(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(MoveStatusSchema)) dto: MoveStatusDto,
  ) {
    return this.learningItemService.moveStatus(userId, id, dto);
  }
}
