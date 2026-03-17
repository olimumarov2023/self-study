import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

import { CategoryService } from './category.service.js';
import { CreateCategorySchema } from './dto/create-category.dto.js';
import { UpdateCategorySchema } from './dto/update-category.dto.js';

import type { CreateCategoryDto } from './dto/create-category.dto.js';
import type { UpdateCategoryDto } from './dto/update-category.dto.js';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async findAll(@CurrentUser() userId: string) {
    return this.categoryService.findAll(userId);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(CreateCategorySchema))
  async create(
    @CurrentUser() userId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoryService.create(userId, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCategorySchema)) dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ) {
    await this.categoryService.remove(userId, id);
  }
}
