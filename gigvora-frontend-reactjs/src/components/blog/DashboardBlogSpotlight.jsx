import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowTopRightOnSquareIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { fetchBlogPosts } from '../../services/blog.js';
import BlogCard from './BlogCard.jsx';

function SkeletonCard() {
  return (
    <div className="flex h-full animate-pulse flex-col rounded-3xl border border-slate-200 bg-white/80 p-6">
      <div className="h-40 rounded-2xl bg-slate-100" />
      <div className="mt-4 h-3 w-1/3 rounded-full bg-slate-100" />
      <div className="mt-3 h-5 w-4/5 rounded-full bg-slate-200" />
      <div className="mt-2 h-5 w-3/5 rounded-full bg-slate-100" />
      <div className="mt-auto h-3 w-2/5 rounded-full bg-slate-100" />
    </div>
  );
}

export default function DashboardBlogSpotlight() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchBlogPosts({ pageSize: 3 }, { signal: controller.signal });
        if (!cancelled) {
          setPosts(Array.isArray(data?.results) ? data.results : []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const spotlightPosts = useMemo(() => posts.slice(0, 3), [posts]);

  if (loading && !spotlightPosts.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Insights &amp; playbooks</p>
            <h2 className="text-xl font-semibold text-slate-900">Gigvora blog spotlight</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Enterprise-grade strategies, growth playbooks, and platform updates curated for your workspace.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500">
            <ArrowPathIcon className="h-4 w-4 animate-spin" /> Refreshing
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50/80 p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Content unavailable</p>
            <h2 className="text-xl font-semibold text-amber-700">We&apos;re having trouble loading the latest blog insights.</h2>
            <p className="mt-2 max-w-3xl text-sm text-amber-700">
              Refresh the page or visit the blog hub to view the full library of announcements, guides, and operator tips.
            </p>
          </div>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-amber-600"
          >
            Open blog hub
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  if (!spotlightPosts.length) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Insights &amp; playbooks</p>
          <h2 className="text-xl font-semibold text-slate-900">Gigvora blog spotlight</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Enterprise growth, trust, and operations best practices curated for your workspace roles.
          </p>
        </div>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
        >
          Visit blog hub
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
        </Link>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {spotlightPosts.map((post) => (
          <BlogCard key={post.id ?? post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
