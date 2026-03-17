import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module.js';
import { SpacedRepetitionModule } from '../spaced-repetition/spaced-repetition.module.js';

import { AssessmentsController } from './assessments.controller.js';
import { AssessmentsService } from './assessments.service.js';

@Module({
  imports: [AiModule, SpacedRepetitionModule],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
