import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IdVerificationManualIntakeForm from '../IdVerificationManualIntakeForm.jsx';
import IdVerificationDetailDrawer from '../IdVerificationDetailDrawer.jsx';
import IdVerificationQueue from '../IdVerificationQueue.jsx';
import IdVerificationSettingsPanel from '../IdVerificationSettingsPanel.jsx';
import IdVerificationOverview from '../IdVerificationOverview.jsx';

vi.mock('../../../utils/classNames.js', async (importOriginal) => {
  const actual = await importOriginal();
  return actual;
});

async function runInAct(callback) {
  await act(async () => {
    await callback();
  });
}

describe('Identity verification admin components', () => {
  it('validates manual intake form and sanitises payload', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue({});
    render(<IdVerificationManualIntakeForm onCreate={onCreate} />);

    await runInAct(() => user.click(screen.getByRole('button', { name: /create verification/i })));
    expect(await screen.findByText(/complete all required fields/i)).toBeInTheDocument();

    await runInAct(() => user.type(screen.getByLabelText(/user id/i), ' 101 '));
    await runInAct(() => user.type(screen.getByLabelText(/profile id/i), ' 55 '));
    await runInAct(() => user.type(screen.getByLabelText(/full name/i), ' Alex Stone '));
    await runInAct(() => user.type(screen.getByLabelText(/date of birth/i), '1990-01-01'));
    await runInAct(() => user.type(screen.getByLabelText(/address line 1/i), ' 1 Harbour Way '));
    const cityInput = await screen.findByLabelText(/city/i);
    await runInAct(() => user.type(cityInput, '  London '));
    await runInAct(() => user.type(screen.getByLabelText(/postal code/i), ' W1 1AA '));
    await runInAct(() => user.type(screen.getByLabelText(/issuing country code/i), ' us '));
    await runInAct(() => user.type(screen.getByLabelText(/residence country code/i), ' gb '));
    await runInAct(() => user.click(screen.getByRole('button', { name: /create verification/i })));

    await waitFor(() => expect(onCreate).toHaveBeenCalled());
    expect(onCreate.mock.calls[0][0]).toMatchObject({
      userId: 101,
      profileId: 55,
      fullName: 'Alex Stone',
      issuingCountry: 'US',
      country: 'GB',
    });
    expect(await screen.findByText(/verification created/i)).toBeInTheDocument();
  });

  it('submits detail drawer updates with trimmed values', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn().mockResolvedValue({});
    const verification = {
      id: 9,
      fullName: 'Jordan Rivers',
      userId: 88,
      profileId: 44,
      status: 'pending',
      addressLine1: ' 12 Main ',
      city: 'Berlin',
      postalCode: '10115',
      country: 'de',
      events: [],
    };
    render(<IdVerificationDetailDrawer open verification={verification} onClose={vi.fn()} onUpdate={onUpdate} storage={{}} />);

    await screen.findByText(/review controls/i);
    await runInAct(() => user.type(screen.getByPlaceholderText(/summary of verification checks/i), ' Looks good'));
    await runInAct(() => user.type(screen.getByPlaceholderText(/e\.g\. 42/i), ' 7 '));
    await runInAct(() => user.type(screen.getByLabelText(/issuing country code/i), ' us '));
    const addressCountryInput = screen.getByLabelText(/address country/i);
    await runInAct(() => user.clear(addressCountryInput));
    await runInAct(() => user.type(addressCountryInput, ' de '));
    await runInAct(() => user.click(screen.getByRole('button', { name: /save changes/i })));

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    const payload = onUpdate.mock.calls.at(-1)?.[1];
    expect(payload).toMatchObject({
      reviewerId: 7,
      reviewNotes: 'Looks good',
      issuingCountry: 'US',
      country: 'DE',
    });
    expect(await screen.findByText(/verification updated/i)).toBeInTheDocument();
  });

  it('updates queue filters and status', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    const onStatusChange = vi.fn();
    const onSelect = vi.fn();
    const data = [
      {
        id: 1,
        fullName: 'Harper',
        status: 'pending',
        verificationProvider: 'manual_review',
        submittedAt: new Date().toISOString(),
        reviewer: { name: 'Riley' },
      },
    ];
    render(
      <IdVerificationQueue
        data={data}
        filters={{ statuses: [] }}
        onFiltersChange={onFiltersChange}
        onRefresh={vi.fn()}
        onSelect={onSelect}
        onStatusChange={onStatusChange}
      />,
    );

    await runInAct(() => user.click(screen.getByRole('button', { name: /pending/i })));
    expect(onFiltersChange).toHaveBeenCalled();

    const statusSelect = await screen.findByLabelText(/update status/i);
    await runInAct(() => user.selectOptions(statusSelect, 'verified'));
    expect(onStatusChange).toHaveBeenCalledWith(1, 'verified');

    await runInAct(() => user.click(screen.getByRole('button', { name: /open record/i })));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('handles settings panel actions', async () => {
    const user = userEvent.setup();
    const onDraftChange = vi.fn();
    const onAddProvider = vi.fn();
    const onRemoveProvider = vi.fn();
    const onReset = vi.fn();
    const onSave = vi.fn();
    const draft = {
      providers: [
        {
          id: 'provider-1',
          name: 'SafeID',
          enabled: true,
          sandbox: true,
          allowedDocuments: ['passport'],
        },
      ],
      automation: { autoAssignOldest: false },
      documents: {},
      storage: {},
    };

    render(
      <IdVerificationSettingsPanel
        draft={draft}
        dirty
        saving={false}
        onDraftChange={onDraftChange}
        onAddProvider={onAddProvider}
        onRemoveProvider={onRemoveProvider}
        onReset={onReset}
        onSave={onSave}
      />,
    );

    await runInAct(() => user.click(screen.getByRole('button', { name: /add provider/i })));
    expect(onAddProvider).toHaveBeenCalled();

    await runInAct(() => user.click(screen.getByRole('button', { name: /toggle auto-assign/i })));
    expect(onDraftChange).toHaveBeenCalledWith(['automation', 'autoAssignOldest'], true);

    await runInAct(() => user.click(screen.getByRole('button', { name: /save/i })));
    expect(onSave).toHaveBeenCalled();

    await runInAct(() => user.click(screen.getByRole('button', { name: /reset/i })));
    expect(onReset).toHaveBeenCalled();

    await runInAct(() => user.click(screen.getByRole('button', { name: /remove/i })));
    expect(onRemoveProvider).toHaveBeenCalledWith(0);
  });

  it('surfaces overview events and selection callbacks', () => {
    const onSelect = vi.fn();
    const overview = {
      totals: { byStatus: [{ status: 'pending', count: 2 }], total: 2 },
      metrics: { averageReviewSeconds: 120, slaThresholdHours: 48 },
      reviewerBreakdown: [],
      recentActivity: [
        {
          id: 'evt-1',
          eventType: 'status_change',
          toStatus: 'in_review',
          createdAt: new Date().toISOString(),
          actor: { name: 'Jamie' },
          verification: { id: 77, fullName: 'Taylor' },
        },
      ],
      openQueue: [
        {
          id: 77,
          fullName: 'Taylor',
          status: 'pending',
          submittedAt: new Date().toISOString(),
        },
      ],
    };

    render(<IdVerificationOverview overview={overview} onSelectVerification={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /open verification/i }));
    expect(onSelect).toHaveBeenCalledWith(77);

    fireEvent.click(screen.getByRole('button', { name: /review/i }));
    expect(onSelect).toHaveBeenCalledWith(77);
  });
});
