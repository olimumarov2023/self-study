import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module.js';

import { BoardController } from './board.controller.js';
import { BoardService } from './board.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [BoardController],
  providers: [BoardService],
  exports: [BoardService],
})
export class BoardModule {}
