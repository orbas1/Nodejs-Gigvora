import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GigEscrowPanel from '../GigEscrowPanel.jsx';
import GigNewPanel from '../GigNewPanel.jsx';
import GigOrderDrawer from '../GigOrderDrawer.jsx';
import GigOverviewPanel from '../GigOverviewPanel.jsx';
import GigReviewPanel from '../GigReviewPanel.jsx';
import GigTimelinePanel from '../GigTimelinePanel.jsx';
import GigWorkspaceShell from '../GigWorkspaceShell.jsx';

describe('GigEscrowPanel', () => {
  it('creates checkpoints with numeric amount', async () => {
    const onCreate = vi.fn().mockResolvedValue();
    const onRelease = vi.fn();

    render(
      <GigEscrowPanel
        checkpoints={[]}
        currency="USD"
        canManage
        onCreate={onCreate}
        onRelease={onRelease}
      />,
    );

    await act(async () => {
      await userEvent.type(screen.getByPlaceholderText('Milestone'), 'Kickoff deposit');
      await userEvent.type(screen.getByPlaceholderText('2500'), '1800');
      await userEvent.type(screen.getByPlaceholderText('Add release conditions'), '50% upfront');
      await userEvent.click(screen.getByRole('button', { name: 'Add checkpoint' }));
    });

    await waitFor(() => expect(onCreate).toHaveBeenCalled());
    expect(onCreate.mock.calls[0][0]).toMatchObject({
      label: 'Kickoff deposit',
      amount: 1800,
      status: 'funded',
      notes: '50% upfront',
    });
  });

  it('releases funded checkpoints when requested', async () => {
    const onRelease = vi.fn();

    render(
      <GigEscrowPanel
        checkpoints={[
          { id: 'cp-1', label: 'Discovery', amount: 1200, currency: 'USD', status: 'funded' },
        ]}
        onCreate={vi.fn()}
        onRelease={onRelease}
        canManage
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Release' }));

    expect(onRelease).toHaveBeenCalledWith('cp-1');
  });
});

describe('GigNewPanel', () => {
  it('submits new gigs after completing steps', async () => {
    const onCreate = vi.fn().mockResolvedValue();

    render(<GigNewPanel canManage onCreate={onCreate} defaultCurrency="USD" />);

    await act(async () => {
      await userEvent.type(screen.getByLabelText('Vendor'), 'Studio One');
      await userEvent.type(screen.getByLabelText('Service'), 'Brand design');
      await userEvent.type(screen.getByLabelText('Amount'), '4800');
      await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    });

    await act(async () => {
      await userEvent.type(screen.getByPlaceholderText('Brand board'), 'Moodboard delivery');
      await userEvent.type(screen.getByLabelText('Due'), '2024-04-15');
      await userEvent.click(screen.getByRole('button', { name: 'Create gig' }));
    });

    await waitFor(() => expect(onCreate).toHaveBeenCalled());
    expect(onCreate.mock.calls[0][0]).toMatchObject({
      vendorName: 'Studio One',
      serviceName: 'Brand design',
      amount: 4800,
      currency: 'USD',
      deliverables: [
        expect.objectContaining({ ordinal: 1, title: 'Moodboard delivery' }),
      ],
    });
  });
});

describe('GigOrderDrawer', () => {
  it('updates order status and progress', async () => {
    const onUpdate = vi.fn().mockResolvedValue();
    const order = {
      id: 1,
      status: 'requirements',
      progressPercent: 10,
      currency: 'USD',
      amount: 2500,
      gig: { title: 'Logo refresh', currency: 'USD', dueAt: '2099-01-01T12:00:00Z' },
      vendor: { displayName: 'Design Co' },
    };

    render(
      <GigOrderDrawer
        open
        order={order}
        onClose={() => {}}
        canManage
        onUpdate={onUpdate}
      />,
    );

    await act(async () => {
      await userEvent.selectOptions(screen.getByLabelText('Status'), 'in_delivery');
      await userEvent.clear(screen.getByLabelText('Progress'));
      await userEvent.type(screen.getByLabelText('Progress'), '65');
      await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    });

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(onUpdate.mock.calls[0][0]).toMatchObject({ status: 'in_delivery', progressPercent: 65 });
  });
});

describe('GigReviewPanel', () => {
  it('submits review scores and notes', async () => {
    const onSubmit = vi.fn().mockResolvedValue();

    render(<GigReviewPanel scorecard={null} canManage onSubmit={onSubmit} />);

    await act(async () => {
      await userEvent.type(screen.getByLabelText('Overall'), '4.5');
      await userEvent.type(screen.getByLabelText('Notes'), 'Strong communication.');
      await userEvent.click(screen.getByRole('button', { name: 'Save review' }));
    });

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({
      scorecard: { overallScore: 4.5, notes: 'Strong communication.' },
    });
  });
});

describe('GigTimelinePanel', () => {
  it('creates timeline entries with defaults', async () => {
    const onAddEvent = vi.fn().mockResolvedValue();
    const timeline = [
      {
        id: 1,
        title: 'Kickoff call',
        activityType: 'note',
        occurredAt: '2024-04-01T09:00:00Z',
        ownerName: 'Alex',
      },
    ];

    render(
      <GigTimelinePanel timeline={timeline} canManage onAddEvent={onAddEvent} />,
    );

    await act(async () => {
      await userEvent.selectOptions(screen.getByLabelText('Type'), 'order');
      await userEvent.type(screen.getByLabelText('Title'), 'Assets approved');
      await userEvent.click(screen.getByRole('button', { name: 'Log event' }));
    });

    await waitFor(() => expect(onAddEvent).toHaveBeenCalled());
    expect(onAddEvent.mock.calls[0][0]).toMatchObject({
      activityType: 'order',
      title: 'Assets approved',
    });
  });
});

describe('GigOverviewPanel', () => {
  it('supports selecting orders for inspection', async () => {
    const onSelectOrder = vi.fn();
    const onInspectOrder = vi.fn();
    const openOrders = [
      { id: 1, status: 'in_delivery', vendorName: 'Agency A', serviceName: 'Branding' },
    ];
    const closedOrders = [
      { id: 2, status: 'completed', serviceName: 'Website', updatedAt: '2024-03-01T00:00:00Z' },
    ];

    render(
      <GigOverviewPanel
        openOrders={openOrders}
        closedOrders={closedOrders}
        submissions={[]}
        selectedOrderId={null}
        onSelectOrder={onSelectOrder}
        onInspectOrder={onInspectOrder}
        stats={{ openCount: 1, closedCount: 1, escrowTotal: 1200, currency: 'USD' }}
      />,
    );

    const openCard = screen.getByRole('button', { name: /Branding/ });
    await userEvent.click(within(openCard).getByText('View'));
    expect(onInspectOrder).toHaveBeenCalledWith(1);

    await userEvent.click(screen.getByText('Branding'));
    expect(onSelectOrder).toHaveBeenCalledWith(1);
  });
});

describe('GigWorkspaceShell', () => {
  it('invokes onSelect when activating navigation items', async () => {
    const onSelect = vi.fn();
    const items = [
      { id: 'overview', label: 'Overview' },
      { id: 'timeline', label: 'Timeline' },
    ];

    render(
      <GigWorkspaceShell
        items={items}
        activeId="overview"
        onSelect={onSelect}
        header={<span>Header</span>}
        footer={<span>Footer</span>}
      >
        <p>Content</p>
      </GigWorkspaceShell>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Timeline' }));
    expect(onSelect).toHaveBeenCalledWith('timeline');
  });
});
