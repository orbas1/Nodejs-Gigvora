import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import EscrowAutomationPanel from '../EscrowAutomationPanel.jsx';

describe('EscrowAutomationPanel', () => {
  it('prefills automation details and submits updates', async () => {
    const onUpdate = vi.fn().mockResolvedValue();
    render(
      <EscrowAutomationPanel
        automation={{
          autoReleaseEnabled: false,
          manualReviewThreshold: 5000,
          notifyFinanceTeam: true,
          defaultReleaseOffsetHours: 48,
          releasePolicy: 'manual',
          webhookUrl: 'https://hooks.example.com/escrow',
        }}
        onUpdate={onUpdate}
        currentUserId={32}
      />,
    );

    expect(screen.getByLabelText(/manual review limit/i)).toHaveValue(5000);
    expect(screen.getByLabelText(/release offset/i)).toHaveValue(48);
    expect(screen.getByLabelText(/policy/i)).toHaveValue('manual');

    fireEvent.click(screen.getByRole('button', { name: /auto release/i }));
    fireEvent.change(screen.getByLabelText(/manual review limit/i), { target: { value: '8000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        autoReleaseEnabled: true,
        manualReviewThreshold: 8000,
        actorId: 32,
      }),
    );
  });
});
