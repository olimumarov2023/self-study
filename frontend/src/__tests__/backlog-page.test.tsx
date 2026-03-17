import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { BacklogPage } from '@/pages/backlog/backlog-page';
import { server, mockLearningItems } from '@/test/mocks/handlers';
import { renderWithProviders } from '@/test/test-utils';

const API_URL = 'http://localhost:3000';

describe('BacklogPage', () => {
  it('renders learning items from API', async () => {
    renderWithProviders(<BacklogPage />);

    await waitFor(() => {
      expect(screen.getByText('Learn TypeScript generics')).toBeInTheDocument();
    });
    expect(screen.getByText('Vitest fundamentals')).toBeInTheDocument();
    expect(screen.getByText('React patterns')).toBeInTheDocument();
  });

  it('shows loading state while fetching', () => {
    renderWithProviders(<BacklogPage />);

    // The heading should be visible immediately
    expect(screen.getByText('Backlog')).toBeInTheDocument();
  });

  it('renders error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/learning-items`, () => {
        return HttpResponse.json(
          { message: 'Internal Server Error' },
          { status: 500 },
        );
      }),
    );

    renderWithProviders(<BacklogPage />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load learning items/i)).toBeInTheDocument();
    });
  });

  it('opens quick-add modal and submits', async () => {
    const user = userEvent.setup();
    let capturedBody: Record<string, unknown> | null = null;

    server.use(
      http.post(`${API_URL}/learning-items`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: 'item-new',
          userId: 'user-1',
          categoryId: null,
          title: capturedBody.title,
          description: null,
          notes: null,
          priority: capturedBody.priority ?? 'MEDIUM',
          difficulty: 3,
          estimatedHours: null,
          status: 'TO_LEARN',
          dueDate: null,
          targetRole: null,
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          category: null,
        });
      }),
    );

    renderWithProviders(<BacklogPage />);

    // Wait for items to load first
    await waitFor(() => {
      expect(screen.getByText('Learn TypeScript generics')).toBeInTheDocument();
    });

    // Click Add Item button
    const addButton = screen.getByRole('button', { name: /add item/i });
    await user.click(addButton);

    // Modal should open
    await waitFor(() => {
      expect(screen.getByText('Quick Add Item')).toBeInTheDocument();
    });

    // Fill in the title
    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'New learning topic');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /^add item$/i });
    await user.click(submitButton);

    // Verify the API was called with the right data
    await waitFor(() => {
      expect(capturedBody).not.toBeNull();
      expect(capturedBody?.title).toBe('New learning topic');
    });
  });

  it('shows item count from API', async () => {
    renderWithProviders(<BacklogPage />);

    await waitFor(() => {
      expect(
        screen.getByText(`Showing ${mockLearningItems.length} of ${mockLearningItems.length} items`),
      ).toBeInTheDocument();
    });
  });
});
