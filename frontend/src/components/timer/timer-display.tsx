interface TimerDisplayProps {
  seconds: number;
  className?: string;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function TimerDisplay({ seconds, className }: TimerDisplayProps) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return (
    <span className={className}>
      {pad(hours)}:{pad(minutes)}:{pad(secs)}
    </span>
  );
}
