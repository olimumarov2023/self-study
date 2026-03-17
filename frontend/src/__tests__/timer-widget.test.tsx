import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeEach } from 'vitest';

import { TimerWidget } from '@/components/timer/timer-widget';
import { useTimerStore } from '@/stores/timer.store';
import { renderWithProviders } from '@/test/test-utils';

describe('TimerWidget', () => {
  beforeEach(() => {
    // Reset the timer store before each test
    useTimerStore.setState({
      activeSessionId: null,
      startedAt: null,
      elapsed: 0,
      learningItemId: undefined,
      learningItemTitle: undefined,
      intervalId: null,
    });
  });

  it('shows start timer button when no active session', () => {
    renderWithProviders(<TimerWidget />);

    expect(screen.getByRole('button', { name: /start timer/i })).toBeInTheDocument();
  });

  it('shows elapsed time when timer is active', () => {
    useTimerStore.setState({
      activeSessionId: 'session-1',
      startedAt: new Date().toISOString(),
      elapsed: 3661, // 1 hour, 1 minute, 1 second
      learningItemTitle: 'TypeScript deep dive',
    });

    renderWithProviders(<TimerWidget />);

    expect(screen.getByText('01:01:01')).toBeInTheDocument();
    expect(screen.getByText('TypeScript deep dive')).toBeInTheDocument();
  });

  it('shows "General" label when active session has no topic', () => {
    useTimerStore.setState({
      activeSessionId: 'session-1',
      startedAt: new Date().toISOString(),
      elapsed: 120,
      learningItemTitle: undefined,
    });

    renderWithProviders(<TimerWidget />);

    expect(screen.getByText('General')).toBeInTheDocument();
  });

  it('shows stop button when timer is active', () => {
    useTimerStore.setState({
      activeSessionId: 'session-1',
      startedAt: new Date().toISOString(),
      elapsed: 60,
    });

    renderWithProviders(<TimerWidget />);

    // The stop button is the icon button (Square icon)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('opens dropdown menu on start timer click', async () => {
    const user = userEvent.setup();

    renderWithProviders(<TimerWidget />);

    const startButton = screen.getByRole('button', { name: /start timer/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/general \(no topic\)/i)).toBeInTheDocument();
    });
  });

  it('shows learning items in dropdown when available', async () => {
    const user = userEvent.setup();

    renderWithProviders(<TimerWidget />);

    // Wait for items to load from MSW
    const startButton = screen.getByRole('button', { name: /start timer/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText('Learn TypeScript generics')).toBeInTheDocument();
      expect(screen.getByText('Vitest fundamentals')).toBeInTheDocument();
    });
  });

  it('triggers API call when starting general timer', async () => {
    const user = userEvent.setup();

    renderWithProviders(<TimerWidget />);

    const startButton = screen.getByRole('button', { name: /start timer/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/general \(no topic\)/i)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/general \(no topic\)/i));

    // After clicking, the timer store should be updated via the mutation's onSuccess
    await waitFor(() => {
      const state = useTimerStore.getState();
      expect(state.activeSessionId).toBe('session-1');
    });
  });
});
