export type StudyBookStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';

export interface StudyBook {
  id: string;
  title: string;
  author?: string;
  description?: string;
  status: StudyBookStatus;
  totalChapters: number;
  completedChapters: number;
  totalTopics: number;
  learnedTopics: number;
  progressPercent: number;
  chapters?: StudyChapter[];
  createdAt: string;
  updatedAt: string;
}

export interface StudyChapter {
  id: string;
  bookId: string;
  title: string;
  sortOrder: number;
  topics: StudyTopic[];
  createdAt: string;
  updatedAt: string;
}

export interface StudyTopic {
  id: string;
  chapterId: string;
  title: string;
  notes?: string;
  learned: boolean;
  learnedAt?: string;
  sortOrder: number;
  createdAt: string;
}

export interface CreateBookPayload {
  title: string;
  author?: string;
  description?: string;
}

export interface UpdateBookPayload {
  title?: string;
  author?: string;
  description?: string;
  status?: StudyBookStatus;
}

export interface CreateChapterPayload {
  title: string;
  sortOrder?: number;
}

export interface UpdateChapterPayload {
  title?: string;
  sortOrder?: number;
}

export interface CreateTopicPayload {
  title: string;
  notes?: string;
  sortOrder?: number;
}

export interface UpdateTopicPayload {
  title?: string;
  notes?: string;
}
