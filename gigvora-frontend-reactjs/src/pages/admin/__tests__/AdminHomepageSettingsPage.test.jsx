import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AdminHomepageSettingsPage from '../AdminHomepageSettingsPage.jsx';

vi.mock(new URL('../../../layouts/DashboardLayout.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock(new URL('../../../components/dashboard/AccessDeniedPanel.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: (props) => <div data-testid="access-denied">Access denied {JSON.stringify(props)}</div>,
}));

const mockFetchHomepageSettings = vi.fn();
const mockUpdateHomepageSettings = vi.fn();

vi.mock(new URL('../../../services/homepageSettings.js', import.meta.url).pathname, () => ({
  __esModule: true,
  fetchHomepageSettings: (...args) => mockFetchHomepageSettings(...args),
  updateHomepageSettings: (...args) => mockUpdateHomepageSettings(...args),
}));

function createFormStub(name) {
  return ({ onChange, disabled }) => (
    <button type="button" disabled={disabled} onClick={() => onChange({ name })}>
      {name}
    </button>
  );
}

vi.mock(new URL('../../../components/admin/homepage/HomepageAnnouncementForm.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: createFormStub('announcement'),
}));

vi.mock(new URL('../../../components/admin/homepage/HomepageHeroForm.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: createFormStub('hero'),
}));

vi.mock(new URL('../../../components/admin/homepage/HomepageHighlightsForm.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: createFormStub('highlights'),
}));

vi.mock(new URL('../../../components/admin/homepage/HomepageFeatureSectionsForm.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: createFormStub('sections'),
}));

vi.mock(new URL('../../../components/admin/homepage/HomepageTestimonialsForm.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: createFormStub('testimonials'),
}));

vi.mock(new URL('../../../components/admin/homepage/HomepageFaqForm.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: createFormStub('faq'),
}));

vi.mock(new URL('../../../components/admin/homepage/HomepageQuickLinksForm.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: createFormStub('quick-links'),
}));

vi.mock(new URL('../../../components/admin/homepage/HomepageSeoForm.jsx', import.meta.url).pathname, () => ({
  __esModule: true,
  default: createFormStub('seo'),
}));

const mockUseSession = vi.fn();

vi.mock(new URL('../../../hooks/useSession.js', import.meta.url).pathname, () => ({
  __esModule: true,
  default: () => mockUseSession(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminHomepageSettingsPage />
    </MemoryRouter>,
  );
}

describe('AdminHomepageSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchHomepageSettings.mockResolvedValue({
      announcementBar: { message: 'Hello' },
    });
    mockUpdateHomepageSettings.mockResolvedValue({
      announcementBar: { message: 'Hello' },
    });
  });

  it('renders the access denied panel when admin access is missing', () => {
    mockUseSession.mockReturnValue({
      session: { permissions: [], capabilities: [] },
      profile: null,
      isAuthenticated: true,
    });

    renderPage();

    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    expect(screen.getByTestId('access-denied')).toHaveTextContent('Access denied');
    expect(mockFetchHomepageSettings).not.toHaveBeenCalled();
  });

  it('allows admins to load and update homepage settings', async () => {
    const user = userEvent.setup();
    mockUseSession.mockReturnValue({
      session: { permissions: ['admin:full'], capabilities: [] },
      profile: { name: 'Admin User' },
      isAuthenticated: true,
    });

    renderPage();

    await waitFor(() => {
      expect(mockFetchHomepageSettings).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByRole('heading', { name: /homepage settings/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'hero' }));
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateHomepageSettings).toHaveBeenCalledTimes(1);
    });
  });
});
