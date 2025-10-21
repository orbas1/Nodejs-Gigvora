import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminApiManagementPage from '../pages/admin/AdminApiManagementPage.jsx';
import AdminBlogManagementPage from '../pages/admin/AdminBlogManagementPage.jsx';
import AdminCalendarPage from '../pages/admin/AdminCalendarPage.jsx';
import useSession from '../hooks/useSession.js';

const { dashboardLayoutMock } = vi.hoisted(() => {
  const mock = vi.fn(({ title, children }) => (
    <section data-testid="dashboard-layout" data-title={title}>
      {children}
    </section>
  ));
  return { dashboardLayoutMock: mock };
});

vi.mock('../layouts/DashboardLayout.jsx', () => ({
  __esModule: true,
  default: dashboardLayoutMock,
}));

vi.mock('../components/admin/api/ApiProviderForm.jsx', () => ({
  default: () => <div data-testid="api-provider-form" />,
}));

vi.mock('../components/admin/api/ApiClientForm.jsx', () => ({
  default: () => <div data-testid="api-client-form" />,
}));

vi.mock('../components/admin/api/ApiClientUsageForm.jsx', () => ({
  default: () => <div data-testid="api-client-usage-form" />,
}));

vi.mock('../components/admin/api/ApiKeySecretModal.jsx', () => ({
  default: () => <div data-testid="api-key-secret-modal" />,
}));

vi.mock('../components/admin/api/ApiOverviewPanel.jsx', () => ({
  default: () => <div data-testid="api-overview-panel" />,
}));

vi.mock('../components/admin/api/ApiProvidersPanel.jsx', () => ({
  default: () => <div data-testid="api-providers-panel" />,
}));

vi.mock('../components/admin/api/ApiClientsPanel.jsx', () => ({
  default: () => <div data-testid="api-clients-panel" />,
}));

vi.mock('../components/admin/api/ApiAuditPanel.jsx', () => ({
  default: () => <div data-testid="api-audit-panel" />,
}));

vi.mock('../components/admin/blog/BlogPostEditor.jsx', () => ({
  default: () => <div data-testid="blog-editor" />,
}));

vi.mock('../components/admin/blog/BlogPostLibrary.jsx', () => ({
  default: () => <div data-testid="blog-library" />,
}));

vi.mock('../components/admin/blog/BlogCategoryManager.jsx', () => ({
  default: () => <div data-testid="blog-categories" />,
}));

vi.mock('../components/admin/blog/BlogTagManager.jsx', () => ({
  default: () => <div data-testid="blog-tags" />,
}));

vi.mock('../components/admin/blog/BlogMetricsPanel.jsx', () => ({
  default: () => <div data-testid="blog-metrics" />,
}));

vi.mock('../components/admin/blog/BlogCommentsPanel.jsx', () => ({
  default: () => <div data-testid="blog-comments" />,
}));

vi.mock('../components/admin/AdminCalendarConsole.jsx', () => ({
  default: () => <div data-testid="calendar-console" />,
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

vi.mock('../hooks/useSession.js', () => ({
  default: vi.fn(),
}));

vi.mock('../services/adminApi.js', () => ({
  fetchApiRegistry: vi.fn(),
  createApiProvider: vi.fn(),
  updateApiProvider: vi.fn(),
  createApiClient: vi.fn(),
  updateApiClient: vi.fn(),
  issueApiClientKey: vi.fn(),
  revokeApiClientKey: vi.fn(),
  rotateWebhookSecret: vi.fn(),
  fetchClientAuditEvents: vi.fn(),
  recordClientUsage: vi.fn(),
}));

vi.mock('../services/blog.js', () => ({
  fetchAdminBlogPosts: vi.fn(),
  createAdminBlogPost: vi.fn(),
  updateAdminBlogPost: vi.fn(),
  deleteAdminBlogPost: vi.fn(),
  fetchBlogCategories: vi.fn(),
  createBlogCategory: vi.fn(),
  updateBlogCategory: vi.fn(),
  deleteBlogCategory: vi.fn(),
  fetchBlogTags: vi.fn(),
  createBlogTag: vi.fn(),
  updateBlogTag: vi.fn(),
  deleteBlogTag: vi.fn(),
  fetchAdminBlogMetrics: vi.fn(),
  updateAdminBlogPostMetrics: vi.fn(),
  fetchAdminBlogComments: vi.fn(),
  createAdminBlogComment: vi.fn(),
  updateAdminBlogComment: vi.fn(),
  deleteAdminBlogComment: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('Admin access pages', () => {
  beforeEach(() => {
    dashboardLayoutMock.mockClear();
    useSession.mockReset();
  });

  it('blocks non-admin users from the API management console', () => {
    useSession.mockReturnValue({ session: { roles: ['user'] }, isAuthenticated: true });

    render(<AdminApiManagementPage />);

    expect(screen.getByText('Admin role required.')).toBeInTheDocument();
    expect(dashboardLayoutMock).toHaveBeenCalled();
  });

  it('blocks non-admin users from the blog management workspace', () => {
    useSession.mockReturnValue({ session: { memberships: ['company'] }, isAuthenticated: true });

    render(<AdminBlogManagementPage />);

    expect(screen.getByText('Admin access required to manage the Gigvora blog workspace.')).toBeInTheDocument();
  });

  it('shows a restricted message on the admin calendar for non-admins', () => {
    useSession.mockReturnValue({ session: { memberships: ['user'] }, isAuthenticated: true });

    render(<AdminCalendarPage />);

    expect(screen.getByTestId('access-restricted')).toBeInTheDocument();
    expect(screen.getByText('Admin permissions required')).toBeInTheDocument();
  });

  it('renders the admin calendar console for admins', () => {
    useSession.mockReturnValue({ session: { memberships: ['admin'] }, isAuthenticated: true });

    render(<AdminCalendarPage />);

    expect(screen.getByTestId('calendar-console')).toBeInTheDocument();
  });
});
