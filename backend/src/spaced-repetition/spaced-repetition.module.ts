import { Module } from '@nestjs/common';

import { SpacedRepetitionController } from './spaced-repetition.controller.js';
import { SpacedRepetitionService } from './spaced-repetition.service.js';

@Module({
  controllers: [SpacedRepetitionController],
  providers: [SpacedRepetitionService],
  exports: [SpacedRepetitionService],
})
export class SpacedRepetitionModule {}
