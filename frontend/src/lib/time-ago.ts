/**
 * Returns a human-readable relative time string for a given ISO date string.
 * Examples: "just now", "3 minutes ago", "2 hours ago", "Yesterday", "Mar 15"
 */
export function timeAgo(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 60) {
    return 'just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (dateStart.getTime() === todayStart.getTime()) {
    return 'today';
  }
  if (dateStart.getTime() === yesterdayStart.getTime()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Returns the grouping label for a reminder date: "Today", "Yesterday", or a formatted date.
 */
export function dateGroupLabel(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (dateStart.getTime() === todayStart.getTime()) return 'Today';
  if (dateStart.getTime() === yesterdayStart.getTime()) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}
