import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import JobApplicationWorkspaceContainer from '../JobApplicationWorkspaceContainer.jsx';

vi.mock('../../../services/jobApplications.js', () => ({
  __esModule: true,
  fetchJobApplicationWorkspace: vi.fn(),
  createWorkspaceJobApplication: vi.fn(),
  updateWorkspaceJobApplication: vi.fn(),
  archiveWorkspaceJobApplication: vi.fn(),
  createWorkspaceJobApplicationInterview: vi.fn(),
  updateWorkspaceJobApplicationInterview: vi.fn(),
  deleteWorkspaceJobApplicationInterview: vi.fn(),
  createWorkspaceJobApplicationFavourite: vi.fn(),
  updateWorkspaceJobApplicationFavourite: vi.fn(),
  deleteWorkspaceJobApplicationFavourite: vi.fn(),
  createWorkspaceJobApplicationResponse: vi.fn(),
  updateWorkspaceJobApplicationResponse: vi.fn(),
  deleteWorkspaceJobApplicationResponse: vi.fn(),
}));

vi.mock('../WorkspaceDrawer.jsx', () => ({
  __esModule: true,
  default: ({ open, title, onClose, children }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}));

vi.mock('../forms/ApplicationForm.jsx', () => ({
  __esModule: true,
  default: ({ onSubmit }) => (
    <div>
      <button type="button" onClick={() => onSubmit({ jobTitle: 'UX Lead', currencyCode: 'USD', tags: [] })}>
        Submit form
      </button>
    </div>
  ),
}));

import {
  fetchJobApplicationWorkspace,
  createWorkspaceJobApplication,
  updateWorkspaceJobApplication,
  archiveWorkspaceJobApplication,
  createWorkspaceJobApplicationInterview,
  updateWorkspaceJobApplicationInterview,
  deleteWorkspaceJobApplicationInterview,
  createWorkspaceJobApplicationFavourite,
  updateWorkspaceJobApplicationFavourite,
  deleteWorkspaceJobApplicationFavourite,
  createWorkspaceJobApplicationResponse,
  updateWorkspaceJobApplicationResponse,
  deleteWorkspaceJobApplicationResponse,
} from '../../../services/jobApplications.js';

const serviceMocks = {
  fetchJobApplicationWorkspace,
  createWorkspaceJobApplication,
  updateWorkspaceJobApplication,
  archiveWorkspaceJobApplication,
  createWorkspaceJobApplicationInterview,
  updateWorkspaceJobApplicationInterview,
  deleteWorkspaceJobApplicationInterview,
  createWorkspaceJobApplicationFavourite,
  updateWorkspaceJobApplicationFavourite,
  deleteWorkspaceJobApplicationFavourite,
  createWorkspaceJobApplicationResponse,
  updateWorkspaceJobApplicationResponse,
  deleteWorkspaceJobApplicationResponse,
};

describe('JobApplicationWorkspaceContainer', () => {
  beforeEach(() => {
    Object.values(serviceMocks).forEach((fn) => fn.mockReset());
  });

  const baseWorkspace = {
    lastUpdated: '2024-05-20T09:00:00Z',
    summary: {
      totalApplications: 2,
      activeApplications: 1,
      interviewsScheduled: 1,
      favourites: 0,
      pendingResponses: 0,
    },
    formOptions: {
      statuses: ['submitted', 'interviewing'],
    },
    applications: [
      {
        id: 'app-1',
        status: 'submitted',
        submittedAt: '2024-05-01T12:00:00Z',
        detail: {
          title: 'Product Designer',
          companyName: 'Gigvora',
          salary: { min: 80000, max: 95000, currency: 'USD' },
        },
      },
    ],
  };

  it('renders provided workspace data and allows view switching', async () => {
    const user = userEvent.setup();

    render(<JobApplicationWorkspaceContainer userId={42} initialData={baseWorkspace} />);

    expect(screen.getByText('Job hub')).toBeInTheDocument();

    const appsButton = screen.getByRole('button', { name: /apps/i });
    await act(async () => {
      await user.click(appsButton);
    });

    expect(await screen.findByRole('button', { name: /new application/i })).toBeInTheDocument();
    expect(serviceMocks.fetchJobApplicationWorkspace).not.toHaveBeenCalled();
  });

  it('loads workspace data when initialData is not provided', async () => {
    serviceMocks.fetchJobApplicationWorkspace.mockResolvedValueOnce(baseWorkspace);

    render(<JobApplicationWorkspaceContainer userId={51} />);

    await waitFor(() => expect(serviceMocks.fetchJobApplicationWorkspace).toHaveBeenCalledWith(51));

    const companyNav = await screen.findByRole('button', { name: /company dash/i });
    expect(companyNav).toBeInTheDocument();
  });

  it('submits a new application via the drawer workflow', async () => {
    const user = userEvent.setup();

    serviceMocks.createWorkspaceJobApplication.mockResolvedValueOnce({ id: 'new-app' });
    serviceMocks.fetchJobApplicationWorkspace.mockResolvedValueOnce({
      ...baseWorkspace,
      applications: [
        ...baseWorkspace.applications,
        {
          id: 'new-app',
          status: 'submitted',
          submittedAt: '2024-05-22T14:00:00Z',
          detail: { title: 'UX Lead', companyName: 'Acme', salary: {} },
        },
      ],
    });

    render(<JobApplicationWorkspaceContainer userId={7} initialData={baseWorkspace} />);

    const appsButton = screen.getByRole('button', { name: /apps/i });
    await act(async () => {
      await user.click(appsButton);
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /new application/i }));
    });

    const drawer = await screen.findByRole('dialog', { name: /new application/i });
    await act(async () => {
      await user.click(within(drawer).getByRole('button', { name: /submit form/i }));
    });

    await waitFor(() =>
      expect(serviceMocks.createWorkspaceJobApplication).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ jobTitle: 'UX Lead', currencyCode: 'USD', tags: [] }),
      ),
    );

    await waitFor(() => expect(serviceMocks.fetchJobApplicationWorkspace).toHaveBeenCalledWith(7));
  });
});
