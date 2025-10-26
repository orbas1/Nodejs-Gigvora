import { useMemo } from 'react';
import { ArrowTopRightOnSquareIcon, EnvelopeIcon, SparklesIcon } from '@heroicons/react/24/outline';

function initials(firstName = '', lastName = '') {
  const firstInitial = firstName.trim().charAt(0).toUpperCase();
  const lastInitial = lastName.trim().charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}` || 'GV';
}

function normaliseUrl(url) {
  if (!url) {
    return null;
  }
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.toString();
  } catch (error) {
    return null;
  }
}

export default function ContentAuthorCard({ author = {}, headline, highlight, postCount }) {
  const avatarUrl = author.avatar?.url ?? author.profileImage?.url ?? null;
  const linkedInUrl = normaliseUrl(author.linkedinUrl ?? author.social?.linkedin);
  const websiteUrl = normaliseUrl(author.website ?? author.social?.website);
  const contactEmail = author.email ?? author.contactEmail;

  const expertise = useMemo(() => {
    if (Array.isArray(author.expertise) && author.expertise.length > 0) {
      return author.expertise.map((item) => (typeof item === 'string' ? item : item?.name)).filter(Boolean).slice(0, 4);
    }
    if (author.primaryDiscipline) {
      return [author.primaryDiscipline];
    }
    if (author.role) {
      return [author.role];
    }
    return [];
  }, [author]);

  const safePostCount = postCount ?? author.postCount ?? author.stats?.publishedPosts ?? null;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-sm">
      <div className="relative h-32 bg-gradient-to-br from-accent via-indigo-500 to-slate-900">
        <div className="absolute inset-0 opacity-20" aria-hidden>
          <svg className="h-full w-full" viewBox="0 0 400 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                <stop offset="100%" stopColor="rgba(148,163,184,0.2)" />
              </linearGradient>
            </defs>
            <path d="M0 50H400 M0 100H400 M0 150H400 M50 0V200 M100 0V200 M150 0V200 M200 0V200 M250 0V200 M300 0V200 M350 0V200" stroke="url(#gridGradient)" strokeWidth="0.6" />
          </svg>
        </div>
        <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
          <SparklesIcon className="h-4 w-4" />
          Contributor spotlight
        </div>
      </div>
      <div className="-mt-12 flex flex-col gap-6 px-6 pb-6">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${author.firstName ?? ''} ${author.lastName ?? ''}`.trim() || 'Author avatar'}
              className="h-20 w-20 rounded-3xl object-cover shadow-lg"
              loading="lazy"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-accent/10 text-xl font-semibold text-accent">
              {initials(author.firstName, author.lastName)}
            </span>
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{headline ?? 'Author'}</p>
            <h3 className="mt-1 text-2xl font-semibold text-slate-900">
              {author.firstName} {author.lastName}
            </h3>
            {author.role ? <p className="text-sm text-slate-500">{author.role}</p> : null}
          </div>
        </div>
        {highlight ? <p className="text-sm leading-relaxed text-slate-600">“{highlight}”</p> : null}
        {expertise.length ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Focus areas</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {expertise.map((item) => (
                <span key={item} className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          {safePostCount ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">{safePostCount}+ published playbooks</span>
          ) : null}
          {author.location ? <span>{author.location}</span> : null}
        </div>
        <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
          {linkedInUrl ? (
            <a
              href={linkedInUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 transition hover:border-accent hover:text-accent"
            >
              Connect on LinkedIn
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </a>
          ) : null}
          {websiteUrl ? (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 transition hover:border-accent hover:text-accent"
            >
              Portfolio
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </a>
          ) : null}
          {contactEmail ? (
            <a
              href={`mailto:${contactEmail}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 transition hover:border-accent hover:text-accent"
            >
              <EnvelopeIcon className="h-4 w-4" />
              Drop a note
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
