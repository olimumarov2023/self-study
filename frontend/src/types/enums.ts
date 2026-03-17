export const PlanLevel = {
  BACKLOG: 'BACKLOG',
  MONTHLY: 'MONTHLY',
  WEEKLY: 'WEEKLY',
  DAILY: 'DAILY',
} as const;
export type PlanLevel = (typeof PlanLevel)[keyof typeof PlanLevel];

export const LearnStatus = {
  TO_LEARN: 'TO_LEARN',
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  LEARNED: 'LEARNED',
  NEEDS_REVISION: 'NEEDS_REVISION',
  ARCHIVED: 'ARCHIVED',
} as const;
export type LearnStatus = (typeof LearnStatus)[keyof typeof LearnStatus];

export const Priority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export const AssessmentMode = {
  QUIZ: 'QUIZ',
  QA: 'QA',
  TASK: 'TASK',
  FLASHCARD: 'FLASHCARD',
  TEACH_BACK: 'TEACH_BACK',
  BUG_ANALYSIS: 'BUG_ANALYSIS',
} as const;
export type AssessmentMode = (typeof AssessmentMode)[keyof typeof AssessmentMode];

export const ResourceType = {
  BOOK: 'BOOK',
  VIDEO: 'VIDEO',
  ARTICLE: 'ARTICLE',
  LINK: 'LINK',
} as const;
export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];

export const RoleSkillStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;
export type RoleSkillStatus = (typeof RoleSkillStatus)[keyof typeof RoleSkillStatus];

export const ReminderType = {
  SPACED_REVIEW: 'SPACED_REVIEW',
  DAILY_PLAN: 'DAILY_PLAN',
  STUDY_STREAK: 'STUDY_STREAK',
  CUSTOM: 'CUSTOM',
} as const;
export type ReminderType = (typeof ReminderType)[keyof typeof ReminderType];
