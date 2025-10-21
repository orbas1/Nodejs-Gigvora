import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EscrowProvider, useEscrow } from '../EscrowContext.jsx';

const sessionValue = vi.hoisted(() => ({ session: { id: 'user-123', name: 'Agent Doe' } }));

vi.mock('../../../../../hooks/useSession.js', () => ({
  __esModule: true,
  default: () => sessionValue,
}));

const serviceMocks = vi.hoisted(() => ({
  fetchAgencyEscrowOverview: vi.fn(),
  fetchAgencyEscrowAccounts: vi.fn(),
  createAgencyEscrowAccount: vi.fn(),
  updateAgencyEscrowAccount: vi.fn(),
  fetchAgencyEscrowTransactions: vi.fn(),
  createAgencyEscrowTransaction: vi.fn(),
  updateAgencyEscrowTransaction: vi.fn(),
  releaseAgencyEscrowTransaction: vi.fn(),
  refundAgencyEscrowTransaction: vi.fn(),
  updateAgencyEscrowSettings: vi.fn(),
}));

vi.mock('../../../../../services/agencyEscrow.js', () => ({
  __esModule: true,
  ...serviceMocks,
}));

const {
  fetchAgencyEscrowOverview: mockOverview,
  fetchAgencyEscrowAccounts: mockAccounts,
  createAgencyEscrowAccount: mockCreateAccount,
  updateAgencyEscrowAccount: mockUpdateAccount,
  fetchAgencyEscrowTransactions: mockTransactions,
  createAgencyEscrowTransaction: mockCreateTransaction,
  updateAgencyEscrowTransaction: mockUpdateTransaction,
  releaseAgencyEscrowTransaction: mockReleaseTransaction,
  refundAgencyEscrowTransaction: mockRefundTransaction,
  updateAgencyEscrowSettings: mockUpdateSettings,
} = serviceMocks;

function ContextProbe() {
  const context = useEscrow();
  ContextProbe.latest = context;
  return (
    <div>
      <span data-testid="accounts-count">{context.state.accounts.list.length}</span>
      <span data-testid="transactions-count">{context.state.transactions.list.length}</span>
      <span data-testid="toast-message">{context.state.toast?.message ?? ''}</span>
      <span data-testid="auto-release-days">{context.state.settingsDraft?.autoReleaseAfterDays ?? ''}</span>
    </div>
  );
}

