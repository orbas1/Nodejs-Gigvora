import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimelineList from '../TimelineList.jsx';

const timelines = [
  { id: 'tl-1', name: 'Launch alpha', slug: 'launch-alpha', status: 'active', visibility: 'internal' },
  { id: 'tl-2', name: 'Public beta', slug: 'public-beta', status: 'draft', visibility: 'public' },
];

describe('TimelineList', () => {
  it('filters timelines based on provided filters', () => {
    render(
      <TimelineList
        timelines={timelines}
        selectedTimelineId="tl-1"
        onSelect={() => {}}
        filters={{ query: '', status: 'active', visibility: '' }}
        onFiltersChange={() => {}}
        loading={false}
      />,
    );

    expect(screen.getByRole('button', { name: /launch alpha/i })).toBeVisible();
    expect(screen.queryByRole('button', { name: /public beta/i })).not.toBeInTheDocument();
  });

  it('notifies about filter changes through callbacks', async () => {
    const onFiltersChange = vi.fn();
    render(
      <TimelineList
        timelines={timelines}
        selectedTimelineId="tl-1"
        onSelect={() => {}}
        filters={{ query: '', status: '', visibility: '' }}
        onFiltersChange={onFiltersChange}
        loading={false}
      />,
    );

    await userEvent.type(screen.getByPlaceholderText(/search/i), 'beta');
    expect(onFiltersChange).toHaveBeenCalled();
  });
});
