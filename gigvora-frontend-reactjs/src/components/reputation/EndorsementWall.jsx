import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  HandThumbUpIcon,
  ShareIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { ChatBubbleLeftRightIcon, StarIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import DataStatus from '../DataStatus.jsx';
import analytics from '../../services/analytics.js';

const FALLBACK_ENDORSEMENTS = [
  {
    id: 'endorsement-1',
    quote:
      'This partnership transformed our member experience. Delivery sprints landed on time, stakeholders stayed aligned, and the final journey exceeded executive expectations.',
    clientName: 'Elena Duarte',
    clientRole: 'Chief Product Officer',
    company: 'Lumina Health',
    rating: 5,
    tags: ['Transformation', 'Healthcare'],
    createdAt: '2024-03-14T10:00:00.000Z',
    highlight: true,
    impact: 'Flagship transformation',
    persona: 'client',
  },
  {
    id: 'endorsement-2',
    quote:
      'Structured research, commercial insight, and collaborative leadership accelerated our go-to-market by months. We now have a repeatable playbook.',
    clientName: 'Michael Stone',
    clientRole: 'Managing Partner',
    company: 'Atlas Ventures',
    rating: 4.8,
    tags: ['GTM', 'Strategy'],
    createdAt: '2024-02-28T09:15:00.000Z',
    persona: 'mentor',
  },
  {
    id: 'endorsement-3',
    quote:
      'Partnering on the climate tech pod delivered investor-ready storytelling with credible metrics. Collaboration felt effortless even with distributed teams.',
    clientName: 'Priya Patel',
    clientRole: 'Programme Director',
    company: 'Northwind Labs',
    rating: 4.9,
    tags: ['Climate', 'Collaboration'],
    createdAt: '2024-04-04T14:42:00.000Z',
    persona: 'teammate',
  },
  {
    id: 'endorsement-4',
    quote:
      'Mentorship cadence unlocked confidence for our design leads. Feedback loops were thoughtful, inclusive, and grounded in enterprise realities.',
    clientName: 'Rafael Costa',
    clientRole: 'Design Lead',
    company: 'Helios Energy',
    rating: 4.7,
    tags: ['Mentorship', 'Design'],
    createdAt: '2024-01-22T12:10:00.000Z',
    persona: 'mentor',
  },
];

function normaliseEndorsement(raw, index) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const quote = raw.quote ?? raw.comment ?? raw.testimonial ?? raw.body ?? '';
  if (!quote.trim()) {
    return null;
  }
  const tags = Array.isArray(raw.tags)
    ? raw.tags
    : raw.focus
    ? [raw.focus]
    : raw.weight
    ? [raw.weight]
    : raw.categories;
  const createdAt = raw.createdAt ?? raw.publishedAt ?? raw.lastInteractionAt ?? raw.updatedAt ?? null;
  const rating = raw.rating ?? raw.score ?? null;
  return {
    id: `${raw.id ?? raw.testimonialId ?? raw.referenceId ?? `endorsement-${index}`}`,
    quote,
    clientName: raw.clientName ?? raw.client ?? raw.author ?? raw.reviewer ?? 'Confidential partner',
    clientRole: raw.clientRole ?? raw.relationship ?? raw.title ?? null,
    company: raw.company ?? raw.organisation ?? raw.organization ?? null,
    rating: rating != null ? Number.parseFloat(rating) : null,
    tags: Array.isArray(tags) ? tags.filter((tag) => typeof tag === 'string' && tag.trim().length) : [],
    createdAt,
    persona: raw.persona ?? raw.audience ?? null,
    highlight: Boolean(raw.highlight ?? raw.featured),
    impact: raw.impact ?? raw.weight ?? null,
    shareUrl: raw.shareUrl ?? raw.publicUrl ?? null,
    status: raw.status ?? 'published',
  };
}

