export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}`;
  }
  return `${minutes}:00`;
}

export function mergeIntervals(intervals: Array<[number, number]>): Array<[number, number]> {
  if (intervals.length === 0) return [];

  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const first = sorted[0];
  if (!first) return [];

  const merged: Array<[number, number]> = [[first[0], first[1]]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    if (!current) continue;
    const last = merged[merged.length - 1];
    if (!last) continue;
    if (current[0] <= last[1] + 1) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      merged.push([current[0], current[1]]);
    }
  }

  return merged;
}

export function computeProgressPercent(
  type: 'BOOK' | 'VIDEO',
  sessions: Array<{
    startPage?: number | null;
    endPage?: number | null;
    startMinute?: number | null;
    endMinute?: number | null;
  }>,
  total: number | null | undefined,
): number {
  if (!total || total <= 0) return 0;

  const intervals: Array<[number, number]> = [];

  for (const s of sessions) {
    if (type === 'BOOK' && s.startPage != null && s.endPage != null) {
      intervals.push([s.startPage, s.endPage]);
    } else if (type === 'VIDEO' && s.startMinute != null && s.endMinute != null) {
      intervals.push([s.startMinute, s.endMinute]);
    }
  }

  if (intervals.length === 0) return 0;

  const merged = mergeIntervals(intervals);
  let covered = 0;
  for (const [s, e] of merged) {
    covered += e - s + 1;
  }

  return Math.min(100, Math.floor((covered / total) * 100));
}

export function computeResumePosition(
  type: 'BOOK' | 'VIDEO',
  sessions: Array<{
    endPage?: number | null;
    endMinute?: number | null;
  }>,
  total: number | null | undefined,
): { type: 'page' | 'timestamp' | null; value: number | null; label: string | null } {
  if (sessions.length === 0) {
    return { type: null, value: null, label: null };
  }

  if (type === 'BOOK') {
    const maxEndPage = sessions.reduce((max, s) => {
      if (s.endPage != null && s.endPage > max) return s.endPage;
      return max;
    }, 0);

    if (maxEndPage === 0) return { type: null, value: null, label: null };

    let resumeValue = maxEndPage + 1;
    if (total != null && resumeValue > total) {
      resumeValue = total;
    }

    return {
      type: 'page',
      value: resumeValue,
      label: `Resume from page ${resumeValue}`,
    };
  }

  // VIDEO
  const maxEndMinute = sessions.reduce((max, s) => {
    if (s.endMinute != null && s.endMinute > max) return s.endMinute;
    return max;
  }, 0);

  if (maxEndMinute === 0 && sessions.every((s) => s.endMinute == null)) {
    return { type: null, value: null, label: null };
  }

  let resumeValue = maxEndMinute;
  if (total != null && resumeValue >= total) {
    resumeValue = total;
  }

  return {
    type: 'timestamp',
    value: resumeValue,
    label: `Resume from ${formatMinutes(resumeValue)}`,
  };
}
