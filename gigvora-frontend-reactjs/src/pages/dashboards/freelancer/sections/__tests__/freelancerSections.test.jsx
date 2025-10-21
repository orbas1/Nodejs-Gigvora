import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

if (typeof Element !== 'undefined' && !Element.prototype.getAnimations) {
  Element.prototype.getAnimations = () => [];
}

vi.mock('../escrow/components/ConfirmDialog.jsx', () => ({
  default: ({ open, title, message, confirmLabel, onConfirm, onClose }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {message ? <p>{message}</p> : null}
        <button type="button" onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
    ) : null,
}));

vi.mock('../escrow/components/SlideOver.jsx', () => ({
  default: ({ open, title, description, children, footer, onClose }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {description ? <p>{description}</p> : null}
        <div>{children}</div>
        {footer ? <div>{footer}</div> : null}
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}));

vi.mock('../networking/SlideOver.jsx', () => ({
  default: ({ open, title, subtitle, children, footer, onClose }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {subtitle ? <p>{subtitle}</p> : null}
        <div>{children}</div>
        {footer ? <div>{footer}</div> : null}
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}));

const networkingServiceMocks = {
  bookFreelancerNetworkingSession: vi.fn(),
  updateFreelancerNetworkingSignup: vi.fn(),
  createFreelancerNetworkingConnection: vi.fn(),
  updateFreelancerNetworkingConnection: vi.fn(),
  deleteFreelancerNetworkingSignup: vi.fn(),
  deleteFreelancerNetworkingConnection: vi.fn(),
};

vi.mock('../../../../../services/freelancerNetworking.js', () => networkingServiceMocks);

const { default: TransactionsPanel } = await import('../escrow/TransactionsPanel.jsx');
const { default: MentoringSessionForm } = await import('../mentoring/MentoringSessionForm.jsx');
const { default: MentoringPurchasesPanel } = await import('../mentoring/MentoringPurchasesPanel.jsx');
const { default: MentoringMentorPanels } = await import('../mentoring/MentoringMentorPanels.jsx');
const { default: AdsSection } = await import('../networking/AdsSection.jsx');
const { default: OrdersSection } = await import('../networking/OrdersSection.jsx');

let NetworkingSection;

beforeAll(async () => {
  ({ default: NetworkingSection } = await import('../networking/NetworkingSection.jsx'));
});

beforeEach(() => {
  Object.values(networkingServiceMocks).forEach((mockFn) => {
    mockFn.mockReset();
    mockFn.mockResolvedValue(undefined);
  });
  if (typeof window !== 'undefined') {
    window.confirm = vi.fn(() => true);
    window.prompt = vi.fn(() => '');
    window.scrollTo = vi.fn();
    window.open = vi.fn();
  }
});

describe('TransactionsPanel', () => {
  it('filters transactions and triggers release flow', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const onRelease = vi.fn().mockResolvedValue(undefined);
    const onRefund = vi.fn().mockResolvedValue(undefined);

    render(
      <TransactionsPanel
        accounts={[{ id: 1, metadata: { accountLabel: 'Primary' } }]}
        transactions={[
          {
            id: 1,
            reference: 'Alpha',
            status: 'in_escrow',
            amount: 10000,
            netAmount: 9800,
            currencyCode: 'USD',
            createdAt: '2024-05-01T00:00:00Z',
            scheduledReleaseAt: '2024-06-01T00:00:00Z',
            releaseEligible: true,
            auditTrail: [{ action: 'funded', at: '2024-05-01T00:00:00Z' }],
          },
          {
            id: 2,
            reference: 'Beta',
            status: 'released',
            amount: 5000,
            netAmount: 4800,
            currencyCode: 'USD',
            createdAt: '2024-04-01T00:00:00Z',
            scheduledReleaseAt: '2024-04-10T00:00:00Z',
            releaseEligible: false,
            auditTrail: [],
          },
        ]}
        onCreate={onCreate}
        onRelease={onRelease}
        onRefund={onRefund}
        loading={false}
        actionState={{ status: 'idle' }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Escrow' }));
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();

    await user.click(screen.getByText('Alpha'));
    await user.click(screen.getByRole('button', { name: 'Release' }));

    const confirmDialog = await screen.findByRole('dialog', { name: 'Release funds' });
    await user.click(within(confirmDialog).getByRole('button', { name: 'Release' }));

    await waitFor(() => {
      expect(onRelease).toHaveBeenCalledWith(1);
    });

    await user.click(screen.getByRole('button', { name: 'New' }));
    const form = await screen.findByRole('dialog', { name: 'New transaction' });
    await user.type(within(form).getByLabelText('Reference'), 'Milestone A');
    await user.clear(within(form).getByLabelText('Amount'));
    await user.type(within(form).getByLabelText('Amount'), '1200');
    await user.click(within(form).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 1,
          reference: 'Milestone A',
          amount: 1200,
        }),
      );
    });
  });
});

