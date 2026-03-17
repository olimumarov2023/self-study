import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/auth.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

import { RoadmapService } from './roadmap.service.js';
import { UpdateSkillSchema } from './dto/update-skill.dto.js';

import type { UpdateSkillDto } from './dto/update-skill.dto.js';

@Controller('roadmap')
@UseGuards(JwtAuthGuard)
export class RoadmapController {
  constructor(private readonly roadmapService: RoadmapService) {}

  @Get()
  async getFullRoadmap() {
    return this.roadmapService.getFullRoadmap();
  }

  @Get('progress')
  async getProgress() {
    return this.roadmapService.getProgress();
  }

  @Patch('skills/:id')
  async updateSkillStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSkillSchema)) dto: UpdateSkillDto,
  ) {
    return this.roadmapService.updateSkillStatus(id, dto.status);
  }
}
