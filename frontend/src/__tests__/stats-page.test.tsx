import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { StatsPage } from '@/pages/stats/stats-page';
import { renderWithProviders } from '@/test/test-utils';

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

describe('StatsPage', () => {
  it('renders page heading', () => {
    renderWithProviders(<StatsPage />);

    expect(screen.getByText('Statistics')).toBeInTheDocument();
    expect(screen.getByText(/track your learning progress/i)).toBeInTheDocument();
  });

  it('renders period toggle with day/week/month options', () => {
    renderWithProviders(<StatsPage />);

    expect(screen.getByRole('tab', { name: /day/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /week/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /month/i })).toBeInTheDocument();
  });

  it('renders stat cards with data from API (day period)', async () => {
    renderWithProviders(<StatsPage />);

    // Wait for stats to load
    await waitFor(() => {
      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    });

    // Check stat card titles
    expect(screen.getByText('Planned vs Completed')).toBeInTheDocument();
    expect(screen.getByText('Study Time')).toBeInTheDocument();
    expect(screen.getByText('Current Streak')).toBeInTheDocument();

    // Check values from mockDayStats: completionPct=60, streak=7, studyMinutes=135 -> 2:15
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('2:15')).toBeInTheDocument();
    expect(screen.getByText('3 of 5 items')).toBeInTheDocument();
  });

  it('switches to week period on tab click', async () => {
    const user = userEvent.setup();

    renderWithProviders(<StatsPage />);

    // Wait for day stats to load first
    await waitFor(() => {
      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    });

    // Switch to week
    const weekTab = screen.getByRole('tab', { name: /week/i });
    await user.click(weekTab);

    // Wait for week stats to load (mockWeekStats: completionPct=67, streak=7, studyMinutes=480 -> 8:00)
    await waitFor(() => {
      expect(screen.getByText('67%')).toBeInTheDocument();
    });

    expect(screen.getByText('8:00')).toBeInTheDocument();
    expect(screen.getByText('8 of 12 items')).toBeInTheDocument();
  });

  it('switches to month period on tab click', async () => {
    const user = userEvent.setup();

    renderWithProviders(<StatsPage />);

    // Wait for day stats first
    await waitFor(() => {
      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    });

    // Switch to month
    const monthTab = screen.getByRole('tab', { name: /month/i });
    await user.click(monthTab);

    // Wait for month stats (mockMonthStats: completionPct=60, studyMinutes=1920 -> 32:00)
    await waitFor(() => {
      expect(screen.getByText('32:00')).toBeInTheDocument();
    });

    expect(screen.getByText('18 of 30 items')).toBeInTheDocument();
  });

  it('has period navigation arrows', () => {
    renderWithProviders(<StatsPage />);

    // There should be navigation buttons (ChevronLeft, ChevronRight)
    const buttons = screen.getAllByRole('button');
    // At least 2 arrow buttons
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });
});
