import { createBrowserRouter } from 'react-router-dom';

import { MainLayout } from '@/components/layout/main-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { LoginPage } from '@/pages/auth/login-page';
import { WorkspacePage } from '@/pages/workspace/workspace-page';
import { BoardPage } from '@/pages/board/board-page';
import { StatsPage } from '@/pages/stats/stats-page';
import { SettingsPage } from '@/pages/settings/settings-page';
import { StudyTrackerPage } from '@/pages/study-tracker/study-tracker-page';

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
            element: <BoardPage />,
          },
          {
            path: 'workspace',
            element: <WorkspacePage />,
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
            path: 'study-tracker',
            element: <StudyTrackerPage />,
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
