import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { boardApi } from '@/api/board.api';
import { LearnStatus } from '@/types/enums';

import type { BoardResponse, BoardItem, DragPayload } from '@/types/board.types';

export const boardKeys = {
  all: ['board'] as const,
  today: () => [...boardKeys.all, 'today'] as const,
  week: () => [...boardKeys.all, 'week'] as const,
  date: (d: string) => [...boardKeys.all, 'date', d] as const,
};

export function useTodayBoard() {
  return useQuery({
    queryKey: boardKeys.today(),
    queryFn: boardApi.getToday,
  });
}

export function useDateBoard(date: string) {
  return useQuery({
    queryKey: boardKeys.date(date),
    queryFn: () => boardApi.getByDate(date),
    enabled: !!date,
  });
}

export function useWeekBoard() {
  return useQuery({
    queryKey: boardKeys.week(),
    queryFn: boardApi.getWeek,
  });
}

export function useDragItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DragPayload) => boardApi.drag(data),

    onMutate: async (data) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: boardKeys.all });

      // Snapshot the previous values for both today and week
      const previousToday = queryClient.getQueryData<BoardResponse>(boardKeys.today());
      const previousWeek = queryClient.getQueryData<BoardResponse>(boardKeys.week());

      // Helper to optimistically move an item between columns
      const moveItem = (board: BoardResponse | undefined): BoardResponse | undefined => {
        if (!board) return board;

        const newColumns: Record<string, BoardItem[]> = {};
        let movedItem: BoardItem | undefined;

        // Find and remove the item from its current column
        for (const [status, items] of Object.entries(board.columns)) {
          const filtered = items.filter((item) => {
            if (item.id === data.learningItemId) {
              movedItem = { ...item, status: data.newStatus };
              if (data.newRank !== undefined) {
                movedItem.rank = data.newRank;
              }
              return false;
            }
            return true;
          });
          newColumns[status] = filtered;
        }

        // Add to the new column
        if (movedItem) {
          const targetStatus = data.newStatus;
          if (!newColumns[targetStatus]) {
            newColumns[targetStatus] = [];
          }
          newColumns[targetStatus]!.push(movedItem);
          // Sort by rank within the target column
          newColumns[targetStatus]!.sort((a, b) => a.rank - b.rank);
        }

        return { ...board, columns: newColumns };
      };

      // Apply optimistic updates
      if (previousToday) {
        queryClient.setQueryData(boardKeys.today(), moveItem(previousToday));
      }
      if (previousWeek) {
        queryClient.setQueryData(boardKeys.week(), moveItem(previousWeek));
      }

      return { previousToday, previousWeek };
    },

    onError: (_err, _data, context) => {
      // Revert on error
      if (context?.previousToday) {
        queryClient.setQueryData(boardKeys.today(), context.previousToday);
      }
      if (context?.previousWeek) {
        queryClient.setQueryData(boardKeys.week(), context.previousWeek);
      }
    },

    onSettled: () => {
      // Refetch to ensure server state consistency
      queryClient.invalidateQueries({ queryKey: boardKeys.all });
    },
  });
}

/** Board column statuses in display order */
export const BOARD_COLUMNS: LearnStatus[] = [
  LearnStatus.TO_LEARN,
  LearnStatus.PLANNED,
  LearnStatus.IN_PROGRESS,
  LearnStatus.LEARNED,
  LearnStatus.NEEDS_REVISION,
];

export const COLUMN_LABELS: Record<string, string> = {
  [LearnStatus.TO_LEARN]: 'To Learn',
  [LearnStatus.PLANNED]: 'Planned',
  [LearnStatus.IN_PROGRESS]: 'In Progress',
  [LearnStatus.LEARNED]: 'Learned',
  [LearnStatus.NEEDS_REVISION]: 'Needs Revision',
};
