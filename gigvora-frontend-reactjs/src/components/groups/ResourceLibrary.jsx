import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  BookOpenIcon,
  ArrowDownTrayIcon,
  RectangleStackIcon,
  BookmarkIcon,
  FunnelIcon,
  PlayCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { formatGroupRelativeTime } from '../../utils/groupFormatting.js';

function ResourceCard({ resource, onOpen, onSave }) {
  return (
    <article className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
          {resource.type ?? resource.format ?? 'Resource'}
        </span>
        {resource.updatedAt ? <span>{formatGroupRelativeTime(resource.updatedAt)}</span> : null}
      </div>
      <div className="mt-4 space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">{resource.title}</h3>
        <p className="text-sm text-slate-600 line-clamp-3">{resource.summary ?? resource.description}</p>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          {(resource.tags ?? []).map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 font-semibold">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <RectangleStackIcon className="h-4 w-4" />
          {resource.duration ?? resource.readingTime ?? '5 min read'}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSave?.(resource)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            <BookmarkIcon className="h-4 w-4" /> Save
          </button>
          <button
            type="button"
            onClick={() => onOpen?.(resource)}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-slate-800"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Open
          </button>
        </div>
      </div>
    </article>
  );
}

ResourceCard.propTypes = {
  resource: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    summary: PropTypes.string,
    description: PropTypes.string,
    type: PropTypes.string,
    format: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    duration: PropTypes.string,
    readingTime: PropTypes.string,
    updatedAt: PropTypes.string,
  }).isRequired,
  onOpen: PropTypes.func,
  onSave: PropTypes.func,
};

ResourceCard.defaultProps = {
  onOpen: undefined,
  onSave: undefined,
};

export default function ResourceLibrary({ library, onOpenResource, onSaveResource }) {
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState('all');
  const [tag, setTag] = useState('all');
  const [sort, setSort] = useState('recent');

  const items = library?.items ?? [];
  const featured = library?.featured ?? [];
  const tags = useMemo(() => {
    const base = library?.filters?.tags ?? items.flatMap((item) => item.tags ?? []);
    return Array.from(new Set(base.map((value) => value?.toString().trim()).filter(Boolean)));
  }, [library?.filters?.tags, items]);
  const formats = useMemo(() => {
    const base = library?.filters?.formats ?? items.map((item) => item.format ?? item.type);
    return Array.from(new Set(base.map((value) => value?.toString().trim()).filter(Boolean)));
  }, [library?.filters?.formats, items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items
      .filter((item) => {
        if (!normalizedQuery) {
          return true;
        }
        const haystack = `${item.title} ${item.summary ?? ''} ${(item.tags ?? []).join(' ')}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .filter((item) => {
        if (format === 'all') {
          return true;
        }
        return (item.format ?? item.type ?? '').toLowerCase() === format;
      })
      .filter((item) => {
        if (tag === 'all') {
          return true;
        }
        return (item.tags ?? []).map((value) => value.toLowerCase()).includes(tag);
      })
      .sort((a, b) => {
        if (sort === 'popular') {
          return (b.metrics?.saves ?? 0) - (a.metrics?.saves ?? 0);
        }
        if (sort === 'longest') {
          return (b.metrics?.durationMinutes ?? 0) - (a.metrics?.durationMinutes ?? 0);
        }
        const aDate = new Date(a.updatedAt ?? a.publishedAt ?? 0).getTime();
        const bDate = new Date(b.updatedAt ?? b.publishedAt ?? 0).getTime();
        return bDate - aDate;
      });
  }, [items, query, format, tag, sort]);

  const stats = library?.stats ?? {
    totalItems: items.length,
    savedCount: items.reduce((total, item) => total + (item.metrics?.saves ?? 0), 0),
    downloads24h: items.reduce((total, item) => total + (item.metrics?.downloads24h ?? 0), 0),
  };

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <BookOpenIcon className="h-4 w-4" /> Resource library
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Playbooks, recordings, and field guides</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Curated collections from moderators and mentors to help members move faster. Filter by format, save favourites, an
              d track what’s trending.
            </p>
          </div>
          <div className="grid gap-2 text-right text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-4 py-1 font-semibold text-slate-600">{stats.totalItems} resources</span>
            <span>{stats.downloads24h ?? 0} downloads in the last 24h</span>
            <span>{stats.savedCount ?? 0} saved by members</span>
          </div>
        </div>

        {featured.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {featured.map((resource) => (
              <article
                key={resource.id}
                className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-lg"
              >
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
                  <PlayCircleIcon className="h-4 w-4" /> Featured drop
                </p>
                <h3 className="text-xl font-semibold">{resource.title}</h3>
                <p className="text-sm text-white/80">{resource.summary ?? resource.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-white/70">
                  <span>{resource.format ?? resource.type}</span>
                  {resource.updatedAt ? <span>{formatGroupRelativeTime(resource.updatedAt)}</span> : null}
                  <span>{resource.duration ?? resource.readingTime}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onSaveResource?.(resource)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-white/60 hover:text-white"
                  >
                    <BookmarkIcon className="h-4 w-4" /> Save for later
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenResource?.(resource)}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow transition hover:bg-slate-100"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" /> Open resource
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
          <label className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search playbooks, recordings, templates"
              className="w-full rounded-full border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-700 shadow-sm focus:border-accent/40 focus:outline-none focus:ring-4 focus:ring-accent/10"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">
              <FunnelIcon className="h-4 w-4" /> Filters
            </span>
            <select
              value={format}
              onChange={(event) => setFormat(event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
            >
              <option value="all">All formats</option>
              {formats.map((value) => (
                <option key={value} value={value.toLowerCase()}>
                  {value}
                </option>
              ))}
            </select>
            <select
              value={tag}
              onChange={(event) => setTag(event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
            >
              <option value="all">All tags</option>
              {tags.map((value) => (
                <option key={value} value={value.toLowerCase()}>
                  {value}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
            >
              <option value="recent">Newest</option>
              <option value="popular">Most saved</option>
              <option value="longest">Deep dives</option>
            </select>
          </div>
        </div>
      </header>

      {filteredItems.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onOpen={(item) => onOpenResource?.(item)}
              onSave={(item) => onSaveResource?.(item)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <RectangleStackIcon className="h-10 w-10 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700">No resources match the current filters.</p>
          <p className="text-xs text-slate-500">Refresh filters or request new materials from moderators.</p>
        </div>
      )}
    </section>
  );
}

ResourceLibrary.propTypes = {
  library: PropTypes.shape({
    items: PropTypes.arrayOf(PropTypes.object),
    featured: PropTypes.arrayOf(PropTypes.object),
    stats: PropTypes.object,
    filters: PropTypes.shape({
      tags: PropTypes.arrayOf(PropTypes.string),
      formats: PropTypes.arrayOf(PropTypes.string),
    }),
  }),
  onOpenResource: PropTypes.func,
  onSaveResource: PropTypes.func,
};

ResourceLibrary.defaultProps = {
  library: null,
  onOpenResource: undefined,
  onSaveResource: undefined,
};
