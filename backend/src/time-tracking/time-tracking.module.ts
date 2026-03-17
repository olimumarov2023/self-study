import { Module } from '@nestjs/common';

import { TimeTrackingController } from './time-tracking.controller.js';
import { TimeTrackingService } from './time-tracking.service.js';

@Module({
  controllers: [TimeTrackingController],
  providers: [TimeTrackingService],
  exports: [TimeTrackingService],
})
export class TimeTrackingModule {}
