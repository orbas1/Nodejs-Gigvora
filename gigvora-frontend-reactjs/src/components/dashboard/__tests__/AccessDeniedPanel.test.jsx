import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccessDeniedPanel from '../AccessDeniedPanel.jsx';

describe('AccessDeniedPanel', () => {
  it('highlights missing scopes for the requested role', () => {
    render(<AccessDeniedPanel role="company" userScopes={['company:dashboard']} />);

    expect(screen.getByText(/required permissions/i)).toBeInTheDocument();
    expect(screen.getByText(/company:manage/i)).toBeInTheDocument();
  });

  it('navigates to an alternative dashboard when requested', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<AccessDeniedPanel availableDashboards={['user']} onNavigate={onNavigate} />);

    await user.click(screen.getByRole('button', { name: /switch to user/i }));

    expect(onNavigate).toHaveBeenCalledWith('user');
  });

  it('renders support contact details when provided', () => {
    render(<AccessDeniedPanel supportEmail="access@gigvora.test" />);

    const supportLink = screen.getByRole('link', { name: /contact support/i });
    expect(supportLink).toHaveAttribute('href', 'mailto:access@gigvora.test');
  });
});
