import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AgencyBlogManagementPage from '../AgencyBlogManagementPage.jsx';

vi.mock(new URL('../../../layouts/DashboardLayout.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock(new URL('../../../components/dashboard/AccessDeniedPanel.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: (props) => <div data-testid="access-denied">{JSON.stringify(props)}</div>,
}));

vi.mock(new URL('../../../components/agency/blog/AgencyBlogManager.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: () => <div data-testid="blog-manager" />,
}));

const mockUseSession = vi.fn();

vi.mock(new URL('../../../hooks/useSession.js', import.meta.url).pathname, () => ({
  __esModule: true,
  default: () => mockUseSession(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AgencyBlogManagementPage />
    </MemoryRouter>,
  );
}

describe('AgencyBlogManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders access denied when not authenticated', () => {
    mockUseSession.mockReturnValue({ session: null, isAuthenticated: false });

    renderPage();

    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    expect(screen.getByTestId('access-denied')).toBeInTheDocument();
    expect(screen.queryByTestId('blog-manager')).not.toBeInTheDocument();
  });

  it('renders the blog manager when agency access is granted', () => {
    mockUseSession.mockReturnValue({ session: { memberships: ['agency'] }, isAuthenticated: true });

    renderPage();

    expect(screen.getByTestId('blog-manager')).toBeInTheDocument();
    expect(screen.queryByTestId('access-denied')).not.toBeInTheDocument();
  });
});
