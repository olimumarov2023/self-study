export type ResourceType = 'BOOK' | 'VIDEO';
export type ResourceStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';

export interface LibraryResource {
  id: string;
  type: ResourceType;
  title: string;
  author?: string;
  url?: string;
  totalPages?: number;
  currentPage?: number;
  totalMinutes?: number;
  watchedMinutes?: number;
  status: ResourceStatus;
  categoryId?: string;
  notes?: string;
  progressPercent?: number;
  resumePosition?: string | null;
  sessionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceSession {
  id: string;
  resourceId: string;
  startPage?: number;
  endPage?: number;
  startMinute?: number;
  endMinute?: number;
  notes?: string;
  sessionDate: string;
  durationMin: number;
  createdAt: string;
}

export interface CreateResourcePayload {
  type: ResourceType;
  title: string;
  author?: string;
  url?: string;
  totalPages?: number;
  totalMinutes?: number;
  categoryId?: string;
  notes?: string;
}

export interface UpdateResourcePayload {
  title?: string;
  author?: string;
  url?: string;
  totalPages?: number;
  currentPage?: number;
  totalMinutes?: number;
  watchedMinutes?: number;
  status?: ResourceStatus;
  categoryId?: string;
  notes?: string;
}

export interface CreateSessionPayload {
  startPage?: number;
  endPage?: number;
  startMinute?: number;
  endMinute?: number;
  notes?: string;
  sessionDate?: string;
  durationMin?: number;
}
