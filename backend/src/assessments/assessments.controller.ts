import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

import { AssessmentsService } from './assessments.service.js';
import { GenerateAssessmentSchema } from './dto/generate-assessment.dto.js';
import { SubmitAssessmentSchema } from './dto/submit-assessment.dto.js';

import type { GenerateAssessmentDto } from './dto/generate-assessment.dto.js';
import type { SubmitAssessmentDto } from './dto/submit-assessment.dto.js';

@Controller('assessments')
@UseGuards(JwtAuthGuard)
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generate(
    @CurrentUser() userId: string,
    @Body(new ZodValidationPipe(GenerateAssessmentSchema)) dto: GenerateAssessmentDto,
  ) {
    return this.assessmentsService.generate(userId, dto);
  }

  @Post(':id/submit')
  async submit(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SubmitAssessmentSchema)) dto: SubmitAssessmentDto,
  ) {
    return this.assessmentsService.submit(userId, id, dto);
  }

  @Get('history')
  async getHistory(
    @CurrentUser() userId: string,
    @Query('learningItemId') learningItemId?: string,
  ) {
    return this.assessmentsService.getHistory(userId, learningItemId);
  }

  @Get(':id/results')
  async getResults(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ) {
    return this.assessmentsService.getResults(userId, id);
  }
}
