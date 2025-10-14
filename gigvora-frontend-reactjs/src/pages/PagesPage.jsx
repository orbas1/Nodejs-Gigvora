import { useMemo, useState } from 'react';
import {
  ArrowTrendingUpIcon,
  BuildingLibraryIcon,
  GlobeAmericasIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import useSession from '../hooks/useSession.js';

const INITIAL_PAGES = [
  {
    id: 'gigvora-labs',
    name: 'Gigvora Labs',
    headline: 'Product innovation studio shaping the future of work.',
    admins: ['Lena Fields', 'Jordan Blake'],
    followers: 12840,
    engagementScore: 86,
    audience: ['Product', 'Future of Work', 'Innovation'],
    publishedCampaigns: 6,
    nextEvent: {
      title: 'Future of Work Observatory',
      date: '2024-09-12',
    },
    lastUpdated: '2024-08-28T09:00:00Z',
  },
  {
    id: 'northshore-creative',
    name: 'Northshore Creative',
    headline: 'Story-driven brand studio for venture-backed teams.',
    admins: ['Priya Das'],
    followers: 6210,
    engagementScore: 74,
    audience: ['Brand', 'Storytelling', 'Creative'],
    publishedCampaigns: 4,
    nextEvent: {
      title: 'Agency capabilities showcase',
      date: '2024-09-04',
    },
    lastUpdated: '2024-08-26T15:30:00Z',
  },
];

const PAGE_BLUEPRINTS = [
  {
    title: 'Employer brand page',
    description:
      'Position your culture, benefits, and leadership story with deep-dive modules and trust markers.',
    badge: 'Company',
  },
  {
    title: 'Agency showcase page',
    description: 'Curate service lines, client proof, and delivery rituals with conversion-ready CTAs.',
    badge: 'Agency',
  },
  {
    title: 'Community initiative page',
    description: 'Launch talent collectives, launchpad cohorts, or advocacy missions with publishing workflows.',
    badge: 'Program',
  },
];

function formatNumber(value) {
  if (value == null) {
    return '—';
  }
  return value.toLocaleString();
}

function formatDate(value) {
  if (!value) {
    return 'To be scheduled';
  }
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function PagesPage() {
  const { session, isAuthenticated } = useSession();
  const [pages, setPages] = useState(INITIAL_PAGES);
  const [draft, setDraft] = useState({
    name: '',
    headline: '',
    audience: '',
    blueprint: 'Employer brand page',
    visibility: 'private',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const authorisedRoles = useMemo(() => new Set(['company', 'agency']), []);
  const hasAccess = useMemo(() => {
    if (!isAuthenticated) {
      return false;
    }
    const memberships = session?.memberships ?? [];
    return memberships.some((role) => authorisedRoles.has(role));
  }, [authorisedRoles, isAuthenticated, session?.memberships]);

  const stats = useMemo(() => {
    const followerTotal = pages.reduce((total, page) => total + (page.followers ?? 0), 0);
    const avgEngagement =
      pages.length === 0
        ? 0
        : Math.round(pages.reduce((total, page) => total + (page.engagementScore ?? 0), 0) / pages.length);
    const activeCampaigns = pages.reduce((total, page) => total + (page.publishedCampaigns ?? 0), 0);
    return {
      followerTotal,
      avgEngagement,
      activeCampaigns,
    };
  }, [pages]);

  const headerActions = useMemo(() => {
    if (!hasAccess) {
      return [
        (
          <a
            key="request-access"
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
          >
            Request access
          </a>
        ),
      ];
    }
    return [
      (
        <button
          key="create-page"
          type="submit"
          form="page-create-form"
          disabled={isSubmitting || !draft.name || !draft.headline}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition hover:-translate-y-0.5 hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {isSubmitting ? 'Creating…' : 'Create a page'}
        </button>
      ),
      (
        <a
          key="analytics"
          href="#page-analytics"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
        >
          View analytics
        </a>
      ),
    ];
  }, [draft.headline, draft.name, hasAccess, isSubmitting]);

  const handleDraftChange = (event) => {
    const { name, value } = event.target;
    setDraft((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreatePage = (event) => {
    event.preventDefault();
    if (!draft.name.trim() || !draft.headline.trim()) {
      return;
    }
    setIsSubmitting(true);
    window.setTimeout(() => {
      const newPage = {
        id: `${draft.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        name: draft.name.trim(),
        headline: draft.headline.trim(),
        audience: draft.audience
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean),
        followers: 0,
        engagementScore: 0,
        admins: [session?.name ?? 'You'],
        publishedCampaigns: 0,
        nextEvent: null,
        lastUpdated: new Date().toISOString(),
        blueprint: draft.blueprint,
        visibility: draft.visibility,
      };
      setPages((prev) => [newPage, ...prev]);
      setDraft({ name: '', headline: '', audience: '', blueprint: draft.blueprint, visibility: draft.visibility });
      setIsSubmitting(false);
    }, 320);
  };

  return (
    <section className="relative overflow-hidden py-20">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_65%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-6xl px-6">
        <PageHeader
          eyebrow="Pages"
          title="Launch public pages that feel like a flagship site"
          description="Craft high-converting destinations for your brand, guilds, and initiatives with publishing, analytics, and admin controls built for scale."
          actions={headerActions}
        />

        {!hasAccess ? (
          <div className="mt-10 rounded-3xl border border-amber-200 bg-amber-50/70 p-6 text-sm text-amber-800 shadow-soft">
            <p className="font-semibold">Access limited to company and agency workspaces.</p>
            <p className="mt-2 text-amber-700">
              Switch to a company or agency dashboard to configure public pages, or ask your administrator to grant access.
            </p>
          </div>
        ) : null}

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(280px,1fr)]">
          <div className="space-y-8">
            <form
              id="page-create-form"
              onSubmit={handleCreatePage}
              className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft backdrop-blur"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Create new page</p>
                  <h2 className="text-xl font-semibold text-slate-900">Blueprint-driven creation</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Launch a branded page with role-based access, publishing workflows, and analytics baked in.
                  </p>
                </div>
                <SparklesIcon className="h-10 w-10 text-accent" />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="page-name" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Page name
                  </label>
                  <input
                    id="page-name"
                    name="name"
                    value={draft.name}
                    onChange={handleDraftChange}
                    placeholder="Gigvora Labs"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="page-headline" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Headline
                  </label>
                  <input
                    id="page-headline"
                    name="headline"
                    value={draft.headline}
                    onChange={handleDraftChange}
                    placeholder="Product innovation studio shaping the future of work."
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="page-blueprint" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Blueprint
                  </label>
                  <select
                    id="page-blueprint"
                    name="blueprint"
                    value={draft.blueprint}
                    onChange={handleDraftChange}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    {PAGE_BLUEPRINTS.map((blueprint) => (
                      <option key={blueprint.title} value={blueprint.title}>
                        {blueprint.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="page-visibility" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Visibility
                  </label>
                  <select
                    id="page-visibility"
                    name="visibility"
                    value={draft.visibility}
                    onChange={handleDraftChange}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="private">Private draft</option>
                    <option value="review">Internal review</option>
                    <option value="public">Public</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="page-audience" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Audience tags
                  </label>
                  <input
                    id="page-audience"
                    name="audience"
                    value={draft.audience}
                    onChange={handleDraftChange}
                    placeholder="Innovation, Future of work, Product"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  <p className="mt-1 text-xs text-slate-500">Separate tags with commas to power Explorer search.</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Publishing workflow enforces brand guardrails, accessibility checks, and privacy controls automatically.
                </p>
                <button
                  type="submit"
                  disabled={!hasAccess || isSubmitting || !draft.name || !draft.headline}
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition hover:-translate-y-0.5 hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  {isSubmitting ? 'Creating…' : 'Create page'}
                </button>
              </div>
            </form>

            <section id="page-analytics" className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-slate-900">Portfolio health</h2>
              <p className="mt-1 text-sm text-slate-600">
                Track reach, engagement, and program conversion across every page you manage.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[ 
                  {
                    title: 'Total followers',
                    value: formatNumber(stats.followerTotal),
                    description: 'Across every published page',
                    Icon: UserAvatar,
                  },
                  {
                    title: 'Avg engagement score',
                    value: `${stats.avgEngagement || 0}%`,
                    description: 'Quality and relevance benchmark',
                    Icon: ArrowTrendingUpIcon,
                  },
                  {
                    title: 'Active campaigns',
                    value: formatNumber(stats.activeCampaigns),
                    description: 'Live landing experiences',
                    Icon: MegaphoneIcon,
                  },
                ].map(({ title, value, description, Icon }) => (
                  <div key={title} className="rounded-2xl border border-slate-200 bg-white/80 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
                      </div>
                      {Icon === UserAvatar ? (
                        <UserAvatar
                          name={session?.name ?? title}
                          seed={session?.avatarSeed ?? title}
                          size="sm"
                          showGlow={false}
                        />
                      ) : (
                        <Icon className="h-10 w-10 text-accent" />
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                  <h3 className="text-base font-semibold text-slate-900">Operational safeguards</h3>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <ShieldCheckIcon className="mt-0.5 h-4 w-4 text-emerald-500" />
                      SOC 2 aligned privacy controls with mandatory reviewer sign-off.
                    </li>
                    <li className="flex items-start gap-2">
                      <ShieldCheckIcon className="mt-0.5 h-4 w-4 text-emerald-500" />
                      Automatic accessibility linting for colour contrast, landmarks, and semantics.
                    </li>
                    <li className="flex items-start gap-2">
                      <ShieldCheckIcon className="mt-0.5 h-4 w-4 text-emerald-500" />
                      Audience targeting policies respect opt-outs and consent preferences across devices.
                    </li>
                  </ul>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-accent/10 via-transparent to-transparent p-5">
                  <h3 className="text-base font-semibold text-slate-900">Blueprint catalogue</h3>
                  <ul className="mt-3 space-y-3 text-sm text-slate-600">
                    {PAGE_BLUEPRINTS.map((blueprint) => (
                      <li key={blueprint.title} className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{blueprint.title}</p>
                            <p className="mt-1 text-xs text-slate-500">{blueprint.description}</p>
                          </div>
                          <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
                            {blueprint.badge}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Active pages</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Monitor publishing velocity, campaign readiness, and upcoming events at a glance.
                  </p>
                </div>
                <BuildingLibraryIcon className="h-9 w-9 text-accent" />
              </div>
              <ul className="space-y-3">
                {pages.map((page) => (
                  <li key={page.id} className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-inner">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-base font-semibold text-slate-900">{page.name}</p>
                        <p className="mt-1 text-sm text-slate-600">{page.headline}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                          {page.audience?.map((tag) => (
                            <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <div>
                          <p className="font-semibold text-slate-900">Followers</p>
                          <p>{formatNumber(page.followers)}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">Engagement</p>
                          <p>{page.engagementScore}%</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">Campaigns</p>
                          <p>{page.publishedCampaigns}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">Next event</p>
                          <p>{formatDate(page.nextEvent?.date)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-accent/10 px-3 py-1 font-semibold uppercase tracking-wide text-accent">
                          {page.blueprint ?? 'Custom blueprint'}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                          Admins: {page.admins?.join(', ') ?? 'Unassigned'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent">
                          Manage page
                        </button>
                        <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent">
                          Schedule campaign
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-400">
                      Last updated {formatDate(page.lastUpdated)} • Visibility {page.visibility ? page.visibility : 'public'}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
              <h3 className="text-base font-semibold text-slate-900">Rollout timeline</h3>
              <ol className="mt-4 space-y-4 text-sm text-slate-600">
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">Draft</p>
                    <p className="text-xs text-slate-500">Define admins, brand colours, and modules.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">Review</p>
                    <p className="text-xs text-slate-500">Compliance, accessibility, and legal reviewers sign off.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">Launch</p>
                    <p className="text-xs text-slate-500">Connected to Explorer, CRM, and analytics dashboards.</p>
                  </div>
                </li>
              </ol>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-accent/10 to-transparent p-6 shadow-soft">
              <h3 className="text-base font-semibold text-slate-900">Explorer integration</h3>
              <p className="mt-2 text-sm text-slate-600">
                Pages surface in Explorer with geo-targeted modules and personalised CTAs for companies, agencies, and talent.
              </p>
              <div className="mt-4 space-y-3 text-xs text-slate-500">
                <div className="flex items-start gap-3">
                  <GlobeAmericasIcon className="mt-0.5 h-5 w-5 text-accent" />
                  <p>Automatic localisation for 28 regions with translation workflows.</p>
                </div>
                <div className="flex items-start gap-3">
                  <MegaphoneIcon className="mt-0.5 h-5 w-5 text-accent" />
                  <p>Cross-publish to campaigns, Launchpad cohorts, and partner showcases.</p>
                </div>
                <div className="flex items-start gap-3">
                  <ArrowTrendingUpIcon className="mt-0.5 h-5 w-5 text-accent" />
                  <p>Pipeline attribution and conversion scoring feed dashboards in real time.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
              <h3 className="text-base font-semibold text-slate-900">Admin roster</h3>
              <ul className="mt-3 space-y-3 text-sm text-slate-600">
                {pages.slice(0, 4).map((page) => (
                  <li key={`admin-${page.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={page.admins?.[0] ?? page.name} seed={page.admins?.[0] ?? page.name} size="xs" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{page.admins?.[0] ?? 'Unassigned'}</p>
                        <p className="text-xs text-slate-500">{page.name}</p>
                      </div>
                    </div>
                    <button className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent">
                      Manage roles
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
