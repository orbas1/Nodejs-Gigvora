import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TargetsObjectivesTab from '../TargetsObjectivesTab.jsx';

describe('TargetsObjectivesTab', () => {
  const manager = {
    createTarget: vi.fn(),
    updateTarget: vi.fn(),
    deleteTarget: vi.fn(),
    createObjective: vi.fn(),
    updateObjective: vi.fn(),
    deleteObjective: vi.fn(),
  };

  it('switches between targets and objectives views', async () => {
    const user = userEvent.setup();
    render(
      <TargetsObjectivesTab
        targets={[{ id: 't1', name: 'Increase NPS' }]}
        objectives={[{ id: 'o1', name: 'Launch beta' }]}
        manager={manager}
      />,
    );

    expect(screen.getByRole('button', { name: /add target/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /objectives/i }));
    expect(screen.getByRole('button', { name: /add objective/i })).toBeInTheDocument();
  });

  it('shows read-only messaging and disables interactions when permissions block edits', () => {
    render(
      <TargetsObjectivesTab
        targets={[]}
        objectives={[]}
        manager={manager}
        disabled
        readOnlyReason="Only strategy owners can update goals."
      />,
    );

    expect(screen.getByText(/only strategy owners/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add target/i })).toBeDisabled();
  });
});
