import type { LearnStatus } from '@prisma/client';

export const TASHKENT_OFFSET_HOURS = 5;

export type TelegramActionStatus = Extract<
  LearnStatus,
  'IN_PROGRESS' | 'LEARNED' | 'NEEDS_REVISION'
>;

export const STATUS_EMOJI: Record<LearnStatus, string> = {
  TO_LEARN: '⚪',
  PLANNED: '🟡',
  IN_PROGRESS: '🔵',
  LEARNED: '✅',
  NEEDS_REVISION: '🔁',
  ARCHIVED: '📦',
};

export const ACTION_LABELS: Record<TelegramActionStatus, string> = {
  IN_PROGRESS: '▶️ Start',
  LEARNED: '✅ Done',
  NEEDS_REVISION: '🔁 Review',
};

export const CALLBACK_PREFIX = 'stat';
