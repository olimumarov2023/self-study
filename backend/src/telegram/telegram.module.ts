import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module.js';
import { BoardModule } from '../board/board.module.js';

import { TelegramController } from './telegram.controller.js';
import { TelegramService } from './telegram.service.js';
import { TelegramScheduler } from './telegram.scheduler.js';

@Module({
  imports: [PrismaModule, BoardModule],
  controllers: [TelegramController],
  providers: [TelegramService, TelegramScheduler],
  exports: [TelegramService],
})
export class TelegramModule {}
