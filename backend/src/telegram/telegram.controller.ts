import { Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

import { TelegramService } from './telegram.service.js';

@Controller('telegram')
@UseGuards(JwtAuthGuard)
export class TelegramController {
  constructor(private readonly telegram: TelegramService) {}

  @Get('status')
  async getStatus(@CurrentUser() userId: string) {
    return this.telegram.getLinkStatus(userId);
  }

  @Post('link-token')
  async createLinkToken(@CurrentUser() userId: string) {
    if (!this.telegram.isEnabled()) {
      return {
        token: null,
        botUsername: null,
        deepLink: null,
        enabled: false,
      };
    }
    const token = await this.telegram.createLinkToken(userId);
    const botUsername = this.telegram.getBotUsername();
    return {
      token,
      botUsername,
      deepLink: botUsername
        ? `https://t.me/${botUsername}?start=${token}`
        : null,
      enabled: true,
    };
  }

  @Delete('link')
  async unlink(@CurrentUser() userId: string) {
    await this.telegram.unlink(userId);
    return { success: true };
  }
}
