import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AvailabilityDrawer from '../AvailabilityDrawer.jsx';

describe('AvailabilityDrawer', () => {
  it('submits sanitised values', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn().mockResolvedValue();

    render(
      <AvailabilityDrawer
        open
        availability={{ status: 'limited', hoursPerWeek: 20, openToRemote: false, notes: 'Focus' }}
        hourlyRate={75}
        onSave={handleSave}
      />,
    );

    await user.clear(screen.getByLabelText(/hours per week/i));
    await user.type(screen.getByLabelText(/hours per week/i), '35');
    await user.clear(screen.getByLabelText(/hourly rate/i));
    await user.type(screen.getByLabelText(/hourly rate/i), '150');

    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        hoursPerWeek: 35,
        hourlyRate: 150,
        openToRemote: false,
      }),
    );
  });

  it('validates hour ranges', async () => {
    const user = userEvent.setup();

    render(<AvailabilityDrawer open availability={{ status: 'available' }} onSave={vi.fn()} />);

    await user.clear(screen.getByLabelText(/hours per week/i));
    await user.type(screen.getByLabelText(/hours per week/i), '120');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(screen.getByText(/between 0 and 80/i)).toBeInTheDocument();
  });

  it('submits null hourly rate when left blank and remote toggle changes', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn().mockResolvedValue();

    render(<AvailabilityDrawer open onSave={handleSave} availability={{ status: 'available' }} saving={false} />);

    const rateInput = screen.getByLabelText(/hourly rate/i);
    await user.clear(rateInput);
    await user.click(screen.getByLabelText(/remote ready/i));

    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({ hourlyRate: null, openToRemote: false }),
    );
  });
});
