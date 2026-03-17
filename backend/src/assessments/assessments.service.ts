import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { AssessmentStatus, LearnStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import { AiService } from '../ai/ai.service.js';
import { SpacedRepetitionService } from '../spaced-repetition/spaced-repetition.service.js';

import type { GenerateAssessmentDto } from './dto/generate-assessment.dto.js';
import type { SubmitAssessmentDto } from './dto/submit-assessment.dto.js';

@Injectable()
export class AssessmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly spacedRepetitionService: SpacedRepetitionService,
  ) {}

  async generate(userId: string, dto: GenerateAssessmentDto) {
    const item = await this.prisma.learningItem.findFirst({
      where: { id: dto.learningItemId, userId },
    });

    if (!item) {
      throw new NotFoundException('Learning item not found');
    }

    let generatedPayload: unknown[];
    try {
      generatedPayload = await this.aiService.generateAssessment({
        mode: dto.mode.toLowerCase() as Parameters<AiService['generateAssessment']>[0]['mode'],
        itemName: item.title,
        itemDescription: item.description ?? undefined,
        difficulty: String(dto.difficulty),
        questionCount: dto.questionCount,
        promptComment: dto.promptComment,
      });
    } catch (error) {
      // Persist the assessment with FAILED status so the user can see what happened
      await this.prisma.assessment.create({
        data: {
          userId,
          learningItemId: dto.learningItemId,
          mode: dto.mode,
          difficulty: dto.difficulty,
          questionCount: dto.questionCount,
          promptComment: dto.promptComment,
          generatedPayload: [],
          status: AssessmentStatus.FAILED,
        },
      });
      throw error instanceof InternalServerErrorException
        ? error
        : new InternalServerErrorException('AI generation failed');
    }

    return this.prisma.assessment.create({
      data: {
        userId,
        learningItemId: dto.learningItemId,
        mode: dto.mode,
        difficulty: dto.difficulty,
        questionCount: dto.questionCount,
        promptComment: dto.promptComment,
        generatedPayload: generatedPayload as object[],
        status: AssessmentStatus.READY,
      },
    });
  }

  async submit(userId: string, assessmentId: string, dto: SubmitAssessmentDto) {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, userId },
      include: { learningItem: true },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    if (assessment.status === AssessmentStatus.EVALUATED) {
      throw new ConflictException('Assessment has already been evaluated');
    }

    const evaluation = await this.aiService.evaluateAnswers({
      mode: assessment.mode.toLowerCase() as Parameters<AiService['evaluateAnswers']>[0]['mode'],
      itemName: assessment.learningItem.title,
      questions: assessment.generatedPayload as unknown[],
      answers: Object.values(dto.answers) as unknown[],
    });

    const assessmentRun = await this.prisma.$transaction(async (tx) => {
      const run = await tx.assessmentRun.create({
        data: {
          assessmentId,
          userId,
          answers: dto.answers as object,
          score: evaluation.score,
          strengths: evaluation.strengths,
          gaps: evaluation.gaps,
          recommendations: evaluation.recommendations,
          evaluationRaw: evaluation as unknown as object,
        },
      });

      await tx.assessment.update({
        where: { id: assessmentId },
        data: { status: AssessmentStatus.EVALUATED },
      });

      if (evaluation.score < 70) {
        const categoryId = assessment.learningItem.categoryId;
        await Promise.all(
          evaluation.gaps.map((gap) =>
            tx.learningItem.create({
              data: {
                userId,
                title: `[Review] ${gap}`,
                categoryId: categoryId ?? undefined,
                status: LearnStatus.NEEDS_REVISION,
              },
            }),
          ),
        );
      }

      return run;
    });

    await this.spacedRepetitionService.upsertFromAssessment(
      userId,
      assessment.learningItemId,
      assessmentRun.id,
      evaluation.score,
    );

    return assessmentRun;
  }

  async getResults(userId: string, assessmentId: string) {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, userId },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    const run = await this.prisma.assessmentRun.findFirst({
      where: { assessmentId, userId },
      orderBy: { completedAt: 'desc' },
    });

    if (!run) {
      throw new NotFoundException('No assessment run found for this assessment');
    }

    return run;
  }

  async getHistory(userId: string, learningItemId?: string) {
    return this.prisma.assessment.findMany({
      where: {
        userId,
        ...(learningItemId ? { learningItemId } : {}),
      },
      include: { runs: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
