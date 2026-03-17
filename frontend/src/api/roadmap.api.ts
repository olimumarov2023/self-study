import { apiClient } from './client';

import type { RoadmapArea, RoadmapProgress, RoadmapSkill, SkillStatus } from '@/types/roadmap.types';

export const roadmapApi = {
  getRoadmap: () =>
    apiClient
      .get<RoadmapArea[]>('/roadmap')
      .then((r) => r.data),

  getProgress: () =>
    apiClient
      .get<RoadmapProgress>('/roadmap/progress')
      .then((r) => r.data),

  updateSkillStatus: (id: string, status: SkillStatus) =>
    apiClient
      .patch<RoadmapSkill>(`/roadmap/skills/${id}`, { status })
      .then((r) => r.data),
};
