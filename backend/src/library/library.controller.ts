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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ResourceType, ResourceStatus } from '@prisma/client';

import { JwtAuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

import { LibraryService } from './library.service.js';
import { CreateResourceSchema } from './dto/create-resource.dto.js';
import { UpdateResourceSchema } from './dto/update-resource.dto.js';
import { CreateSessionSchema } from './dto/create-session.dto.js';

import type { CreateResourceDto } from './dto/create-resource.dto.js';
import type { UpdateResourceDto } from './dto/update-resource.dto.js';
import type { CreateSessionDto } from './dto/create-session.dto.js';

@Controller('library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get()
  async listResources(
    @CurrentUser() userId: string,
    @Query('type') type?: ResourceType,
    @Query('status') status?: ResourceStatus,
  ) {
    return this.libraryService.listResources(userId, { type, status });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createResource(
    @CurrentUser() userId: string,
    @Body(new ZodValidationPipe(CreateResourceSchema)) dto: CreateResourceDto,
  ) {
    return this.libraryService.createResource(userId, dto);
  }

  @Get(':id')
  async getResource(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ) {
    return this.libraryService.getResource(userId, id);
  }

  @Patch(':id')
  async updateResource(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateResourceSchema)) dto: UpdateResourceDto,
  ) {
    return this.libraryService.updateResource(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteResource(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ) {
    await this.libraryService.deleteResource(userId, id);
  }

  @Get(':id/sessions')
  async listSessions(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ) {
    return this.libraryService.listSessions(userId, id);
  }

  @Post(':id/sessions')
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateSessionSchema)) dto: CreateSessionDto,
  ) {
    return this.libraryService.createSession(userId, id, dto);
  }
}
