import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CompletionDonutProps {
  completionPct: number;
  completed: number;
  planned: number;
}

export function CompletionDonut({ completionPct, completed, planned }: CompletionDonutProps) {
  const remaining = 100 - completionPct;

  const data = [
    { name: 'Completed', value: completionPct || 0 },
    { name: 'Remaining', value: remaining || 100 },
  ];

  // When nothing is planned, show full grey ring
  const isEmpty = planned === 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="h-28 w-28 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={isEmpty ? [{ name: 'Empty', value: 100 }] : data}
                  cx="50%"
                  cy="50%"
                  innerRadius={32}
                  outerRadius={48}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                >
                  {isEmpty ? (
                    <Cell fill="hsl(var(--muted))" />
                  ) : (
                    <>
                      <Cell fill="hsl(var(--primary))" />
                      <Cell fill="hsl(var(--muted))" />
                    </>
                  )}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">{completionPct}%</p>
            <p className="text-sm text-muted-foreground">
              {completed} of {planned} items
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
