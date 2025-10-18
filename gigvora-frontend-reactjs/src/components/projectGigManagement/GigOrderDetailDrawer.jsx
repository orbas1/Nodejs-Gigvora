import PropTypes from 'prop-types';
import { ClockIcon, DocumentTextIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import CommandDrawer from './CommandDrawer.jsx';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value ?? '—'}</span>
    </div>
  );
}

InfoRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
};

InfoRow.defaultProps = {
  value: null,
};

function TimelineItem({ item, onEdit }) {
  return (
    <button
      type="button"
      onClick={() => onEdit?.(item)}
      className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition hover:border-accent hover:bg-accent/5"
    >
      <div>
        <p className="font-semibold text-slate-900">{item.title}</p>
        <p className="text-xs text-slate-500">{item.type?.replace(/_/g, ' ')}</p>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <ClockIcon className="h-4 w-4" />
        <span>{item.scheduledAt ? formatRelativeTime(item.scheduledAt) : 'No date'}</span>
      </div>
    </button>
  );
}

TimelineItem.propTypes = {
  item: PropTypes.object.isRequired,
  onEdit: PropTypes.func,
};

TimelineItem.defaultProps = {
  onEdit: undefined,
};

function SubmissionItem({ item, onEdit }) {
  return (
    <button
      type="button"
      onClick={() => onEdit?.(item)}
      className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition hover:border-accent hover:bg-accent/5"
    >
      <div>
        <p className="font-semibold text-slate-900">{item.title}</p>
        <p className="text-xs text-slate-500">{item.status?.replace(/_/g, ' ')}</p>
      </div>
      <div className="text-xs text-slate-500">
        {item.submittedAt ? formatAbsolute(item.submittedAt) : 'Draft'}
      </div>
    </button>
  );
}

SubmissionItem.propTypes = {
  item: PropTypes.object.isRequired,
  onEdit: PropTypes.func,
};

SubmissionItem.defaultProps = {
  onEdit: undefined,
};

function Message({ message }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-slate-900">{message.authorName ?? 'Anon'}</p>
        <span className="text-xs text-slate-500">{message.sentAt ? formatRelativeTime(message.sentAt) : 'Just now'}</span>
      </div>
      <p className="mt-2 whitespace-pre-line">{message.body}</p>
    </div>
  );
}

Message.propTypes = {
  message: PropTypes.object.isRequired,
};

export default function GigOrderDetailDrawer({
  open,
  onClose,
  order,
  onEditOrder,
  onAddTimeline,
  onEditTimeline,
  onLogSubmission,
  onEditSubmission,
  onStartChat,
}) {
  if (!order) {
    return null;
  }

  const footer = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onEditOrder?.(order)}
          className="inline-flex items-center rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Edit order
        </button>
        <button
          type="button"
          onClick={() => onAddTimeline?.(order.id)}
          className="inline-flex items-center rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent/90"
        >
          Add milestone
        </button>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onLogSubmission?.(order.id)}
          className="inline-flex items-center rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-600 hover:border-accent hover:text-accent"
        >
          Log delivery
        </button>
        <button
          type="button"
          onClick={() => onStartChat?.(order.id)}
          className="inline-flex items-center rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-600 hover:border-accent hover:text-accent"
        >
          Ping chat
        </button>
      </div>
    </div>
  );

  return (
    <CommandDrawer
      open={open}
      onClose={onClose}
      title={order.serviceName ?? 'Gig'}
      subtitle={order.vendorName ? `Vendor · ${order.vendorName}` : undefined}
      size="xl"
      footer={footer}
    >
      <div className="grid gap-6">
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="Order" value={order.orderNumber ?? `#${order.id}`}></InfoRow>
            <InfoRow label="Status" value={order.status?.replace(/_/g, ' ')} />
            <InfoRow label="Progress" value={`${order.progressPercent ?? 0}%`} />
            <InfoRow label="Due" value={order.dueAt ? formatAbsolute(order.dueAt) : '—'} />
            <InfoRow label="Amount" value={`${order.currency ?? 'USD'} ${order.amount ?? 0}`} />
            <InfoRow label="Kickoff" value={order.kickoffAt ? formatAbsolute(order.kickoffAt) : '—'} />
          </div>
        </section>

        <section className="grid gap-4">
          <header className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">Timeline</h4>
            <button
              type="button"
              onClick={() => onAddTimeline?.(order.id)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent"
            >
              <ClockIcon className="h-4 w-4" />
              Add
            </button>
          </header>
          <div className="grid gap-2">
            {order.timelineEvents?.length ? (
              order.timelineEvents.slice(0, 6).map((event) => (
                <TimelineItem key={event.id} item={event} onEdit={(item) => onEditTimeline?.(order.id, item)} />
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                No milestones yet.
              </p>
            )}
          </div>
        </section>

        <section className="grid gap-4">
          <header className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">Deliveries</h4>
            <button
              type="button"
              onClick={() => onLogSubmission?.(order.id)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent"
            >
              <DocumentTextIcon className="h-4 w-4" />
              Log
            </button>
          </header>
          <div className="grid gap-2">
            {order.submissions?.length ? (
              order.submissions.slice(0, 6).map((submission) => (
                <SubmissionItem
                  key={submission.id}
                  item={submission}
                  onEdit={(item) => onEditSubmission?.(order.id, item)}
                />
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                No deliveries yet.
              </p>
            )}
          </div>
        </section>

        <section className="grid gap-4">
          <header className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">Latest chat</h4>
            <button
              type="button"
              onClick={() => onStartChat?.(order.id)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              Reply
            </button>
          </header>
          <div className="grid gap-2">
            {order.chatMessages?.length ? (
              order.chatMessages.slice(0, 5).map((message) => <Message key={message.id} message={message} />)
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                No messages yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </CommandDrawer>
  );
}

GigOrderDetailDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  order: PropTypes.object,
  onEditOrder: PropTypes.func,
  onAddTimeline: PropTypes.func,
  onEditTimeline: PropTypes.func,
  onLogSubmission: PropTypes.func,
  onEditSubmission: PropTypes.func,
  onStartChat: PropTypes.func,
};

GigOrderDetailDrawer.defaultProps = {
  open: false,
  onClose: undefined,
  order: null,
  onEditOrder: undefined,
  onAddTimeline: undefined,
  onEditTimeline: undefined,
  onLogSubmission: undefined,
  onEditSubmission: undefined,
  onStartChat: undefined,
};
