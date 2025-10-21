import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EscrowManagementSection from '../EscrowManagementSection.jsx';

const sessionStub = vi.hoisted(() => ({ session: { id: 'freelancer-99', role: 'freelancer' } }));
const escrowStub = vi.hoisted(() => ({ current: null }));

vi.mock('../../../../../hooks/useSession.js', () => ({
  __esModule: true,
  default: () => sessionStub,
}));

vi.mock('../../../../../hooks/useFreelancerEscrow.js', () => ({
  __esModule: true,
  default: () => escrowStub.current,
}));

vi.mock('../escrow/components/MetricBoard.jsx', () => ({
  __esModule: true,
  default: ({ metrics }) => <div data-testid="metric-board">metrics:{metrics?.totalAccounts ?? 0}</div>,
}));

vi.mock('../escrow/AccountsPanel.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="escrow-panel">accounts</div>,
}));
vi.mock('../escrow/TransactionsPanel.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="escrow-panel">payments</div>,
}));
vi.mock('../escrow/DisputesPanel.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="escrow-panel">disputes</div>,
}));
vi.mock('../escrow/ActivityPanel.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="escrow-panel">activity</div>,
}));
vi.mock('../escrow/ReleaseQueuePanel.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="escrow-panel">release</div>,
}));
vi.mock('../escrow/SettingsPanel.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="escrow-panel">settings</div>,
}));
vi.mock('../escrow/StatementsPanel.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="escrow-panel">statements</div>,
}));

function buildEscrowState(overrides = {}) {
  const refresh = vi.fn();
  escrowStub.current = {
    accounts: [],
    transactions: [],
    disputes: [],
    activityLog: [],
    releaseQueue: [],
    metrics: { totalAccounts: 1, currency: 'USD' },
    loading: false,
    error: null,
    fromCache: false,
    lastUpdated: '2024-04-18T10:00:00.000Z',
    refresh,
    createAccount: vi.fn(),
    updateAccount: vi.fn(),
    createTransaction: vi.fn(),
    releaseTransaction: vi.fn(),
    refundTransaction: vi.fn(),
    openDispute: vi.fn(),
    appendDisputeEvent: vi.fn(),
    actionState: { status: 'idle' },
    ...overrides,
  };
  return escrowStub.current;
}

describe('EscrowManagementSection', () => {
  beforeEach(() => {
    buildEscrowState();
  });

  it('renders metrics and switches between views', () => {
    const state = buildEscrowState();
    render(<EscrowManagementSection />);

    expect(screen.getByTestId('metric-board')).toHaveTextContent('metrics:1');
    expect(screen.getAllByTestId('escrow-panel')[0]).toHaveTextContent('accounts');

    fireEvent.click(screen.getByRole('button', { name: /Payments/i }));
    expect(screen.getAllByTestId('escrow-panel')[0]).toHaveTextContent('payments');

    fireEvent.click(screen.getByRole('button', { name: /Sync/i }));
    expect(state.refresh).toHaveBeenCalledWith({ force: true });
  });

  it('surfaces escrow action errors to the operator', () => {
    buildEscrowState({ actionState: { status: 'error', error: new Error('Escrow update failed') } });

    render(<EscrowManagementSection />);

    expect(screen.getByText(/escrow update failed/i)).toBeInTheDocument();
  });
});
