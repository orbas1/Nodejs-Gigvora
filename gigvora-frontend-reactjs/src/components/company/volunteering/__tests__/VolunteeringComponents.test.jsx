import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ApplicationManager from '../ApplicationManager.jsx';
import VolunteeringApplicationDrawer from '../VolunteeringApplicationDrawer.jsx';
import VolunteeringContractLedger from '../VolunteeringContractLedger.jsx';
import VolunteeringInterviewBoard from '../VolunteeringInterviewBoard.jsx';
import VolunteeringPeopleWorkspace from '../VolunteeringPeopleWorkspace.jsx';
import VolunteeringPostBoard from '../VolunteeringPostBoard.jsx';
import VolunteeringPostFormModal from '../VolunteeringPostFormModal.jsx';

const baseApplication = {
  id: 1,
  status: 'submitted',
  stage: 'Initial review',
  assignedTo: 'Alex',
  source: 'Referral',
  notes: 'Strong open-source work',
  candidateName: 'Taylor Brooks',
  candidateEmail: 'taylor@example.com',
  candidatePhone: '+1 555 0100',
  responses: [
    {
      id: 'resp-1',
      message: 'Thanks for applying!',
      visibility: 'candidate',
      responseType: 'message',
      sentAt: '2024-05-01T10:00:00Z',
    },
  ],
  interviews: [
    {
      id: 'int-1',
      scheduledAt: '2024-06-01T10:00',
      status: 'scheduled',
      interviewerName: 'Jordan',
      meetingUrl: 'https://meet.example.com',
    },
  ],
  contracts: [
    {
      id: 10,
      applicationId: 1,
      title: 'Volunteer contract',
      status: 'draft',
      contractType: 'fixed_term',
      stipendAmount: 500,
      stipendCurrency: 'USD',
      spendEntries: [],
    },
  ],
};

describe('ApplicationManager', () => {
  const createHandlers = () => ({
    onUpdate: vi.fn().mockResolvedValue(),
    onDelete: vi.fn(),
    onCreateResponse: vi.fn().mockResolvedValue(),
    onUpdateResponse: vi.fn().mockResolvedValue(),
    onDeleteResponse: vi.fn(),
    onScheduleInterview: vi.fn().mockResolvedValue(),
    onUpdateInterview: vi.fn().mockResolvedValue(),
    onDeleteInterview: vi.fn(),
    onCreateContract: vi.fn().mockResolvedValue(),
    onUpdateContract: vi.fn().mockResolvedValue(),
    onAddSpend: vi.fn().mockResolvedValue(),
    onUpdateSpend: vi.fn().mockResolvedValue(),
    onDeleteSpend: vi.fn(),
  });

  it('drives core workflows for an application', async () => {
    const handlers = createHandlers();

    render(<ApplicationManager application={baseApplication} busy={false} {...handlers} />);

    fireEvent.change(screen.getByLabelText(/candidate name/i), { target: { value: 'Taylor Updated' } });
    fireEvent.click(screen.getByRole('button', { name: /save application/i }));
    await waitFor(() => expect(handlers.onUpdate).toHaveBeenCalled());
    expect(handlers.onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ candidateName: 'Taylor Updated', status: 'submitted' }),
    );

    fireEvent.change(screen.getByLabelText(/^Message$/i), { target: { value: 'Thanks for the update!' } });
    fireEvent.click(screen.getByRole('button', { name: /log response/i }));
    await waitFor(() => expect(handlers.onCreateResponse).toHaveBeenCalled());
    expect(handlers.onCreateResponse).toHaveBeenCalledWith({
      message: 'Thanks for the update!',
      responseType: 'message',
      visibility: 'internal',
    });

    fireEvent.change(screen.getAllByLabelText(/scheduled at/i)[0], { target: { value: '2024-06-10T09:30' } });
    fireEvent.click(screen.getByRole('button', { name: /schedule interview/i }));
    await waitFor(() => expect(handlers.onScheduleInterview).toHaveBeenCalled());
    expect(handlers.onScheduleInterview).toHaveBeenCalledWith({
      scheduledAt: '2024-06-10T09:30',
      durationMinutes: 45,
      interviewerName: undefined,
      interviewerEmail: undefined,
      status: 'scheduled',
      location: undefined,
      meetingUrl: undefined,
      notes: undefined,
    });

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Taylor volunteer contract' } });
    fireEvent.click(screen.getByRole('button', { name: /create contract/i }));
    await waitFor(() => expect(handlers.onCreateContract).toHaveBeenCalled());
    expect(handlers.onCreateContract).toHaveBeenCalledWith({
      title: 'Taylor volunteer contract',
      status: 'draft',
      contractType: 'fixed_term',
      stipendAmount: undefined,
      currency: 'USD',
      hoursPerWeek: undefined,
      startDate: undefined,
      endDate: undefined,
      terms: undefined,
    });

    fireEvent.change(screen.getByLabelText(/^Contract$/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/^Amount$/i), { target: { value: '200' } });
    fireEvent.click(screen.getByRole('button', { name: /add spend/i }));
    await waitFor(() => expect(handlers.onAddSpend).toHaveBeenCalled());
    expect(handlers.onAddSpend).toHaveBeenCalledWith(10, {
      amount: 200,
      currency: 'USD',
      category: undefined,
      description: undefined,
    });
  });
});

