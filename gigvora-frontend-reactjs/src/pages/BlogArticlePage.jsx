import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { ArrowLeftIcon, ClockIcon } from '@heroicons/react/24/outline';
import { fetchBlogPost } from '../services/blog.js';
import BlogCard from '../components/blog/BlogCard.jsx';
import { fetchBlogPosts } from '../services/blog.js';

function formatDate(input) {
  if (!input) {
    return null;
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function BlogArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchBlogPost(slug, { signal: controller.signal });
        if (!cancelled) {
          setArticle(data);
        }
        const relatedPayload = await fetchBlogPosts({ pageSize: 3 }, { signal: controller.signal });
        if (!cancelled) {
          setRelated((relatedPayload?.results ?? []).filter((post) => post.slug !== slug));
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
  }, [slug]);

  const sanitized = useMemo(() => {
    if (!article?.content) {
      return '';
    }
    return DOMPurify.sanitize(article.content, { USE_PROFILES: { html: true } });
  }, [article?.content]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gradient-to-b from-white via-slate-50 to-slate-100">
        <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 shadow-soft">
          Loading article...
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="bg-gradient-to-b from-white via-slate-50 to-slate-100 py-20">
        <div className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-rose-50/80 p-10 text-center shadow-soft">
          <h1 className="text-2xl font-semibold text-rose-600">We can&apos;t find that story right now.</h1>
          <p className="mt-3 text-sm text-rose-600">
            The article might have been archived or you followed an outdated link. Browse the latest insights from the blog hub.
          </p>
          <Link
            to="/blog"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-rose-600"
          >
            Back to blog
          </Link>
        </div>
      </div>
    );
  }

  const coverImage = article.coverImage?.url ?? article.media?.[0]?.media?.url ?? null;

  return (
    <div className="bg-gradient-to-b from-white via-slate-50 to-slate-100">
      <div className="mx-auto max-w-5xl px-6 pb-16">
        <nav className="flex items-center gap-3 py-6 text-sm text-slate-600">
          <Link to="/blog" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 transition hover:border-accent hover:text-accent">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to blog
          </Link>
          {article.category ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
              {article.category.name}
            </span>
          ) : null}
        </nav>

        <header className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-[0_40px_120px_-70px_rgba(37,99,235,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Gigvora insights</p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900 leading-tight">{article.title}</h1>
          {article.excerpt ? <p className="mt-4 text-base text-slate-600">{article.excerpt}</p> : null}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            {article.author ? (
              <span>
                By {article.author.firstName} {article.author.lastName}
              </span>
            ) : null}
            {article.publishedAt ? <span>{formatDate(article.publishedAt)}</span> : null}
            {article.readingTimeMinutes ? (
              <span className="inline-flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                {article.readingTimeMinutes} min read
              </span>
            ) : null}
          </div>
          {article.tags?.length ? (
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
              {article.tags.map((tag) => (
                <span key={tag.id ?? tag.slug} className="rounded-full bg-accent/10 px-3 py-1">
                  #{tag.name}
                </span>
              ))}
            </div>
          ) : null}
        </header>

        {coverImage ? (
          <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
            <img src={coverImage} alt={article.coverImage?.altText ?? article.title} className="h-full w-full object-cover" />
          </div>
        ) : null}

        <article className="prose prose-lg prose-slate mx-auto mt-10 max-w-none rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-sm prose-headings:font-semibold prose-a:text-accent hover:prose-a:text-accentDark">
          <div dangerouslySetInnerHTML={{ __html: sanitized }} />
        </article>

        {related.length ? (
          <section className="mt-16 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Continue exploring</h2>
            <p className="mt-1 text-sm text-slate-500">More enterprise-grade tactics and stories curated for you.</p>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {related.slice(0, 3).map((post) => (
                <BlogCard key={post.id ?? post.slug} post={post} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
