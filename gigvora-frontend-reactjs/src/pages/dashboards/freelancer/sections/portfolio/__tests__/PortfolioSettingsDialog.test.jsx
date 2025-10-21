import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PortfolioSettingsDialog from '../PortfolioSettingsDialog.jsx';

describe('PortfolioSettingsDialog', () => {
  it('submits cleaned settings when valid', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn().mockResolvedValue();

    render(
      <PortfolioSettingsDialog
        open
        canEdit
        settings={{ heroHeadline: 'Welcome' }}
        onSave={handleSave}
        onClose={vi.fn()}
      />,
    );

    await user.clear(screen.getByLabelText(/hero headline/i));
    await user.type(screen.getByLabelText(/hero headline/i), 'Launchpad');
    await user.type(screen.getByLabelText(/contact email/i), 'founder@example.com');

    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(handleSave).toHaveBeenCalledTimes(1));
    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({ heroHeadline: 'Launchpad', contactEmail: 'founder@example.com' }),
    );
  });

  it('validates contact email format', async () => {
    const user = userEvent.setup();

    render(<PortfolioSettingsDialog open canEdit onSave={vi.fn()} />);

    await user.type(screen.getByLabelText(/contact email/i), 'invalid');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(screen.getByText(/valid contact email/i)).toBeInTheDocument();
  });
});
