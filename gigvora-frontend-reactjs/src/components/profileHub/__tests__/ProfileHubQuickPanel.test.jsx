import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileHubQuickPanel from '../ProfileHubQuickPanel.jsx';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('ProfileHubQuickPanel', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('renders overview details and triggers provided open handler', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();

    render(
      <ProfileHubQuickPanel
        profileOverview={{ name: 'Jordan Lee', headline: 'Product Lead', location: 'Berlin' }}
        profileHub={{ followers: { total: 3 }, connections: { total: 5 } }}
        onOpen={onOpen}
      />,
    );

    expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
    expect(screen.getByText('Product Lead')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /workspace/i }));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('navigates to the workspace route when no handler is provided', async () => {
    const user = userEvent.setup();

    render(
      <ProfileHubQuickPanel
        profileOverview={{ name: 'Jordan Lee', headline: 'Product Lead', location: 'Berlin' }}
        profileHub={{ followers: { total: 1 }, connections: { total: 2 } }}
      />,
    );

    await user.click(screen.getByRole('button', { name: /workspace/i }));
    expect(navigateMock).toHaveBeenCalledWith('/dashboard/user/profile');
  });
});