function flattenEndorsements(source) {
  if (!source) {
    return FALLBACK_ENDORSEMENTS;
  }
  const list = [];
  if (Array.isArray(source)) {
    list.push(...source);
  } else {
    const { featured, recent, collection, testimonials } = source;
    if (featured) {
      list.push({ ...featured, highlight: true });
    }
    if (Array.isArray(recent)) {
      list.push(...recent);
    }
    if (Array.isArray(collection)) {
      list.push(...collection);
    }
    if (Array.isArray(testimonials)) {
      list.push(...testimonials);
    }
  }
  if (!list.length) {
    return FALLBACK_ENDORSEMENTS;
  }
  const parsed = list
    .map((item, index) => normaliseEndorsement(item, index))
    .filter(Boolean);
  return parsed.length ? parsed : FALLBACK_ENDORSEMENTS;
}

function sortEndorsements(items, sort) {
  const copy = [...items];
  switch (sort) {
    case 'rating':
      copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    case 'impact':
      copy.sort((a, b) => {
        const highlightScore = (value) => (value.highlight ? 1 : 0);
        const aScore = highlightScore(a);
        const bScore = highlightScore(b);
        if (bScore !== aScore) {
          return bScore - aScore;
        }
        return (b.rating ?? 0) - (a.rating ?? 0);
      });
      break;
    default:
      copy.sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));
      break;
  }
  return copy;
}

