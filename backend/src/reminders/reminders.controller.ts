import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

import { RemindersService } from './reminders.service.js';

@Controller('reminders')
@UseGuards(JwtAuthGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post('generate-daily')
  @HttpCode(HttpStatus.CREATED)
  async generateDailySummary(@CurrentUser() userId: string) {
    return this.remindersService.generateDailySummary(userId);
  }

  @Post('generate-spaced-rep')
  @HttpCode(HttpStatus.CREATED)
  async generateSpacedRepDueAlert(@CurrentUser() userId: string) {
    return this.remindersService.generateSpacedRepDueAlert(userId);
  }

  @Get()
  async listReminders(
    @CurrentUser() userId: string,
    @Query('unread') unread?: string,
  ) {
    const unreadOnly = unread === 'true';
    return this.remindersService.listReminders(userId, unreadOnly);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() userId: string) {
    const count = await this.remindersService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  async markRead(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ) {
    return this.remindersService.markRead(userId, id);
  }
}
