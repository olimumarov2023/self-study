import type { LearnStatus } from '@prisma/client';

export const TASHKENT_OFFSET_HOURS = 5;

/** The three statuses exposed in the Telegram bot. */
export type TelegramActionStatus = Extract<
  LearnStatus,
  'TO_LEARN' | 'IN_PROGRESS' | 'LEARNED'
>;

/** Collapses all board statuses into one of the three bot-facing buckets. */
export function toBotStatus(status: LearnStatus): TelegramActionStatus {
  if (status === 'IN_PROGRESS') return 'IN_PROGRESS';
  if (status === 'LEARNED') return 'LEARNED';
  return 'TO_LEARN';
}

export const STATUS_EMOJI: Record<TelegramActionStatus, string> = {
  TO_LEARN: '📝',
  IN_PROGRESS: '▶️',
  LEARNED: '✅',
};

export const STATUS_LABELS: Record<TelegramActionStatus, string> = {
  TO_LEARN: 'TODO',
  IN_PROGRESS: 'In Progress',
  LEARNED: 'Done',
};

export const CALLBACK_PREFIX = 'stat';
