import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import WorkspaceModal from '../agency/workspace/WorkspaceModal.jsx';

describe('WorkspaceModal', () => {
  it('renders the provided heading, description, and content', () => {
    render(
      <WorkspaceModal open title="Workspace roles" description="Manage access policies" onClose={() => {}}>
        <p>Modal body content</p>
      </WorkspaceModal>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Workspace roles' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Manage access policies')).toBeInTheDocument();
    expect(screen.getByText('Modal body content')).toBeInTheDocument();
  });

  it('invokes the close handler when the action button is pressed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <WorkspaceModal open title="Workspace managers" description="Invite reviewers" onClose={onClose} size="lg">
        <p>Managers list</p>
      </WorkspaceModal>,
    );

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
  });
});

