import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const TYPE_CONFIG = {
  gigs: {
    label: 'Gigs',
    pillBg: 'bg-emerald-500/15',
    pillText: 'text-emerald-500',
    cardBorder: 'border-emerald-500/20',
    cardShadow: 'shadow-[0_25px_50px_-12px_rgba(16,185,129,0.35)]',
    accent: 'bg-emerald-500',
    ctaLabel: 'Review gig brief',
    searchCategory: 'gigs',
  },
  mentorships: {
    label: 'Mentorships',
    pillBg: 'bg-sky-500/15',
    pillText: 'text-sky-500',
    cardBorder: 'border-sky-500/20',
    cardShadow: 'shadow-[0_25px_50px_-12px_rgba(14,165,233,0.35)]',
    accent: 'bg-sky-500',
    ctaLabel: 'Meet the mentor',
    searchCategory: 'mentorships',
  },
  launchpads: {
    label: 'Launchpads',
    pillBg: 'bg-purple-500/15',
    pillText: 'text-purple-500',
    cardBorder: 'border-purple-500/20',
    cardShadow: 'shadow-[0_25px_50px_-12px_rgba(168,85,247,0.35)]',
    accent: 'bg-purple-500',
    ctaLabel: 'Enter launchpad',
    searchCategory: 'launchpads',
  },
  campaigns: {
    label: 'Campaigns',
    pillBg: 'bg-amber-500/15',
    pillText: 'text-amber-500',
    cardBorder: 'border-amber-500/20',
    cardShadow: 'shadow-[0_25px_50px_-12px_rgba(245,158,11,0.35)]',
    accent: 'bg-amber-500',
    ctaLabel: 'Join the campaign',
    searchCategory: 'campaigns',
  },
  volunteering: {
    label: 'Volunteering',
    pillBg: 'bg-rose-500/15',
    pillText: 'text-rose-500',
    cardBorder: 'border-rose-500/20',
    cardShadow: 'shadow-[0_25px_50px_-12px_rgba(244,63,94,0.35)]',
    accent: 'bg-rose-500',
    ctaLabel: 'Support this mission',
    searchCategory: 'volunteering',
  },
};

const DEFAULT_TYPE_KEY = 'gigs';

const FALLBACK_THEME = {
  pillBg: 'bg-slate-900/10',
  pillText: 'text-slate-200',
  cardBorder: 'border-slate-800/60',
  cardShadow: 'shadow-lg',
  accent: 'bg-slate-700',
  ctaLabel: 'View on Explorer',
};

const FALLBACK_CARDS = [
  {
    type: 'gigs',
    title: 'Spin up a specialist pod in under 10 minutes',
    description: 'Drop your brief and match with vetted operators ready to plug into your roadmap this week.',
    ctaLabel: 'Browse gigs',
  },
  {
    type: 'mentorships',
    title: 'Book a mentor for a lightning strategy sprint',
    description: 'Pair with senior operators who have solved the exact challenge you are facing right now.',
    ctaLabel: 'Explore mentors',
  },
  {
    type: 'launchpads',
    title: 'Co-create your next product launch',
    description: 'Collaborate with launch strategists and creatives that have shipped dozens of GTM motions.',
    ctaLabel: 'See launchpads',
  },
  {
    type: 'campaigns',
    title: 'Scale a campaign with fractional talent',
    description: 'Spin up flexible teams that can own every channel from lifecycle to paid social.',
    ctaLabel: 'View live campaigns',
  },
  {
    type: 'volunteering',
    title: 'Give your skills to a mission that matters',
    description: 'Offer pro-bono hours to nonprofits and grassroots orgs making real-world impact.',
    ctaLabel: 'Find volunteering crews',
  },
];

function normaliseTypeKey(type) {
  if (!type || typeof type !== 'string') return null;
  return type.trim().toLowerCase();
}

