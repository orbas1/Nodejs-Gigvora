import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

function formatPercent(value) {
  if (value == null) {
    return '0%';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '0%';
  }
  return `${Math.round(numeric)}%`;
}

function formatCurrency(amount, currency) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch (error) {
    return `${currency || 'USD'} ${numberFormatter.format(Math.round(numeric))}`;
  }
}

function formatDate(value) {
  if (!value) {
    return '—';
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString();
  } catch (error) {
    return '—';
  }
}

const STATUS_STYLES = {
  requirements: 'bg-slate-100 text-slate-700',
  in_delivery: 'bg-sky-100 text-sky-700',
  in_revision: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
};

function OrderDetailModal({ open, onClose, order }) {
  const [previewMedia, setPreviewMedia] = useState(null);

  if (!open || !order) {
    return null;
  }

  const requirements = order.requirements ?? [];
  const submissions = order.submissions ?? [];
  const timeline = order.timeline ?? [];
  const classes = order.classes ?? [];
  const addons = order.addons ?? [];
  const tags = order.tags ?? [];
  const media = order.media ?? [];
  const faqs = order.faqs ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-10">
      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          Close
        </button>
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Gig · Detail</p>
            <h3 className="mt-1 text-2xl font-semibold text-slate-900">{order.serviceName}</h3>
            <p className="text-sm text-slate-500">{order.vendorName}</p>
            {tags.length ? (
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                {tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <dl className="grid grid-cols-2 gap-4 text-xs text-slate-500 sm:text-sm">
            <div>
              <dt className="font-semibold text-slate-900">Order</dt>
              <dd>{order.orderNumber}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Status</dt>
              <dd className="capitalize">{order.status?.replace(/_/g, ' ')}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Budget</dt>
              <dd>{formatCurrency(order.amount, order.currency)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Progress</dt>
              <dd>{formatPercent(order.progressPercent)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Kickoff</dt>
              <dd>{formatDate(order.kickoffAt)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Due</dt>
              <dd>{formatDate(order.dueAt)}</dd>
            </div>
          </dl>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            <section>
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Classes</h4>
              <div className="mt-3 grid gap-3 lg:grid-cols-3">
                {classes.map((gigClass) => (
                  <div
                    key={gigClass.key ?? gigClass.name}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600"
                  >
                    <p className="text-base font-semibold text-slate-900">{gigClass.name}</p>
                    {gigClass.summary ? <p className="mt-1 text-xs text-slate-500">{gigClass.summary}</p> : null}
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      {formatCurrency(gigClass.priceAmount, gigClass.priceCurrency)}
                    </p>
                    {gigClass.deliveryDays ? (
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        {gigClass.deliveryDays} days
                      </p>
                    ) : null}
                    {gigClass.inclusions?.length ? (
                      <ul className="mt-3 space-y-1 text-xs text-slate-500">
                        {gigClass.inclusions.map((item) => (
                          <li key={item} className="truncate">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Timeline</h4>
              {timeline.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                  No events yet.
                </div>
              ) : (
                <ol className="mt-3 space-y-3">
                  {timeline.slice(0, 5).map((event) => (
                    <li key={event.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500">
                        <span>{event.eventType?.replace(/_/g, ' ')}</span>
                        <span>{formatDate(event.occurredAt)}</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{event.title}</p>
                      {event.summary ? <p className="mt-1 text-xs text-slate-500">{event.summary}</p> : null}
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section>
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Submissions</h4>
              {submissions.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                  Waiting on first delivery.
                </div>
              ) : (
                <ul className="mt-3 space-y-3">
                  {submissions.slice(0, 4).map((submission) => (
                    <li key={submission.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                        <span>{submission.status?.replace(/_/g, ' ')}</span>
                        <span>{formatDate(submission.submittedAt)}</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{submission.title}</p>
                      {submission.description ? (
                        <p className="mt-1 text-xs text-slate-500">{submission.description}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section>
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Add-ons</h4>
              {addons.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                  No add-ons configured.
                </div>
              ) : (
                <ul className="mt-3 space-y-3">
                  {addons.map((addon) => (
                    <li key={addon.key ?? addon.name} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900">{addon.name}</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatCurrency(addon.priceAmount, addon.priceCurrency)}
                        </p>
                      </div>
                      {addon.deliveryDays ? (
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">{addon.deliveryDays} days</p>
                      ) : null}
                      {addon.description ? (
                        <p className="mt-1 text-xs text-slate-500">{addon.description}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Assets</h4>
              {media.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                  No gallery uploaded.
                </div>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {media.map((item) => (
                    <button
                      key={item.key ?? item.url}
                      type="button"
                      onClick={() => setPreviewMedia(item)}
                      className="group relative aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/5"
                    >
                      <img
                        src={item.thumbnailUrl ?? item.url}
                        alt={item.caption ?? item.type}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                        {item.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Requirements</h4>
              {requirements.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                  Nothing captured.
                </div>
              ) : (
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {requirements.map((requirement) => (
                    <li key={requirement.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500">
                        <span>{requirement.title}</span>
                        <span className="capitalize">{requirement.status?.replace(/_/g, ' ')}</span>
                      </div>
                      {requirement.notes ? (
                        <p className="mt-1 text-xs text-slate-500">{requirement.notes}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">FAQ</h4>
              {faqs.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                  No questions logged.
                </div>
              ) : (
                <dl className="mt-3 space-y-3 text-sm text-slate-600">
                  {faqs.map((faq) => (
                    <div key={faq.key ?? faq.question} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <dt className="font-semibold text-slate-900">{faq.question}</dt>
                      <dd className="mt-1 text-xs text-slate-500">{faq.answer}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          </div>
        </div>

        {previewMedia ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/95 p-6">
            <button
              type="button"
              onClick={() => setPreviewMedia(null)}
              className="absolute right-6 top-6 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
            >
              Close preview
            </button>
            <div className="w-full max-w-3xl space-y-4">
              <div className="aspect-video overflow-hidden rounded-3xl border border-slate-200 bg-slate-900/5">
                {previewMedia.type === 'video' ? (
                  <video src={previewMedia.url} controls className="h-full w-full object-cover" />
                ) : (
                  <img src={previewMedia.url} alt={previewMedia.caption ?? 'Media preview'} className="h-full w-full object-cover" />
                )}
              </div>
              {previewMedia.caption ? (
                <p className="text-sm text-slate-600">{previewMedia.caption}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

OrderDetailModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  order: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    serviceName: PropTypes.string,
    vendorName: PropTypes.string,
    orderNumber: PropTypes.string,
    status: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    currency: PropTypes.string,
    progressPercent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    kickoffAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    dueAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    requirements: PropTypes.arrayOf(PropTypes.object),
    submissions: PropTypes.arrayOf(PropTypes.object),
    timeline: PropTypes.arrayOf(PropTypes.object),
    classes: PropTypes.arrayOf(PropTypes.object),
    addons: PropTypes.arrayOf(PropTypes.object),
    tags: PropTypes.arrayOf(PropTypes.string),
    media: PropTypes.arrayOf(PropTypes.object),
    faqs: PropTypes.arrayOf(PropTypes.object),
  }),
};

OrderDetailModal.defaultProps = {
  open: false,
  order: null,
};

export default function GigManagementSection({
  summary,
  deliverables,
  orders,
  selectedOrderId,
  onSelectOrder,
  onRefresh,
  loading,
  detail,
}) {
  const [detailOpen, setDetailOpen] = useState(false);

  const metrics = useMemo(
    () => [
      {
        id: 'managed',
        label: 'Managed gigs',
        value: summary?.managedGigs ?? 0,
      },
      {
        id: 'active-orders',
        label: 'Active orders',
        value: summary?.activeOrders ?? 0,
      },
      {
        id: 'on-time',
        label: 'On-time delivery',
        value: summary?.onTimeRate != null ? `${summary.onTimeRate}%` : '—',
      },
      {
        id: 'avg-days',
        label: 'Avg delivery days',
        value: summary?.averageDeliveryDays != null ? summary.averageDeliveryDays : '—',
      },
      {
        id: 'breaches',
        label: 'Breaches',
        value: summary?.breaches ?? 0,
      },
      {
        id: 'backlog',
        label: 'Deliverable backlog',
        value: deliverables?.backlog ?? 0,
      },
    ],
    [summary, deliverables],
  );

  const orderedList = useMemo(
    () =>
      [...(orders ?? [])]
        .map((order) => ({
          id: order.id,
          serviceName: order.serviceName,
          vendorName: order.vendorName,
          status: order.status,
          amount: order.amount,
          currency: order.currency,
          progressPercent: order.progressPercent,
          dueAt: order.dueAt,
          orderNumber: order.orderNumber,
          tags: Array.isArray(order.tags) ? order.tags : [],
          classes: Array.isArray(order.classes)
            ? order.classes.map((gigClass) => gigClass?.name).filter(Boolean)
            : [],
        }))
        .sort((a, b) => {
          const aDate = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
          const bDate = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
          return aDate - bDate;
        }),
    [orders],
  );

  const activeDetail = selectedOrderId && detail?.id === selectedOrderId ? detail : null;

  return (
    <section id="agency-gig-management" className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Gig · Manage</p>
          <h2 className="text-3xl font-semibold text-slate-900">Manage gigs</h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
              {metric.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">Order book</h3>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            {numberFormatter.format(orderedList.length)}
          </span>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2">
          {orderedList.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
              No gigs yet.
            </div>
          ) : (
            orderedList.map((order) => {
              const statusClass = STATUS_STYLES[order.status] ?? 'bg-slate-100 text-slate-600';
              const isSelected = selectedOrderId === order.id;
              const progress = Math.max(0, Math.min(Number(order.progressPercent ?? 0), 100));
              return (
                <div
                  key={order.id}
                  className={`flex h-full flex-col justify-between rounded-2xl border px-5 py-5 transition ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900/5 shadow-inner'
                      : 'border-slate-200 bg-white shadow-sm hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{order.serviceName}</p>
                        <p className="text-xs text-slate-500">{order.vendorName}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusClass}`}>
                        {order.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">Due {formatDate(order.dueAt)}</span>
                      <span>{formatCurrency(order.amount, order.currency)}</span>
                      <span>#{order.orderNumber}</span>
                    </div>
                    {order.tags.length ? (
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-500">
                        {order.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {order.classes.length ? (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        {order.classes.slice(0, 3).map((className) => (
                          <span key={className} className="rounded-full border border-slate-200 px-3 py-1 text-slate-600">
                            {className}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-900"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>Progress</span>
                      <span className="font-semibold text-slate-700">{progress}%</span>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectOrder?.(order.id);
                        setDetailOpen(true);
                      }}
                      className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => onRefresh?.()}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                    >
                      Sync
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <OrderDetailModal
        open={detailOpen && Boolean(activeDetail)}
        onClose={() => setDetailOpen(false)}
        order={activeDetail}
      />
    </section>
  );
}

GigManagementSection.propTypes = {
  summary: PropTypes.shape({
    managedGigs: PropTypes.number,
    activeOrders: PropTypes.number,
    onTimeRate: PropTypes.number,
    averageDeliveryDays: PropTypes.number,
    breaches: PropTypes.number,
  }),
  deliverables: PropTypes.shape({
    backlog: PropTypes.number,
  }),
  orders: PropTypes.arrayOf(PropTypes.object),
  selectedOrderId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onSelectOrder: PropTypes.func,
  onRefresh: PropTypes.func,
  loading: PropTypes.bool,
  detail: PropTypes.object,
};

GigManagementSection.defaultProps = {
  summary: null,
  deliverables: null,
  orders: [],
  selectedOrderId: null,
  onSelectOrder: undefined,
  onRefresh: undefined,
  loading: false,
  detail: null,
};
