import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserOrdersSection from '../UserOrdersSection.jsx';
import useProjectGigManagement from '../../../../hooks/useProjectGigManagement.js';

vi.mock('../../../../hooks/useProjectGigManagement.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

function makeTimelineEvents(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `evt-${index + 1}`,
    title: `Milestone ${index + 1}`,
    notes: `Notes ${index + 1}`,
    createdAt: new Date(Date.now() - index * 3600_000).toISOString(),
  }));
}

function makeMessages(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `msg-${index + 1}`,
    body: `Message body ${index + 1}`,
    createdAt: new Date(Date.now() - index * 1800_000).toISOString(),
    author: { name: index % 2 === 0 ? 'Vendor Bot' : 'Client Success' },
  }));
}

function createHookState(orders) {
  return {
    data: {
      purchasedGigs: {
        orders,
        stats: { currency: 'USD', totalOrders: orders.length, active: orders.length },
      },
    },
    loading: false,
    error: null,
    actions: {
      updateGigOrder: vi.fn(),
      addTimelineEvent: vi.fn(),
      createGigOrder: vi.fn(),
      postGigMessage: vi.fn(),
      createGigSubmission: vi.fn(),
    },
    reload: vi.fn(),
  };
}

function makeOrdersDataset() {
  const timeline = makeTimelineEvents(14);
  const messages = makeMessages(12);
  return [
    {
      id: 1,
      title: 'Analytics Setup',
      status: 'in_delivery',
      timeline: timeline.slice(0, 8),
      messages: messages.slice(0, 6),
    },
    {
      id: 2,
      title: 'Growth Strategy',
      status: 'requirements',
      timeline: timeline.slice(8),
      messages: messages.slice(6),
    },
  ];
}

let hookState;

function renderOrdersSection() {
  return render(<UserOrdersSection userId={42} initialWorkspace={hookState.data} />);
}

describe('UserOrdersSection', () => {
  beforeEach(() => {
    hookState = createHookState(makeOrdersDataset());
    useProjectGigManagement.mockImplementation(() => hookState);
  });

  it('aggregates timeline history with pagination controls', async () => {
    const user = userEvent.setup();
    renderOrdersSection();

    await screen.findByRole('heading', { name: /order journal/i });
    const timelineLabel = await screen.findAllByText(/^timeline$/i);
    const timelineSection = timelineLabel[0]?.closest('div');
    expect(timelineSection).toBeTruthy();
    const timelineList = within(timelineSection).getByRole('list');
    expect(within(timelineList).getAllByRole('listitem')).toHaveLength(10);

    const loadMoreUpdates = await within(timelineSection).findByRole('button', { name: /load more updates/i });
    await user.click(loadMoreUpdates);

    expect(within(timelineList).getAllByRole('listitem').length).toBeGreaterThan(10);
    expect(
      within(timelineSection).getByText(/showing \d+ of \d+ updates across all orders/i),
    ).toBeInTheDocument();

    const messagesHeading = (await screen.findAllByText(/^messages$/i))[0];
    const messagesSection = messagesHeading.closest('div');
    expect(messagesSection).toBeTruthy();
    const messagesList = within(messagesSection).getByRole('list');
    expect(within(messagesList).getAllByRole('listitem')).toHaveLength(10);

    const loadMoreMessages = await within(messagesSection).findByRole('button', { name: /load more messages/i });
    await user.click(loadMoreMessages);
    expect(within(messagesList).getAllByRole('listitem').length).toBeGreaterThan(10);
    expect(
      within(messagesSection).getByText(/showing \d+ of \d+ messages across all orders/i),
    ).toBeInTheDocument();
  });

  it('recovers from invalid order selections by reverting to the first workspace order', async () => {
    renderOrdersSection();

    const orderSelect = await screen.findByRole('combobox', { name: /order reference/i });
    fireEvent.change(orderSelect, { target: { value: '999' } });

    await waitFor(() => {
      expect(orderSelect.value).toBe('all');
    });
  });

  it('shows placeholders when no timeline or messages exist', async () => {
    hookState = createHookState([
      { id: 10, title: 'Website refresh', status: 'requirements', timeline: [], messages: [] },
    ]);
    useProjectGigManagement.mockImplementation(() => hookState);
    renderOrdersSection();

    expect(
      await screen.findByText(/timeline notes will appear here once logged/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
  });
});
