import { useEffect, useMemo, useState } from 'react';
import { ArrowTopRightOnSquareIcon, PhotoIcon, PlayCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import clsx from 'clsx';

function normaliseItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .map((item, index) => ({
      id: item.id ?? item.slug ?? item.title ?? `portfolio-${index}`,
      title: item.title ?? item.name ?? 'Untitled project',
      summary: item.summary ?? item.description ?? '',
      tags: Array.isArray(item.tags)
        ? item.tags
        : Array.isArray(item.categories)
        ? item.categories
        : Array.isArray(item.focus)
        ? item.focus
        : [],
      metrics: Array.isArray(item.metrics)
        ? item.metrics
        : item.metrics && typeof item.metrics === 'object'
        ? Object.entries(item.metrics).map(([label, value]) => ({ label, value }))
        : [],
      imageUrl:
        item.imageUrl ??
        item.coverImage ??
        item.heroImage ??
        item.media?.image ??
        item.media?.thumbnail ??
        null,
      videoUrl: item.videoUrl ?? item.media?.videoUrl ?? item.media?.video ?? null,
      link: item.link ?? item.url ?? item.caseStudyUrl ?? null,
      featured: Boolean(item.featured ?? item.isFeatured ?? item.priority === 'featured'),
      spotlight: item.spotlight ?? item.hero ?? null,
      attachments: Array.isArray(item.attachments) ? item.attachments : [],
      lastUpdated: item.lastUpdated ?? item.updatedAt ?? null,
    }))
    .filter((item) => item.title);
}

function buildCategories(items, providedCategories) {
  if (Array.isArray(providedCategories) && providedCategories.length) {
    return ['all', ...providedCategories];
  }
  const categorySet = new Set();
  for (const item of items) {
    for (const tag of item.tags ?? []) {
      if (tag) {
        categorySet.add(tag);
      }
    }
  }
  return ['all', ...categorySet];
}

function formatMetricValue(value) {
  if (value == null) {
    return '—';
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric) && Math.abs(numeric) >= 1000) {
    return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(numeric);
  }
  if (Number.isFinite(numeric)) {
    return numeric.toLocaleString();
  }
  return String(value);
}