describe('EscrowProvider', () => {
  beforeEach(() => {
    ContextProbe.latest = null;
    mockOverview.mockResolvedValue({
      totals: { escrowed: 125000 },
      settings: {
        autoReleaseEnabled: false,
        autoReleaseAfterDays: 14,
        requireDualApproval: true,
        notifyHoursBeforeRelease: 36,
        holdLargePaymentsThreshold: 50000,
      },
    });
    mockAccounts.mockResolvedValue({
      accounts: [
        {
          id: 1,
          provider: 'stripe',
          status: 'active',
          currentBalance: 1000,
          pendingBalance: 0,
          currencyCode: 'USD',
        },
      ],
      pagination: { total: 1 },
    });
    mockTransactions.mockResolvedValue({
      transactions: [
        {
          id: 91,
          accountId: 1,
          amount: 450,
          currencyCode: 'USD',
          status: 'held',
        },
      ],
      pagination: { total: 1 },
    });
    mockCreateAccount.mockResolvedValue({ id: 200 });
    mockUpdateAccount.mockResolvedValue({ id: 1 });
    mockCreateTransaction.mockResolvedValue({ id: 501 });
    mockUpdateTransaction.mockResolvedValue({ id: 91 });
    mockReleaseTransaction.mockResolvedValue({});
    mockRefundTransaction.mockResolvedValue({});
    mockUpdateSettings.mockResolvedValue({});

    vi.clearAllMocks();
    mockOverview.mockClear();
    mockAccounts.mockClear();
    mockTransactions.mockClear();
  });

  const renderProvider = (props = {}) =>
    render(
      <EscrowProvider workspaceId="workspace-7" {...props}>
        <ContextProbe />
      </EscrowProvider>,
    );

  it('loads escrow overview, accounts, and transactions for the selected workspace', async () => {
    renderProvider();

    await waitFor(() => expect(mockOverview).toHaveBeenCalledTimes(1));
    expect(mockOverview).toHaveBeenCalledWith(
      { workspaceId: 'workspace-7' },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    await waitFor(() => expect(screen.getByTestId('accounts-count')).toHaveTextContent('1'));
    expect(screen.getByTestId('transactions-count')).toHaveTextContent('1');
    expect(screen.getByTestId('auto-release-days')).toHaveTextContent('14');
  });

  it('creates a new escrow account and refreshes downstream state', async () => {
    renderProvider();
    await waitFor(() => ContextProbe.latest);

    await act(async () => {
      await ContextProbe.latest.saveAccount({
        provider: 'stripe',
        currencyCode: 'USD',
        label: 'Client funds',
        bankReference: 'ABC-123',
        metadata: '{"region":"US"}',
      });
    });

    expect(mockCreateAccount).toHaveBeenCalledWith(
      {
        provider: 'stripe',
        currencyCode: 'USD',
        label: 'Client funds',
        bankReference: 'ABC-123',
        metadata: { region: 'US' },
      },
      { workspaceId: 'workspace-7' },
    );
    await waitFor(() => expect(mockAccounts).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByTestId('toast-message')).toHaveTextContent('Account created'));
  });

  it('releases a transaction with the acting session user and refreshes overview metrics', async () => {
    renderProvider();
    await waitFor(() => ContextProbe.latest);

    await act(async () => {
      await ContextProbe.latest.releaseTransaction(91);
    });

    expect(mockReleaseTransaction).toHaveBeenCalledWith(
      91,
      { actorId: 'user-123' },
      { workspaceId: 'workspace-7' },
    );
    await waitFor(() => expect(mockOverview).toHaveBeenCalledTimes(2));
  });

  it('creates a transaction using numeric fields and fallback metadata', async () => {
    renderProvider();
    await waitFor(() => ContextProbe.latest);

    await act(async () => {
      await ContextProbe.latest.saveTransaction({
        accountId: '1',
        amount: '500',
        feeAmount: '12',
        currencyCode: 'USD',
        type: 'project',
        reference: 'MOVE-500',
        milestoneLabel: 'Kickoff',
        scheduledReleaseAt: '2024-08-01T12:30',
        metadata: 'manual note',
      });
    });

    expect(mockCreateTransaction).toHaveBeenCalledWith(
      {
        accountId: 1,
        amount: 500,
        currencyCode: 'USD',
        feeAmount: 12,
        type: 'project',
        reference: 'MOVE-500',
        milestoneLabel: 'Kickoff',
        scheduledReleaseAt: expect.stringContaining('2024-08-01T12:30'),
        metadata: { note: 'manual note' },
      },
      { workspaceId: 'workspace-7' },
    );
  });

  it('persists rules via update settings handler', async () => {
    renderProvider();
    await waitFor(() => ContextProbe.latest);

    await act(async () => {
      await ContextProbe.latest.saveSettings({
        autoReleaseEnabled: false,
        autoReleaseAfterDays: 10,
        requireDualApproval: false,
        notifyHoursBeforeRelease: 12,
        holdLargePaymentsThreshold: 15000,
      });
    });

    expect(mockUpdateSettings).toHaveBeenCalledWith(
      {
        autoReleaseEnabled: false,
        autoReleaseAfterDays: 10,
        requireDualApproval: false,
        notifyHoursBeforeRelease: 12,
        holdLargePaymentsThreshold: 15000,
      },
      { workspaceId: 'workspace-7' },
    );
  });
});
