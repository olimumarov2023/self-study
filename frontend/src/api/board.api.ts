import { apiClient } from './client';

import type { BoardResponse, DragPayload } from '@/types/board.types';
import type { LearningItem } from '@/types/learning-item.types';

export const boardApi = {
  getToday: () =>
    apiClient.get<BoardResponse>('/board/today').then((r) => r.data),

  getWeek: () =>
    apiClient.get<BoardResponse>('/board/week').then((r) => r.data),

  drag: (data: DragPayload) =>
    apiClient.patch<LearningItem>('/board/drag', data).then((r) => r.data),
};
