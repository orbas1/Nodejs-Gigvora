import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import WalletLedgerEntryForm from '../WalletLedgerEntryForm.jsx';
import WalletLedgerTable from '../WalletLedgerTable.jsx';
import WalletSummary from '../WalletSummary.jsx';

const sampleEntries = [
  {
    id: 'entry-1',
    reference: 'WL-100',
    entryType: 'credit',
    amount: 2500,
    balanceAfter: 7500,
    currencyCode: 'USD',
    occurredAt: '2024-05-01T09:30:00.000Z',
    initiatedBy: { firstName: 'Alex', lastName: 'Rivera' },
    description: 'Payout release',
  },
];

describe('WalletLedgerEntryForm', () => {
  it('submits normalised payload and resets when requested', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    const handleCancel = vi.fn();

    const { rerender } = render(
      <WalletLedgerEntryForm onSubmit={handleSubmit} onCancel={handleCancel} resetKey={0} />,
    );

    await user.selectOptions(screen.getByLabelText(/type/i), 'debit');
    await user.clear(screen.getByLabelText(/amount/i));
    await user.type(screen.getByLabelText(/amount/i), '123.45');
    await user.clear(screen.getByLabelText(/notes/i));
    await user.type(screen.getByLabelText(/notes/i), '  Funding adjustment  ');
    await user.type(screen.getByLabelText(/reference/i), '  REF-1  ');
    await user.type(screen.getByLabelText(/external ref/i), 'EXT-9');

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith({
      entryType: 'debit',
      amount: 123.45,
      currencyCode: 'USD',
      description: 'Funding adjustment',
      reference: 'REF-1',
      externalReference: 'EXT-9',
    });

    rerender(<WalletLedgerEntryForm onSubmit={handleSubmit} onCancel={handleCancel} resetKey={1} />);

    expect(screen.getByLabelText(/amount/i)).toHaveValue(null);
    expect(screen.getByLabelText(/notes/i)).toHaveValue('');
  });

  it('guards against invalid amounts', async () => {
    const user = userEvent.setup();
    render(<WalletLedgerEntryForm onSubmit={vi.fn()} resetKey={0} />);

    await user.clear(screen.getByLabelText(/amount/i));
    await user.type(screen.getByLabelText(/amount/i), '0');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.queryByText(/amount required/i)).toBeTruthy();
    });
  });
});

describe('WalletLedgerTable', () => {
  it('renders ledger rows and triggers pagination and filter changes', async () => {
    const user = userEvent.setup();
    const handlePageChange = vi.fn();
    const handleFilterChange = vi.fn();

    function Wrapper() {
      const [filtersState, setFiltersState] = useState({ entryType: '', search: '' });
      return (
        <WalletLedgerTable
          entries={sampleEntries}
          pagination={{ page: 1, totalPages: 3, totalItems: 9 }}
          onPageChange={handlePageChange}
          onFilterChange={(next) => {
            setFiltersState(next);
            handleFilterChange(next);
          }}
          filters={filtersState}
          currency="USD"
        />
      );
    }

    render(<Wrapper />);

    const row = within(screen.getByRole('row', { name: /wl-100/i }));
    expect(row.getByText('$2,500.00')).toBeInTheDocument();
    expect(row.getByText('Payout release')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/type/i), 'debit');
    expect(handleFilterChange).toHaveBeenCalledWith(expect.objectContaining({ entryType: 'debit', page: 1 }));

    await user.type(screen.getByLabelText(/lookup/i), 'WL');
    expect(handleFilterChange).toHaveBeenLastCalledWith(expect.objectContaining({ entryType: 'debit', search: 'WL', page: 1 }));

    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(handlePageChange).toHaveBeenCalledWith(2);
  });

  it('renders empty message when no entries are available', () => {
    render(<WalletLedgerTable entries={[]} filters={{}} />);
    expect(screen.getByText(/no entries yet/i)).toBeInTheDocument();
  });
});

describe('WalletSummary', () => {
  it('prefers filtered summary metrics when available', () => {
    render(
      <WalletSummary
        globalSummary={{ totals: { currentBalance: 1000, availableBalance: 900, pendingHoldBalance: 50, accounts: 2 } }}
        filteredSummary={{ totals: { currentBalance: 200, availableBalance: 150, pendingHoldBalance: 10, accounts: 1 } }}
      />,
    );

    expect(screen.getByText('$200.00')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('falls back to global totals', () => {
    render(
      <WalletSummary globalSummary={{ totals: { currentBalance: 800, availableBalance: 500, pendingHoldBalance: 60, accounts: 3 } }} />,
    );

    expect(screen.getByText('$800.00')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
