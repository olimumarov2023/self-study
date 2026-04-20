import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CategoryModule } from './category/category.module.js';
import { LearningItemModule } from './learning-item/learning-item.module.js';
import { PlanningModule } from './planning/planning.module.js';
import { BoardModule } from './board/board.module.js';
import { TimeTrackingModule } from './time-tracking/time-tracking.module.js';
import { StatsModule } from './stats/stats.module.js';
import { AiModule } from './ai/ai.module.js';
import { AssessmentsModule } from './assessments/assessments.module.js';
import { SpacedRepetitionModule } from './spaced-repetition/spaced-repetition.module.js';
import { RoadmapModule } from './roadmap/roadmap.module.js';
import { RemindersModule } from './reminders/reminders.module.js';
import { LibraryModule } from './library/library.module.js';
import { StudyTrackerModule } from './study-tracker/study-tracker.module.js';
import { TelegramModule } from './telegram/telegram.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    CategoryModule,
    LearningItemModule,
    PlanningModule,
    BoardModule,
    TimeTrackingModule,
    StatsModule,
    AiModule,
    AssessmentsModule,
    SpacedRepetitionModule,
    RoadmapModule,
    RemindersModule,
    LibraryModule,
    StudyTrackerModule,
    TelegramModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