function getTypeTheme(typeKey) {
  if (!typeKey) {
    return {
      label: 'Showcase',
      ...FALLBACK_THEME,
    };
  }

  const key = normaliseTypeKey(typeKey);
  if (key && TYPE_CONFIG[key]) {
    return TYPE_CONFIG[key];
  }

  const readableLabel = typeKey[0]?.toUpperCase() + typeKey.slice(1);
  return {
    label: readableLabel || 'Showcase',
    ...FALLBACK_THEME,
    searchCategory: key ?? typeKey,
  };
}

function getInitials(name) {
  if (!name) return 'GV';
  const parts = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) return 'GV';
  return parts
    .map((segment) => segment[0].toUpperCase())
    .join('');
}

function resolveDate(input) {
  if (!input) return null;
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatPublishedDistance(date) {
  if (!date) return 'Just launched';
  try {
    return `${formatDistanceToNow(date, { addSuffix: true })}`;
  } catch (error) {
    return 'Recently updated';
  }
}

export function ExplorerShowcaseSection({ loading, error, creations = [] }) {
  const groupedCreations = useMemo(() => {
    const collection = new Map();
    if (!Array.isArray(creations)) {
      return collection;
    }

    creations.forEach((item) => {
      const key = normaliseTypeKey(item?.type ?? item?.category);
      if (!key) return;
      if (!collection.has(key)) {
        collection.set(key, []);
      }
      collection.get(key).push(item);
    });

    collection.forEach((items, key) => {
      collection.set(
        key,
        items
          .filter((entry) => entry?.title || entry?.name)
          .sort((a, b) => {
            const dateA = resolveDate(a?.publishedAt ?? a?.updatedAt ?? a?.createdAt);
            const dateB = resolveDate(b?.publishedAt ?? b?.updatedAt ?? b?.createdAt);
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateB.getTime() - dateA.getTime();
          }),
      );
    });

    return collection;
  }, [creations]);

  const availableTypeKeys = useMemo(() => {
    if (groupedCreations.size === 0) {
      return Object.keys(TYPE_CONFIG);
    }
    return Array.from(groupedCreations.keys());
  }, [groupedCreations]);

  const [activeType, setActiveType] = useState(DEFAULT_TYPE_KEY);

  useEffect(() => {
    if (!availableTypeKeys.length) {
      if (activeType !== DEFAULT_TYPE_KEY) {
        setActiveType(DEFAULT_TYPE_KEY);
      }
      return;
    }
    if (!availableTypeKeys.includes(activeType)) {
      setActiveType(availableTypeKeys[0]);
    }
  }, [availableTypeKeys, activeType]);

  const activeItems = groupedCreations.get(activeType) ?? [];
  const typeConfig = getTypeTheme(activeType);

  const placeholderCards = useMemo(
    () =>
      FALLBACK_CARDS.filter((card) => card.type === activeType).length
        ? FALLBACK_CARDS.filter((card) => card.type === activeType)
        : FALLBACK_CARDS.filter((card) => !availableTypeKeys.length || availableTypeKeys.includes(card.type)),
    [activeType, availableTypeKeys],
  );

  const showFallback = !loading && !error && activeItems.length === 0;

  return (
    <section className="bg-slate-950 py-20 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Explorer showcase</p>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">Discover what the community is shipping</h2>
            <p className="text-base text-slate-300">
              Swipe through live creations to see how teams are collaborating in real-time. Filter by stream to find the momentum
              that inspires you to jump in.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableTypeKeys.map((typeKey) => {
              const config = getTypeTheme(typeKey ?? DEFAULT_TYPE_KEY);
              const isActive = typeKey === activeType;
              return (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() => setActiveType(typeKey)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                    isActive
                      ? `${config.pillBg} ${config.pillText}`
                      : 'bg-slate-900/60 text-slate-300 hover:bg-slate-900/80'
                  }`}
                >
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

        {error ? (
          <div className="mt-8 rounded-3xl border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-200">
            Unable to reach Explorer right now. Try refreshing in a moment.
          </div>
        ) : null}

        <div className="mt-10 overflow-hidden">
          <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4">
            {loading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="snap-start min-w-[20rem] flex-1 rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6"
                  >
                    <div className="flex h-full animate-pulse flex-col gap-4">
                      <div className="h-5 w-24 rounded-full bg-slate-800/80" />
                      <div className="h-6 w-3/4 rounded-full bg-slate-800/80" />
                      <div className="space-y-2">
                        <div className="h-4 w-full rounded-full bg-slate-800/80" />
                        <div className="h-4 w-5/6 rounded-full bg-slate-800/80" />
                        <div className="h-4 w-2/3 rounded-full bg-slate-800/80" />
                      </div>
                      <div className="mt-auto flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-800/80" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-1/2 rounded-full bg-slate-800/80" />
                          <div className="h-3 w-1/3 rounded-full bg-slate-800/80" />
                        </div>
                      </div>
                      <div className="h-10 w-full rounded-full bg-slate-800/80" />
                    </div>
                  </div>
                ))
              : null}

            {!loading && !showFallback
              ? activeItems.map((item) => {
                  const key = item.id ?? item.slug ?? `${item.type}-${item.title}`;
                  const ownerName =
                    item.ownerName ?? item.owner?.name ?? item.authorName ?? item.creatorName ?? 'Gigvora member';
                  const publishedDate = resolveDate(item.publishedAt ?? item.updatedAt ?? item.createdAt);
                  const linkTarget =
                    item.deepLink ??
                    item.url ??
                    item.href ??
                    `/search?category=${encodeURIComponent(typeConfig.searchCategory ?? typeConfig.label ?? 'explorer')}`;

                  return (
                    <article
                      key={key}
                      className={`snap-start min-w-[20rem] flex-1 rounded-3xl border ${
                        typeConfig.cardBorder
                      } bg-slate-900/70 p-6 shadow-lg transition hover:-translate-y-1 ${typeConfig.cardShadow}`}
                    >
                      <div className="flex h-full flex-col">
                        <div className="space-y-4">
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${typeConfig.pillBg} ${typeConfig.pillText}`}>
                            {typeConfig.label}
                          </span>
                          <h3 className="text-xl font-semibold text-white">
                            {item.title ?? item.name ?? 'Featured creation'}
                          </h3>
                          <p className="text-sm text-slate-300">
                            {item.summary ??
                              item.description ??
                              'Step inside to explore timelines, collaborators, and the outcomes the team is unlocking.'}
                          </p>
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-full ${typeConfig.pillBg} ${typeConfig.pillText} text-sm font-semibold`}>
                            {getInitials(ownerName)}
                          </div>
                          <div className="text-sm">
                            <p className="font-semibold text-white">{ownerName}</p>
                            <p className="text-xs text-slate-400">{formatPublishedDistance(publishedDate)}</p>
                          </div>
                        </div>

                        <Link
                          to={linkTarget}
                          className={`mt-6 inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${typeConfig.accent} hover:brightness-110`}
                        >
                          {typeConfig.ctaLabel ?? 'View details'}
                        </Link>
                      </div>
                    </article>
                  );
                })
              : null}

            {showFallback
              ? placeholderCards.map((card, index) => {
                  const config = getTypeTheme(card.type ?? activeType);
                  const linkTarget = `/search?category=${encodeURIComponent(config.searchCategory ?? card.type)}`;
                  return (
                    <article
                      key={`fallback-${card.type}-${index}`}
                      className={`snap-start min-w-[20rem] flex-1 rounded-3xl border ${
                        config.cardBorder
                      } bg-slate-900/70 p-6 shadow-lg transition hover:-translate-y-1 ${config.cardShadow}`}
                    >
                      <div className="flex h-full flex-col">
                        <div className="space-y-4">
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${config.pillBg} ${config.pillText}`}>
                            {config.label}
                          </span>
                          <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                          <p className="text-sm text-slate-300">{card.description}</p>
                        </div>
                        <div className="mt-auto">
                          <Link
                            to={linkTarget}
                            className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-2 text-sm font-semibold text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${config.accent} hover:brightness-110`}
                          >
                            {card.ctaLabel}
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })
              : null}
          </div>
        </div>
      </div>
    </section>
  );
}
