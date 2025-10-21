import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import WorkspaceModal from '../WorkspaceModal.jsx';
import WorkspaceOverviewTab from '../WorkspaceOverviewTab.jsx';
import WorkspaceProjectSelector from '../WorkspaceProjectSelector.jsx';
import WorkspaceSummary from '../WorkspaceSummary.jsx';

describe('WorkspaceModal', () => {
  it('renders content and notifies when closed', () => {
    const onClose = vi.fn();
    render(
      <WorkspaceModal open title="Workspace" description="Details" onClose={onClose} size="lg">
        <p>Modal body</p>
      </WorkspaceModal>,
    );

    expect(screen.getByRole('dialog', { name: 'Workspace' })).toBeInTheDocument();
    expect(screen.getByText('Modal body')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('WorkspaceOverviewTab', () => {
  const baseProps = {
    project: { title: 'Northstar', description: 'Core revamp' },
    workspace: {
      status: 'in_progress',
      progressPercent: 35,
      riskLevel: 'medium',
      nextMilestone: 'MVP release',
      nextMilestoneDueAt: '2024-07-01',
    },
    summary: {
      budget: { planned: 50000, actual: 12000 },
      tasks: { completed: 4, total: 10, active: 3 },
      time: { totalHours: 120 },
      collaboration: { invitesAccepted: 12, invitesSent: 20 },
    },
    timeline: { startDate: '2024-05-01', endDate: '2024-08-01' },
    objectives: [],
  };

  it('submits updated summary with numeric progress', () => {
    const onUpdateSummary = vi.fn();
    render(
      <WorkspaceOverviewTab
        {...baseProps}
        onUpdateSummary={onUpdateSummary}
      />,
    );

    const summaryForm = screen.getByRole('button', { name: /save summary/i }).closest('form');
    fireEvent.change(within(summaryForm).getByLabelText(/^Title$/i), { target: { value: '  Revamp plan  ' } });
    fireEvent.change(within(summaryForm).getByLabelText(/^Progress \(%\)$/i), { target: { value: '82' } });
    fireEvent.submit(summaryForm);

    expect(onUpdateSummary).toHaveBeenCalledTimes(1);
    expect(onUpdateSummary.mock.calls[0][0]).toMatchObject({
      title: 'Revamp plan',
      progressPercent: 82,
      notes: '',
    });
  });

  it('creates objectives with trimmed values', () => {
    const onCreateObjective = vi.fn();
    render(
      <WorkspaceOverviewTab
        {...baseProps}
        onCreateObjective={onCreateObjective}
      />,
    );

    const [, objectiveTitle] = screen.getAllByLabelText(/^Title$/i);
    fireEvent.change(objectiveTitle, { target: { value: '  Launch beta  ' } });
    fireEvent.change(screen.getByLabelText(/^Owner$/i), { target: { value: '  Alex  ' } });
    fireEvent.change(screen.getByLabelText(/^Metric$/i), { target: { value: 'Signups' } });

    const submitButton = screen
      .getAllByRole('button', { name: /add objective/i })
      .find((button) => button.getAttribute('type') === 'submit');
    fireEvent.click(submitButton);

    expect(onCreateObjective).toHaveBeenCalledTimes(1);
    expect(onCreateObjective.mock.calls[0][0]).toMatchObject({
      title: 'Launch beta',
      ownerName: 'Alex',
      metric: 'Signups',
      targetValue: null,
    });
  });
});

describe('WorkspaceProjectSelector', () => {
  it('notifies change with numeric identifier and refresh action', () => {
    const onChange = vi.fn();
    const onRefresh = vi.fn();
    const { rerender } = render(
      <WorkspaceProjectSelector
        value={1}
        onChange={onChange}
        onRefresh={onRefresh}
        loading
        projects={[
          { id: 1, title: 'Northstar', status: 'in_progress' },
          { id: 2, title: 'Growth playbook', status: 'planning' },
        ]}
      />,
    );

    const selector = screen.getByRole('combobox');
    fireEvent.change(selector, { target: { value: '2' } });
    expect(onChange).toHaveBeenCalledWith(2);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeDisabled();

    rerender(
      <WorkspaceProjectSelector
        value={1}
        onChange={onChange}
        onRefresh={onRefresh}
        loading={false}
        projects={[
          { id: 1, title: 'Northstar', status: 'in_progress' },
          { id: 2, title: 'Growth playbook', status: 'planning' },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});

describe('WorkspaceSummary', () => {
  it('renders formatted metrics when summary is provided', () => {
    render(
      <WorkspaceSummary
        summary={{
          budget: { planned: 32000, actual: 12000 },
          tasks: { completed: 5, total: 8, active: 2 },
          time: { totalHours: 96 },
          collaboration: { invitesAccepted: 14, invitesSent: 20 },
        }}
      />,
    );

    expect(screen.getByText(/\$32,000/)).toBeInTheDocument();
    expect(screen.getByText(/5\s*\/\s*8 done/i)).toBeInTheDocument();
    expect(screen.getByText(/96h/)).toBeInTheDocument();
  });

  it('renders nothing without summary data', () => {
    const { container } = render(<WorkspaceSummary summary={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
