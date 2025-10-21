import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../../hooks/useAuthorization.js', () => ({
  useProjectManagementAccess: vi.fn(),
}));

vi.mock('../../../hooks/useProjectWorkspace.js', () => ({
  default: vi.fn(),
}));

const sectionSpy = vi.fn();
const dataStatusSpy = vi.fn();

vi.mock('../ProjectWorkspaceSection.jsx', () => ({
  __esModule: true,
  default: (props) => {
    sectionSpy(props);
    return (
      <div data-testid="workspace-section" data-can-manage={props.canManage ? 'yes' : 'no'}>
        Section for {props.projects[0]?.title}
      </div>
    );
  },
}));

vi.mock('../../DataStatus.jsx', () => ({
  __esModule: true,
  default: (props) => {
    dataStatusSpy(props);
    return <div data-testid="data-status">{props.children}</div>;
  },
}));

import { useProjectManagementAccess } from '../../../hooks/useAuthorization.js';
import useProjectWorkspace from '../../../hooks/useProjectWorkspace.js';
import ProjectWorkspaceContainer from '../ProjectWorkspaceContainer.jsx';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('ProjectWorkspaceContainer', () => {
  it('renders an access notice when project tools are restricted', () => {
    useProjectManagementAccess.mockReturnValue({ canManageProjects: false, denialReason: 'Only admins' });

    const reload = vi.fn();
    useProjectWorkspace.mockReturnValue({ data: null, loading: false, error: null, actions: {}, reload });

    render(<ProjectWorkspaceContainer userId={77} />);

    expect(screen.getByText(/Workspace access required/i)).toBeInTheDocument();
    expect(screen.getByText(/Only admins/)).toBeInTheDocument();
    expect(screen.queryByTestId('workspace-section')).not.toBeInTheDocument();
  });

  it('passes canManage and reload handlers to child sections', async () => {
    useProjectManagementAccess.mockReturnValue({ canManageProjects: true, denialReason: null });
    const reload = vi.fn();
    useProjectWorkspace.mockReturnValue({
      data: {
        access: { canManage: true },
        projects: [
          {
            id: 1,
            title: 'AI Launch',
            status: 'planning',
            workspace: { progressPercent: 20 },
          },
        ],
        summary: { projectCount: 1 },
      },
      loading: false,
      error: null,
      actions: {},
      reload,
    });

    render(<ProjectWorkspaceContainer userId={42} />);

    const workspaceSection = await screen.findByTestId('workspace-section');
    expect(workspaceSection.getAttribute('data-can-manage')).toBe('yes');
    expect(dataStatusSpy).toHaveBeenCalledWith(expect.objectContaining({ onRefresh: reload, onRetry: reload }));

    await userEvent.click(screen.getByRole('button', { name: /Refresh/ }));
    expect(reload).toHaveBeenCalled();
  });
});
