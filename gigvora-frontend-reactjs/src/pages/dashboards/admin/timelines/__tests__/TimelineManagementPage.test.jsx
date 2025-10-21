import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TimelineManagementPage from '../TimelineManagementPage.jsx';

const mockUseSession = vi.fn();

vi.mock('../../../../hooks/useSession.js', () => ({
  default: () => mockUseSession(),
}));

vi.mock('../TimelineWorkspace.jsx', () => ({
  default: () => <div data-testid="workspace">Workspace loaded</div>,
}));

beforeEach(() => {
  mockUseSession.mockReset();
});

describe('TimelineManagementPage', () => {
  it('denies access to non-admin users', () => {
    mockUseSession.mockReturnValue({ session: { roles: ['member'] } });
    render(<TimelineManagementPage />);

    expect(screen.getByText(/admin access required/i)).toBeVisible();
  });

  it('renders workspace for admin users', () => {
    mockUseSession.mockReturnValue({ session: { roles: ['admin'] } });
    render(<TimelineManagementPage />);

    expect(screen.getByTestId('workspace')).toHaveTextContent('Workspace loaded');
  });
});
