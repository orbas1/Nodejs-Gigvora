import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { act } from 'react';
import ProjectsPage from '../pages/ProjectsPage.jsx';
import ProjectCreatePage from '../pages/ProjectCreatePage.jsx';
import ProjectDetailPage from '../pages/ProjectDetailPage.jsx';
import ProjectAutoMatchPage from '../pages/ProjectAutoMatchPage.jsx';
import useSession from '../hooks/useSession.js';
import useOpportunityListing from '../hooks/useOpportunityListing.js';
import { useProjectManagementAccess } from '../hooks/useAuthorization.js';
import useRoleAccess from '../hooks/useRoleAccess.js';
import useCachedResource from '../hooks/useCachedResource.js';
import projectsService from '../services/projects.js';
import { enqueueProjectAssignments, fetchProjectQueue } from '../services/autoAssign.js';

const { mockNavigate, analyticsTrack } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  analyticsTrack: vi.fn(),
}));

vi.mock('../components/PageHeader.jsx', () => ({
  default: ({ title, description, meta, actions, eyebrow }) => (
    <header data-testid="page-header">
      {eyebrow ? <span>{eyebrow}</span> : null}
      <h1>{title}</h1>
      <p>{description}</p>
      {actions}
      {meta}
    </header>
  ),
}));

vi.mock('../components/DataStatus.jsx', () => ({
  default: ({ loading, onRefresh }) => (
    <div data-testid="data-status">
      {loading ? 'loading' : 'ready'}
      {onRefresh ? <button type="button" onClick={() => onRefresh({ force: true })}>refresh</button> : null}
    </div>
  ),
}));

vi.mock('../components/UserAvatar.jsx', () => ({
  default: ({ name }) => <span data-testid="avatar">{name}</span>,
}));

vi.mock('../components/projects/ProjectOperationsSection.jsx', () => ({
  default: () => <div data-testid="operations-section" />,
}));

vi.mock('../components/projects/ProjectWorkspaceSection.jsx', () => ({
  default: () => <div data-testid="workspace-section" />,
}));

vi.mock('../components/AccessRestricted.jsx', () => ({
  __esModule: true,
  default: ({ title, description, actionLabel }) => (
    <div data-testid="access-restricted">
      <h2>{title}</h2>
      <p>{description}</p>
      {actionLabel ? <button type="button">{actionLabel}</button> : null}
    </div>
  ),
}));

vi.mock('../services/analytics.js', () => ({
  default: { track: analyticsTrack },
}));

vi.mock('../hooks/useSession.js', () => ({
  default: vi.fn(),
}));

vi.mock('../hooks/useOpportunityListing.js', () => ({
  default: vi.fn(),
}));

vi.mock('../hooks/useAuthorization.js', () => ({
  useProjectManagementAccess: vi.fn(),
}));

vi.mock('../hooks/useRoleAccess.js', () => ({
  default: vi.fn(),
}));

vi.mock('../hooks/useCachedResource.js', () => ({
  default: vi.fn(),
}));

vi.mock('../services/projects.js', () => ({
  default: {
    fetchProject: vi.fn(),
    fetchProjectEvents: vi.fn(),
    createProject: vi.fn(),
  },
}));

