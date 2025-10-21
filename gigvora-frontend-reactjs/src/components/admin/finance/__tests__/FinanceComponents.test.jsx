import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import FinancialSummaryCards from '../FinancialSummaryCards.jsx';
import RecentTransactionsTable from '../RecentTransactionsTable.jsx';
import TreasuryPolicyForm from '../TreasuryPolicyForm.jsx';

describe('FinancialSummaryCards', () => {
  it('renders treasury metrics and supports refresh action', () => {
    const handleRefresh = vi.fn();
    render(
      <FinancialSummaryCards
        summary={{
          grossEscrowVolume: 120000,
          netEscrowVolume: 95000,
          pendingReleaseTotal: 25000,
          activeScheduleCount: 12,
          activeAdjustmentCount: 3,
        }}
        lookbackDays={14}
        refreshedAt="2024-05-01T09:30:00Z"
        onRefresh={handleRefresh}
      />,
    );

    expect(screen.getByText(/Treasury control tower/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Refresh/i }));
    expect(handleRefresh).toHaveBeenCalled();
  });
});

describe('RecentTransactionsTable', () => {
  it('renders the provided transactions using default formatters', () => {
    render(
      <RecentTransactionsTable
        transactions={[
          {
            id: 'txn1',
            reference: 'TXN-100',
            type: 'release',
            status: 'settled',
            amount: 500,
            netAmount: 480,
            currencyCode: 'USD',
            account: { provider: 'stripe' },
            createdAt: '2024-05-01T12:00:00Z',
          },
        ]}
      />,
    );

    expect(screen.getByText('TXN-100')).toBeInTheDocument();
    expect(screen.getByText(/\$500/)).toBeInTheDocument();
  });
});

describe('TreasuryPolicyForm', () => {
  it('normalises numeric fields before saving', async () => {
    const handleSave = vi.fn().mockResolvedValue();
    render(<TreasuryPolicyForm onSave={handleSave} />);

    fireEvent.change(screen.getByLabelText(/Policy name/i), { target: { value: 'Core Policy' } });
    fireEvent.change(screen.getByLabelText(/Default currency/i), { target: { value: 'usd' } });
    fireEvent.change(screen.getByLabelText(/Reserve target/i), { target: { value: '25000' } });
    fireEvent.change(screen.getByLabelText(/Minimum operating balance/i), { target: { value: '5000' } });
    fireEvent.click(screen.getByLabelText(/Enable automated releases/i));
    fireEvent.change(screen.getByLabelText(/Window \(days\)/i), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText(/Run day/i), { target: { value: 'monday' } });
    fireEvent.change(screen.getByLabelText(/Run time/i), { target: { value: '09:00' } });
    fireEvent.change(screen.getByLabelText(/Invoice grace period/i), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText(/Risk appetite/i), { target: { value: 'balanced' } });

    fireEvent.submit(screen.getByRole('button', { name: /Save treasury policy/i }));

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalled();
    });

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        policyName: 'Core Policy',
        defaultCurrency: 'USD',
        reserveTarget: 25000,
        minimumBalanceThreshold: 5000,
        autopayoutEnabled: true,
        autopayoutWindowDays: 3,
        autopayoutDayOfWeek: 'monday',
        autopayoutTimeOfDay: '09:00',
        invoiceGracePeriodDays: 7,
        riskAppetite: 'balanced',
      }),
    );
  });
});
