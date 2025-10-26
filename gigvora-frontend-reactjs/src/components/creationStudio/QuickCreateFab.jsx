import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  PlusIcon,
  SparklesIcon,
  FireIcon,
  ArrowPathIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { CREATION_TYPES } from './config.js';
import { formatRelativeTime } from '../../utils/date.js';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function buildInsights(types, insights) {
  return types.map((type) => {
    const metrics = insights?.[type.id] ?? {};
    const total = metrics.total ?? 0;
    const drafts = metrics.drafts ?? 0;
    const published = metrics.published ?? 0;
    const scheduled = metrics.scheduled ?? 0;
    const lastUpdated = metrics.lastUpdated ?? null;
    const impact = metrics.impact ?? null;
    return {
      type,
      total,
      drafts,
      published,
      scheduled,
      lastUpdated,
      impact,
      priorityScore:
        (published ? published * 3 : 0) +
        (scheduled ? scheduled * 2 : 0) +
        (drafts ? drafts : 0) +
        (impact ? impact.score ?? 0 : 0),
    };
  });
}

function describeStatus(metric) {
  const pieces = [];
  if (metric.drafts) {
    pieces.push(`${metric.drafts} draft${metric.drafts === 1 ? '' : 's'}`);
  }
  if (metric.scheduled) {
    pieces.push(`${metric.scheduled} scheduled`);
  }
  if (metric.published) {
    pieces.push(`${metric.published} live`);
  }
  if (!pieces.length) {
    pieces.push('Start fresh with guided templates');
  }
  return pieces.join(' • ');
}

function describeMomentum(metric) {
  if (!metric.lastUpdated) {
    return 'Insights calibrate once you publish.';
  }
  const relative = formatRelativeTime(metric.lastUpdated) || 'moments ago';
  if (metric.impact?.label) {
    return `${metric.impact.label} • Updated ${relative}`;
  }
  return `Updated ${relative}`;
}

