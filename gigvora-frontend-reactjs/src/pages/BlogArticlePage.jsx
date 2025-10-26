import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { fetchBlogPost, fetchBlogPosts } from '../services/blog.js';
import BlogPostLayout from '../components/blog/BlogPostLayout.jsx';

export function formatDate(input) {
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
  const navigate = useNavigate();
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
        const relatedPayload = await fetchBlogPosts({ pageSize: 4 }, { signal: controller.signal });
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

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

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
          <button
            type="button"
            onClick={handleBack}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-rose-600"
          >
            Back to blog
          </button>
        </div>
      </div>
    );
  }

  return (
    <BlogPostLayout
      article={article}
      sanitizedHtml={sanitized}
      relatedPosts={related.slice(0, 4)}
      onNavigateBack={handleBack}
    />
  );
}
