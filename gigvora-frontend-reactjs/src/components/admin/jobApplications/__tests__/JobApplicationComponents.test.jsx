import { render, screen, act, waitFor } from '@testing-library/react';
import { useState } from 'react';
import userEvent from '@testing-library/user-event';
import JobApplicationFilters from '../JobApplicationFilters.jsx';
import JobApplicationTable from '../JobApplicationTable.jsx';
import JobApplicationCreateDrawer from '../JobApplicationCreateDrawer.jsx';
import JobApplicationDrawer from '../JobApplicationDrawer.jsx';

async function runInAct(callback) {
  await act(async () => {
    await callback();
  });
}

describe('JobApplicationFilters', () => {
  it('updates filters and resets to defaults', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    const onReset = vi.fn();

    function Harness() {
      const [filters, setFilters] = useState({
        search: '',
        status: '',
        stage: '',
        priority: '',
        source: '',
        assignedRecruiterId: '',
      });
      return (
        <JobApplicationFilters
          filters={filters}
          onFiltersChange={(next) => {
            setFilters(next);
            onFiltersChange(next);
          }}
          onReset={onReset}
          facets={{
            stages: ['screen', 'onsite'],
            statuses: ['new', 'interviewing'],
            priorities: ['high'],
            sources: ['referral'],
            recruiters: [{ id: '5', name: 'Taylor' }],
          }}
          metrics={{ statusSummary: [{ key: 'new', count: 3 }], stageSummary: [{ key: 'screen', count: 2 }] }}
        />
      );
    }

    render(<Harness />);

    await runInAct(() => user.type(screen.getByPlaceholderText(/candidate, job, recruiter/i), 'Morgan'));
    expect(onFiltersChange.mock.calls.at(-1)[0]).toEqual(expect.objectContaining({ search: 'Morgan' }));

    await runInAct(() => user.selectOptions(screen.getByLabelText(/stage/i), 'onsite'));
    expect(onFiltersChange.mock.calls.at(-1)[0]).toEqual(expect.objectContaining({ stage: 'onsite' }));

    await runInAct(() => user.click(screen.getByRole('button', { name: /reset/i })));
    expect(onReset).toHaveBeenCalled();
    expect(onFiltersChange.mock.calls.at(-1)[0]).toEqual({
      search: '',
      status: '',
      stage: '',
      priority: '',
      source: '',
      assignedRecruiterId: '',
    });
  });
});

describe('JobApplicationTable', () => {
  it('renders rows and handles selection and pagination', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onPageChange = vi.fn();

    render(
      <JobApplicationTable
        applications={[
          {
            id: 'app-1',
            candidateName: 'Morgan Rivers',
            candidateEmail: 'morgan@gigvora.com',
            stage: 'phone_screen',
            status: 'interviewing',
            priority: 'high',
            jobTitle: 'Product Manager',
            salaryExpectation: 125000,
            currency: 'USD',
            interviewCount: 2,
            noteCount: 3,
            updatedAt: new Date(Date.now() - 3600_000).toISOString(),
          },
        ]}
        onSelect={onSelect}
        onCreate={vi.fn()}
        selectedId={null}
        pagination={{ page: 1, totalPages: 2 }}
        onPageChange={onPageChange}
      />,
    );

    await runInAct(() => user.click(screen.getByRole('button', { name: /open/i })));
    expect(onSelect).toHaveBeenCalled();

    await runInAct(() => user.click(screen.getByRole('button', { name: /next/i })));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('shows empty state when no applications', () => {
    const onCreate = vi.fn();
    render(<JobApplicationTable applications={[]} loading={false} onCreate={onCreate} />);
    expect(screen.getByText(/no applications/i)).toBeInTheDocument();
  });
});

describe('JobApplicationCreateDrawer', () => {
  it('steps through the wizard and submits payload', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({});

    render(
      <JobApplicationCreateDrawer
        open
        onClose={vi.fn()}
        onSubmit={onSubmit}
        facets={{
          recruiters: [{ id: '10', name: 'Jordan' }],
          statuses: ['new', 'interviewing'],
        }}
      />,
    );

    await runInAct(() => user.type(screen.getByLabelText(/^name$/i), 'Sam Lee'));
    await runInAct(() => user.type(screen.getByLabelText(/^email$/i), 'sam@gigvora.com'));
    await runInAct(() => user.click(screen.getByRole('button', { name: /^next$/i })));

    await runInAct(() => user.type(screen.getByLabelText(/^job title$/i), 'Customer Success Lead'));
    await runInAct(() => user.type(screen.getByLabelText(/^salary$/i), '90000'));
    const tagsField = await screen.findByLabelText(/tags/i);
    await runInAct(() => user.type(tagsField, 'fast learner, organized'));
    await runInAct(() => user.click(screen.getByRole('button', { name: /^next$/i })));

    const [workflowStatusSelect] = await screen.findAllByLabelText(/^status$/i);
    await runInAct(() => user.selectOptions(workflowStatusSelect, 'new'));

    await runInAct(() => user.click(screen.getByRole('button', { name: /create application/i })));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          candidateName: 'Sam Lee',
          jobTitle: 'Customer Success Lead',
          salaryExpectation: 90000,
          tags: ['fast learner', 'organized'],
        }),
      );
    });
  });
});

describe('JobApplicationDrawer', () => {
  it('updates applicant details and manages notes', async () => {
    const user = userEvent.setup();
    const callbacks = {
      onClose: vi.fn(),
      onUpdate: vi.fn().mockResolvedValue({}),
      onDelete: vi.fn(),
      onCreateNote: vi.fn().mockResolvedValue({}),
      onUpdateNote: vi.fn().mockResolvedValue({}),
      onDeleteNote: vi.fn().mockResolvedValue({}),
      onCreateInterview: vi.fn().mockResolvedValue({}),
      onUpdateInterview: vi.fn().mockResolvedValue({}),
      onDeleteInterview: vi.fn().mockResolvedValue({}),
      onCreateDocument: vi.fn().mockResolvedValue({}),
      onUpdateDocument: vi.fn().mockResolvedValue({}),
      onDeleteDocument: vi.fn().mockResolvedValue({}),
    };

    render(
      <JobApplicationDrawer
        open
        application={{
          id: 'app-1',
          candidateName: 'Morgan Rivers',
          candidateEmail: 'morgan@gigvora.com',
          jobTitle: 'Product Manager',
          status: 'interviewing',
          stage: 'onsite',
          tags: ['pm'],
          skills: ['communication'],
          interviews: [],
          notes: [],
          documents: [],
        }}
        facets={{
          recruiters: [{ id: '7', name: 'Taylor' }],
          interviewTypes: ['video'],
          interviewStatuses: ['scheduled', 'completed'],
        }}
        {...callbacks}
      />,
    );

    const [nameField] = screen.getAllByLabelText(/^name$/i);
    await runInAct(() => user.clear(nameField));
    await runInAct(() => user.type(nameField, 'Morgan Rivers Updated'));
    await runInAct(() => user.click(screen.getByRole('button', { name: /save changes/i })));

    expect(callbacks.onUpdate).toHaveBeenCalledWith('app-1', expect.objectContaining({ candidateName: 'Morgan Rivers Updated' }));

    await runInAct(() => user.click(screen.getByRole('tab', { name: /notes/i })));
    await runInAct(() => user.type(screen.getByPlaceholderText(/share progress/i), 'Great communicator'));
    await runInAct(() => user.click(screen.getByRole('button', { name: /log note/i })));

    expect(callbacks.onCreateNote).toHaveBeenCalledWith('app-1', expect.objectContaining({ body: 'Great communicator' }));
  });
});
