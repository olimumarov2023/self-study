import { Module } from '@nestjs/common';

import { StudyTrackerController } from './study-tracker.controller.js';
import { StudyTrackerService } from './study-tracker.service.js';

@Module({
  controllers: [StudyTrackerController],
  providers: [StudyTrackerService],
  exports: [StudyTrackerService],
})
export class StudyTrackerModule {}
