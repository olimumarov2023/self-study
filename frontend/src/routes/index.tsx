import { createBrowserRouter } from 'react-router-dom';

import { MainLayout } from '@/components/layout/main-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { LoginPage } from '@/pages/auth/login-page';
import { DashboardPage } from '@/pages/dashboard/dashboard-page';
import { BacklogPage } from '@/pages/backlog/backlog-page';
import { PlannerPage } from '@/pages/planner/planner-page';
import { BoardPage } from '@/pages/board/board-page';
import { StatsPage } from '@/pages/stats/stats-page';
import { SettingsPage } from '@/pages/settings/settings-page';
import { AssessmentsPage } from '@/pages/assessments/assessments-page';
import { AssessmentRunPage } from '@/pages/assessments/assessment-run-page';
import { AssessmentResultsPage } from '@/pages/assessments/assessment-results-page';
import { RoadmapPage } from '@/pages/roadmap/roadmap-page';
import { RemindersPage } from '@/pages/reminders/reminders-page';
import { LibraryPage } from '@/pages/library/library-page';
import { ResourceDetailPage } from '@/pages/library/resource-detail-page';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'backlog',
            element: <BacklogPage />,
          },
          {
            path: 'planner',
            element: <PlannerPage />,
          },
          {
            path: 'board',
            element: <BoardPage />,
          },
          {
            path: 'stats',
            element: <StatsPage />,
          },
          {
            path: 'settings',
            element: <SettingsPage />,
          },
          {
            path: 'assessments',
            element: <AssessmentsPage />,
          },
          {
            path: 'assessments/:id/run',
            element: <AssessmentRunPage />,
          },
          {
            path: 'assessments/:id/results',
            element: <AssessmentResultsPage />,
          },
          {
            path: 'reminders',
            element: <RemindersPage />,
          },
          {
            path: 'roadmap',
            element: <RoadmapPage />,
          },
          {
            path: 'library',
            element: <LibraryPage />,
          },
          {
            path: 'library/:id',
            element: <ResourceDetailPage />,
          },
        ],
      },
    ],
  },
]);
