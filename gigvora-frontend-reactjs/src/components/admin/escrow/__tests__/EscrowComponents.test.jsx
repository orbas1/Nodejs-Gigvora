import { fireEvent, render, screen } from '@testing-library/react';
import EscrowMetrics from '../EscrowMetrics.jsx';
import EscrowProviderForm from '../EscrowProviderForm.jsx';
import EscrowAccountsTable from '../EscrowAccountsTable.jsx';
import EscrowTransactionsTable from '../EscrowTransactionsTable.jsx';
import EscrowWorkspace from '../EscrowWorkspace.jsx';

describe('EscrowMetrics', () => {
  it('formats monetary and numeric values', () => {
    render(
      <EscrowMetrics
        summary={{
          grossVolume: 120000,
          netVolume: 95000,
          feeVolume: 5000,
          currentBalance: 20000,
          pendingReleaseTotal: 7000,
          openDisputes: 3,
          outstandingTransactions: 6,
          averageReleaseHours: 12.3,
        }}
        currency="USD"
      />,
    );

    expect(screen.getByText(/Gross volume/i).nextElementSibling.textContent).toMatch(/\$120,000/);
    expect(screen.getByText(/Avg release/i).nextElementSibling.textContent).toContain('12.3 hrs');
  });
});

describe('EscrowProviderForm', () => {
  it('normalises payloads when saving', () => {
    const handleSave = vi.fn();
    render(<EscrowProviderForm onSave={handleSave} value={{ provider: 'stripe' }} />);

    fireEvent.change(screen.getByLabelText(/Publishable key/i), {
      target: { value: 'pk_test' },
    });
    fireEvent.change(screen.getByLabelText(/Secret key/i), {
      target: { value: 'sk_test' },
    });
    fireEvent.submit(screen.getByText(/Save provider/i).closest('form'));

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'stripe',
        stripe: expect.objectContaining({ publishableKey: 'pk_test', secretKey: 'sk_test' }),
      }),
    );
  });
});

describe('EscrowAccountsTable', () => {
  it('pushes filter updates upstream', () => {
    const handleFilterChange = vi.fn();
    render(
      <EscrowAccountsTable
        accounts={{
          items: [],
          pagination: { page: 1, totalPages: 1 },
        }}
        filters={{ status: '', provider: '', search: '' }}
        onFilterChange={handleFilterChange}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Status/i), { target: { value: 'active' } });
    expect(handleFilterChange).toHaveBeenCalledWith(expect.objectContaining({ status: 'active', page: 1 }));
  });
});

describe('EscrowTransactionsTable', () => {
  it('allows filter changes and renders data', () => {
    const handleFilterChange = vi.fn();
    render(
      <EscrowTransactionsTable
        transactions={{
          items: [
            {
              id: 'txn_1',
              reference: 'TXN-001',
              status: 'funded',
              amount: 1000,
              netAmount: 950,
              currencyCode: 'USD',
              buyer: { name: 'Buyer' },
              seller: { name: 'Seller' },
              createdAt: '2024-05-01T10:00:00Z',
            },
          ],
          pagination: { page: 1, totalPages: 1 },
        }}
        filters={{ status: '', provider: '', search: '' }}
        onFilterChange={handleFilterChange}
      />,
    );

    expect(screen.getByText('TXN-001')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Status/i), { target: { value: 'funded' } });
    expect(handleFilterChange).toHaveBeenCalledWith(expect.objectContaining({ status: 'funded', page: 1 }));
  });
});

describe('EscrowWorkspace', () => {
  it('opens the provider configuration drawer when selecting an action', () => {
    render(
      <EscrowWorkspace
        summary={{ grossVolume: 0 }}
        currency="USD"
        providerSettings={{ provider: 'stripe' }}
        policies={[]}
        tiers={[]}
        accounts={{ items: [], pagination: { page: 1, totalPages: 1 } }}
        accountFilters={{}}
        transactions={{ items: [], pagination: { page: 1, totalPages: 1 } }}
        transactionFilters={{}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Provider/i }));
    expect(screen.getByText(/Stripe credentials/i)).toBeInTheDocument();
  });
});
