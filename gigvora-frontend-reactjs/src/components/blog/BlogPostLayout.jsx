import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ClockIcon,
  ShareIcon,
  Squares2X2Icon,
  ChatBubbleOvalLeftEllipsisIcon,
} from '@heroicons/react/24/outline';
import ContentAuthorCard from './ContentAuthorCard.jsx';

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function formatDate(input) {
  if (!input) {
    return null;
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function estimatedReadingTime(content, fallback) {
  if (typeof fallback === 'number' && fallback > 0) {
    return fallback;
  }
  if (!content) {
    return null;
  }
  const text = typeof content === 'string' ? content : '';
  const words = text.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return null;
  }
  return Math.max(1, Math.round(words.length / 220));
}

export default function BlogPostLayout({ article, sanitizedHtml, relatedPosts = [], onNavigateBack }) {
  const articleRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [headings, setHeadings] = useState([]);
  const [shareStatus, setShareStatus] = useState(null);

  const readingTime = useMemo(() => estimatedReadingTime(article?.content, article?.readingTimeMinutes), [article]);
  const shareUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return article?.canonicalUrl ?? '';
  }, [article?.canonicalUrl]);

  useEffect(() => {
    function updateProgress() {
      if (!articleRef.current) {
        setProgress(0);
        return;
      }
      const elementTop = articleRef.current.offsetTop;
      const elementHeight = articleRef.current.scrollHeight;
      const scrollPosition = window.scrollY + window.innerHeight;
      const distance = Math.max(0, scrollPosition - elementTop);
      const total = elementHeight + window.innerHeight;
      const ratio = Math.min(Math.max(distance / total, 0), 1);
      setProgress(ratio);
    }

    updateProgress();
    window.addEventListener('scroll', updateProgress);
    window.addEventListener('resize', updateProgress);
    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  useEffect(() => {
    if (!articleRef.current) {
      setHeadings([]);
      return;
    }
    const nodes = Array.from(articleRef.current.querySelectorAll('h2, h3'));
    const mapped = nodes.map((node) => {
      const text = node.textContent ?? '';
      const baseSlug = slugify(text) || `section-${Math.random().toString(36).slice(2, 8)}`;
      const slug = node.id && node.id.length > 0 ? node.id : baseSlug;
      node.id = slug;
      return { id: slug, text, level: node.tagName.toLowerCase() };
    });
    setHeadings(mapped);
  }, [sanitizedHtml]);

  const handleShare = async (platform) => {
    if (typeof navigator === 'undefined') {
      setShareStatus('Share not available');
      return;
    }
    const url = shareUrl;
    const title = article?.title ?? 'Gigvora insight';
    const text = article?.excerpt ?? 'Explore the latest strategies from Gigvora.';

    try {
      if (platform === 'copy') {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          setShareStatus('Copied to clipboard');
          return;
        }
      }
      if (platform === 'native' && navigator.share) {
        await navigator.share({ title, text, url });
        setShareStatus('Shared');
        return;
      }
      if (platform === 'linkedin') {
        if (typeof window !== 'undefined') {
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
            '_blank',
            'noopener,noreferrer',
          );
        }
        setShareStatus('Opened LinkedIn');
        return;
      }
      if (platform === 'x') {
        if (typeof window !== 'undefined') {
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${title}\n${url}`)}`,
            '_blank',
            'noopener,noreferrer',
          );
        }
        setShareStatus('Opened X');
        return;
      }
      setShareStatus('Share not available');
    } catch (error) {
      setShareStatus('Unable to share');
    }
  };

  const handleBack = () => {
    if (typeof onNavigateBack === 'function') {
      onNavigateBack();
      return;
    }
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  return (
    <div className="bg-gradient-to-b from-white via-slate-50 to-slate-100">
      <div className="sticky top-0 z-30 h-1 w-full bg-slate-200">
        <div className="h-full bg-accent transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <div className="mx-auto max-w-5xl px-6 pb-16">
        <nav className="flex flex-wrap items-center gap-3 py-6 text-sm text-slate-600">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 transition hover:border-accent hover:text-accent"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to blog
          </button>
          {article?.category ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
              {article.category.name}
            </span>
          ) : null}
        </nav>

        <header className="rounded-[2.5rem] border border-slate-200 bg-white/95 p-8 shadow-[0_40px_120px_-70px_rgba(37,99,235,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Gigvora insights</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">{article?.title}</h1>
          {article?.excerpt ? <p className="mt-4 text-base text-slate-600 sm:text-lg">{article.excerpt}</p> : null}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            {article?.author ? (
              <span>
                By {article.author.firstName} {article.author.lastName}
              </span>
            ) : null}
            {article?.publishedAt ? <span>{formatDate(article.publishedAt)}</span> : null}
            {readingTime ? (
              <span className="inline-flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                {readingTime} min read
              </span>
            ) : null}
            {article?.metrics?.views ? <span>{article.metrics.views.toLocaleString()} readers</span> : null}
          </div>
          {article?.tags?.length ? (
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
              {article.tags.map((tag) => (
                <span key={tag.id ?? tag.slug} className="rounded-full bg-accent/10 px-3 py-1">
                  #{tag.name}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            {shareStatus ? <span className="text-[11px] text-accent">{shareStatus}</span> : null}
            <button
              type="button"
              onClick={() => handleShare('native')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 transition hover:border-accent hover:text-accent"
            >
              <ShareIcon className="h-4 w-4" />
              Quick share
            </button>
            <button
              type="button"
              onClick={() => handleShare('linkedin')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 transition hover:border-accent hover:text-accent"
            >
              LinkedIn
            </button>
            <button
              type="button"
              onClick={() => handleShare('x')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 transition hover:border-accent hover:text-accent"
            >
              X
            </button>
            <button
              type="button"
              onClick={() => handleShare('copy')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 transition hover:border-accent hover:text-accent"
            >
              Copy link
            </button>
          </div>
        </header>

        {article?.coverImage?.url ? (
          <div className="mt-8 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-soft">
            <img
              src={article.coverImage.url}
              alt={article.coverImage?.altText ?? article.title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <article
            ref={articleRef}
            className="prose prose-lg prose-slate max-w-none rounded-[2.5rem] border border-slate-200 bg-white/95 p-8 shadow-sm prose-headings:font-semibold prose-a:text-accent hover:prose-a:text-accent"
          >
            <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
          </article>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">In this story</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {headings.length === 0 ? (
                  <li className="text-xs text-slate-400">Sections will appear once the article loads.</li>
                ) : null}
                {headings.map((heading) => (
                  <li key={heading.id} className="group">
                    <a
                      href={`#${heading.id}`}
                      className="flex items-center gap-2 rounded-2xl px-3 py-2 transition hover:bg-accent/5 hover:text-accent"
                    >
                      {heading.level === 'h3' ? <span className="h-1.5 w-1.5 rounded-full bg-accent" /> : <Squares2X2Icon className="h-4 w-4" />}
                      <span className="text-sm font-medium text-slate-600 group-hover:text-accent">{heading.text}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {article?.author ? (
              <ContentAuthorCard
                author={article.author}
                headline="Author"
                highlight={article.author?.bio ?? article.excerpt}
                postCount={article.author?.postCount}
              />
            ) : null}

            <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Continue exploring</h2>
              <div className="mt-4 space-y-4">
                {relatedPosts.map((post) => (
                  <Link
                    key={post.id ?? post.slug}
                    to={`/blog/${post.slug}`}
                    className="group block rounded-2xl border border-slate-100 px-4 py-3 text-sm text-slate-600 transition hover:border-accent hover:text-accent"
                  >
                    <p className="font-semibold text-slate-800 group-hover:text-accent">{post.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{post.readingTimeMinutes ?? '—'} min read</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-accent/20 bg-gradient-to-br from-white via-slate-50 to-accent/10 p-5 text-sm text-slate-600 shadow-soft">
              <p className="font-semibold text-slate-900">Join the operator roundtable</p>
              <p className="mt-2 text-sm text-slate-600">
                Access private sessions with product, trust, and revenue leaders shaping the next generation of platforms.
              </p>
              <a
                href="https://cal.com/gigvora/consult"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
              >
                Request invite
              </a>
            </div>
          </aside>
        </div>

        {article?.commentsEnabled ? (
          <section className="mt-16 rounded-[2.5rem] border border-slate-200 bg-white/95 p-8 shadow-sm">
            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              <ChatBubbleOvalLeftEllipsisIcon className="h-4 w-4" />
              Community reflections
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Comments are powered by our trust and compliance framework. Please keep discussions constructive and respectful.
            </p>
            <button
              type="button"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
            >
              Leave a comment
            </button>
          </section>
        ) : null}
      </div>
    </div>
  );
}
