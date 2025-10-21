import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import WalletAlertsPanel from '../panels/WalletAlertsPanel.jsx';
import WalletSummaryPanel from '../panels/WalletSummaryPanel.jsx';
import { formatCurrency } from '../walletFormatting.js';

describe('Wallet panels', () => {
  describe('WalletAlertsPanel', () => {
    it('announces the absence of alerts', () => {
      render(<WalletAlertsPanel alerts={[]} />);
      const container = screen.getByRole('heading', { name: /alerts/i }).closest('#wallet-alerts');
      expect(container).not.toBeNull();
      expect(container).toHaveAttribute('aria-live', 'polite');
      expect(screen.getByText(/all clear/i)).toBeInTheDocument();
    });

    it('renders actionable alerts with severity cues', () => {
      const alerts = [
        { id: 'alert-1', message: 'Manual review required', severity: 'critical' },
        { id: 'alert-2', message: 'Settlement delayed', severity: 'warning' },
      ];

      render(<WalletAlertsPanel alerts={alerts} />);

      expect(screen.getByText(alerts[0].message)).toHaveAttribute('role', 'alert');
      expect(screen.getByText(alerts[0].message).className).toMatch(/rose/);
      expect(screen.getByText(alerts[1].message).className).toMatch(/amber/);
    });
  });

  describe('WalletSummaryPanel', () => {
    it('summarises wallet health and forwards interactions', async () => {
      const onSelectAccount = vi.fn();
      const onOpenTransfers = vi.fn();

      const summary = {
        totalBalance: 12500,
        availableBalance: 9300,
        pendingHoldBalance: 3200,
        accountCount: 2,
        complianceStatus: 'active',
        ledgerIntegrity: 'ready',
        appStoreCompliant: true,
        currency: 'USD',
      };

      const accounts = [
        {
          id: 'wallet-1',
          label: 'Primary wallet',
          availableBalance: 9300,
          currencyCode: 'USD',
          complianceStatus: 'active',
          accountType: 'primary',
          lastEntryAt: '2024-03-17T09:24:00.000Z',
        },
        null,
      ];

      const transfers = [
        { id: 'tr-1', amount: 500, currencyCode: 'USD', status: 'pending' },
      ];

      render(
        <WalletSummaryPanel
          summary={summary}
          accounts={accounts}
          pendingTransfers={transfers}
          onSelectAccount={onSelectAccount}
          onOpenTransfers={onOpenTransfers}
        />,
      );

      const totalMetric = screen.getAllByRole('button', { name: /total/i })[0];
      const availableMetric = screen.getAllByRole('button', { name: /available/i })[0];

      expect(within(totalMetric).getByText(formatCurrency(summary.totalBalance, 'USD'))).toBeInTheDocument();
      expect(within(availableMetric).getByText(formatCurrency(summary.availableBalance, 'USD'))).toBeInTheDocument();
      expect(screen.getByText(/View transfers/i)).toBeInTheDocument();

      await userEvent.click(totalMetric);
      await userEvent.click(screen.getByRole('button', { name: /view transfers/i }));

      expect(onSelectAccount).toHaveBeenCalledWith(accounts[0]);
      expect(onOpenTransfers).toHaveBeenCalled();

      expect(screen.getAllByRole('button', { name: /primary wallet/i })).toHaveLength(1);
    });
  });
});