describe('MentoringSessionForm', () => {
  it('submits cleaned mentoring session payload', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const mentorLookup = new Map([[5, { id: 5, name: 'Jordan Mentor', email: 'jordan@gigvora.test' }]]);

    render(
      <MentoringSessionForm
        mentorLookup={mentorLookup}
        onSubmit={onSubmit}
        submitting={false}
        prefillMentorId={5}
      />
    );

    await user.type(screen.getByLabelText('Topic'), ' Growth strategy review ');
    await user.type(screen.getByLabelText('Scheduled for'), '2024-06-15T10:00');
    await user.type(screen.getByLabelText('Meeting link'), 'https://meet.gigvora.test');
    await user.type(screen.getByLabelText('Price paid'), '350');

    await user.click(screen.getByRole('button', { name: 'Create session' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          mentorId: 5,
          topic: 'Growth strategy review',
          meetingUrl: 'https://meet.gigvora.test',
          pricePaid: 350,
          status: 'scheduled',
        }),
      );
    });
    expect(screen.getByLabelText('Topic')).toHaveValue('');
  });
});

describe('MentoringPurchasesPanel', () => {
  it('creates and updates mentoring purchases', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const mentorLookup = new Map([[9, { id: 9, name: 'Taylor Coach' }]]);
    const purchases = {
      orders: [
        {
          id: 'order-1',
          mentorId: 9,
          packageName: 'Strategy Sprint',
          packageDescription: 'Four coaching calls',
          sessionsPurchased: 4,
          sessionsRedeemed: 1,
          totalAmount: 180000,
          currency: 'USD',
          status: 'active',
          purchasedAt: '2024-05-01T00:00:00Z',
        },
      ],
    };

    render(
      <MentoringPurchasesPanel
        purchases={purchases}
        mentorLookup={mentorLookup}
        onCreate={onCreate}
        onUpdate={onUpdate}
        pending={false}
      />
    );

    // Update existing order
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const statusSelect = screen.getByLabelText('Status');
    await user.selectOptions(statusSelect, 'completed');
    await user.clear(screen.getByLabelText('Sessions redeemed'));
    await user.type(screen.getByLabelText('Sessions redeemed'), '4');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith('order-1', expect.objectContaining({ status: 'completed', sessionsRedeemed: 4 }));
    });

    // Create new purchase
    await user.selectOptions(screen.getByLabelText('Mentor'), '9');
    await user.type(screen.getByLabelText('Package name'), ' Leadership Intensive ');
    await user.type(screen.getByLabelText('Total amount'), '1200');
    await user.click(screen.getByRole('button', { name: 'Record purchase' }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({ mentorId: 9, totalAmount: 1200, sessionsPurchased: 1 }),
      );
    });
  });
});

describe('MentoringMentorPanels', () => {
  it('supports saving notes, removing favourites, and booking suggestions', async () => {
    const user = userEvent.setup();
    const onFavourite = vi.fn().mockResolvedValue(undefined);
    const onRemoveFavourite = vi.fn();
    const onStartSession = vi.fn();

    render(
      <MentoringMentorPanels
        favourites={[
          {
            id: 'fav-1',
            mentorId: 42,
            notes: 'Initial note',
            createdAt: '2024-04-01T00:00:00Z',
            mentor: { fullName: 'Avery Mentor', email: 'avery@gigvora.test' },
          },
        ]}
        suggestions={[
          {
            id: 'suggest-1',
            mentorId: 77,
            generatedAt: '2024-04-10T00:00:00Z',
            mentor: { fullName: 'Jamie Guide' },
          },
        ]}
        onFavourite={onFavourite}
        onRemoveFavourite={onRemoveFavourite}
        onStartSession={onStartSession}
        pending={false}
      />
    );

    const notesField = screen.getByLabelText('Notes');
    await user.clear(notesField);
    await user.type(notesField, 'Updated note');
    await user.click(screen.getByRole('button', { name: 'Save notes' }));

    await waitFor(() => {
      expect(onFavourite).toHaveBeenCalledWith(42, 'Updated note');
    });

    await user.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onRemoveFavourite).toHaveBeenCalledWith(42);

    await user.click(screen.getByRole('button', { name: 'Book session' }));
    expect(onStartSession).toHaveBeenCalledWith(77);
  });
});