describe('VolunteeringApplicationDrawer', () => {
  it('renders manager content and closes via action', () => {
    const handleClose = vi.fn();
    render(
      <VolunteeringApplicationDrawer
        open
        application={baseApplication}
        onClose={handleClose}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onCreateResponse={vi.fn()}
        onUpdateResponse={vi.fn()}
        onDeleteResponse={vi.fn()}
        onScheduleInterview={vi.fn()}
        onUpdateInterview={vi.fn()}
        onDeleteInterview={vi.fn()}
        onCreateContract={vi.fn()}
        onUpdateContract={vi.fn()}
        onAddSpend={vi.fn()}
        onUpdateSpend={vi.fn()}
        onDeleteSpend={vi.fn()}
      />,
    );

    expect(screen.getByText(/Taylor Brooks/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(handleClose).toHaveBeenCalled();
  });
});

describe('VolunteeringContractLedger', () => {
  const contracts = [
    {
      id: 50,
      applicationId: 1,
      title: 'Onboarding support',
      contractType: 'fixed_term',
      status: 'draft',
      startDate: '2024-06-01',
      endDate: '2024-07-01',
      stipendAmount: 600,
      stipendCurrency: 'USD',
      spendEntries: [],
    },
  ];
  const applications = [{ id: 1, candidateName: 'Taylor Brooks', post: { title: 'Community mentor' } }];

  it('creates and manages contracts', async () => {
    const handleCreate = vi.fn().mockResolvedValue();
    const handleUpdate = vi.fn().mockResolvedValue();
    const handleDelete = vi.fn().mockResolvedValue();
    const handleSelect = vi.fn();

    render(
      <VolunteeringContractLedger
        contracts={contracts}
        applications={applications}
        onCreateContract={handleCreate}
        onUpdateContract={handleUpdate}
        onDeleteContract={handleDelete}
        onSelectApplication={handleSelect}
      />,
    );

    fireEvent.change(screen.getByLabelText(/candidate/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Community engagement' } });
    fireEvent.submit(screen.getByRole('button', { name: /create/i }));
    await waitFor(() => expect(handleCreate).toHaveBeenCalled());
    expect(handleCreate).toHaveBeenCalledWith('1', expect.objectContaining({ title: 'Community engagement' }));

    const contractRow = screen.getByText('Onboarding support').closest('tr');
    fireEvent.change(within(contractRow).getByRole('combobox'), { target: { value: 'active' } });
    expect(handleUpdate).toHaveBeenCalledWith(50, { status: 'active' });

    fireEvent.click(within(contractRow).getByRole('button', { name: /remove/i }));
    await waitFor(() => expect(handleDelete).toHaveBeenCalledWith(50));
  });
});

describe('VolunteeringInterviewBoard', () => {
  const interviews = [
    {
      id: 5,
      applicationId: 1,
      scheduledAt: '2099-06-05T09:00',
      durationMinutes: 45,
      status: 'scheduled',
      location: 'HQ',
      meetingUrl: 'https://meet.example.com',
    },
  ];
  const applications = [{ id: 1, candidateName: 'Taylor Brooks', post: { title: 'Community mentor' } }];

  it('schedules updates and removes interviews', async () => {
    const handleSchedule = vi.fn().mockResolvedValue();
    const handleUpdate = vi.fn().mockResolvedValue();
    const handleDelete = vi.fn().mockResolvedValue();
    const handleSelect = vi.fn();

    render(
      <VolunteeringInterviewBoard
        interviews={interviews}
        applications={applications}
        onScheduleInterview={handleSchedule}
        onUpdateInterview={handleUpdate}
        onDeleteInterview={handleDelete}
        onSelectApplication={handleSelect}
      />,
    );

    fireEvent.change(screen.getByLabelText(/candidate/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/start/i), { target: { value: '2099-06-12T13:00' } });
    fireEvent.click(screen.getByRole('button', { name: /schedule/i }));
    await waitFor(() => expect(handleSchedule).toHaveBeenCalled());
    expect(handleSchedule).toHaveBeenCalledWith('1', expect.objectContaining({ scheduledAt: '2099-06-12T13:00' }));

    const interviewRow = screen.getByText('HQ').closest('tr');
    fireEvent.change(within(interviewRow).getByRole('combobox'), { target: { value: 'completed' } });
    expect(handleUpdate).toHaveBeenCalledWith(5, { status: 'completed' });

    fireEvent.click(within(interviewRow).getByRole('button', { name: /remove/i }));
    await waitFor(() => expect(handleDelete).toHaveBeenCalledWith(5));
  });
});

describe('VolunteeringPeopleWorkspace', () => {
  const applications = [
    {
      id: 1,
      candidateName: 'Taylor Brooks',
      candidateEmail: 'taylor@example.com',
      status: 'submitted',
      postId: 'post-1',
      stage: 'Initial',
      createdAt: '2024-05-01T10:00:00Z',
    },
  ];
  const posts = [{ id: 'post-1', title: 'Community mentor' }];

  it('creates new applications and selects them on success', async () => {
    const handleCreate = vi.fn().mockResolvedValue({ id: 2 });
    const handleSelect = vi.fn();

    render(
      <VolunteeringPeopleWorkspace
        applications={applications}
        posts={posts}
        onCreateApplication={handleCreate}
        onSelectApplication={handleSelect}
      />,
    );

    fireEvent.change(screen.getByLabelText(/^Name$/i), { target: { value: 'Alex Doe' } });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));
    await waitFor(() => expect(handleCreate).toHaveBeenCalled());
    expect(handleSelect).toHaveBeenCalledWith(2);

    expect(screen.getByText(/Taylor Brooks/)).toBeInTheDocument();
  });
});

describe('VolunteeringPostFormModal', () => {
  it('maps form state to submission payload', async () => {
    const handleSubmit = vi.fn();
    render(
      <VolunteeringPostFormModal
        open
        onClose={vi.fn()}
        onSubmit={handleSubmit}
        initialValue={{ tags: ['mentoring'], skills: ['communication'] }}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Community mentor' } });
    fireEvent.change(screen.getByLabelText(/Tags/i), { target: { value: 'mentoring, outreach' } });
    fireEvent.click(screen.getByRole('button', { name: /create posting/i }));
    await waitFor(() => expect(handleSubmit).toHaveBeenCalled());

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Community mentor',
        tags: ['mentoring', 'outreach'],
        skills: ['communication'],
      }),
    );
  });
});

describe('VolunteeringPostBoard', () => {
  const posts = [
    {
      id: 'post-1',
      title: 'Community mentor',
      summary: 'Support our community partners',
      description: 'Lead volunteer mentorship',
      status: 'draft',
      location: 'Remote',
      remoteFriendly: true,
      applications: [],
    },
  ];

  it('opens modal to create posts and handles edit actions', async () => {
    const handleCreate = vi.fn().mockResolvedValue();
    const handleUpdate = vi.fn().mockResolvedValue();
    const handleDelete = vi.fn().mockResolvedValue();
    const handlePipeline = vi.fn();

    render(
      <VolunteeringPostBoard
        posts={posts}
        onCreatePost={handleCreate}
        onUpdatePost={handleUpdate}
        onDeletePost={handleDelete}
        onOpenPipeline={handlePipeline}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /new post/i }));
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Community mentor' } });
    fireEvent.click(screen.getByRole('button', { name: /create posting/i }));
    await waitFor(() => expect(handleCreate).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /pipeline/i }));
    expect(handlePipeline).toHaveBeenCalledWith(posts[0]);

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Updated mentor role' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => expect(handleUpdate).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => expect(handleDelete).toHaveBeenCalledWith('post-1'));
  });
});
