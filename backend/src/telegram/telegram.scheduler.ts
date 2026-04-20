import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { TelegramService } from './telegram.service.js';

@Injectable()
export class TelegramScheduler {
  private readonly logger = new Logger(TelegramScheduler.name);

  constructor(private readonly telegram: TelegramService) {}

  /**
   * Runs daily at 19:00 UTC, which is 00:00 in UTC+5 (Tashkent).
   */
  @Cron('0 19 * * *', { timeZone: 'UTC' })
  async sendDailyTodoDigest() {
    if (!this.telegram.isEnabled()) return;
    this.logger.log('Sending daily Telegram TODO digests…');
    await this.telegram.sendDailyDigestsToAllUsers();
  }
}
