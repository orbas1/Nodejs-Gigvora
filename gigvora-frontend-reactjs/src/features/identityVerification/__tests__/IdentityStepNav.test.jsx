import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import IdentityStepNav from '../IdentityStepNav.jsx';
import { IDENTITY_STEPS } from '../constants.js';

describe('IdentityStepNav', () => {
  it('highlights the active step and calls onSelect when clicked', () => {
    const handleSelect = vi.fn();

    render(
      <IdentityStepNav
        activeStep="documents"
        status="submitted"
        onSelect={handleSelect}
        nextActions={[{ id: 'verify', label: 'Verify identity', priority: 'high' }]}
      />,
    );

    const activeButton = screen.getByRole('button', { name: /files/i });
    expect(activeButton.className).toMatch(/bg-slate-900/);

    const profileButton = screen.getAllByRole('button', { name: /profile/i })[0];
    fireEvent.click(profileButton);
    expect(handleSelect).toHaveBeenCalledWith('details');

    expect(screen.getByText('Verify identity')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument();
  });

  it('renders all steps in the defined order', () => {
    render(<IdentityStepNav activeStep="details" />);

    const buttons = screen.getAllByRole('button', { name: /\d$/ });
    expect(buttons).toHaveLength(IDENTITY_STEPS.length);
    IDENTITY_STEPS.forEach((step, index) => {
      expect(buttons[index]).toHaveTextContent(step.label);
    });
  });
});