vi.mock('../services/autoAssign.js', () => ({
  enqueueProjectAssignments: vi.fn(),
  fetchProjectQueue: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderRoute(route) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/new" element={<ProjectCreatePage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="/projects/:projectId/auto-match" element={<ProjectAutoMatchPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Projects workspace surfaces', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    analyticsTrack.mockReset();
    useSession.mockReset();
    useOpportunityListing.mockReset();
    useProjectManagementAccess.mockReset();
    useRoleAccess.mockReset();
    useCachedResource.mockReset();
    projectsService.fetchProject.mockReset();
    projectsService.fetchProjectEvents.mockReset();
    projectsService.createProject.mockReset();
    enqueueProjectAssignments.mockReset();
    fetchProjectQueue.mockReset();
  });

  it('prompts restricted users on the projects listing', () => {
    useSession.mockReturnValue({ session: { memberships: ['user'] }, isAuthenticated: true });
    useProjectManagementAccess.mockReturnValue({ canManageProjects: false, denialReason: 'Operations clearance required.' });
    useOpportunityListing.mockReturnValue({
      data: { items: [] },
      error: null,
      loading: false,
      fromCache: false,
      lastUpdated: null,
      refresh: vi.fn(),
      debouncedQuery: '',
    });

    renderRoute('/projects');

    expect(screen.getByText('Restricted workspace')).toBeInTheDocument();
    expect(screen.getByText(/Operations clearance required\./i)).toBeInTheDocument();
  });

  it('renders project cards when data is available', () => {
    useSession.mockReturnValue({ session: { memberships: ['admin'] }, isAuthenticated: true });
    useProjectManagementAccess.mockReturnValue({ canManageProjects: true, denialReason: null });
    useOpportunityListing.mockReturnValue({
      data: {
        items: [
          {
            id: 'proj-1',
            title: 'Global Residency',
            description: 'Support a global launch.',
            status: 'planning',
            updatedAt: '2024-08-01T10:00:00.000Z',
            autoAssignEnabled: true,
            autoAssignStatus: 'pending',
          },
        ],
      },
      error: null,
      loading: false,
      fromCache: false,
      lastUpdated: '2024-08-01T12:00:00.000Z',
      refresh: vi.fn(),
      debouncedQuery: '',
    });

    renderRoute('/projects');

    expect(screen.getByText('Global Residency')).toBeInTheDocument();
  });

  it('blocks project creation when access is missing', () => {
    useSession.mockReturnValue({ session: { memberships: ['user'] }, isAuthenticated: true });
    useProjectManagementAccess.mockReturnValue({ canManageProjects: false, denialReason: 'Admin role required.' });

    renderRoute('/projects/new');

    expect(screen.getByText('Project workspace locked')).toBeInTheDocument();
    expect(screen.getByText('Admin role required.')).toBeInTheDocument();
  });

  it('submits a new project when authorised', async () => {
    const user = userEvent.setup();
    const createResponse = { project: { id: 'new-project' } };
    projectsService.createProject.mockResolvedValue(createResponse);
    useSession.mockReturnValue({ session: { memberships: ['admin'], userId: 'user-1' }, isAuthenticated: true });
    useProjectManagementAccess.mockReturnValue({ canManageProjects: true, denialReason: null });

    renderRoute('/projects/new');

    await act(async () => {
      await user.type(screen.getByLabelText('Project title'), 'New Venture Build');
      await user.type(screen.getByLabelText('Description'), 'Deliver a new venture programme.');
      await user.click(screen.getByRole('button', { name: 'Create project' }));
    });

    await waitFor(() => {
      expect(projectsService.createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Venture Build',
          description: 'Deliver a new venture programme.',
          autoAssign: expect.objectContaining({ enabled: true }),
        }),
      );
    });
  });

  it('gates the project detail view when access is denied', () => {
    useSession.mockReturnValue({ session: { memberships: ['user'] }, isAuthenticated: true });
    useProjectManagementAccess.mockReturnValue({ canManageProjects: false, denialReason: 'Operations access required.' });

    renderRoute('/projects/proj-9');

    expect(screen.getByText('Project workspace locked')).toBeInTheDocument();
    expect(screen.getByText('Operations access required.')).toBeInTheDocument();
  });

  it('loads project data when access is granted', async () => {
    useSession.mockReturnValue({ session: { memberships: ['admin'] }, isAuthenticated: true });
    useProjectManagementAccess.mockReturnValue({ canManageProjects: true, denialReason: null });
    projectsService.fetchProject.mockResolvedValue({
      project: { id: 'proj-42', title: 'Project 42', autoAssignLastRunAt: '2024-08-01T10:00:00.000Z' },
      queueEntries: [],
    });
    projectsService.fetchProjectEvents.mockResolvedValue({ events: [] });

    render(
      <MemoryRouter initialEntries={['/projects/proj-42']}>
        <Routes>
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(projectsService.fetchProject).toHaveBeenCalledWith('proj-42');
      expect(projectsService.fetchProjectEvents).toHaveBeenCalledWith('proj-42', { limit: 40 });
    });
  });

  it('requires authentication before regenerating auto-match queues', () => {
    useRoleAccess.mockReturnValue({ session: null, isAuthenticated: false, hasAccess: false });
    useCachedResource.mockReturnValue({
      data: null,
      error: null,
      loading: false,
      lastUpdated: null,
      refresh: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/projects/proj-1/auto-match']}>
        <Routes>
          <Route path="/projects/:projectId/auto-match" element={<ProjectAutoMatchPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Sign in to orchestrate auto-match')).toBeInTheDocument();
  });

  it('regenerates the auto-match queue when permitted', async () => {
    const user = userEvent.setup();
    const refreshQueue = vi.fn();
    const refreshProject = vi.fn();
    useRoleAccess.mockReturnValue({
      session: { id: 'user-1', memberships: ['company'] },
      isAuthenticated: true,
      hasAccess: true,
    });
    useCachedResource
      .mockReturnValueOnce({
        data: { project: { id: 'proj-1', autoAssignSettings: { weights: { recency: 0.25 } } } },
        error: null,
        loading: false,
        lastUpdated: new Date().toISOString(),
        refresh: refreshProject,
      })
      .mockReturnValueOnce({
        data: [
          { id: 'entry-1', position: 1, status: 'pending', freelancer: { name: 'Jordan' } },
        ],
        error: null,
        loading: false,
        lastUpdated: new Date().toISOString(),
        refresh: refreshQueue,
      })
      .mockReturnValue({
        data: [
          { id: 'entry-1', position: 1, status: 'pending', freelancer: { name: 'Jordan' } },
        ],
        error: null,
        loading: false,
        lastUpdated: new Date().toISOString(),
        refresh: refreshQueue,
      });

    enqueueProjectAssignments.mockResolvedValue({});

    const { getByRole } = render(
      <MemoryRouter initialEntries={['/projects/proj-1/auto-match']}>
        <Routes>
          <Route path="/projects/:projectId/auto-match" element={<ProjectAutoMatchPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await act(async () => {
      await user.click(getByRole('button', { name: /Regenerate queue/i }));
    });

    await waitFor(() => {
      expect(enqueueProjectAssignments).toHaveBeenCalledWith('proj-1', expect.any(Object));
      expect(refreshQueue).toHaveBeenCalledWith({ force: true });
      expect(refreshProject).toHaveBeenCalledWith({ force: true });
    });
  });
});