describe('AdsSection', () => {
  it('opens panel and saves a campaign', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const campaigns = [
      {
        id: 'cmp-1',
        name: 'Q2 Launch',
        status: 'draft',
        objective: 'awareness',
        budgetFormatted: '$1,000',
        spendFormatted: '$200',
        metrics: { impressions: 12000, clicks: 300, conversions: 12, spendCents: 20000 },
        metadata: { creative: { headline: 'Grow faster', description: 'Hire experts', cta: 'Book now' } },
      },
    ];

    render(
      <AdsSection
        campaigns={campaigns}
        insights={{ totalSpendFormatted: '$200', totalImpressions: 12000, totalClicks: 300, activeCampaigns: 1 }}
        loading={false}
        busy={false}
        onCreate={onCreate}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Launch campaign' }));
    const panel = await screen.findByRole('dialog', { name: 'Launch campaign' });
    await user.type(within(panel).getByLabelText('Campaign name'), 'New Growth Push');
    await user.type(within(panel).getByLabelText('Budget'), '2500');
    await user.click(within(panel).getByRole('button', { name: 'Save campaign' }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Growth Push', budget: '2500' }),
      );
    });
  });
});

describe('OrdersSection', () => {
  it('records and updates networking orders', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);

    render(
      <OrdersSection
        orders={[
          {
            id: 'order-1',
            reference: 'INV-100',
            sessionId: 55,
            amountFormatted: '$750',
            status: 'pending',
            purchasedAt: '2024-05-01T12:00:00Z',
          },
        ]}
        summary={{ totals: { total: 1, paid: 0, pending: 1 }, spend: { totalSpendFormatted: '$750' } }}
        loading={false}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Record order' }));
    const createPanel = await screen.findByRole('dialog', { name: 'Record networking order' });
    await user.type(within(createPanel).getByLabelText('Amount'), '500');
    await user.type(within(createPanel).getByLabelText('Currency'), 'EUR');
    await user.type(within(createPanel).getByLabelText('Reference'), 'INV-200');
    await user.click(within(createPanel).getByRole('button', { name: 'Save order' }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({ amount: '500', currency: 'EUR', reference: 'INV-200' }),
      );
    });

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const editPanel = await screen.findByRole('dialog', { name: 'Update order' });
    await user.selectOptions(within(editPanel).getByLabelText('Status'), 'paid');
    await user.click(within(editPanel).getByRole('button', { name: 'Save order' }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith('order-1', expect.objectContaining({ status: 'paid' }));
    });

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith('order-1');
    });
  });
});

describe('NetworkingSection', () => {
  it('books and updates networking sessions across views', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(
      <NetworkingSection
        freelancerId={88}
        summaryCards={[{ id: 'bookings', label: 'Bookings', value: '3' }]}
        bookings={[
          {
            id: 'booking-1',
            paymentStatus: 'pending',
            purchaseCents: 15000,
            purchaseCurrency: 'USD',
            status: 'confirmed',
            session: { id: 101, title: 'Founder Roundtable', startTime: '2024-06-20T17:00:00Z' },
            metadata: {},
          },
        ]}
        availableSessions={[
          { id: 201, title: 'Pitch Review', priceCents: 20000, startTime: '2024-06-25T16:00:00Z' },
        ]}
        connections={{ total: 1, items: [{ id: 'conn-1', status: 'new', followUpAt: '2024-06-10', counterpart: { name: 'Alex Client' } }] }}
        config={{ paymentStatuses: ['pending', 'paid'], connectionStatuses: ['new', 'follow_up'], connectionTypes: ['follow', 'deal'] }}
        loading={false}
        onRefresh={onRefresh}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Reserve' }));
    const bookingPanel = await screen.findByRole('dialog', { name: 'Reserve session' });
    await user.selectOptions(within(bookingPanel).getByLabelText('Status'), 'paid');
    await user.click(within(bookingPanel).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(networkingServiceMocks.bookFreelancerNetworkingSession).toHaveBeenCalledWith(88, 201, expect.any(Object));
      expect(onRefresh).toHaveBeenCalledWith({ force: true });
    });

    await user.click(screen.getByRole('button', { name: 'Bookings' }));
    await user.click(screen.getByRole('button', { name: 'Manage' }));
    const updatePanel = await screen.findByRole('dialog', { name: 'Update booking' });
    await user.selectOptions(within(updatePanel).getByLabelText('Status'), 'paid');
    await user.click(within(updatePanel).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(networkingServiceMocks.updateFreelancerNetworkingSignup).toHaveBeenCalledWith(
        88,
        'booking-1',
        expect.objectContaining({ paymentStatus: 'paid' }),
      );
    });
  });
});
