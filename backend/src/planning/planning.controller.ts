import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

import { PlanningService } from './planning.service.js';
import { AssignSchema } from './dto/assign.dto.js';
import { ReorderSchema } from './dto/reorder.dto.js';
import { AutoDistributeSchema } from './dto/auto-distribute.dto.js';

import type { AssignDto } from './dto/assign.dto.js';
import type { ReorderDto } from './dto/reorder.dto.js';
import type { AutoDistributeDto } from './dto/auto-distribute.dto.js';

@Controller('planning')
@UseGuards(JwtAuthGuard)
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Post('assign')
  async assign(
    @CurrentUser() userId: string,
    @Body(new ZodValidationPipe(AssignSchema)) dto: AssignDto,
  ) {
    return this.planningService.assign(userId, dto);
  }

  @Get('month/:yyyyMM')
  async getMonth(
    @CurrentUser() userId: string,
    @Param('yyyyMM') yyyyMM: string,
  ) {
    return this.planningService.findByPeriod(userId, 'MONTHLY', yyyyMM);
  }

  @Get('week/:yyyyWww')
  async getWeek(
    @CurrentUser() userId: string,
    @Param('yyyyWww') yyyyWww: string,
  ) {
    return this.planningService.findByPeriod(userId, 'WEEKLY', yyyyWww);
  }

  @Get('day/:yyyyMMdd')
  async getDay(
    @CurrentUser() userId: string,
    @Param('yyyyMMdd') yyyyMMdd: string,
  ) {
    return this.planningService.findByPeriod(userId, 'DAILY', yyyyMMdd);
  }

  @Patch('reorder')
  async reorder(
    @CurrentUser() userId: string,
    @Body(new ZodValidationPipe(ReorderSchema)) dto: ReorderDto,
  ) {
    return this.planningService.reorder(userId, dto);
  }

  @Post('auto-distribute')
  async autoDistribute(
    @CurrentUser() userId: string,
    @Body(new ZodValidationPipe(AutoDistributeSchema)) dto: AutoDistributeDto,
  ) {
    return this.planningService.autoDistribute(userId, dto);
  }
}
