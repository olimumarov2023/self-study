import { Module } from '@nestjs/common';

import { LearningItemController } from './learning-item.controller.js';
import { LearningItemService } from './learning-item.service.js';

@Module({
  controllers: [LearningItemController],
  providers: [LearningItemService],
  exports: [LearningItemService],
})
export class LearningItemModule {}
