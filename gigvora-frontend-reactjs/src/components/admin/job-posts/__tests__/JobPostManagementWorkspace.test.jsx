import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../../../services/adminJobPosts.js', () => ({
  fetchAdminJobPosts: vi.fn(),
  createAdminJobPost: vi.fn(),
  updateAdminJobPost: vi.fn(),
  publishAdminJobPost: vi.fn(),
  archiveAdminJobPost: vi.fn(),
  deleteAdminJobPost: vi.fn(),
}));

vi.mock('../JobPostBoard.jsx', () => ({
  __esModule: true,
  default: ({ onSelectJob, onNewJob, onRefresh }) => (
    <div>
      <button type="button" onClick={() => onRefresh?.()}>
        refresh board
      </button>
      <button type="button" onClick={() => onNewJob?.()}>
        open wizard
      </button>
      <button
        type="button"
        onClick={() =>
          onSelectJob?.({
            id: 'job-1',
            title: 'Mock job',
            description: 'Details',
            employmentType: 'full_time',
            location: 'Remote',
            detail: { status: 'draft', visibility: 'public', workflowStage: 'draft' },
          })
        }
      >
        open drawer
      </button>
    </div>
  ),
}));

vi.mock('../JobPostDetailDrawer.jsx', () => ({
  __esModule: true,
  default: ({ job, open, onPublish, onArchive, onDelete, onClose }) =>
    open ? (
      <div data-testid="drawer">
        <span>{job?.title}</span>
        <button type="button" onClick={() => onPublish?.()}>
          publish job
        </button>
        <button type="button" onClick={() => onArchive?.('Archived')}>
          archive job
        </button>
        <button type="button" onClick={() => onDelete?.(false)}>
          delete job
        </button>
        <button type="button" onClick={() => onClose?.()}>
          close drawer
        </button>
      </div>
    ) : null,
}));

vi.mock('../JobPostWizard.jsx', () => ({
  __esModule: true,
  default: ({ open, onSubmit, onClose }) => {
    if (!open) {
      return null;
    }
    const form = {
      title: 'New wizard job',
      slug: '',
      description: 'From wizard',
      status: 'draft',
      workflowStage: 'draft',
      approvalStatus: 'pending_review',
      visibility: 'public',
      workplaceType: 'hybrid',
      employmentType: 'full_time',
      contractType: 'full_time',
      experienceLevel: 'mid',
      compensationType: 'salary',
      promotionFlags: {},
      benefits: [''],
      responsibilities: [''],
      requirements: [''],
      attachments: [{ label: '', url: '', type: '' }],
      tagsText: '',
      metadataJson: '',
    };
    return (
      <div data-testid="wizard">
        <button type="button" onClick={() => onSubmit?.(form)}>
          submit wizard
        </button>
        <button type="button" onClick={() => onClose?.()}>
          close wizard
        </button>
      </div>
    );
  },
}));

const services = await import('../../../../services/adminJobPosts.js');
const JobPostManagementWorkspace = (await import('../JobPostManagementWorkspace.jsx')).default;

async function runInAct(callback) {
  await act(async () => {
    await callback();
  });
}

describe('JobPostManagementWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads listings and handles lifecycle actions', async () => {
    services.fetchAdminJobPosts.mockResolvedValue({
      results: [
        {
          id: 'job-1',
          title: 'Mock job',
          description: 'Details',
          employmentType: 'full_time',
          location: 'Remote',
          detail: { status: 'draft', visibility: 'public', workflowStage: 'draft' },
        },
      ],
      summary: { statusCounts: { draft: 1 } },
      pagination: { page: 1, totalPages: 1, total: 1 },
    });

    services.createAdminJobPost.mockResolvedValue({ id: 'job-2' });
    services.publishAdminJobPost.mockResolvedValue({
      id: 'job-1',
      detail: { status: 'live', workflowStage: 'active' },
    });
    services.archiveAdminJobPost.mockResolvedValue({
      id: 'job-1',
      detail: { status: 'archived', workflowStage: 'archived' },
    });
    services.deleteAdminJobPost.mockResolvedValue({
      id: 'job-1',
      detail: { status: 'archived', workflowStage: 'archived' },
    });

    render(<JobPostManagementWorkspace />);

    await waitFor(() => expect(services.fetchAdminJobPosts).toHaveBeenCalled());

    const user = userEvent.setup();
    await runInAct(async () => {
      await user.click(screen.getByText(/refresh board/i));
    });
    expect(services.fetchAdminJobPosts).toHaveBeenCalledTimes(2);

    await runInAct(async () => {
      await user.click(screen.getByText(/open wizard/i));
    });
    await runInAct(async () => {
      await user.click(screen.getByText(/submit wizard/i));
    });
    await waitFor(() => expect(services.createAdminJobPost).toHaveBeenCalled());

    await runInAct(async () => {
      await user.click(screen.getByText(/open drawer/i));
    });
    await runInAct(async () => {
      const publishButton = await screen.findByText(/publish job/i);
      await user.click(publishButton);
    });
    expect(services.publishAdminJobPost).toHaveBeenCalledWith('job-1', expect.objectContaining({ publishedAt: expect.any(String) }));

    await runInAct(async () => {
      await user.click(screen.getByText(/archive job/i));
    });
    const archiveNote = await screen.findByLabelText(/archive note/i);
    await runInAct(async () => {
      await user.type(archiveNote, 'Archived');
    });
    await runInAct(async () => {
      const confirmArchive = (await screen.findAllByRole('button', { name: /^archive$/i })).at(-1);
      await user.click(confirmArchive);
    });
    await waitFor(() =>
      expect(services.archiveAdminJobPost).toHaveBeenCalledWith('job-1', { reason: 'Archived' }),
    );

    await runInAct(async () => {
      await user.click(screen.getByText(/delete job/i));
    });
    await runInAct(async () => {
      const confirmDelete = (await screen.findAllByRole('button', { name: /^delete$/i })).at(-1);
      await user.click(confirmDelete);
    });
    await waitFor(() =>
      expect(services.deleteAdminJobPost).toHaveBeenCalledWith('job-1', { hardDelete: false }),
    );
  });
});
