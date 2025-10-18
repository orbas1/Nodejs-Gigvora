import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import GigWorkspaceShell from './workspace/GigWorkspaceShell.jsx';
import GigOverviewPanel from './workspace/GigOverviewPanel.jsx';
import GigNewPanel from './workspace/GigNewPanel.jsx';
import GigTimelinePanel from './workspace/GigTimelinePanel.jsx';
import GigChatPanel from './workspace/GigChatPanel.jsx';
import GigEscrowPanel from './workspace/GigEscrowPanel.jsx';
import GigReviewPanel from './workspace/GigReviewPanel.jsx';
import GigOrderDrawer from './workspace/GigOrderDrawer.jsx';

const PANES = {
  HOME: 'home',
  NEW: 'new',
  TIMELINE: 'timeline',
  CHAT: 'chat',
  ESCROW: 'escrow',
  REVIEW: 'review',
};

function normalizeOrders(snapshot) {
  if (!snapshot) {
    return [];
  }
  const orders = snapshot.purchasedGigs?.orders;
  if (Array.isArray(orders)) {
    return orders;
  }
  return [];
}

export default function GigOperationsWorkspace({
  data,
  canManage,
  onCreateOrder,
  onUpdateOrder,
  onAddTimelineEvent,
  onPostMessage,
  onCreateEscrow,
  onUpdateEscrow,
  onSubmitReview,
  defaultAuthorName,
}) {
  const orders = useMemo(() => normalizeOrders(data), [data]);
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id ?? null);
  const [activePane, setActivePane] = useState(PANES.HOME);
  const [drawerOrderId, setDrawerOrderId] = useState(null);

  useEffect(() => {
    if (!orders.length) {
      setSelectedOrderId(null);
      setActivePane(PANES.NEW);
      return;
    }
    setSelectedOrderId((current) => {
      if (current == null || !orders.some((order) => order.id === current)) {
        return orders[0].id;
      }
      return current;
    });
  }, [orders]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

  const openOrders = useMemo(
    () => orders.filter((order) => order?.isClosed !== true && order?.status !== 'closed'),
    [orders],
  );
  const closedOrders = useMemo(
    () => orders.filter((order) => order?.isClosed === true || order?.status === 'closed'),
    [orders],
  );

  const timeline = useMemo(
    () => (Array.isArray(selectedOrder?.timeline) ? selectedOrder.timeline : []),
    [selectedOrder],
  );
  const messages = useMemo(
    () => (Array.isArray(selectedOrder?.messages) ? selectedOrder.messages : []),
    [selectedOrder],
  );
  const revisions = useMemo(
    () => (Array.isArray(selectedOrder?.revisions) ? selectedOrder.revisions : []),
    [selectedOrder],
  );
  const escrowCheckpoints = useMemo(
    () => (Array.isArray(selectedOrder?.escrowCheckpoints) ? selectedOrder.escrowCheckpoints : []),
    [selectedOrder],
  );
  const scorecard = selectedOrder?.scorecard ?? null;

  const workspaceCurrency = selectedOrder?.currency ?? selectedOrder?.orderCurrency ?? data?.purchasedGigs?.currency ?? 'USD';

  const stats = useMemo(() => {
    const escrowTotal = orders.reduce((total, order) => {
      const checkpoints = Array.isArray(order?.escrowCheckpoints) ? order.escrowCheckpoints : [];
      return (
        total +
        checkpoints.reduce((sum, checkpoint) => {
          if (checkpoint.status === 'released') {
            return sum;
          }
          const amount = Number(checkpoint.amount);
          return sum + (Number.isFinite(amount) ? amount : 0);
        }, 0)
      );
    }, 0);
    return {
      openCount: openOrders.length,
      closedCount: closedOrders.length,
      escrowTotal,
      currency: workspaceCurrency,
    };
  }, [openOrders.length, closedOrders.length, orders, workspaceCurrency]);

  const navItems = useMemo(() => {
    const hasOrder = Boolean(selectedOrder);
    return [
      { id: PANES.HOME, label: 'Home', badge: openOrders.length + closedOrders.length },
      { id: PANES.NEW, label: 'New' },
      {
        id: PANES.TIMELINE,
        label: 'Timeline',
        badge: timeline.length,
        disabled: !hasOrder,
      },
      {
        id: PANES.CHAT,
        label: 'Chat',
        badge: messages.length,
        disabled: !hasOrder,
      },
      {
        id: PANES.ESCROW,
        label: 'Escrow',
        badge: escrowCheckpoints.length,
        disabled: !hasOrder,
      },
      {
        id: PANES.REVIEW,
        label: 'Review',
        badge: scorecard?.overallScore ? scorecard.overallScore.toFixed(1) : undefined,
        disabled: !hasOrder,
      },
    ];
  }, [selectedOrder, openOrders.length, closedOrders.length, timeline.length, messages.length, escrowCheckpoints.length, scorecard]);

  useEffect(() => {
    if (!selectedOrder && activePane !== PANES.NEW && navItems.find((item) => item.id === activePane)?.disabled) {
      setActivePane(PANES.NEW);
    }
  }, [selectedOrder, activePane, navItems]);

  const handleInspect = (orderId) => {
    setDrawerOrderId(orderId);
  };

  const handleDrawerClose = () => {
    setDrawerOrderId(null);
  };

  const drawerOrder = useMemo(
    () => orders.find((order) => order.id === drawerOrderId) ?? null,
    [orders, drawerOrderId],
  );

  const handleDrawerUpdate = async (payload) => {
    if (!drawerOrder) {
      throw new Error('Select a gig.');
    }
    await onUpdateOrder(drawerOrder.id, payload);
  };

  const paneContent = (() => {
    switch (activePane) {
      case PANES.NEW:
        return (
          <GigNewPanel
            canManage={canManage}
            onCreate={(payload) => onCreateOrder(payload)}
            defaultCurrency={workspaceCurrency}
          />
        );
      case PANES.TIMELINE:
        return (
          <GigTimelinePanel
            timeline={timeline}
            canManage={canManage}
            onAddEvent={async (payload) => {
              if (!selectedOrder) throw new Error('Select a gig first.');
              await onAddTimelineEvent(selectedOrder.id, payload);
            }}
          />
        );
      case PANES.CHAT:
        return (
          <GigChatPanel
            messages={messages}
            canManage={canManage}
            defaultAuthorName={defaultAuthorName}
            onSendMessage={async (payload) => {
              if (!selectedOrder) throw new Error('Select a gig first.');
              await onPostMessage(selectedOrder.id, payload);
            }}
          />
        );
      case PANES.ESCROW:
        return (
          <GigEscrowPanel
            checkpoints={escrowCheckpoints}
            currency={workspaceCurrency}
            canManage={canManage}
            onCreate={async (payload) => {
              if (!selectedOrder) throw new Error('Select a gig first.');
              await onCreateEscrow(selectedOrder.id, payload);
            }}
            onRelease={async (checkpointId) => {
              if (!selectedOrder) throw new Error('Select a gig first.');
              await onUpdateEscrow(selectedOrder.id, checkpointId, { status: 'released' });
            }}
          />
        );
      case PANES.REVIEW:
        return (
          <GigReviewPanel
            scorecard={scorecard}
            canManage={canManage}
            onSubmit={async (payload) => {
              if (!selectedOrder) throw new Error('Select a gig first.');
              await onSubmitReview(selectedOrder.id, payload);
            }}
          />
        );
      case PANES.HOME:
      default:
        return (
          <GigOverviewPanel
            openOrders={openOrders}
            closedOrders={closedOrders}
            submissions={revisions}
            selectedOrderId={selectedOrder?.id ?? null}
            onSelectOrder={setSelectedOrderId}
            onInspectOrder={handleInspect}
            stats={stats}
          />
        );
    }
  })();

  const shellHeader = (
    <div className="flex w-full items-center justify-between">
      <h2 className="text-lg font-semibold text-slate-900">Gig hub</h2>
      {orders.length ? (
        <select
          value={selectedOrderId ?? ''}
          onChange={(event) => setSelectedOrderId(Number(event.target.value))}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          {orders.map((order) => (
            <option key={order.id} value={order.id}>
              {order.gig?.title ?? order.serviceName ?? 'Gig'}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );

  const shellFooter = selectedOrder ? (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-600">
      <p className="font-semibold text-slate-800">{selectedOrder.vendor?.displayName ?? selectedOrder.vendorName ?? 'Vendor'}</p>
      <p className="mt-1">Order {selectedOrder.orderNumber ?? selectedOrder.id}</p>
    </div>
  ) : null;

  return (
    <section id="project-gig-operations" className="w-full">
      <GigWorkspaceShell items={navItems} activeId={activePane} onSelect={setActivePane} header={shellHeader} footer={shellFooter}>
        {paneContent}
      </GigWorkspaceShell>
      <GigOrderDrawer
        open={Boolean(drawerOrder)}
        order={drawerOrder}
        onClose={handleDrawerClose}
        canManage={canManage}
        onUpdate={handleDrawerUpdate}
      />
    </section>
  );
}

GigOperationsWorkspace.propTypes = {
  data: PropTypes.object,
  canManage: PropTypes.bool,
  onCreateOrder: PropTypes.func.isRequired,
  onUpdateOrder: PropTypes.func.isRequired,
  onAddTimelineEvent: PropTypes.func.isRequired,
  onPostMessage: PropTypes.func.isRequired,
  onCreateEscrow: PropTypes.func.isRequired,
  onUpdateEscrow: PropTypes.func.isRequired,
  onSubmitReview: PropTypes.func.isRequired,
  defaultAuthorName: PropTypes.string,
};

GigOperationsWorkspace.defaultProps = {
  data: null,
  canManage: false,
  defaultAuthorName: null,
};
