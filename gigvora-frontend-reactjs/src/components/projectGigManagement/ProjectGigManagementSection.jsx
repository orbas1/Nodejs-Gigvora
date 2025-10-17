import PropTypes from 'prop-types';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

const NAV_ITEMS = [
  { id: 'manage', label: 'Manage' },
  { id: 'create', label: 'Create' },
  { id: 'open', label: 'Open' },
  { id: 'closed', label: 'Closed' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'submit', label: 'Submit' },
  { id: 'chat', label: 'Chat' },
];

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-GB').format(Number(value));
}

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return `${currency} 0`;
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${currency} ${formatNumber(value)}`;
  }
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
};

function OrderCard({ order, onOpen, onTimeline, onLog, onEdit }) {
  const status = order.status?.replace(/_/g, ' ');
  const due = order.dueAt ? formatRelativeTime(order.dueAt) : 'No due date';
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{order.serviceName}</p>
          <p className="text-xs text-slate-500">{order.vendorName}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{status}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs text-slate-500">Progress</p>
          <p className="text-sm font-semibold text-slate-900">{order.progressPercent ?? 0}%</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Due</p>
          <p className="text-sm font-semibold text-slate-900">{due}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Amount</p>
          <p className="text-sm font-semibold text-slate-900">{formatCurrency(order.amount, order.currency)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Open items</p>
          <p className="text-sm font-semibold text-slate-900">{order.outstandingRequirements ?? 0}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onOpen(order)}
          className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
        >
          View
        </button>
        <button
          type="button"
          onClick={() => onEdit(order)}
          className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onTimeline(order)}
          className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent"
        >
          Milestone
        </button>
        <button
          type="button"
          onClick={() => onLog(order)}
          className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent"
        >
          Delivery
        </button>
      </div>
    </div>
  );
}

OrderCard.propTypes = {
  order: PropTypes.object.isRequired,
  onOpen: PropTypes.func.isRequired,
  onTimeline: PropTypes.func.isRequired,
  onLog: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};

function ManageView({ summary, board, onOpenProject, onOpenOrder }) {
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Projects" value={formatNumber(summary.totalProjects)} />
        <StatCard label="Active" value={formatNumber(summary.activeProjects)} />
        <StatCard label="Open gigs" value={formatNumber(summary.openGigs)} />
        <StatCard label="Closed gigs" value={formatNumber(summary.closedGigs)} />
        <StatCard label="In play" value={formatCurrency(summary.openGigValue, summary.currency)} />
        <StatCard label="Budget" value={formatCurrency(summary.budgetInPlay, summary.currency)} />
        <StatCard label="Templates" value={formatNumber(summary.templatesAvailable)} />
        <StatCard label="Stories" value={formatNumber(summary.storiesReady)} />
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">Board lanes</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onOpenProject}
              className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Project
            </button>
            <button
              type="button"
              onClick={onOpenOrder}
              className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent/90"
            >
              Order
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {board.lanes.map((lane) => (
            <div key={lane.status} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{lane.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{lane.projects.length}</p>
              <div className="mt-3 grid gap-2">
                {lane.projects.slice(0, 3).map((project) => (
                  <div key={project.id} className="rounded-xl bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
                    <p className="font-semibold text-slate-900">{project.title}</p>
                    <p>{project.progress}% · {project.riskLevel}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

ManageView.propTypes = {
  summary: PropTypes.object.isRequired,
  board: PropTypes.object.isRequired,
  onOpenProject: PropTypes.func.isRequired,
  onOpenOrder: PropTypes.func.isRequired,
};

function CreateView({ onOpenProject, onOpenOrder, onCreateTimeline, onLogSubmission, onStartChat }) {
  const actions = [
    { label: 'Project', onClick: onOpenProject },
    { label: 'Order', onClick: onOpenOrder },
    { label: 'Milestone', onClick: onCreateTimeline },
    { label: 'Delivery', onClick: onLogSubmission },
    { label: 'Message', onClick: onStartChat },
  ];

  return (
    <div className="grid h-full place-items-center rounded-3xl border border-slate-200 bg-white/95 p-10 shadow-sm">
      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => action.onClick()}
            className="rounded-3xl border border-slate-200 bg-slate-50/70 px-6 py-10 text-lg font-semibold text-slate-900 shadow-sm transition hover:border-accent hover:bg-white"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

CreateView.propTypes = {
  onOpenProject: PropTypes.func.isRequired,
  onOpenOrder: PropTypes.func.isRequired,
  onCreateTimeline: PropTypes.func.isRequired,
  onLogSubmission: PropTypes.func.isRequired,
  onStartChat: PropTypes.func.isRequired,
};

function OrdersView({ title, orders, onOpenOrder, onTimeline, onLog, onEdit }) {
  return (
    <div className="grid h-full gap-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {orders.length ? (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onOpen={() => onOpenOrder(order)}
              onTimeline={() => onTimeline(order.id)}
              onLog={() => onLog(order.id)}
              onEdit={() => onEdit(order)}
            />
          ))}
        </div>
      ) : (
        <p className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 p-10 text-sm text-slate-500">
          Nothing here yet.
        </p>
      )}
    </div>
  );
}

OrdersView.propTypes = {
  title: PropTypes.string.isRequired,
  orders: PropTypes.arrayOf(PropTypes.object).isRequired,
  onOpenOrder: PropTypes.func.isRequired,
  onTimeline: PropTypes.func.isRequired,
  onLog: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};

function TimelineView({ timeline, onEdit }) {
  return (
    <div className="grid h-full gap-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Upcoming</h3>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {timeline.upcoming.length ? (
            timeline.upcoming.slice(0, 8).map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => onEdit(event.orderId, event)}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left text-sm text-slate-700 transition hover:border-accent hover:bg-white"
              >
                <p className="font-semibold text-slate-900">{event.title}</p>
                <p className="mt-1 text-xs text-slate-500">{event.serviceName}</p>
                <p className="mt-2 text-xs text-slate-500">{event.scheduledAt ? formatRelativeTime(event.scheduledAt) : 'No date'}</p>
              </button>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">No upcoming items.</p>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-base font-semibold text-slate-900">Recent</h3>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {timeline.recent.length ? (
            timeline.recent.slice(0, 8).map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => onEdit(event.orderId, event)}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left text-sm text-slate-700 transition hover:border-accent hover:bg-white"
              >
                <p className="font-semibold text-slate-900">{event.title}</p>
                <p className="mt-1 text-xs text-slate-500">{event.serviceName}</p>
                <p className="mt-2 text-xs text-slate-500">{event.completedAt ? formatAbsolute(event.completedAt) : 'In progress'}</p>
              </button>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">No history yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

TimelineView.propTypes = {
  timeline: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
};

function SubmissionView({ submissions, onEdit }) {
  return (
    <div className="grid h-full gap-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Pending</h3>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {submissions.pending.length ? (
            submissions.pending.slice(0, 8).map((submission) => (
              <button
                key={submission.id}
                type="button"
                onClick={() => onEdit(submission.orderId, submission)}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left text-sm text-slate-700 transition hover:border-accent hover:bg-white"
              >
                <p className="font-semibold text-slate-900">{submission.title}</p>
                <p className="mt-2 text-xs text-slate-500">{submission.status.replace(/_/g, ' ')}</p>
                <p className="mt-2 text-xs text-slate-500">{submission.submittedAt ? formatRelativeTime(submission.submittedAt) : 'Draft'}</p>
              </button>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">All caught up.</p>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-base font-semibold text-slate-900">Recent</h3>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {submissions.recent.length ? (
            submissions.recent.slice(0, 8).map((submission) => (
              <button
                key={submission.id}
                type="button"
                onClick={() => onEdit(submission.orderId, submission)}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left text-sm text-slate-700 transition hover:border-accent hover:bg-white"
              >
                <p className="font-semibold text-slate-900">{submission.title}</p>
                <p className="mt-2 text-xs text-slate-500">{submission.status.replace(/_/g, ' ')}</p>
                <p className="mt-2 text-xs text-slate-500">{submission.reviewedAt ? formatAbsolute(submission.reviewedAt) : 'Awaiting review'}</p>
              </button>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">No deliveries logged.</p>
          )}
        </div>
      </div>
    </div>
  );
}

SubmissionView.propTypes = {
  submissions: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
};

function ChatView({ chat, onReply }) {
  return (
    <div className="grid h-full gap-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Threads</h3>
        <button
          type="button"
          onClick={() => onReply()}
          className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent/90"
        >
          New
        </button>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {chat.recent.length ? (
          chat.recent.slice(0, 12).map((message) => (
            <button
              key={message.id}
              type="button"
              onClick={() => onReply(message.orderId)}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left text-sm text-slate-700 transition hover:border-accent hover:bg-white"
            >
              <p className="font-semibold text-slate-900">{message.serviceName}</p>
              <p className="mt-1 text-xs text-slate-500">{message.authorName ?? 'Anon'}</p>
              <p className="mt-2 text-xs text-slate-500">{message.sentAt ? formatRelativeTime(message.sentAt) : 'Just now'}</p>
              <p className="mt-2 line-clamp-2 text-xs text-slate-600">{message.body}</p>
            </button>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">No chatter yet.</p>
        )}
      </div>
    </div>
  );
}

ChatView.propTypes = {
  chat: PropTypes.object.isRequired,
  onReply: PropTypes.func.isRequired,
};

export default function ProjectGigManagementSection({
  data,
  activeView,
  onViewChange,
  onOpenProject,
  onOpenOrder,
  onOpenOrderDetail,
  onCreateTimeline,
  onEditTimeline,
  onLogSubmission,
  onEditSubmission,
  onStartChat,
  onEditOrder,
}) {
  const openOrders = data.purchasedGigs?.orders?.filter((order) => ['requirements', 'in_delivery', 'in_revision'].includes(order.status)) ?? [];
  const closedOrders = data.purchasedGigs?.orders?.filter((order) => !['requirements', 'in_delivery', 'in_revision'].includes(order.status)) ?? [];

  let viewContent = null;
  if (activeView === 'manage') {
    viewContent = (
      <ManageView summary={data.summary} board={data.managementBoard} onOpenProject={onOpenProject} onOpenOrder={onOpenOrder} />
    );
  } else if (activeView === 'create') {
    viewContent = (
      <CreateView
        onOpenProject={onOpenProject}
        onOpenOrder={onOpenOrder}
        onCreateTimeline={() => onCreateTimeline(openOrders[0]?.id ?? data.purchasedGigs?.orders?.[0]?.id)}
        onLogSubmission={() => onLogSubmission(openOrders[0]?.id ?? data.purchasedGigs?.orders?.[0]?.id)}
        onStartChat={() => onStartChat(openOrders[0]?.id ?? data.purchasedGigs?.orders?.[0]?.id)}
      />
    );
  } else if (activeView === 'open') {
    viewContent = (
      <OrdersView
        title="Active gigs"
        orders={openOrders}
        onOpenOrder={(order) => {
          onOpenOrderDetail(order.id);
        }}
        onTimeline={(orderId) => onCreateTimeline(orderId)}
        onLog={(orderId) => onLogSubmission(orderId)}
        onEdit={(order) => onEditOrder(order)}
      />
    );
  } else if (activeView === 'closed') {
    viewContent = (
      <OrdersView
        title="Closed gigs"
        orders={closedOrders}
        onOpenOrder={(order) => {
          onOpenOrderDetail(order.id);
        }}
        onTimeline={(orderId) => onCreateTimeline(orderId)}
        onLog={(orderId) => onLogSubmission(orderId)}
        onEdit={(order) => onEditOrder(order)}
      />
    );
  } else if (activeView === 'timeline') {
    viewContent = <TimelineView timeline={data.purchasedGigs?.timeline ?? { upcoming: [], recent: [] }} onEdit={onEditTimeline} />;
  } else if (activeView === 'submit') {
    viewContent = <SubmissionView submissions={data.purchasedGigs?.submissions ?? { pending: [], recent: [] }} onEdit={onEditSubmission} />;
  } else if (activeView === 'chat') {
    viewContent = <ChatView chat={data.purchasedGigs?.chat ?? { recent: [] }} onReply={(orderId) => onStartChat(orderId)} />;
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <nav className="flex w-full flex-row gap-2 overflow-x-auto rounded-3xl border border-slate-200 bg-white/80 p-3 shadow-sm lg:w-48 lg:flex-col">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onViewChange(item.id)}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              activeView === item.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="flex-1">
        <div className="min-h-[640px] rounded-3xl bg-gradient-to-br from-slate-50 via-white to-white p-6 shadow-sm">
          {viewContent}
        </div>
      </div>
    </div>
  );
}

ProjectGigManagementSection.propTypes = {
  data: PropTypes.object.isRequired,
  activeView: PropTypes.string.isRequired,
  onViewChange: PropTypes.func.isRequired,
  onOpenProject: PropTypes.func.isRequired,
  onOpenOrder: PropTypes.func.isRequired,
  onOpenOrderDetail: PropTypes.func.isRequired,
  onCreateTimeline: PropTypes.func.isRequired,
  onEditTimeline: PropTypes.func.isRequired,
  onLogSubmission: PropTypes.func.isRequired,
  onEditSubmission: PropTypes.func.isRequired,
  onStartChat: PropTypes.func.isRequired,
  onEditOrder: PropTypes.func.isRequired,
};

