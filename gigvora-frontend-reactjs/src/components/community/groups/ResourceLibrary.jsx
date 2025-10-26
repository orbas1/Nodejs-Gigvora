import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowDownTrayIcon,
  BookmarkIcon,
  FolderOpenIcon,
  RectangleGroupIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { classNames } from '../../../utils/classNames.js';
import { formatDate, formatRelativeTime } from '../../../utils/groupsFormatting.js';

function CategoryFilter({ categories, activeCategory, onSelect }) {
  if (!categories.length) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelect('all')}
        className={classNames(
          'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition',
          activeCategory === 'all'
            ? 'border-slate-900 bg-slate-900 text-white'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
        )}
      >
        All resources
      </button>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onSelect(category)}
          className={classNames(
            'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition',
            activeCategory === category
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

CategoryFilter.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  activeCategory: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
};

function ResourceCard({ resource, view, onPreview }) {
  const badge = resource?.category ?? resource?.type ?? 'Resource';
  const published = resource?.publishedAt ?? resource?.updatedAt;
  const lastUpdated = published ? formatRelativeTime(published) : null;
  const previewText = resource?.description ?? resource?.summary ?? resource?.excerpt;

  return (
    <article
      className={classNames(
        'group flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/90 p-5 transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-soft',
        view === 'list' ? 'md:flex-row md:items-center md:gap-6' : '',
      )}
    >
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{badge}</span>
          {resource?.difficulty ? <span>{resource.difficulty}</span> : null}
          {resource?.duration ? <span>{resource.duration}</span> : null}
        </div>
        <h3 className="mt-3 text-lg font-semibold text-slate-900">{resource.title}</h3>
        {previewText ? <p className="mt-2 text-sm text-slate-600">{previewText}</p> : null}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {resource?.author ? <span>By {resource.author}</span> : null}
          {lastUpdated ? <span>• {lastUpdated}</span> : null}
          {resource?.format ? <span>• {resource.format}</span> : null}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <a
          href={resource.url ?? '#'}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Download
        </a>
        <button
          type="button"
          onClick={() => onPreview(resource)}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <RectangleGroupIcon className="h-4 w-4" />
          Preview
        </button>
      </div>
    </article>
  );
}

ResourceCard.propTypes = {
  resource: PropTypes.object.isRequired,
  view: PropTypes.oneOf(['grid', 'list']).isRequired,
  onPreview: PropTypes.func.isRequired,
};

function PreviewOverlay({ resource, onClose }) {
  if (!resource) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 px-4 py-10">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resource preview</p>
            <h3 className="text-lg font-semibold text-slate-900">{resource.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            aria-label="Close preview"
          >
            ×
          </button>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-6 text-sm text-slate-600">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overview</p>
          <p>{resource.description ?? resource.summary ?? 'Detailed preview coming soon.'}</p>
          {resource.takeaways ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Key takeaways</p>
              <ul className="mt-2 space-y-2">
                {resource.takeaways.map((item) => (
                  <li key={item} className="rounded-2xl bg-slate-50 px-4 py-2">{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {resource.publishedAt ? (
            <div className="text-xs text-slate-500">Published {formatDate(resource.publishedAt)}</div>
          ) : null}
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <p>Need more context? Share this preview with mentors for curated recommendations.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

PreviewOverlay.propTypes = {
  resource: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

PreviewOverlay.defaultProps = {
  resource: null,
};

export default function ResourceLibrary({ library, formatNumber }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [view, setView] = useState('grid');
  const [visibleCount, setVisibleCount] = useState(9);
  const [preview, setPreview] = useState(null);

  const items = Array.isArray(library?.items) ? library.items : [];
  const categories = useMemo(() => {
    const set = new Set();
    (library?.categories ?? []).forEach((cat) => cat && set.add(cat));
    items.forEach((item) => {
      if (item?.category) {
        set.add(item.category);
      }
    });
    return Array.from(set);
  }, [library?.categories, items]);

  const filteredItems = useMemo(() => {
    let list = items;
    if (category !== 'all') {
      list = list.filter((item) => item?.category === category || item?.type === category);
    }
    if (query.trim()) {
      const value = query.trim().toLowerCase();
      list = list.filter((item) => {
        const title = item?.title ?? '';
        const description = item?.description ?? item?.summary ?? '';
        return title.toLowerCase().includes(value) || description.toLowerCase().includes(value);
      });
    }
    return list;
  }, [items, category, query]);

  const visibleItems = useMemo(() => filteredItems.slice(0, visibleCount), [filteredItems, visibleCount]);
  const hasMore = filteredItems.length > visibleCount;
  const featured = Array.isArray(library?.featured) ? library.featured.slice(0, 3) : items.slice(0, 3);
  const collections = Array.isArray(library?.collections) ? library.collections : [];
  const analytics = library?.analytics ?? {};

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <BookmarkIcon className="h-4 w-4 text-accent" /> Resource library
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Curated playbooks, templates, and recordings to accelerate collaborations across the community.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
            {formatNumber(items.length)} assets
          </span>
          {analytics?.downloads ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-600">
              {formatNumber(analytics.downloads)} downloads this quarter
            </span>
          ) : null}
          {analytics?.newThisMonth ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 font-semibold text-rose-600">
              {formatNumber(analytics.newThisMonth)} new this month
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(9);
            }}
            className="w-full border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            placeholder="Search guides, recordings, or decks"
            aria-label="Search resources"
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 text-slate-500">
            <button
              type="button"
              onClick={() => setView('grid')}
              className={classNames(
                'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition',
                view === 'grid' ? 'bg-slate-900 text-white' : 'hover:text-slate-900',
              )}
            >
              <Squares2X2Icon className="h-4 w-4" /> Grid
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={classNames(
                'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition',
                view === 'list' ? 'bg-slate-900 text-white' : 'hover:text-slate-900',
              )}
            >
              <FolderOpenIcon className="h-4 w-4" /> List
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <CategoryFilter categories={categories} activeCategory={category} onSelect={(value) => {
          setCategory(value);
          setVisibleCount(9);
        }} />
      </div>

      {collections.length ? (
        <div className="mt-8 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Curated collections</p>
          <div className="grid gap-4 md:grid-cols-3">
            {collections.slice(0, 3).map((collection) => (
              <div key={collection.id ?? collection.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-base font-semibold text-slate-900">{collection.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{collection.description ?? 'Playlist prepared by mentors.'}</p>
                <div className="mt-3 text-xs text-slate-500">
                  {formatNumber(collection.count ?? 0)} items · Updated {formatRelativeTime(collection.updatedAt ?? new Date())}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {featured.length ? (
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Featured</p>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {featured.map((resource) => (
              <article key={resource.id ?? resource.title} className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{resource.category ?? resource.type ?? 'Resource'}</p>
                <h4 className="mt-2 text-base font-semibold text-slate-900">{resource.title}</h4>
                <p className="mt-2 text-sm text-slate-600">{resource.description ?? 'Curated insight from community mentors.'}</p>
                <button
                  type="button"
                  onClick={() => setPreview(resource)}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  <RectangleGroupIcon className="h-4 w-4" />
                  Preview
                </button>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <div className={classNames('mt-8 grid gap-4', view === 'grid' ? 'md:grid-cols-2' : 'md:grid-cols-1')}> 
        {visibleItems.length ? (
          visibleItems.map((resource) => (
            <ResourceCard key={resource.id ?? resource.title} resource={resource} view={view} onPreview={setPreview} />
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            No resources match that filter yet. Try searching for another keyword.
          </div>
        )}
      </div>

      {hasMore ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => Math.min(count + 6, filteredItems.length))}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Load more resources
          </button>
        </div>
      ) : null}

      <PreviewOverlay resource={preview} onClose={() => setPreview(null)} />
    </section>
  );
}

ResourceLibrary.propTypes = {
  library: PropTypes.shape({
    items: PropTypes.arrayOf(PropTypes.object),
    categories: PropTypes.arrayOf(PropTypes.string),
    collections: PropTypes.arrayOf(PropTypes.object),
    featured: PropTypes.arrayOf(PropTypes.object),
    analytics: PropTypes.object,
  }).isRequired,
  formatNumber: PropTypes.func.isRequired,
};
