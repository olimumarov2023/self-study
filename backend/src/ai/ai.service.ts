import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

import { buildQuizPrompt } from './prompts/quiz.prompt.js';
import { buildQaPrompt } from './prompts/qa.prompt.js';
import { buildFlashcardPrompt } from './prompts/flashcard.prompt.js';
import { buildTaskPrompt } from './prompts/task.prompt.js';
import { buildBugAnalysisPrompt } from './prompts/bug-analysis.prompt.js';
import { buildTeachBackPrompt } from './prompts/teach-back.prompt.js';

const MODEL = 'claude-sonnet-4-5-20250514';

export type AssessmentMode =
  | 'quiz'
  | 'qa'
  | 'flashcard'
  | 'task'
  | 'bug_analysis'
  | 'teach_back';

export interface GenerateParams {
  mode: AssessmentMode;
  itemName: string;
  itemDescription?: string;
  difficulty: string;
  questionCount: number;
  promptComment?: string;
}

export interface EvaluateParams {
  mode: AssessmentMode;
  itemName: string;
  questions: unknown[];
  answers: unknown[];
}

export interface EvaluationResult {
  score: number;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

@Injectable()
export class AiService {
  private readonly client: Anthropic;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    this.client = new Anthropic({ apiKey });
  }

  async generateAssessment(params: GenerateParams): Promise<unknown[]> {
    const prompt = this.buildGenerationPrompt(params);

    let rawText: string;
    try {
      const message = await this.client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      const firstContent = message.content[0];
      if (!firstContent || firstContent.type !== 'text') {
        throw new InternalServerErrorException(
          'Unexpected response type from AI model',
        );
      }
      rawText = firstContent.text;
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      const msg = (error as Error).message ?? '';
      if (msg.includes('credit balance') || msg.includes('billing')) {
        throw new BadRequestException(
          'AI service unavailable: Anthropic API credits are exhausted. Please add credits to your Anthropic account.',
        );
      }
      throw new InternalServerErrorException(
        `AI generation failed: ${msg}`,
      );
    }

    return this.parseJsonArray(rawText);
  }

  async evaluateAnswers(params: EvaluateParams): Promise<EvaluationResult> {
    const prompt = this.buildEvaluationPrompt(params);

    let rawText: string;
    try {
      const message = await this.client.messages.create({
        model: MODEL,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      const firstContent = message.content[0];
      if (!firstContent || firstContent.type !== 'text') {
        throw new InternalServerErrorException(
          'Unexpected response type from AI model',
        );
      }
      rawText = firstContent.text;
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      const msg = (error as Error).message ?? '';
      if (msg.includes('credit balance') || msg.includes('billing')) {
        throw new BadRequestException(
          'AI service unavailable: Anthropic API credits are exhausted. Please add credits to your Anthropic account.',
        );
      }
      throw new InternalServerErrorException(
        `AI evaluation failed: ${msg}`,
      );
    }

    return this.parseEvaluationResult(rawText);
  }

  private buildGenerationPrompt(params: GenerateParams): string {
    const { mode, itemName, itemDescription, difficulty, questionCount, promptComment } =
      params;

    switch (mode) {
      case 'quiz':
        return buildQuizPrompt(itemName, itemDescription, difficulty, questionCount, promptComment);
      case 'qa':
        return buildQaPrompt(itemName, itemDescription, difficulty, questionCount, promptComment);
      case 'flashcard':
        return buildFlashcardPrompt(itemName, itemDescription, difficulty, questionCount, promptComment);
      case 'task':
        return buildTaskPrompt(itemName, itemDescription, difficulty, questionCount, promptComment);
      case 'bug_analysis':
        return buildBugAnalysisPrompt(itemName, itemDescription, difficulty, questionCount, promptComment);
      case 'teach_back':
        return buildTeachBackPrompt(itemName, itemDescription, difficulty, questionCount, promptComment);
      default: {
        const exhaustiveCheck: never = mode;
        throw new InternalServerErrorException(
          `Unknown assessment mode: ${String(exhaustiveCheck)}`,
        );
      }
    }
  }

  private buildEvaluationPrompt(params: EvaluateParams): string {
    const { mode, itemName, questions, answers } = params;

    const questionsJson = JSON.stringify(questions, null, 2);
    const answersJson = JSON.stringify(answers, null, 2);

    return `You are an expert educator evaluating a learner's responses on "${itemName}".

Assessment mode: ${mode}

Questions / Tasks presented to the learner:
${questionsJson}

Learner's answers:
${answersJson}

Evaluate the learner's responses holistically.

Respond with ONLY a valid JSON object. No markdown, no explanation, no code fences.
Use this exact structure:
{
  "score": 75,
  "strengths": ["Strength 1", "Strength 2"],
  "gaps": ["Gap 1", "Gap 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}

Rules:
- score is an integer from 0 to 100 representing overall performance
- strengths: 2-4 specific things the learner demonstrated well
- gaps: 2-4 specific concepts or skills the learner needs to improve
- recommendations: 2-4 actionable next steps to improve understanding
- Be specific and constructive, referencing the actual content where possible`;
  }

  private parseJsonArray(raw: string): unknown[] {
    const cleaned = this.stripCodeFences(raw);

    try {
      const parsed: unknown = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) {
        throw new InternalServerErrorException(
          'AI response was not a JSON array',
        );
      }
      return parsed;
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      throw new InternalServerErrorException(
        `Failed to parse AI response as JSON array: ${(error as Error).message}`,
      );
    }
  }

  private parseEvaluationResult(raw: string): EvaluationResult {
    const cleaned = this.stripCodeFences(raw);

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to parse AI evaluation response as JSON: ${(error as Error).message}`,
      );
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>)['score'] !== 'number' ||
      !Array.isArray((parsed as Record<string, unknown>)['strengths']) ||
      !Array.isArray((parsed as Record<string, unknown>)['gaps']) ||
      !Array.isArray((parsed as Record<string, unknown>)['recommendations'])
    ) {
      throw new InternalServerErrorException(
        'AI evaluation response does not match expected schema',
      );
    }

    const result = parsed as Record<string, unknown>;
    return {
      score: result['score'] as number,
      strengths: result['strengths'] as string[],
      gaps: result['gaps'] as string[],
      recommendations: result['recommendations'] as string[],
    };
  }

  private stripCodeFences(text: string): string {
    // Remove ```json ... ``` or ``` ... ``` wrappers
    return text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }
}
