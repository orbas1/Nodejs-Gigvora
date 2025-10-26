import { useMemo, useState } from 'react';
import {
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
  ClockIcon,
  PlayCircleIcon,
  SparklesIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import clsx from 'clsx';

function toDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function formatRange(start, end) {
  const dateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' });
  const startDate = toDate(start);
  const endDate = toDate(end);

  if (!startDate && !endDate) {
    return 'Timeline updated';
  }
  if (startDate && !endDate) {
    return `${dateFormatter.format(startDate)} – Present`;
  }
  if (!startDate && endDate) {
    return `Through ${dateFormatter.format(endDate)}`;
  }
  return `${dateFormatter.format(startDate)} – ${dateFormatter.format(endDate)}`;
}

function normaliseItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .map((item) => ({
      id: item.id ?? `${item.organization ?? item.company}-${item.role ?? item.title}`,
      role: item.role ?? item.title ?? 'Role',
      organization: item.organization ?? item.company ?? item.client ?? '',
      location: item.location ?? '',
      startDate: item.startDate ?? item.startedAt ?? item.from,
      endDate: item.endDate ?? item.endedAt ?? item.to,
      summary: item.summary ?? item.description ?? '',
      achievements: Array.isArray(item.achievements)
        ? item.achievements
        : Array.isArray(item.highlights)
        ? item.highlights
        : item.achievements
        ? [item.achievements]
        : [],
      metrics: Array.isArray(item.metrics)
        ? item.metrics
        : item.metrics && typeof item.metrics === 'object'
        ? Object.entries(item.metrics).map(([label, value]) => ({ label, value }))
        : [],
      media: item.media ?? item.spotlight ?? null,
      tags: Array.isArray(item.tags)
        ? item.tags
        : Array.isArray(item.skills)
        ? item.skills
        : typeof item.category === 'string'
        ? [item.category]
        : [],
      spotlight: Boolean(item.spotlight ?? item.featured ?? item.isSpotlight),
    }))
    .filter((item) => item.role || item.organization);
}

function buildFilters(items, providedFilters) {
  if (Array.isArray(providedFilters) && providedFilters.length) {
    return ['all', ...providedFilters];
  }
  const tagSet = new Set();
  for (const item of items) {
    for (const tag of item.tags ?? []) {
      if (tag) {
        tagSet.add(tag);
      }
    }
  }
  return ['all', ...tagSet];
}

