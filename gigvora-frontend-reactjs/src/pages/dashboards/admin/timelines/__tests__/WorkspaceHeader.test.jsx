import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkspaceHeader from '../WorkspaceHeader.jsx';

describe('WorkspaceHeader', () => {
  it('renders stats and triggers actions', async () => {
    const onCreate = vi.fn();
    const onRefresh = vi.fn();

    render(
      <WorkspaceHeader
        stats={{ total: 4, active: 2, upcoming: 3, draft: 1 }}
        loading={false}
        onCreate={onCreate}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByText('4')).toBeVisible();
    expect(screen.getByText('2')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: /new timeline/i }));
    await userEvent.click(screen.getByRole('button', { name: /refresh/i }));

    expect(onCreate).toHaveBeenCalled();
    expect(onRefresh).toHaveBeenCalled();
  });
});
