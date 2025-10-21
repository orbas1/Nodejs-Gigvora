import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('../../../hooks/useSession.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../../../layouts/DashboardLayout.jsx', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock('../../../components/creationStudio/CreationStudioWorkspace.jsx', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="creation-studio-workspace" />),
}));

import UserCreationStudioPage from '../UserCreationStudioPage.jsx';
import useSession from '../../../hooks/useSession.js';
import CreationStudioWorkspace from '../../../components/creationStudio/CreationStudioWorkspace.jsx';

const mockUseSession = useSession;
const mockWorkspace = CreationStudioWorkspace;

function renderPage(initialEntry = '/dashboard/user/creation-studio') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/dashboard/user/creation-studio" element={<UserCreationStudioPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('UserCreationStudioPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('asks visitors to sign in when unauthenticated', () => {
    mockUseSession.mockReturnValue({ session: null, isAuthenticated: false });

    renderPage();

    expect(screen.getByText(/sign in required/i)).toBeInTheDocument();
    expect(mockWorkspace).not.toHaveBeenCalled();
  });

  it('blocks accounts without creator roles', () => {
    mockUseSession.mockReturnValue({
      session: { id: 77, memberships: ['viewer'] },
      isAuthenticated: true,
    });

    renderPage();

    expect(screen.getByText(/creation studio unavailable/i)).toBeInTheDocument();
    expect(mockWorkspace).not.toHaveBeenCalled();
  });

  it('renders the workspace for creator accounts with query params', () => {
    mockUseSession.mockReturnValue({
      session: { id: 88, memberships: ['freelancer'] },
      isAuthenticated: true,
    });

    renderPage('/dashboard/user/creation-studio?create=1&item=5');

    expect(screen.getByTestId('creation-studio-workspace')).toBeInTheDocument();
    expect(mockWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: 88, hasAccess: true, startFresh: true, initialItemId: 5 }),
      expect.anything(),
    );
  });
});
