import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdjustmentsHorizontalIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import BlogCard from '../components/blog/BlogCard.jsx';
import {
  fetchBlogCategories,
  fetchBlogPosts,
  fetchBlogTags,
} from '../services/blog.js';

export function FilterPill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'border-accent bg-accent text-white shadow-soft'
          : 'border-slate-200 bg-white text-slate-600 hover:border-accent hover:text-accent'
      }`}
    >
      {label}
    </button>
  );
}

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const selectedCategory = searchParams.get('category') ?? '';
  const selectedTag = searchParams.get('tag') ?? '';

  const loadBlogMeta = useCallback(async () => {
    try {
      const [categoryList, tagList] = await Promise.all([fetchBlogCategories({}), fetchBlogTags({})]);
      setCategories(categoryList);
      setTags(tagList);
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
          category: selectedCategory || undefined,
          tag: selectedTag || undefined,
          pageSize: 9,
        });
        setPosts(Array.isArray(data?.results) ? data.results : []);
        setPagination(data?.pagination ?? { page: 1, totalPages: 1 });
      } catch (loadError) {
        setError(loadError);
      } finally {
        setLoading(false);
      }
    },
    [selectedCategory, selectedTag],
  );

  useEffect(() => {
    loadBlogMeta();
  }, [loadBlogMeta]);

  useEffect(() => {
    loadPosts(1);
  }, [loadPosts]);

  const resetFilters = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('category');
    next.delete('tag');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const heroCategory = useMemo(() => categories.find((item) => item.slug === selectedCategory), [categories, selectedCategory]);

  return (
    <div className="bg-gradient-to-b from-white via-slate-50 to-indigo-50/40 py-12">
      <div className="mx-auto max-w-6xl px-6">
        <header className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-[0_40px_100px_-60px_rgba(37,99,235,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Gigvora insights</p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">Stories, playbooks, and platform intelligence</h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">
            Discover enterprise-ready strategies across hiring, revenue operations, trust, compliance, and product growth. Every
            post is curated for high-trust organisations building the future of work.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-600">
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
              Refine topics by category or tags
            </span>
            {heroCategory?.description ? <span>{heroCategory.description}</span> : null}
          </div>
        </header>

        <section className="mt-10 flex flex-wrap items-center gap-3">
          <FilterPill
            label="All categories"
            active={!selectedCategory}
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete('category');
              setSearchParams(next, { replace: true });
            }}
          />
          {categories.map((category) => (
            <FilterPill
              key={category.id}
              label={category.name}
              active={selectedCategory === category.slug}
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                if (selectedCategory === category.slug) {
                  next.delete('category');
                } else {
                  next.set('category', category.slug);
                }
                setSearchParams(next, { replace: true });
              }}
            />
          ))}
        </section>

        <section className="mt-6 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold uppercase tracking-[0.2em]">Tags:</span>
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete('tag');
              setSearchParams(next, { replace: true });
            }}
            className={`rounded-full px-3 py-1 font-semibold transition ${
              selectedTag ? 'border border-slate-200 text-slate-600 hover:border-accent hover:text-accent' : 'bg-accent text-white'
            }`}
          >
            All tags
          </button>
          {tags.slice(0, 16).map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                if (selectedTag === tag.slug) {
                  next.delete('tag');
                } else {
                  next.set('tag', tag.slug);
                }
                setSearchParams(next, { replace: true });
              }}
              className={`rounded-full px-3 py-1 font-semibold transition ${
                selectedTag === tag.slug
                  ? 'bg-slate-900 text-white shadow-soft'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-accent hover:text-accent'
              }`}
            >
              #{tag.name}
            </button>
          ))}
          {tags.length > 16 ? (
            <span className="rounded-full border border-dashed border-slate-200 px-3 py-1 text-slate-400">
              +{tags.length - 16} more curated tags
            </span>
          ) : null}
        </section>

        <section className="mt-10">
          {loading ? (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white/80 p-10 text-sm text-slate-500">
              <ArrowPathIcon className="h-6 w-6 animate-spin text-accent" />
              Loading beautifully designed insights...
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-10 text-center text-sm text-rose-600">
              We couldn&apos;t load the blog right now. Refresh the page or clear your filters to try again.
            </div>
          ) : posts.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <BlogCard key={post.id ?? post.slug} post={post} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-10 text-center text-sm text-slate-500">
              No articles match your filters yet. Reset filters to view the latest Gigvora updates.
            </div>
          )}
        </section>

        <section className="mt-10 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <div>
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={pagination.page <= 1 || loading}
              onClick={() => loadPosts(Math.max(1, pagination.page - 1))}
              className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-600 transition enabled:hover:border-accent enabled:hover:text-accent disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => loadPosts(Math.min(pagination.totalPages, pagination.page + 1))}
              className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-600 transition enabled:hover:border-accent enabled:hover:text-accent disabled:opacity-50"
            >
              Next
            </button>
            {(selectedCategory || selectedTag) && !loading ? (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-rose-200 px-4 py-2 font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
