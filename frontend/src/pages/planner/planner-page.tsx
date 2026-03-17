import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MonthPlannerView } from '@/pages/planner/month-planner-view';
import { WeekPlannerView } from '@/pages/planner/week-planner-view';
import { DayPlannerView } from '@/pages/planner/day-planner-view';

export function PlannerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Planner</h1>
        <p className="text-muted-foreground">
          Plan your learning across months, weeks, and days.
        </p>
      </div>

      <Tabs defaultValue="month">
        <TabsList>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="day">Day</TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="mt-4">
          <MonthPlannerView />
        </TabsContent>

        <TabsContent value="week" className="mt-4">
          <WeekPlannerView />
        </TabsContent>

        <TabsContent value="day" className="mt-4">
          <DayPlannerView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
