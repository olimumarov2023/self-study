import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module.js';

import { PlanningController } from './planning.controller.js';
import { PlanningService } from './planning.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [PlanningController],
  providers: [PlanningService],
  exports: [PlanningService],
})
export class PlanningModule {}
