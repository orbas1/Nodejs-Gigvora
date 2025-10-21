import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AvailabilityCard from '../AvailabilityCard.jsx';

describe('AvailabilityCard', () => {
  it('displays formatted hours and rate', () => {
    render(
      <AvailabilityCard
        availability={{ status: 'available', hoursPerWeek: 30, openToRemote: true }}
        hourlyRate={125}
      />,
    );

    expect(screen.getByText('30 hrs/week')).toBeInTheDocument();
    expect(screen.getByText('$125 / hr')).toBeInTheDocument();
  });

  it('shows fallbacks when data is missing and triggers manage handler', async () => {
    const user = userEvent.setup();
    const handleManage = vi.fn();

    render(<AvailabilityCard availability={{}} onManage={handleManage} />);

    expect(screen.getByText('Hours not set')).toBeInTheDocument();
    expect(screen.getByText('Rate hidden')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /availability/i }));
    expect(handleManage).toHaveBeenCalled();
  });
});