function formatDate(value) {
  if (!value) {
    return 'Recently updated';
  }
  try {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

export default function EndorsementWall({
  testimonials,
  shareLinks,
  freelancer,
  loading,
  error,
  fromCache,
  lastUpdated,
  onRefresh,
}) {
  const endorsements = useMemo(() => flattenEndorsements(testimonials), [testimonials]);
  const categories = useMemo(() => {
    const set = new Set();
    endorsements.forEach((endorsement) => {
      endorsement.tags?.forEach((tag) => set.add(tag));
      if (endorsement.persona) {
        set.add(endorsement.persona);
      }
      if (endorsement.highlight) {
        set.add('Featured');
      }
    });
    return ['All', ...Array.from(set)];
  }, [endorsements]);

  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('recent');
  const [shareFeedback, setShareFeedback] = useState(null);
  const [sharePending, setSharePending] = useState(false);

  const filtered = useMemo(() => {
    if (filter === 'All') {
      return endorsements;
    }
    return endorsements.filter((endorsement) => {
      if (filter === 'Featured') {
        return endorsement.highlight;
      }
      if (endorsement.tags?.includes(filter)) {
        return true;
      }
      return endorsement.persona === filter;
    });
  }, [endorsements, filter]);

  const sorted = useMemo(() => sortEndorsements(filtered, sort), [filtered, sort]);
  const hero = sorted.find((item) => item.highlight) ?? sorted[0];
  const rest = sorted.filter((item) => item !== hero);

  const shareUrl = shareLinks?.[0]?.url ?? hero?.shareUrl ?? null;

  const handleShare = async () => {
    if (!shareUrl) {
      setShareFeedback('Generate a shareable link in settings to broadcast this wall.');
      return;
    }
    setSharePending(true);
    setShareFeedback(null);
    const sharePayload = {
      title: `${freelancer?.name ?? 'Gigvora talent'} · Endorsement wall`,
      text: 'Discover verified endorsements and trust signals.',
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback('Link copied to clipboard. Paste into your favourite channels.');
      } else {
        setShareFeedback(shareUrl);
      }
      analytics.track('endorsement_wall_shared', { url: shareUrl });
    } catch (shareError) {
      setShareFeedback(shareError?.message ?? 'Unable to share. Copy the link manually.');
    } finally {
      setSharePending(false);
    }
  };

  return (
    <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-soft">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent/80">Endorsement wall</p>
          <h3 className="text-2xl font-semibold text-slate-900">Social proof engineered for trust</h3>
          <p className="max-w-2xl text-sm text-slate-600">
            Filters, curated highlights, and persona signals showcase credibility to executives, investors, and mentors. Designed
            to mirror the warmth of LinkedIn testimonials with the structure of enterprise case studies.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
            <AdjustmentsHorizontalIcon className="h-4 w-4 text-accent" aria-hidden="true" />
            {categories.length - 1} filters
          </div>
          <button
            type="button"
            onClick={handleShare}
            disabled={sharePending}
            className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {sharePending ? <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShareIcon className="h-4 w-4" aria-hidden="true" />}
            Share wall
          </button>
          {shareFeedback ? <span className="text-xs text-slate-500">{shareFeedback}</span> : null}
        </div>
      </header>

      <div className="mt-6">
        <DataStatus
          loading={loading}
          error={error}
          fromCache={fromCache}
          lastUpdated={lastUpdated}
          onRefresh={onRefresh}
          statusLabel="Live endorsements"
        >
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setFilter(category)}
                className={clsx(
                  'rounded-full border px-3 py-1 font-semibold transition',
                  filter === category
                    ? 'border-accent bg-accent text-white shadow-sm'
                    : 'border-slate-200 bg-white hover:border-accent/60 hover:text-accent',
                )}
              >
                {category}
              </button>
            ))}
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="ml-auto rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 focus:border-accent focus:outline-none"
            >
              <option value="recent">Most recent</option>
              <option value="rating">Highest rating</option>
              <option value="impact">Impact highlights</option>
            </select>
          </div>

          {hero ? (
            <article className="mt-6 grid gap-6 rounded-4xl border border-accent/30 bg-gradient-to-br from-accent/10 via-white to-emerald-50 p-6 lg:grid-cols-[1.2fr,0.8fr]">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/50 bg-white px-3 py-1 text-xs font-semibold text-accent">
                  <SparklesIcon className="h-4 w-4" aria-hidden="true" />
                  Featured highlight
                </div>
                <p className="text-lg font-semibold text-slate-900">“{hero.quote}”</p>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="font-semibold text-slate-900">{hero.clientName}</span>
                  {hero.clientRole ? <span>• {hero.clientRole}</span> : null}
                  {hero.company ? <span>• {hero.company}</span> : null}
                  {hero.createdAt ? <span>• {formatDate(hero.createdAt)}</span> : null}
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  {hero.tags?.map((tag) => (
                    <span key={`${hero.id}-${tag}`} className="rounded-full border border-accent/40 bg-white/70 px-3 py-1 text-accent">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-between rounded-3xl border border-white/70 bg-white/80 p-4 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <HandThumbUpIcon className="h-5 w-5 text-accent" aria-hidden="true" />
                    Stakeholder impact
                  </div>
                  <p className="text-sm text-slate-600">
                    {hero.impact ?? 'Elevated executive confidence across programme stakeholders with proactive communication and measurable wins.'}
                  </p>
                </div>
                {hero.rating ? (
                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-amber-600">
                    <StarIcon className="h-5 w-5" aria-hidden="true" /> {hero.rating.toFixed(1)} / 5
                  </div>
                ) : null}
              </div>
            </article>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rest.map((endorsement) => (
              <article
                key={endorsement.id}
                className={clsx(
                  'flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg',
                  endorsement.highlight && 'border-accent/60 shadow-accent/10',
                )}
              >
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">“{endorsement.quote}”</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-900">{endorsement.clientName}</span>
                    {endorsement.clientRole ? <span>• {endorsement.clientRole}</span> : null}
                    {endorsement.company ? <span>• {endorsement.company}</span> : null}
                    {endorsement.createdAt ? <span>• {formatDate(endorsement.createdAt)}</span> : null}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    {endorsement.tags?.map((tag) => (
                      <span key={`${endorsement.id}-${tag}`} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <ChatBubbleLeftRightIcon className="h-4 w-4 text-accent" aria-hidden="true" />
                    {endorsement.persona ? endorsement.persona : 'Partner'} review
                  </span>
                  {endorsement.rating ? (
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <StarIcon className="h-4 w-4" aria-hidden="true" />
                      {endorsement.rating.toFixed(1)}
                    </span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </DataStatus>
      </div>
    </section>
  );
}

EndorsementWall.propTypes = {
  testimonials: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  shareLinks: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string,
      label: PropTypes.string,
    }),
  ),
  freelancer: PropTypes.shape({
    name: PropTypes.string,
  }),
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.shape({ message: PropTypes.string })]),
  fromCache: PropTypes.bool,
  lastUpdated: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string, PropTypes.number]),
  onRefresh: PropTypes.func,
};

EndorsementWall.defaultProps = {
  testimonials: undefined,
  shareLinks: undefined,
  freelancer: undefined,
  loading: false,
  error: null,
  fromCache: false,
  lastUpdated: undefined,
  onRefresh: undefined,
};
