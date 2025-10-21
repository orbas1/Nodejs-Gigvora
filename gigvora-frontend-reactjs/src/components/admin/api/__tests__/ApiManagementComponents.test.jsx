import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ApiClientUsageForm from '../ApiClientUsageForm.jsx';
import ApiClientsPanel from '../ApiClientsPanel.jsx';
import ApiKeySecretModal from '../ApiKeySecretModal.jsx';
import ApiOverviewPanel from '../ApiOverviewPanel.jsx';
import ApiProviderForm from '../ApiProviderForm.jsx';
import ApiProvidersPanel from '../ApiProvidersPanel.jsx';
import WalletAccountPicker from '../WalletAccountPicker.jsx';

vi.mock('../../../../services/adminApi.js', () => ({
  listWalletAccounts: vi.fn(() => Promise.resolve({ accounts: [] })),
}));

const { listWalletAccounts } = await import('../../../../services/adminApi.js');

describe('admin api management components', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('submits usage form payloads and resets on success', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    const client = {
      name: 'BillingBot',
      billing: {
        effectiveCallPriceCents: 250,
        walletAccount: { label: 'Ops wallet' },
      },
    };

    render(<ApiClientUsageForm client={client} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/Requests/i), { target: { value: '42' } });
    fireEvent.change(screen.getByLabelText(/Errors/i), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/Avg latency/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /Save usage/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ requestCount: 42, errorCount: 2, avgLatencyMs: 123 }),
      );
    });

    expect(screen.getByLabelText(/Requests/i).value).toBe('');
  });

  it('shows submit errors from usage form', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Server unavailable'));
    const client = { billing: {} };

    render(<ApiClientUsageForm client={client} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /Save usage/i }));

    await screen.findByText(/Server unavailable/);
  });

  it('invokes client actions from panel buttons', () => {
    const callbacks = {
      onEdit: vi.fn(),
      onIssueKey: vi.fn(),
      onRotateWebhook: vi.fn(),
      onViewAudit: vi.fn(),
      onRecordUsage: vi.fn(),
      onRevokeKey: vi.fn(),
    };
    const clients = [
      {
        id: '1',
        name: 'Widget',
        status: 'active',
        provider: { name: 'Payments' },
        keys: [{ id: 'key-1', secretLastFour: 'abcd' }],
      },
    ];

    render(<ApiClientsPanel clients={clients} {...callbacks} />);

    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));
    fireEvent.click(screen.getByRole('button', { name: /Usage/i }));
    fireEvent.click(screen.getByRole('button', { name: /New key/i }));
    fireEvent.click(screen.getByRole('button', { name: /Rotate webhook/i }));
    fireEvent.click(screen.getByRole('button', { name: /Audit/i }));
    fireEvent.click(screen.getByText(/Revoke/i));

    expect(callbacks.onEdit).toHaveBeenCalled();
    expect(callbacks.onRecordUsage).toHaveBeenCalled();
    expect(callbacks.onIssueKey).toHaveBeenCalled();
    expect(callbacks.onRotateWebhook).toHaveBeenCalled();
    expect(callbacks.onViewAudit).toHaveBeenCalled();
    expect(callbacks.onRevokeKey).toHaveBeenCalledWith(clients[0], 'key-1');
  });

  it('copies secrets in key secret modal', async () => {
    vi.useFakeTimers();
    const close = vi.fn();
    const writeText = vi.fn().mockResolvedValue();
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <ApiKeySecretModal
        open
        onClose={close}
        apiKey="abc"
        webhookSecret="xyz"
        clientName="Client"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Copy secrets/i }));
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith('abc\nxyz');
    expect(screen.getByRole('button', { name: /Copied/i })).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(screen.getByRole('button', { name: /Copy secrets/i })).toBeInTheDocument();
  });

  it('renders overview metrics and triggers refresh', () => {
    const onRefresh = vi.fn();
    const summary = {
      providerCount: 3,
      activeClientCount: 7,
      requestsLast30Days: 4200,
      revenueLast30DaysCents: 123456,
      unbilledRequestCountLast30Days: 80,
      avgLatencyMsLast30Days: 210,
      peakLatencyMsLast30Days: 320,
      errorRateLast30Days: 0.75,
      billableRequestCountLast30Days: 4000,
    };

    render(<ApiOverviewPanel summary={summary} onRefresh={onRefresh} />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('$1234.56')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Refresh/i }));
    expect(onRefresh).toHaveBeenCalled();
  });

  it('validates and submits provider form', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    const { container } = render(<ApiProviderForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Provider name/i), { target: { value: 'Maps' } });
    fireEvent.change(screen.getByLabelText(/Slug/i), { target: { value: 'maps' } });
    fireEvent.change(screen.getByLabelText(/Contact email/i), { target: { value: 'ops@example.com' } });
    fireEvent.change(screen.getByLabelText(/Price per call/i), { target: { value: '0.25' } });

    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Maps', slug: 'maps', contactEmail: 'ops@example.com', callPrice: 0.25 }),
      );
    });
  });

  it('renders provider cards and triggers callbacks', () => {
    const providers = [
      {
        id: 'prov-1',
        name: 'Maps',
        status: 'active',
        description: 'Mapping API',
        summary: { activeClients: 2, requestCount30d: 100, billedAmountCents30d: 2500 },
        callPriceCents: 125,
      },
    ];
    const callbacks = { onEdit: vi.fn(), onCreateClient: vi.fn(), onSelect: vi.fn() };

    render(<ApiProvidersPanel providers={providers} {...callbacks} />);

    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));
    fireEvent.click(screen.getByRole('button', { name: /New client/i }));
    fireEvent.click(screen.getByRole('button', { name: /Details/i }));

    expect(callbacks.onEdit).toHaveBeenCalledWith(providers[0]);
    expect(callbacks.onCreateClient).toHaveBeenCalledWith('prov-1');
    expect(callbacks.onSelect).toHaveBeenCalledWith(providers[0]);
  });

  it('searches wallet accounts and notifies selection', async () => {
    listWalletAccounts.mockResolvedValueOnce({
      accounts: [
        { id: '1', label: 'Ops wallet', availableBalance: 1000, currencyCode: 'USD', ownerEmail: 'ops@example.com' },
      ],
    });
    const onChange = vi.fn();

    render(<WalletAccountPicker onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText(/Search by name/i), { target: { value: 'op' } });

    await waitFor(() => expect(listWalletAccounts).toHaveBeenCalledWith({ query: 'op', limit: 12 }, expect.any(Object)));

    fireEvent.click(screen.getByRole('button', { name: /Ops wallet/i }));
    expect(onChange).toHaveBeenCalledWith('1', expect.objectContaining({ label: 'Ops wallet' }));
    expect(screen.queryByText(/No wallets match/i)).not.toBeInTheDocument();
  });
});
