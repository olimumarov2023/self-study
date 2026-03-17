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
        ],
      },
    ],
  },
]);
