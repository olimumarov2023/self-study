import { useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, Timer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuickActionsProps {
  onAddTopic: () => void;
  onStartTimer?: () => void;
  isTimerActive?: boolean;
}

export function QuickActions({ onAddTopic, onStartTimer, isTimerActive }: QuickActionsProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onAddTopic}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Topic
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/board')}
          >
            <LayoutGrid className="mr-1.5 h-4 w-4" />
            Open Board
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isTimerActive}
            onClick={onStartTimer}
          >
            <Timer className="mr-1.5 h-4 w-4" />
            {isTimerActive ? 'Timer Running' : 'Start Timer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
