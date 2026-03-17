import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module.js';

import { RemindersController } from './reminders.controller.js';
import { RemindersService } from './reminders.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [RemindersController],
  providers: [RemindersService],
})
export class RemindersModule {}