export default function ExperienceTimeline({
  items,
  filters,
  defaultFilter,
  defaultView,
  onSpotlight,
  onShare,
  onEdit,
}) {
  const normalisedItems = useMemo(() => normaliseItems(items), [items]);
  const sortedItems = useMemo(() => {
    return [...normalisedItems].sort((a, b) => {
      const aDate = toDate(a.endDate) ?? toDate(a.startDate) ?? new Date(0);
      const bDate = toDate(b.endDate) ?? toDate(b.startDate) ?? new Date(0);
      return bDate - aDate;
    });
  }, [normalisedItems]);

  const filterOptions = useMemo(() => buildFilters(sortedItems, filters), [sortedItems, filters]);
  const [activeFilter, setActiveFilter] = useState(() => {
    if (defaultFilter && filterOptions.includes(defaultFilter)) {
      return defaultFilter;
    }
    const spotlightItem = sortedItems.find((item) => item.spotlight);
    if (spotlightItem && spotlightItem.tags?.length) {
      const spotlightTag = spotlightItem.tags.find((tag) => filterOptions.includes(tag));
      if (spotlightTag) {
        return spotlightTag;
      }
    }
    return 'all';
  });
  const [view, setView] = useState(defaultView === 'grid' ? 'grid' : 'timeline');
  const [activeItemId, setActiveItemId] = useState(() => {
    const firstSpotlight = sortedItems.find((item) => item.spotlight);
    return firstSpotlight?.id ?? sortedItems[0]?.id ?? null;
  });

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') {
      return sortedItems;
    }
    return sortedItems.filter((item) => item.tags?.includes(activeFilter));
  }, [sortedItems, activeFilter]);

  const activeItem = useMemo(
    () => sortedItems.find((item) => item.id === activeItemId) ?? filteredItems[0] ?? null,
    [sortedItems, activeItemId, filteredItems],
  );

  const handleSelect = (item) => {
    setActiveItemId(item.id);
    onSpotlight?.(item);
  };

  return (
    <section className="rounded-4xl border border-slate-200 bg-white/90 p-6 shadow-soft">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Experience timeline</h2>
          <p className="text-sm text-slate-500">
            Spotlight career peaks, collaborations, and proof points with motion-ready storytelling.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['timeline', 'grid'].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              className={clsx(
                'rounded-3xl px-4 py-2 text-sm font-medium transition',
                view === mode
                  ? 'bg-accent text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-accent hover:text-accent',
              )}
            >
              {mode === 'timeline' ? 'Timeline' : 'Spotlight grid'}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr),minmax(0,1fr)]">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setActiveFilter(option)}
                className={clsx(
                  'rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition',
                  activeFilter === option
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-accent hover:text-accent',
                )}
              >
                {option === 'all' ? 'All highlights' : option}
              </button>
            ))}
          </div>

          {view === 'timeline' ? (
            <ol className="relative space-y-6 border-l border-slate-200 pl-6">
              {filteredItems.map((item) => (
                <li key={item.id} className="relative">
                  <div className="absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white">
                    <StarIcon
                      className={clsx('h-3 w-3', item.spotlight ? 'text-amber-500' : 'text-slate-300')}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={clsx(
                      'w-full rounded-3xl border px-4 py-4 text-left transition',
                      activeItemId === item.id
                        ? 'border-slate-900 bg-slate-900/5 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-accent/60 hover:shadow-sm',
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.role}</p>
                        <p className="text-sm text-slate-500">{item.organization}</p>
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                        <CalendarDaysIcon className="h-4 w-4" />
                        {formatRange(item.startDate, item.endDate)}
                      </span>
                    </div>
                    {item.summary ? (
                      <p className="mt-3 text-sm text-slate-600">{item.summary}</p>
                    ) : null}
                    {item.tags?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <span
                            key={`${item.id}-${tag}`}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                          >
                            <SparklesIcon className="h-3 w-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={clsx(
                    'flex h-full flex-col rounded-3xl border px-4 py-4 text-left transition',
                    activeItemId === item.id
                      ? 'border-slate-900 bg-slate-900/5 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-accent/60 hover:shadow-sm',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold text-slate-900">{item.role}</p>
                    <span className="text-xs uppercase tracking-wide text-slate-500">{item.organization}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{formatRange(item.startDate, item.endDate)}</p>
                  {item.summary ? <p className="mt-3 text-sm text-slate-600">{item.summary}</p> : null}
                  {item.achievements?.length ? (
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      {item.achievements.slice(0, 3).map((achievement, index) => (
                        <li key={`${item.id}-achievement-${index}`}>{achievement}</li>
                      ))}
                    </ul>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-6">
          {activeItem ? (
            <div className="space-y-4">
              <header className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  <StarIcon className="h-4 w-4 text-amber-300" /> Spotlight
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{activeItem.role}</h3>
                <p className="text-sm text-slate-500">{activeItem.organization}</p>
              </header>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <CalendarDaysIcon className="h-4 w-4" />
                  {formatRange(activeItem.startDate, activeItem.endDate)}
                </span>
                {activeItem.location ? (
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon className="h-4 w-4" />
                    {activeItem.location}
                  </span>
                ) : null}
              </div>

              {activeItem.summary ? (
                <p className="text-sm leading-relaxed text-slate-600">{activeItem.summary}</p>
              ) : null}

              {activeItem.achievements?.length ? (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Key outcomes</h4>
                  <ul className="mt-2 space-y-2 text-sm text-slate-600">
                    {activeItem.achievements.map((achievement, index) => (
                      <li key={`${activeItem.id}-achievement-${index}`} className="flex gap-2">
                        <SparklesIcon className="mt-1 h-4 w-4 text-amber-400" />
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {activeItem.metrics?.length ? (
                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                  {activeItem.metrics.map((metric, index) => (
                    <div key={`${activeItem.id}-metric-${index}`} className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">{metric.label}</span>
                      <span className="font-semibold text-slate-900">{metric.value}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {activeItem.media?.videoUrl || activeItem.media?.link ? (
                <a
                  href={activeItem.media.videoUrl ?? activeItem.media.link}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  <PlayCircleIcon className="h-5 w-5" /> View spotlight reel
                </a>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onShare?.(activeItem)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Share highlight
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onEdit?.(activeItem)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Edit timeline
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              Add timeline entries to unlock storytelling insights and spotlight-ready motion templates.
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

const achievementShape = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    description: PropTypes.string,
  }),
]);

const metricShape = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
]);

const mediaShape = PropTypes.shape({
  videoUrl: PropTypes.string,
  link: PropTypes.string,
});

const itemShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  role: PropTypes.string,
  title: PropTypes.string,
  organization: PropTypes.string,
  company: PropTypes.string,
  client: PropTypes.string,
  location: PropTypes.string,
  startDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  endDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  summary: PropTypes.string,
  description: PropTypes.string,
  achievements: PropTypes.arrayOf(achievementShape),
  highlights: PropTypes.arrayOf(achievementShape),
  metrics: PropTypes.oneOfType([PropTypes.arrayOf(metricShape), PropTypes.object]),
  tags: PropTypes.arrayOf(PropTypes.string),
  skills: PropTypes.arrayOf(PropTypes.string),
  category: PropTypes.string,
  spotlight: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  media: mediaShape,
});

ExperienceTimeline.propTypes = {
  items: PropTypes.arrayOf(itemShape),
  filters: PropTypes.arrayOf(PropTypes.string),
  defaultFilter: PropTypes.string,
  defaultView: PropTypes.oneOf(['timeline', 'grid']),
  onSpotlight: PropTypes.func,
  onShare: PropTypes.func,
  onEdit: PropTypes.func,
};

ExperienceTimeline.defaultProps = {
  items: [],
  filters: undefined,
  defaultFilter: undefined,
  defaultView: 'timeline',
  onSpotlight: undefined,
  onShare: undefined,
  onEdit: undefined,
};
