import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import MainLayout from '../layouts/MainLayout.jsx';
import AdminLoginPage from '../pages/AdminLoginPage.jsx';
import AboutPage from '../pages/AboutPage.jsx';

vi.mock('../components/messaging/MessagingDock.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="messaging-dock" />,
}));

vi.mock('../components/ads/AdPlacementRail.jsx', () => ({
  __esModule: true,
  default: () => <aside data-testid="ad-rail" />,
}));

vi.mock('../components/Header.jsx', () => ({
  __esModule: true,
  default: () => <header data-testid="header">Header</header>,
}));

vi.mock('../components/Footer.jsx', () => ({
  __esModule: true,
  default: () => <footer data-testid="footer">Footer</footer>,
}));

vi.mock('../components/policy/PolicyAcknowledgementBanner.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="policy-banner" />,
}));

vi.mock('../components/support/ChatwootWidget.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="chat-widget" />,
}));

vi.mock('../components/support/SupportLauncher.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="support-launcher" />,
}));

const {
  useSessionMock,
  requestAdminTwoFactorMock,
  verifyTwoFactorCodeMock,
  useSiteDocumentMock,
} = vi.hoisted(() => ({
  useSessionMock: vi.fn(() => ({
    session: null,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
  })),
  requestAdminTwoFactorMock: vi.fn(),
  verifyTwoFactorCodeMock: vi.fn(),
  useSiteDocumentMock: vi.fn(() => ({
    page: { title: 'About Gigvora', body: '', summary: 'Summary' },
    sections: [
      { id: 'mission', title: 'Mission', blocks: [{ type: 'paragraph', text: 'Ship outcomes.' }] },
    ],
    metadata: { summary: 'Summary', lastUpdated: new Date().toISOString() },
    hero: { title: 'About Gigvora', description: 'Why teams trust us.' },
    loading: false,
    error: null,
    refresh: vi.fn(),
    usingFallback: false,
    lastFetchedAt: new Date(),
    lastErrorAt: null,
  })),
}));

vi.mock('../hooks/useSession.js', () => ({
  __esModule: true,
  default: useSessionMock,
}));

vi.mock('../services/auth.js', () => ({
  __esModule: true,
  requestAdminTwoFactor: requestAdminTwoFactorMock,
  verifyTwoFactorCode: verifyTwoFactorCodeMock,
}));

vi.mock('../hooks/useSiteDocument.js', () => ({
  __esModule: true,
  default: useSiteDocumentMock,
}));

describe('DashboardLayout', () => {
  beforeEach(() => {
    useSessionMock.mockReturnValue({ session: null, isAuthenticated: true, login: vi.fn(), logout: vi.fn() });
  });

  it('renders navigation with accessibility attributes and handles selection', async () => {
    const onMenuItemSelect = vi.fn();
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardLayout
          title="Control centre"
          menuSections={[
            {
              id: 'team',
              label: 'Team',
              items: [
                { id: 'overview', name: 'Overview', description: 'Summary', href: '/dashboard/overview' },
              ],
            },
          ]}
          onMenuItemSelect={onMenuItemSelect}
          activeMenuItem="overview"
        >
          <div data-testid="dashboard-content">Content</div>
        </DashboardLayout>
      </MemoryRouter>,
    );

    const toggle = screen.getByRole('button', { name: /team/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    const menuItem = screen.getByRole('button', { name: /overview/i });
    expect(menuItem).toHaveAttribute('aria-current', 'page');

    fireEvent.click(menuItem);
    expect(onMenuItemSelect).toHaveBeenCalledWith('overview', expect.objectContaining({ id: 'overview' }));
  });
});

describe('MainLayout', () => {
  beforeEach(() => {
    useSessionMock.mockReturnValue({ session: null, isAuthenticated: false, login: vi.fn(), logout: vi.fn() });
  });

  it('provides a skip link and renders outlet content', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<div data-testid="main-content-body">Body</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const skipLink = screen.getByText(/skip to main content/i);
    expect(skipLink).toBeInTheDocument();
    expect(screen.getByTestId('main-content-body')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});

describe('AdminLoginPage', () => {
  beforeEach(() => {
    requestAdminTwoFactorMock.mockResolvedValue({});
    verifyTwoFactorCodeMock.mockResolvedValue({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: { id: 'admin-1', email: 'ops@gigvora.com', userType: 'admin' },
    });
    const loginMock = vi.fn();
    useSessionMock.mockReturnValue({ session: {}, isAuthenticated: false, login: loginMock, logout: vi.fn() });
  });

  it('drives the two-step admin login flow', async () => {
    render(
      <MemoryRouter>
        <AdminLoginPage />
      </MemoryRouter>,
    );

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/admin email/i), 'ops@gigvora.com');
    await user.type(screen.getByLabelText(/password/i), 'SuperSecret1!');
    await user.click(screen.getByRole('button', { name: /continue to 2fa/i }));

    expect(requestAdminTwoFactorMock).toHaveBeenCalledWith({ email: 'ops@gigvora.com', password: 'SuperSecret1!' });

    await user.type(screen.getByLabelText(/enter 6-digit code/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify & access admin panel/i }));

    expect(verifyTwoFactorCodeMock).toHaveBeenCalledWith({ email: 'ops@gigvora.com', code: '123456' });
    const { login } = useSessionMock.mock.results.at(-1).value;
    expect(login).toHaveBeenCalledWith(expect.objectContaining({ email: 'ops@gigvora.com', role: 'admin' }));
  });
});

describe('AboutPage', () => {
  beforeEach(() => {
    useSessionMock.mockReturnValue({ session: null, isAuthenticated: false, login: vi.fn(), logout: vi.fn() });
  });

  it('renders hero content from the site document hook', () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /about gigvora/i })).toBeInTheDocument();
    expect(screen.getByText(/ship outcomes/i)).toBeInTheDocument();
  });
});
