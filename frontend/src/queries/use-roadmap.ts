import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { roadmapApi } from '@/api/roadmap.api';

import type { RoadmapArea, RoadmapSkill, SkillStatus } from '@/types/roadmap.types';

export const roadmapKeys = {
  all: ['roadmap'] as const,
  progress: () => [...roadmapKeys.all, 'progress'] as const,
};

export function useRoadmap() {
  return useQuery({
    queryKey: roadmapKeys.all,
    queryFn: () => roadmapApi.getRoadmap(),
  });
}

export function useRoadmapProgress() {
  return useQuery({
    queryKey: roadmapKeys.progress(),
    queryFn: () => roadmapApi.getProgress(),
  });
}

export function useUpdateSkillStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SkillStatus }) =>
      roadmapApi.updateSkillStatus(id, status),

    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: roadmapKeys.all });

      const previousAreas = queryClient.getQueryData<RoadmapArea[]>(roadmapKeys.all);

      if (previousAreas) {
        queryClient.setQueryData<RoadmapArea[]>(roadmapKeys.all, (areas) =>
          (areas ?? []).map((area) => ({
            ...area,
            skills: area.skills.map((skill) =>
              skill.id === id ? { ...skill, status } : skill
            ),
          }))
        );
      }

      return { previousAreas };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousAreas) {
        queryClient.setQueryData<RoadmapArea[]>(roadmapKeys.all, context.previousAreas);
      }
    },

    onSuccess: (updatedSkill: RoadmapSkill) => {
      // Reconcile with server value after optimistic update
      queryClient.setQueryData<RoadmapArea[]>(roadmapKeys.all, (areas) =>
        (areas ?? []).map((area) => ({
          ...area,
          skills: area.skills.map((skill) =>
            skill.id === updatedSkill.id ? { ...skill, status: updatedSkill.status } : skill
          ),
        }))
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: roadmapKeys.progress() });
    },
  });
}