export default function QuickCreateFab({
  types = CREATION_TYPES,
  insights,
  activeTypeId,
  onCreate,
  onTrack,
  disabled = false,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const previousOpenRef = useRef(false);

  const decorated = useMemo(() => buildInsights(types, insights), [types, insights]);
  const sorted = useMemo(() => {
    return decorated
      .slice()
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .map((metric) => metric.type.id);
  }, [decorated]);

  const visibleTypes = useMemo(() => {
    const limit = 4;
    const seen = new Set();
    const ordered = [];
    if (activeTypeId) {
      const found = decorated.find((metric) => metric.type.id === activeTypeId);
      if (found) {
        ordered.push(found);
        seen.add(found.type.id);
      }
    }
    for (const id of sorted) {
      if (seen.has(id)) {
        continue;
      }
      const metric = decorated.find((item) => item.type.id === id);
      if (metric) {
        ordered.push(metric);
        seen.add(id);
      }
      if (ordered.length >= limit) {
        break;
      }
    }
    for (const metric of decorated) {
      if (ordered.length >= limit) {
        break;
      }
      if (!seen.has(metric.type.id)) {
        ordered.push(metric);
        seen.add(metric.type.id);
      }
    }
    return ordered;
  }, [decorated, sorted, activeTypeId]);

  const recommendationContext = useMemo(
    () =>
      visibleTypes.map((metric) => ({
        typeId: metric.type.id,
        priorityScore: metric.priorityScore,
        total: metric.total,
        drafts: metric.drafts,
        scheduled: metric.scheduled,
        published: metric.published,
        lastUpdated: metric.lastUpdated ?? null,
        impact: metric.impact ?? null,
      })),
    [visibleTypes],
  );

  const handleToggle = useCallback(() => {
    if (disabled) {
      return;
    }
    setOpen((previous) => {
      const next = !previous;
      if (previous && !next && typeof onTrack === 'function') {
        onTrack({
          event: 'quick_create_closed',
          reason: 'toggle',
          activeTypeId: activeTypeId ?? null,
          recommendations: recommendationContext,
        });
      }
      return next;
    });
  }, [disabled, onTrack, activeTypeId, recommendationContext]);

  const handleClose = useCallback(() => {
    if (!open) {
      return;
    }
    setOpen(false);
    if (typeof onTrack === 'function') {
      onTrack({
        event: 'quick_create_closed',
        reason: 'manual',
        activeTypeId: activeTypeId ?? null,
        recommendations: recommendationContext,
      });
    }
  }, [open, onTrack, activeTypeId, recommendationContext]);

  const handleCreate = useCallback(
    (type) => {
      if (typeof onCreate === 'function') {
        onCreate(type.id, { source: 'quick-create-fab' });
      }
      if (typeof onTrack === 'function') {
        onTrack({
          event: 'quick_create_selected',
          typeId: type.id,
          metrics: insights?.[type.id] ?? null,
          recommendations: recommendationContext,
        });
      }
      setOpen(false);
      if (typeof onTrack === 'function') {
        onTrack({
          event: 'quick_create_closed',
          reason: 'selection',
          activeTypeId: activeTypeId ?? null,
          recommendations: recommendationContext,
        });
      }
    },
    [onCreate, onTrack, insights, recommendationContext, activeTypeId],
  );

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const handlePointer = (event) => {
      if (!containerRef.current) {
        return;
      }
      if (containerRef.current.contains(event.target)) {
        return;
      }
      setOpen(false);
      if (typeof onTrack === 'function') {
        onTrack({
          event: 'quick_create_closed',
          reason: 'outside',
          activeTypeId: activeTypeId ?? null,
          recommendations: recommendationContext,
        });
      }
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        if (typeof onTrack === 'function') {
          onTrack({
            event: 'quick_create_closed',
            reason: 'escape',
            activeTypeId: activeTypeId ?? null,
            recommendations: recommendationContext,
          });
        }
      }
    };
    window.addEventListener('pointerdown', handlePointer);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('pointerdown', handlePointer);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onTrack, activeTypeId, recommendationContext]);

  useEffect(() => {
    const wasOpen = previousOpenRef.current;
    if (open && !wasOpen && typeof onTrack === 'function') {
      onTrack({
        event: 'quick_create_opened',
        activeTypeId: activeTypeId ?? null,
        recommendations: recommendationContext,
      });
    }
    previousOpenRef.current = open;
  }, [open, onTrack, activeTypeId, recommendationContext]);

  return (
    <div
      ref={containerRef}
      className={classNames(
        'pointer-events-none fixed bottom-6 right-6 z-40 flex flex-col items-end space-y-3',
        className,
      )}
    >
      {open ? (
        <div
          role="dialog"
          aria-label="Quick create recommendations"
          className="pointer-events-auto w-80 rounded-3xl border border-indigo-100/70 bg-white/90 p-4 shadow-2xl backdrop-blur"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Creation studio</p>
              <h3 className="text-base font-semibold text-slate-900">Launch something new</h3>
              <p className="text-xs text-slate-500">Pick a template and we will preload best-practice modules.</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close quick create menu"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>

          <ul className="mt-4 space-y-3">
            {visibleTypes.map((metric) => {
              const Icon = metric.type.icon ?? SparklesIcon;
              const isActive = metric.type.id === activeTypeId;
              return (
                <li key={metric.type.id}>
                  <button
                    type="button"
                    onClick={() => handleCreate(metric.type)}
                    className={classNames(
                      'group w-full rounded-2xl border border-slate-200 bg-white/70 p-3 text-left shadow-sm transition',
                      'hover:border-indigo-200 hover:bg-indigo-50/60 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                      isActive ? 'border-indigo-300 bg-indigo-50/80 shadow-md' : '',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="rounded-2xl bg-indigo-100/80 p-2 text-indigo-600">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{metric.type.name}</p>
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                              <CheckCircleIcon className="h-3 w-3" />
                              Active
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-slate-500">{metric.type.tagline}</p>
                        <p className="text-xs font-semibold text-slate-600">{describeStatus(metric)}</p>
                        <p className="text-xs text-slate-500">{describeMomentum(metric)}</p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <div className="inline-flex items-center gap-1">
              <FireIcon className="h-3.5 w-3.5 text-amber-500" />
              Recommendations refresh as your catalogue grows.
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof onTrack === 'function') {
                  onTrack({
                    event: 'quick_create_recommendations_viewed',
                    activeTypeId: activeTypeId ?? null,
                    recommendations: recommendationContext,
                  });
                }
                setOpen(false);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-1 font-semibold text-indigo-600 transition hover:border-indigo-200 hover:bg-indigo-50"
            >
              View roadmap
              <ArrowUpRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={classNames(
          'pointer-events-auto inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white shadow-2xl shadow-indigo-500/40 transition',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-500',
          disabled ? 'opacity-70' : 'hover:from-indigo-500 hover:to-fuchsia-500',
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <PlusIcon className="h-5 w-5" />
        Quick create
        <SparklesIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

QuickCreateFab.propTypes = {
  types: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      tagline: PropTypes.string,
      icon: PropTypes.elementType,
    }),
  ),
  insights: PropTypes.object,
  activeTypeId: PropTypes.string,
  onCreate: PropTypes.func,
  onTrack: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

