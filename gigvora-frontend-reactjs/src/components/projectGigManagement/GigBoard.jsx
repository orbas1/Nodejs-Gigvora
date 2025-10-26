import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { differenceInCalendarDays, format, formatDistanceToNow, isBefore, parseISO } from 'date-fns';

const DEFAULT_LANES = [
  { id: 'sourcing', label: 'Sourcing', status: 'sourcing', accent: 'from-sky-500/10 to-transparent' },
  { id: 'pitching', label: 'Pitching', status: 'pitching', accent: 'from-emerald-500/10 to-transparent' },
  { id: 'negotiation', label: 'Negotiation', status: 'negotiation', accent: 'from-amber-500/10 to-transparent' },
  { id: 'delivery', label: 'Delivery', status: 'delivery', accent: 'from-indigo-500/10 to-transparent' },
  { id: 'completed', label: 'Completed', status: 'completed', accent: 'from-slate-500/10 to-transparent' },
];

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  try {
    return parseISO(value);
  } catch (error) {
    return null;
  }
}

function formatDate(value, fallback = '—') {
  const date = parseDate(value);
  if (!date) return fallback;
  try {
    return format(date, 'd MMM');
  } catch (error) {
    return fallback;
  }
}

function formatBudget(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return `${currency} 0`;
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${currency} ${Number(value).toLocaleString()}`;
  }
}

function normalizeLanes(board) {
  const lanes = Array.isArray(board?.lanes) && board.lanes.length ? board.lanes : DEFAULT_LANES;
  return lanes.map((lane) => ({
    ...lane,
    id: lane.id ?? lane.status,
    label: lane.label ?? (lane.status ? lane.status.replace(/_/g, ' ') : 'Lane'),
    cards: Array.isArray(lane.cards)
      ? lane.cards
      : Array.isArray(lane.projects)
        ? lane.projects
        : Array.isArray(lane.gigs)
          ? lane.gigs
          : [],
  }));
}

function collectTags(lanes) {
  const tagSet = new Set();
  lanes.forEach((lane) => {
    lane.cards.forEach((card) => {
      const cardTags = Array.isArray(card?.tags) ? card.tags : [];
      cardTags.forEach((tag) => {
        if (tag?.trim()) {
          tagSet.add(tag.trim());
        }
      });
    });
  });
  return Array.from(tagSet);
}

function computeLaneInsights(cards, { now = new Date() } = {}) {
  const totals = cards.reduce(
    (acc, card) => {
      const dueDate = parseDate(card?.dueAt ?? card?.deadline ?? card?.closeAt);
      const value = Number(card?.value ?? card?.budget ?? card?.amount);
      const probability = Number(card?.winProbability ?? card?.probability ?? 0);
      const hasDue = Boolean(dueDate);
      const isOverdue = hasDue ? isBefore(dueDate, now) : false;
      const daysUntilDue = hasDue ? differenceInCalendarDays(dueDate, now) : null;

      if (Number.isFinite(value)) {
        acc.totalValue += value;
        if (probability > 0 && probability <= 1) {
          acc.weightedValue += value * probability;
        } else if (probability > 1 && probability <= 100) {
          acc.weightedValue += value * (probability / 100);
        }
      }

      if (isOverdue) {
        acc.overdue += 1;
      } else if (daysUntilDue != null && daysUntilDue <= 5) {
        acc.nearingDue += 1;
      }

      if (card?.priority === 'high' || card?.priority === 'urgent') {
        acc.highPriority += 1;
      }

      return acc;
    },
    { totalValue: 0, weightedValue: 0, overdue: 0, nearingDue: 0, highPriority: 0 },
  );

  return totals;
}

function GigCard({ card, currency, onInspect, onDragStart, onDragEnd }) {
  const dueDate = parseDate(card?.dueAt ?? card?.deadline ?? card?.closeAt);
  const client = card?.client?.name ?? card?.clientName ?? card?.company;
  const budgetValue = card?.value ?? card?.budget ?? card?.amount;
  const probability = card?.winProbability ?? card?.probability;
  const tags = Array.isArray(card?.tags) ? card.tags : [];
  const statusTone =
    card?.status === 'at_risk' || card?.risk === 'high'
      ? 'text-rose-600 bg-rose-50 border-rose-200'
      : card?.status === 'priority' || card?.priority === 'high'
        ? 'text-amber-600 bg-amber-50 border-amber-200'
        : 'text-slate-600 bg-white border-transparent';

  return (
    <article
      className="group flex flex-col gap-3 rounded-2xl border border-transparent bg-white/80 p-4 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-lg"
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        if (onDragStart) {
          onDragStart(card);
        }
      }}
      onDragEnd={() => onDragEnd?.()}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h4 className="text-base font-semibold text-slate-900">{card?.title ?? card?.gigTitle ?? 'Untitled gig'}</h4>
          {client ? <p className="text-sm text-slate-500">{client}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => onInspect?.(card)}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
        >
          Inspect
        </button>
      </header>

      <dl className="grid grid-cols-2 gap-3 text-xs text-slate-500">
        <div>
          <dt className="font-semibold uppercase tracking-wide text-slate-400">Budget</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">{formatBudget(budgetValue, card?.currency ?? currency)}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wide text-slate-400">Due</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">
            {dueDate ? `${formatDate(dueDate)} · ${formatDistanceToNow(dueDate, { addSuffix: true })}` : 'TBD'}
          </dd>
        </div>
        {probability != null ? (
          <div>
            <dt className="font-semibold uppercase tracking-wide text-slate-400">Win rate</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{`${Math.round(Number(probability) * (Number(probability) <= 1 ? 100 : 1))}%`}</dd>
          </div>
        ) : null}
        {card?.owner?.name ? (
          <div>
            <dt className="font-semibold uppercase tracking-wide text-slate-400">Owner</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{card.owner.name}</dd>
          </div>
        ) : null}
      </dl>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            {tag}
          </span>
        ))}
      </div>

      {card?.risk ? (
        <div className={`rounded-2xl border px-3 py-2 text-xs font-semibold ${statusTone}`}>
          Risk {card.risk === 'high' ? 'Critical' : card.risk === 'medium' ? 'Watch' : 'Low'}
        </div>
      ) : null}

      <footer className="flex flex-wrap gap-2 pt-1 text-xs text-slate-500">
        {card?.metrics?.responseTime ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
            Response {card.metrics.responseTime}
          </span>
        ) : null}
        {card?.metrics?.conversations ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
            Touchpoints {card.metrics.conversations}
          </span>
        ) : null}
      </footer>
    </article>
  );
}

GigCard.propTypes = {
  card: PropTypes.object.isRequired,
  currency: PropTypes.string,
  onInspect: PropTypes.func,
  onDragStart: PropTypes.func,
  onDragEnd: PropTypes.func,
};

GigCard.defaultProps = {
  currency: 'USD',
  onInspect: undefined,
  onDragStart: undefined,
  onDragEnd: undefined,
};

export default function GigBoard({
  board,
  canManage,
  onLaneChange,
  onSaveView,
  onDeleteView,
  onViewChange,
  onInspectGig,
  onRefresh,
}) {
  const normalizedLanes = useMemo(() => normalizeLanes(board), [board]);
  const [activeViewId, setActiveViewId] = useState(board?.activeViewId ?? board?.defaultViewId ?? null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [draggingGig, setDraggingGig] = useState(null);

  const tags = useMemo(() => collectTags(normalizedLanes), [normalizedLanes]);

  const filteredLanes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return normalizedLanes.map((lane) => {
      const cards = lane.cards.filter((card) => {
        const matchesQuery = query
          ? (card?.title ?? card?.gigTitle ?? '').toLowerCase().includes(query) ||
            (card?.client?.name ?? card?.clientName ?? '').toLowerCase().includes(query)
          : true;
        const matchesTags = selectedTags.length
          ? selectedTags.every((tag) => (Array.isArray(card?.tags) ? card.tags : []).includes(tag))
          : true;
        return matchesQuery && matchesTags;
      });
      return { ...lane, cards };
    });
  }, [normalizedLanes, searchTerm, selectedTags]);

  const boardCurrency = board?.currency ?? 'USD';
  const analytics = useMemo(() => {
    return filteredLanes.reduce(
      (acc, lane) => {
        const laneInsights = computeLaneInsights(lane.cards);
        acc.totalValue += laneInsights.totalValue;
        acc.weightedValue += laneInsights.weightedValue;
        acc.overdue += laneInsights.overdue;
        acc.nearingDue += laneInsights.nearingDue;
        acc.highPriority += laneInsights.highPriority;
        acc.totalCards += lane.cards.length;
        return acc;
      },
      { totalValue: 0, weightedValue: 0, overdue: 0, nearingDue: 0, highPriority: 0, totalCards: 0 },
    );
  }, [filteredLanes]);

  const views = Array.isArray(board?.views) ? board.views : [];

  const handleSaveView = async () => {
    if (!onSaveView) return;
    await onSaveView({
      name: `View ${views.length + 1}`,
      query: searchTerm || undefined,
      tags: selectedTags,
    });
  };

  const handleViewChange = async (viewId) => {
    setActiveViewId(viewId);
    const view = views.find((entry) => entry.id === viewId);
    if (view) {
      setSearchTerm(view.query ?? '');
      setSelectedTags(view.tags ?? []);
    }
    await onViewChange?.(viewId);
  };

  const handleTagToggle = (tag) => {
    setSelectedTags((current) => {
      if (current.includes(tag)) {
        return current.filter((value) => value !== tag);
      }
      return [...current, tag];
    });
  };

  const handleDropOnLane = async (lane) => {
    if (!draggingGig || !canManage) return;
    const payload = {
      laneId: lane.id,
      status: lane.status ?? lane.id,
    };
    await onLaneChange?.(draggingGig.id ?? draggingGig.gigId ?? draggingGig.orderId, payload);
    setDraggingGig(null);
  };

  const totalLanes = filteredLanes.length;

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-accentSoft/40 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Gig pipeline</p>
            <h3 className="text-2xl font-semibold text-slate-900">Board overview</h3>
            <p className="text-sm text-slate-500">
              {analytics.totalCards} gigs across {totalLanes} lanes · Weighted pipeline {formatBudget(analytics.weightedValue, boardCurrency)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRefresh ?? (() => {})}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
            >
              Refresh
            </button>
            {canManage ? (
              <button
                type="button"
                onClick={handleSaveView}
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark"
              >
                Save view
              </button>
            ) : null}
          </div>
        </div>
        <dl className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total value</dt>
            <dd className="mt-2 text-xl font-semibold text-slate-900">{formatBudget(analytics.totalValue, boardCurrency)}</dd>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Weighted</dt>
            <dd className="mt-2 text-xl font-semibold text-slate-900">{formatBudget(analytics.weightedValue, boardCurrency)}</dd>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 text-rose-700">
            <dt className="text-xs font-semibold uppercase tracking-wide">Overdue</dt>
            <dd className="mt-2 text-xl font-semibold">{analytics.overdue}</dd>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 text-amber-700">
            <dt className="text-xs font-semibold uppercase tracking-wide">High priority</dt>
            <dd className="mt-2 text-xl font-semibold">{analytics.highPriority}</dd>
          </div>
        </dl>
      </header>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search gigs or clients"
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 md:w-64"
            />
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    selectedTags.includes(tag)
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          {views.length ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Saved views</span>
              <div className="flex gap-2">
                {views.map((view) => (
                  <button
                    key={view.id}
                    type="button"
                    onClick={() => handleViewChange(view.id)}
                    className={`rounded-2xl px-3 py-1 text-xs font-semibold transition ${
                      activeViewId === view.id
                        ? 'bg-accent text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {view.name ?? 'View'}
                  </button>
                ))}
              </div>
              {canManage ? (
                <button
                  type="button"
                  onClick={() => onDeleteView?.(activeViewId)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-rose-200 hover:text-rose-500"
                >
                  Delete
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {filteredLanes.map((lane) => (
          <section
            key={lane.id}
            className={`flex h-full min-h-[420px] flex-col gap-4 rounded-3xl border border-slate-200 bg-gradient-to-b ${
              lane.accent ?? 'from-slate-100/40 to-white'
            } p-4 shadow-inner`}
            onDragOver={(event) => {
              if (!canManage) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
            }}
            onDrop={() => handleDropOnLane(lane)}
          >
            <header className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{lane.label}</h4>
                <p className="text-2xl font-semibold text-slate-900">{lane.cards.length}</p>
              </div>
              <div className="text-xs text-slate-500">
                {(() => {
                  const insight = computeLaneInsights(lane.cards);
                  if (insight.overdue) {
                    return <span className="text-rose-500">{insight.overdue} overdue</span>;
                  }
                  if (insight.nearingDue) {
                    return <span>{insight.nearingDue} nearing deadline</span>;
                  }
                  return <span>Flowing smoothly</span>;
                })()}
              </div>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl bg-white/60 p-2 shadow-sm">
              {lane.cards.length ? (
                lane.cards.map((card) => (
                  <GigCard
                    key={card.id ?? card.gigId ?? card.orderId}
                    card={card}
                    currency={lane.currency ?? boardCurrency}
                    onInspect={onInspectGig}
                    onDragStart={(currentCard) => {
                      if (!canManage) return;
                      setDraggingGig(currentCard);
                    }}
                    onDragEnd={() => setDraggingGig(null)}
                  />
                ))
              ) : (
                <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
                  {canManage ? 'Drop gigs here' : 'No gigs yet'}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

GigBoard.propTypes = {
  board: PropTypes.shape({
    lanes: PropTypes.arrayOf(PropTypes.object),
    views: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), name: PropTypes.string })),
    activeViewId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    defaultViewId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
  }),
  canManage: PropTypes.bool,
  onLaneChange: PropTypes.func,
  onSaveView: PropTypes.func,
  onDeleteView: PropTypes.func,
  onViewChange: PropTypes.func,
  onInspectGig: PropTypes.func,
  onRefresh: PropTypes.func,
};

GigBoard.defaultProps = {
  board: null,
  canManage: false,
  onLaneChange: undefined,
  onSaveView: undefined,
  onDeleteView: undefined,
  onViewChange: undefined,
  onInspectGig: undefined,
  onRefresh: undefined,
};
