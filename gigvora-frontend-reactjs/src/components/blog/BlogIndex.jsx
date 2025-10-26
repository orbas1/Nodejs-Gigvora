import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  CommandLineIcon,
  MagnifyingGlassIcon,
  PlayCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import ContentAuthorCard from './ContentAuthorCard.jsx';
import {
  fetchBlogCategories,
  fetchBlogPosts,
  fetchBlogTags,
} from '../../services/blog.js';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);
  return debounced;
}

function formatDate(input) {
  if (!input) {
    return null;
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const sortOptions = [
  { id: 'featured', label: 'Editorial picks' },
  { id: 'newest', label: 'Latest' },
  { id: 'trending', label: 'Trending' },
  { id: 'longform', label: 'Deep dives' },
];

export default function BlogIndex() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState(sortOptions[0].id);
  const [searchValue, setSearchValue] = useState(searchParams.get('q') ?? '');
  const searchInputRef = useRef(null);

  const selectedCategory = searchParams.get('category') ?? '';
  const selectedTag = searchParams.get('tag') ?? '';
  const queryParam = searchParams.get('q') ?? '';
  const debouncedSearch = useDebouncedValue(searchValue.trim(), 300);

  const loadMeta = useCallback(async () => {
    try {
      const [categoryResults, tagResults] = await Promise.all([
        fetchBlogCategories({}),
        fetchBlogTags({}),
      ]);
      setCategories(categoryResults ?? []);
      setTags(tagResults ?? []);
    } catch (metaError) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load blog metadata', metaError);
    }
  }, []);

  const loadPosts = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchBlogPosts({
          page,
          pageSize: 12,
          category: selectedCategory || undefined,
          tag: selectedTag || undefined,
          search: debouncedSearch || undefined,
        });
        setPosts(Array.isArray(data?.results) ? data.results : []);
        setPagination(data?.pagination ?? { page: 1, totalPages: 1 });
      } catch (loadError) {
        setError(loadError);
      } finally {
        setLoading(false);
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    },
    [debouncedSearch, selectedCategory, selectedTag],
  );

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    loadPosts(1);
  }, [loadPosts]);

  useEffect(() => {
    const currentQuery = searchParams.get('q') ?? '';
    if (currentQuery === searchValue.trim()) {
      return;
    }
    const next = new URLSearchParams(searchParams);
    if (searchValue.trim().length === 0) {
      next.delete('q');
    } else {
      next.set('q', searchValue.trim());
    }
    setSearchParams(next, { replace: true });
  }, [searchValue, searchParams, setSearchParams]);

  useEffect(() => {
    if (queryParam !== searchValue) {
      setSearchValue(queryParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParam]);

  const featuredPost = useMemo(() => {
    if (!posts.length) {
      return null;
    }
    if (sort === 'trending') {
      return [...posts].sort((a, b) => (b.metrics?.views ?? 0) - (a.metrics?.views ?? 0))[0];
    }
    if (sort === 'longform') {
      return [...posts].sort((a, b) => (b.readingTimeMinutes ?? 0) - (a.readingTimeMinutes ?? 0))[0];
    }
    return posts[0];
  }, [posts, sort]);

  const curatedCollections = useMemo(() => {
    if (!posts.length) {
      return { trending: [], strategy: [], quickReads: [] };
    }
    const trending = [...posts]
      .sort((a, b) => (b.metrics?.views ?? 0) - (a.metrics?.views ?? 0))
      .slice(0, 4);
    const strategy = posts.filter((post) => post.tags?.some((tag) => /strategy|growth|enterprise/i.test(tag?.name ?? '')));
    const quickReads = [...posts]
      .filter((post) => (post.readingTimeMinutes ?? 0) <= 5)
      .slice(0, 4);
    return {
      trending,
      strategy: strategy.slice(0, 4),
      quickReads,
    };
  }, [posts]);

  const heroCategory = useMemo(
    () => categories.find((item) => item.slug === selectedCategory),
    [categories, selectedCategory],
  );

  const orderedPosts = useMemo(() => {
    if (sort === 'trending') {
      return [...posts].sort((a, b) => (b.metrics?.views ?? 0) - (a.metrics?.views ?? 0));
    }
    if (sort === 'longform') {
      return [...posts].sort((a, b) => (b.readingTimeMinutes ?? 0) - (a.readingTimeMinutes ?? 0));
    }
    if (sort === 'newest') {
      return [...posts].sort(
        (a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime(),
      );
    }
    return posts;
  }, [posts, sort]);

  const handleReset = useCallback(() => {
    setSearchValue('');
    setSort(sortOptions[0].id);
    const next = new URLSearchParams(searchParams);
    next.delete('category');
    next.delete('tag');
    next.delete('q');
    setSearchParams(next, { replace: true });
    searchInputRef.current?.focus();
  }, [searchParams, setSearchParams]);

  return (
    <div className="bg-gradient-to-b from-white via-slate-50 to-indigo-50/40">
      <div className="mx-auto max-w-7xl px-6 pb-20">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/95 px-8 pb-10 pt-12 shadow-[0_40px_120px_-70px_rgba(37,99,235,0.6)]">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">Gigvora insights</p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Intelligence hub for leaders building trusted platforms
              </h1>
              <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                Navigate growth, trust, and revenue with executive playbooks sourced from our product, compliance, and mentor
                communities. Curated to feel as premium as the platforms you&apos;re building.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-600">
                  <AdjustmentsHorizontalIcon className="h-4 w-4" />
                  Personalise by topics and tags
                </span>
                {heroCategory?.description ? <span>{heroCategory.description}</span> : null}
              </div>
            </div>
            <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-accent/10 bg-accent/5 p-4 text-slate-50">
              <div className="absolute inset-0 bg-gradient-to-br from-accent via-indigo-500 to-slate-900 opacity-80" />
              <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
                  <SparklesIcon className="h-5 w-5" />
                  Editors&apos; cut
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{featuredPost?.title ?? 'Preview platform intelligence'}</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    {featuredPost?.excerpt ??
                      'Tour the strategies top operators use to operationalise trust, scale hiring, and grow revenue.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 self-start rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                  onClick={() => {
                    const video = document.createElement('video');
                    video.src = featuredPost?.heroVideoUrl ?? '';
                    video.controls = true;
                    video.autoplay = true;
                    video.className =
                      'fixed inset-0 z-[60] m-auto max-h-[90vh] max-w-3xl rounded-3xl border border-white/30 shadow-2xl';
                    const overlay = document.createElement('div');
                    overlay.className = 'fixed inset-0 z-50 bg-slate-900/80 backdrop-blur';
                    const close = () => {
                      video.pause();
                      overlay.remove();
                      video.remove();
                    };
                    overlay.addEventListener('click', close, { once: true });
                    document.body.appendChild(overlay);
                    document.body.appendChild(video);
                    if (!featuredPost?.heroVideoUrl) {
                      setTimeout(close, 2000);
                    }
                  }}
                >
                  <PlayCircleIcon className="h-5 w-5" />
                  Watch 90s walkthrough
                </button>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_minmax(320px,360px)]">
          <div>
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSort(option.id)}
                      className={classNames(
                        'rounded-full px-4 py-2 text-sm font-semibold transition',
                        sort === option.id
                          ? 'bg-accent text-white shadow-soft'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-700',
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="relative flex w-full max-w-sm items-center">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-3 h-5 w-5 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder="Search playbooks, teams, or keywords"
                    className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm font-medium text-slate-700 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Categories:</span>
                <button
                  type="button"
                  className={classNames(
                    'rounded-full border px-4 py-1 text-sm font-semibold transition',
                    selectedCategory
                      ? 'border-slate-200 text-slate-600 hover:border-accent hover:text-accent'
                      : 'border-accent bg-accent text-white shadow-soft',
                  )}
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.delete('category');
                    setSearchParams(next, { replace: true });
                  }}
                >
                  All categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id ?? category.slug}
                    type="button"
                    className={classNames(
                      'rounded-full border px-4 py-1 text-sm font-semibold transition',
                      selectedCategory === category.slug
                        ? 'border-accent bg-accent text-white shadow-soft'
                        : 'border-slate-200 text-slate-600 hover:border-accent hover:text-accent',
                    )}
                    onClick={() => {
                      const next = new URLSearchParams(searchParams);
                      if (selectedCategory === category.slug) {
                        next.delete('category');
                      } else {
                        next.set('category', category.slug);
                      }
                      setSearchParams(next, { replace: true });
                    }}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-[0.2em]">Tags:</span>
                <button
                  type="button"
                  className={classNames(
                    'rounded-full px-3 py-1 font-semibold transition',
                    selectedTag
                      ? 'border border-slate-200 text-slate-600 hover:border-accent hover:text-accent'
                      : 'bg-accent text-white shadow-soft',
                  )}
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.delete('tag');
                    setSearchParams(next, { replace: true });
                  }}
                >
                  All tags
                </button>
                {tags.slice(0, 18).map((tag) => (
                  <button
                    key={tag.id ?? tag.slug}
                    type="button"
                    className={classNames(
                      'rounded-full border px-3 py-1 font-semibold transition',
                      selectedTag === tag.slug
                        ? 'border-accent bg-accent text-white shadow-soft'
                        : 'border-slate-200 text-slate-600 hover:border-accent hover:text-accent',
                    )}
                    onClick={() => {
                      const next = new URLSearchParams(searchParams);
                      if (selectedTag === tag.slug) {
                        next.delete('tag');
                      } else {
                        next.set('tag', tag.slug);
                      }
                      setSearchParams(next, { replace: true });
                    }}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              {loading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="h-60 animate-pulse rounded-3xl border border-slate-100 bg-white"
                    >
                      <div className="h-2/3 rounded-t-3xl bg-slate-200" />
                      <div className="space-y-3 p-4">
                        <div className="h-4 rounded-full bg-slate-200" />
                        <div className="h-4 w-1/2 rounded-full bg-slate-200" />
                      </div>
                    </div>
                  ))
                : orderedPosts.map((post) => (
                    <div key={post.id ?? post.slug} className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                      {post.coverImage?.url ? (
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={post.coverImage.url}
                            alt={post.coverImage?.altText ?? post.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent" />
                          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                            <CommandLineIcon className="h-4 w-4" />
                            {post.category?.name ?? 'Editorial'}
                          </div>
                        </div>
                      ) : null}
                      <div className="flex flex-1 flex-col p-6">
                        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                          {post.tags?.slice(0, 2).map((tag) => (
                            <span key={tag.id ?? tag.slug} className="rounded-full bg-accent/10 px-3 py-1 text-[11px]">
                              #{tag.name}
                            </span>
                          ))}
                          <span className="text-[11px] text-slate-500">{formatDate(post.publishedAt)}</span>
                        </div>
                        <h2 className="mt-3 text-2xl font-semibold text-slate-900 group-hover:text-accent">
                          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                        </h2>
                        {post.excerpt ? (
                          <p className="mt-3 text-sm leading-relaxed text-slate-600">{post.excerpt}</p>
                        ) : null}
                        <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
                          <div className="flex items-center gap-2">
                            {post.author ? (
                              <div className="flex items-center gap-2">
                                {post.author.avatar?.url ? (
                                  <img
                                    src={post.author.avatar.url}
                                    alt={`${post.author.firstName} ${post.author.lastName}`}
                                    className="h-8 w-8 rounded-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 font-semibold text-accent">
                                    {(post.author.firstName?.[0] ?? '').toUpperCase()}
                                    {(post.author.lastName?.[0] ?? '').toUpperCase()}
                                  </span>
                                )}
                                <span className="font-semibold text-slate-700">
                                  {post.author.firstName} {post.author.lastName}
                                </span>
                              </div>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                            <span>{post.readingTimeMinutes ?? '—'} min read</span>
                            {post.metrics?.views ? <span>{post.metrics.views.toLocaleString()} views</span> : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
            </section>

            {!loading && !posts.length ? (
              <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center text-sm text-amber-700">
                <p>No stories match the filters yet. Try broadening your search or reset the filters.</p>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-slate-700">Showing page {pagination.page} of {pagination.totalPages}</p>
                <p className="text-xs text-slate-500">Explore the full archive of premium stories, research, and product updates.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => loadPosts(Math.max(1, pagination.page - 1))}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition enabled:hover:border-accent enabled:hover:text-accent disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages || loading}
                  onClick={() => loadPosts(Math.min(pagination.totalPages, pagination.page + 1))}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition enabled:hover:border-accent enabled:hover:text-accent disabled:opacity-50"
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Reset filters
                </button>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Trending today</h2>
              <p className="mt-1 text-sm text-slate-500">Stories operators are sharing with their teams right now.</p>
              <ul className="mt-4 space-y-4">
                {(curatedCollections.trending ?? []).map((post) => (
                  <li key={post.id ?? post.slug} className="group border-b border-slate-100 pb-4 last:border-none last:pb-0">
                    <Link to={`/blog/${post.slug}`} className="block">
                      <p className="text-sm font-semibold text-slate-900 transition group-hover:text-accent">{post.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{post.readingTimeMinutes ?? '—'} min read · {post.metrics?.views ? `${post.metrics.views.toLocaleString()} views` : 'New'}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 font-semibold transition hover:border-accent hover:text-accent"
                >
                  Reset personalisation
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
                <a
                  href="https://www.linkedin.com/company/gigvora"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 font-semibold transition hover:border-accent hover:text-accent"
                >
                  Follow on LinkedIn
                  <ChevronRightIcon className="h-4 w-4" />
                </a>
                <Link
                  to="/newsletter"
                  className="inline-flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 font-semibold transition hover:border-accent hover:text-accent"
                >
                  Subscribe to Signals
                  <ChevronRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {featuredPost?.author ? (
              <ContentAuthorCard
                author={featuredPost.author}
                headline="Meet the strategist behind this playbook"
                highlight={featuredPost.excerpt}
                postCount={featuredPost.author?.postCount ?? undefined}
              />
            ) : null}

            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Collections</h2>
              <div className="mt-4 space-y-4 text-sm text-slate-600">
                <div>
                  <p className="font-semibold text-slate-800">Executive strategy</p>
                  <ul className="mt-2 space-y-2 text-xs text-slate-500">
                    {(curatedCollections.strategy ?? []).map((post) => (
                      <li key={`strategy-${post.id ?? post.slug}`} className="group">
                        <Link to={`/blog/${post.slug}`} className="transition hover:text-accent">
                          {post.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">5 minute quick reads</p>
                  <ul className="mt-2 space-y-2 text-xs text-slate-500">
                    {(curatedCollections.quickReads ?? []).map((post) => (
                      <li key={`quick-${post.id ?? post.slug}`} className="group">
                        <Link to={`/blog/${post.slug}`} className="transition hover:text-accent">
                          {post.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-accent/20 bg-gradient-to-br from-white via-slate-50 to-accent/10 p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-slate-900">Monthly research drop</h2>
              <p className="mt-2 text-sm text-slate-600">
                Receive exclusive data stories, product tear-downs, and operator roundtables before they go public.
              </p>
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
              >
                Join the insider list
              </button>
            </div>
          </aside>
        </div>

        {error ? (
          <div className="mt-10 rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-600">
            We couldn&apos;t refresh the blog at the moment. Please retry in a moment or reset your filters.
          </div>
        ) : null}
      </div>
    </div>
  );
}
