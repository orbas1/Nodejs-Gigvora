import { Link } from 'react-router-dom';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

function formatDate(input) {
  if (!input) {
    return 'Unscheduled';
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return 'Unscheduled';
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function resolveCover(post) {
  const cover = post?.coverImage ?? post?.media?.find((item) => item?.media)?.media;
  return cover?.url ?? null;
}

export default function BlogCard({ post }) {
  const coverImage = resolveCover(post);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <Link to={`/blog/${post.slug}`} className="relative block aspect-[3/2] overflow-hidden bg-slate-100">
        {coverImage ? (
          <img
            src={coverImage}
            alt={post.coverImage?.altText ?? post.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent/10 via-blue-50 to-white text-accent">
            <span className="text-sm font-semibold uppercase tracking-[0.2em]">Gigvora Blog</span>
          </div>
        )}
        {post.featured ? (
          <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white shadow-soft">
            Featured
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-accent">
          {post.category ? (
            <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-accent">
              {post.category.name}
            </span>
          ) : null}
          {Array.isArray(post.tags)
            ? post.tags.slice(0, 2).map((tag) => (
                <span key={tag.id ?? tag.slug} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                  #{tag.name}
                </span>
              ))
            : null}
        </div>

        <Link to={`/blog/${post.slug}`} className="mt-4 text-xl font-semibold text-slate-900 transition group-hover:text-accent">
          {post.title}
        </Link>
        {post.excerpt ? <p className="mt-3 flex-1 text-sm text-slate-600">{post.excerpt}</p> : null}

        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" aria-hidden="true" />
            {formatDate(post.publishedAt ?? post.createdAt)}
          </span>
          {post.readingTimeMinutes ? (
            <span className="inline-flex items-center gap-2">
              <ClockIcon className="h-4 w-4" aria-hidden="true" />
              {post.readingTimeMinutes} min read
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
