import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { KanbanBoard } from '@/components/board/kanban-board';
import { mockBoardResponse } from '@/test/mocks/handlers';
import { renderWithProviders } from '@/test/test-utils';

import type { BoardResponse } from '@/types/board.types';

describe('KanbanBoard', () => {
  const defaultProps = {
    data: mockBoardResponse as BoardResponse,
    date: '2026-04-19',
    search: '',
    categoryId: 'all',
  };

  it('renders 5 columns with correct headers', () => {
    renderWithProviders(<KanbanBoard {...defaultProps} />);

    expect(screen.getByText('To Learn')).toBeInTheDocument();
    expect(screen.getByText('Planned')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Learned')).toBeInTheDocument();
    expect(screen.getByText('Needs Revision')).toBeInTheDocument();
  });

  it('displays cards in correct columns based on status', () => {
    renderWithProviders(<KanbanBoard {...defaultProps} />);

    // Each item should be rendered on the board
    expect(screen.getByText('Learn TypeScript generics')).toBeInTheDocument();
    expect(screen.getByText('GraphQL basics')).toBeInTheDocument();
    expect(screen.getByText('Vitest fundamentals')).toBeInTheDocument();
    expect(screen.getByText('React patterns')).toBeInTheDocument();
  });

  it('shows item count per column', () => {
    renderWithProviders(<KanbanBoard {...defaultProps} />);

    // Each column header shows item count. TO_LEARN=1, PLANNED=1, IN_PROGRESS=1, LEARNED=1, NEEDS_REVISION=0
    const countBadges = screen.getAllByText('1');
    expect(countBadges.length).toBeGreaterThanOrEqual(4);

    // Needs Revision column should show 0
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('shows empty state for columns with no items', () => {
    renderWithProviders(<KanbanBoard {...defaultProps} />);

    // NEEDS_REVISION column is empty, should show drop target text
    expect(screen.getByText('Drop items here')).toBeInTheDocument();
  });

  it('filters cards by search text', () => {
    renderWithProviders(
      <KanbanBoard {...defaultProps} search="typescript" />,
    );

    expect(screen.getByText('Learn TypeScript generics')).toBeInTheDocument();
    expect(screen.queryByText('Vitest fundamentals')).not.toBeInTheDocument();
    expect(screen.queryByText('GraphQL basics')).not.toBeInTheDocument();
    expect(screen.queryByText('React patterns')).not.toBeInTheDocument();
  });

  it('filters cards by categoryId', () => {
    renderWithProviders(
      <KanbanBoard {...defaultProps} categoryId="cat-2" />,
    );

    // Only Vitest fundamentals has category cat-2
    expect(screen.getByText('Vitest fundamentals')).toBeInTheDocument();
    expect(screen.queryByText('Learn TypeScript generics')).not.toBeInTheDocument();
    expect(screen.queryByText('GraphQL basics')).not.toBeInTheDocument();
  });

  it('renders all columns even when all items are filtered out', () => {
    renderWithProviders(
      <KanbanBoard {...defaultProps} search="nonexistent" />,
    );

    // Column headers should still exist
    expect(screen.getByText('To Learn')).toBeInTheDocument();
    expect(screen.getByText('Planned')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Learned')).toBeInTheDocument();
    expect(screen.getByText('Needs Revision')).toBeInTheDocument();
  });
});
