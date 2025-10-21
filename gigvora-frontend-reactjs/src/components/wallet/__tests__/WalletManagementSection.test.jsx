import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import WalletManagementSection from '../WalletManagementSection.jsx';

const mockUseWalletManagement = vi.fn();

vi.mock('../../../hooks/useWalletManagement.js', () => ({
  __esModule: true,
  default: (userId) => mockUseWalletManagement(userId),
}));

const buildActions = () => ({
  refresh: vi.fn(),
  createFundingSource: vi.fn().mockResolvedValue(undefined),
  updateFundingSource: vi.fn().mockResolvedValue(undefined),
  createTransferRule: vi.fn().mockResolvedValue(undefined),
  updateTransferRule: vi.fn().mockResolvedValue(undefined),
  deleteTransferRule: vi.fn().mockResolvedValue(undefined),
  createTransferRequest: vi.fn().mockResolvedValue(undefined),
  updateTransferRequest: vi.fn().mockResolvedValue(undefined),
});

const buildSnapshot = () => ({
  summary: {
    totalBalance: 5500,
    availableBalance: 4000,
    pendingHoldBalance: 500,
    accountCount: 2,
    pendingTransferCount: 1,
    nextScheduledTransferAt: '2024-01-05T09:00:00.000Z',
    currency: 'USD',
    complianceStatus: 'active',
    ledgerIntegrity: 'ready',
    appStoreCompliant: true,
  },
  metadata: {
    generatedAt: '2024-01-02T12:00:00.000Z',
  },
  access: { canManage: true },
  accounts: [
    {
      id: 1,
      label: 'Operating',
      accountType: 'operating',
      complianceStatus: 'active',
      currentBalance: 5500,
      availableBalance: 4000,
      pendingHoldBalance: 500,
      currencyCode: 'USD',
      lastEntryAt: '2024-01-01T08:00:00.000Z',
      ledger: [
        {
          id: 'ledger-1',
          entryType: 'credit',
          occurredAt: '2024-01-01T07:00:00.000Z',
          amount: 250,
          currencyCode: 'USD',
          balanceAfter: 5500,
          reference: 'Invoice 88',
        },
      ],
    },
  ],
  fundingSources: {
    primaryId: 10,
    items: [
      {
        id: 10,
        label: 'Primary Bank',
        type: 'bank_account',
        provider: 'Bank of Atlas',
        lastFour: '1234',
        connectedAt: '2023-12-01T00:00:00.000Z',
        limitAmount: 5000,
        currencyCode: 'USD',
        isPrimary: true,
      },
      {
        id: 11,
        label: 'Backup Card',
        type: 'card',
        provider: 'Visa',
        lastFour: '4321',
        connectedAt: '2023-12-05T00:00:00.000Z',
        limitAmount: 2000,
        currencyCode: 'USD',
        requiresManualReview: true,
      },
    ],
  },
  transferRules: [
    {
      id: 'rule-1',
      name: 'Weekly Payout',
      transferType: 'payout',
      cadence: 'weekly',
      thresholdAmount: 500,
      currencyCode: 'USD',
      executionDay: 5,
      fundingSourceId: 10,
      fundingSource: { label: 'Primary Bank' },
      status: 'active',
    },
  ],
  transfers: {
    recent: [
      {
        id: 'transfer-1',
        transferType: 'payout',
        scheduledAt: '2024-01-05T09:00:00.000Z',
        createdAt: '2024-01-02T08:00:00.000Z',
        amount: 250,
        currencyCode: 'USD',
        fundingSourceId: 10,
        fundingSource: { label: 'Primary Bank' },
        walletAccountId: 1,
        status: 'pending',
        notes: 'Weekly payout',
      },
    ],
  },
  escrow: { accounts: [] },
  ledger: { entries: [] },
  alerts: [],
});

const arrange = ({ data, loading = false, error = null } = {}) => {
  const snapshot = data ?? buildSnapshot();
  const actions = buildActions();
  mockUseWalletManagement.mockReturnValue({
    data: snapshot,
    loading,
    error,
    actions,
  });
  return { snapshot, actions };
};

describe('WalletManagementSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWalletManagement.mockReset();
  });

  it('renders wallet summary metrics and supports manual refresh', async () => {
    const { actions } = arrange();

    const user = userEvent.setup();

    render(<WalletManagementSection userId="user-1" />);

    expect(screen.getByRole('heading', { name: 'Wallet' })).toBeInTheDocument();
    expect(screen.getByText('US$5,500.00')).toBeInTheDocument();

    const refreshButton = screen.getByRole('button', { name: 'Refresh' });
    await user.click(refreshButton);

    expect(actions.refresh).toHaveBeenCalledTimes(1);
  });

  it('validates and submits a new funding source', async () => {
    const { actions } = arrange();

    const user = userEvent.setup();

    render(<WalletManagementSection userId="user-1" />);

    await user.click(screen.getByRole('button', { name: 'Sources' }));
    await user.click(screen.getByRole('button', { name: 'Add source' }));

    const saveButton = screen.getByRole('button', { name: 'Save source' });
    await user.click(saveButton);

    expect(await screen.findByText('Name is required.')).toBeInTheDocument();

    const dialog = screen.getByRole('dialog', { name: /source/i });
    const nameInput = within(dialog).getByLabelText('Name');
    const providerInput = within(dialog).getByLabelText('Provider');
    const lastDigitsInput = within(dialog).getByLabelText('Last digits');

    fireEvent.change(nameInput, { target: { value: 'New Source' } });
    fireEvent.change(providerInput, { target: { value: 'Test Bank' } });
    fireEvent.change(lastDigitsInput, { target: { value: '9876' } });

    expect(nameInput).toHaveValue('New Source');
    expect(providerInput).toHaveValue('Test Bank');
    expect(lastDigitsInput).toHaveValue('9876');

    await user.click(saveButton);

    await waitFor(() => {
      expect(actions.createFundingSource).toHaveBeenCalled();
    });

    expect(actions.createFundingSource).toHaveBeenCalledWith({
      walletAccountId: '1',
      type: 'bank_account',
      label: 'New Source',
      provider: 'Test Bank',
      lastFour: '9876',
      makePrimary: false,
      currencyCode: 'USD',
    });

    expect(await screen.findByText('Funding source saved.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('promotes a funding source to primary', async () => {
    const { actions } = arrange();

    const user = userEvent.setup();

    render(<WalletManagementSection userId="user-1" />);

    await user.click(screen.getByRole('button', { name: 'Sources' }));
    await user.click(screen.getByRole('button', { name: /set backup card/i }));

    await waitFor(() => {
      expect(actions.updateFundingSource).toHaveBeenCalledWith(11, { makePrimary: true });
    });

    expect(await screen.findByText('Backup Card set as primary.')).toBeInTheDocument();
  });

  it('shows restricted access overlay for read-only viewers', () => {
    const snapshot = buildSnapshot();
    snapshot.access.canManage = false;
    arrange({ data: snapshot });

    render(<WalletManagementSection userId="user-1" />);

    expect(screen.getByText('Wallet access is restricted for this role.')).toBeInTheDocument();
  });
});
