import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import WorkspaceDialog from '../WorkspaceDialog.jsx';
import CreateWorkspaceDialog from '../CreateWorkspaceDialog.jsx';
import ProjectWorkspaceSection from '../ProjectWorkspaceSection.jsx';

const noopActions = {
  updateProject: vi.fn(),
  createBudgetLine: vi.fn(),
  updateBudgetLine: vi.fn(),
  deleteBudgetLine: vi.fn(),
  createDeliverable: vi.fn(),
  updateDeliverable: vi.fn(),
  deleteDeliverable: vi.fn(),
  createChatMessage: vi.fn(),
  updateChatMessage: vi.fn(),
  deleteChatMessage: vi.fn(),
  createTaskDependency: vi.fn(),
  deleteTaskDependency: vi.fn(),
};

describe('WorkspaceDialog', () => {
  it('renders provided content when open', () => {
    const onClose = vi.fn();

    render(
      <WorkspaceDialog open onClose={onClose} title="Test dialog" size="sm">
        <p>Dialog body</p>
      </WorkspaceDialog>,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Dialog body')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    const { queryByText } = render(
      <WorkspaceDialog open={false} onClose={() => {}} title="Hidden" size="sm">
        <p>Should not render</p>
      </WorkspaceDialog>,
    );

    expect(queryByText('Should not render')).toBeNull();
  });
});

describe('CreateWorkspaceDialog', () => {
  it('submits the form with the provided handler', async () => {
    const handleSubmit = vi.fn((event) => event.preventDefault());

    render(
      <CreateWorkspaceDialog
        open
        onClose={() => {}}
        form={{
          title: 'Growth workspace',
          description: 'Expansion planning',
          status: 'planning',
          budgetCurrency: 'USD',
          budgetAllocated: '5000',
          dueDate: '2024-04-30',
        }}
        errors={{}}
        feedback={null}
        onChange={vi.fn()}
        onSubmit={handleSubmit}
        submitting={false}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Create workspace' }));
    expect(handleSubmit).toHaveBeenCalled();
  });
});

describe('ProjectWorkspaceSection', () => {
  it('switches tabs using the provided change handler', async () => {
    const project = {
      id: 1,
      title: 'AI Launch',
      status: 'planning',
      workspace: { progressPercent: 20 },
      tasks: [],
      deliverables: [],
      budgetLines: [],
      chat: { channels: [{ id: 1, name: 'general' }], messages: [] },
      meetings: [],
      invitations: [],
      roleDefinitions: [],
      submissions: [],
      calendarEvents: [],
    };

    function Wrapper() {
      const [activeTab, setActiveTab] = useState('workspace');
      return (
        <ProjectWorkspaceSection
          projects={[project]}
          selectedProjectId={project.id}
          onSelectProject={() => {}}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          actions={noopActions}
          canManage
          summary={{}}
        />
      );
    }

    render(<Wrapper />);

    expect(screen.getByText(/Execution health/)).toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Budget' }));
    });
    await waitFor(() => expect(screen.getByText('No lines recorded.')).toBeInTheDocument());

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Chat' }));
    });
    await waitFor(() => expect(screen.getByText(/Project channels/)).toBeInTheDocument());
  });
});