export default function PortfolioGallery({
  items,
  categories,
  defaultCategory,
  loading,
  onSelect,
  onShare,
  onEdit,
}) {
  const normalisedItems = useMemo(() => normaliseItems(items), [items]);
  const categoryOptions = useMemo(() => buildCategories(normalisedItems, categories), [normalisedItems, categories]);
  const featuredItem = useMemo(
    () => normalisedItems.find((item) => item.featured) ?? normalisedItems[0] ?? null,
    [normalisedItems],
  );

  const [activeCategory, setActiveCategory] = useState(() => {
    if (defaultCategory && categoryOptions.includes(defaultCategory)) {
      return defaultCategory;
    }
    return 'all';
  });
  const [selectedId, setSelectedId] = useState(() => featuredItem?.id ?? null);

  useEffect(() => {
    if (!selectedId && featuredItem) {
      setSelectedId(featuredItem.id);
      return;
    }
    if (selectedId && !normalisedItems.some((item) => item.id === selectedId) && featuredItem) {
      setSelectedId(featuredItem.id);
    }
  }, [featuredItem, normalisedItems, selectedId]);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') {
      return normalisedItems;
    }
    return normalisedItems.filter((item) => item.tags?.includes(activeCategory));
  }, [normalisedItems, activeCategory]);

  const selectedItem = useMemo(
    () => normalisedItems.find((item) => item.id === selectedId) ?? featuredItem ?? null,
    [normalisedItems, selectedId, featuredItem],
  );

  const handleSelect = (item) => {
    setSelectedId(item.id);
    onSelect?.(item);
  };

  return (
    <section className="rounded-4xl border border-slate-200 bg-white/90 shadow-soft">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
        <div className="relative overflow-hidden rounded-t-4xl lg:rounded-tr-none lg:rounded-bl-4xl">
          {selectedItem?.imageUrl ? (
            <img
              src={selectedItem.imageUrl}
              alt={selectedItem.title}
              className="h-80 w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-80 w-full items-center justify-center bg-gradient-to-r from-slate-800 via-slate-700 to-accent/60 text-slate-200">
              <PhotoIcon className="h-12 w-12" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-900/20" />
          <div className="absolute inset-0 flex flex-col justify-end gap-4 px-8 pb-8 text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-wide">
              Spotlight case study
            </span>
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight">{selectedItem?.title ?? 'Portfolio gallery'}</h2>
              {selectedItem?.summary ? (
                <p className="max-w-2xl text-sm text-slate-100">{selectedItem.summary}</p>
              ) : (
                <p className="max-w-2xl text-sm text-slate-100">
                  Curate your flagship engagements, launch metrics, and storytelling media to impress executive reviewers.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {selectedItem?.tags?.slice(0, 6).map((tag) => (
                <span key={`${selectedItem.id}-${tag}`} className="rounded-full bg-white/20 px-3 py-1 text-xs uppercase">
                  {tag}
                </span>
              ))}
              {selectedItem?.videoUrl ? (
                <a
                  href={selectedItem.videoUrl}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-200"
                >
                  <PlayCircleIcon className="h-4 w-4" /> Watch spotlight
                </a>
              ) : null}
              {selectedItem?.link ? (
                <a
                  href={selectedItem.link}
                  className="inline-flex items-center gap-2 rounded-full border border-white/70 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" /> Open case study
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="space-y-5 rounded-b-4xl border-t border-slate-200 bg-white/90 p-6 lg:rounded-bl-none lg:rounded-br-4xl lg:border-l lg:border-t-0">
          <header className="space-y-2">
            <h3 className="text-xl font-semibold text-slate-900">Gallery narrative</h3>
            <p className="text-sm text-slate-500">
              Mix testimonials, metrics, and programme imagery to help decision-makers evaluate your craft quickly.
            </p>
          </header>

          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={clsx(
                  'rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition',
                  activeCategory === category
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-accent hover:text-accent',
                )}
              >
                {category === 'all' ? 'All work' : category}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="h-32 rounded-3xl bg-slate-100/80" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={clsx(
                    'flex h-full flex-col rounded-3xl border px-4 py-4 text-left transition',
                    selectedId === item.id
                      ? 'border-slate-900 bg-slate-900/5 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-accent/60 hover:shadow-sm',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold text-slate-900">{item.title}</p>
                    <SparklesIcon className={clsx('h-4 w-4', item.featured ? 'text-amber-400' : 'text-slate-300')} />
                  </div>
                  {item.summary ? <p className="mt-2 line-clamp-3 text-sm text-slate-500">{item.summary}</p> : null}
                  {item.tags?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={`${item.id}-${tag}`} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          )}

          {selectedItem?.metrics?.length ? (
            <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4">
              {selectedItem.metrics.map((metric, index) => (
                <div key={`${selectedItem.id}-metric-${index}`} className="flex items-center justify-between text-sm text-slate-600">
                  <span>{metric.label}</span>
                  <span className="font-semibold text-slate-900">{formatMetricValue(metric.value)}</span>
                </div>
              ))}
            </div>
          ) : null}

          {selectedItem?.attachments?.length ? (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attachments</h4>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {selectedItem.attachments.map((attachment, index) => (
                  <li key={`${selectedItem.id}-attachment-${index}`} className="flex justify-between gap-2">
                    <span className="truncate">{attachment.label ?? attachment.name ?? attachment}</span>
                    {attachment.url ? (
                      <a
                        href={attachment.url}
                        className="text-xs font-semibold text-accent transition hover:text-accent/80"
                      >
                        Open
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => (selectedItem ? onShare?.(selectedItem) : null)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-accent hover:text-accent"
            >
              Share gallery
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => (selectedItem ? onEdit?.(selectedItem) : null)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-accent hover:text-accent"
            >
              Edit spotlight
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}

const metricShape = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
]);

const attachmentShape = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.shape({
    label: PropTypes.string,
    name: PropTypes.string,
    url: PropTypes.string,
  }),
]);

const portfolioItemShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  title: PropTypes.string,
  name: PropTypes.string,
  summary: PropTypes.string,
  description: PropTypes.string,
  tags: PropTypes.arrayOf(PropTypes.string),
  categories: PropTypes.arrayOf(PropTypes.string),
  focus: PropTypes.arrayOf(PropTypes.string),
  metrics: PropTypes.oneOfType([PropTypes.arrayOf(metricShape), PropTypes.object]),
  imageUrl: PropTypes.string,
  coverImage: PropTypes.string,
  heroImage: PropTypes.string,
  media: PropTypes.shape({
    image: PropTypes.string,
    thumbnail: PropTypes.string,
    video: PropTypes.string,
    videoUrl: PropTypes.string,
  }),
  videoUrl: PropTypes.string,
  link: PropTypes.string,
  url: PropTypes.string,
  caseStudyUrl: PropTypes.string,
  featured: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  isFeatured: PropTypes.bool,
  priority: PropTypes.string,
  attachments: PropTypes.arrayOf(attachmentShape),
  spotlight: PropTypes.any,
  lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
});

PortfolioGallery.propTypes = {
  items: PropTypes.arrayOf(portfolioItemShape),
  categories: PropTypes.arrayOf(PropTypes.string),
  defaultCategory: PropTypes.string,
  loading: PropTypes.bool,
  onSelect: PropTypes.func,
  onShare: PropTypes.func,
  onEdit: PropTypes.func,
};

PortfolioGallery.defaultProps = {
  items: [],
  categories: undefined,
  defaultCategory: undefined,
  loading: false,
  onSelect: undefined,
  onShare: undefined,
  onEdit: undefined,
};
