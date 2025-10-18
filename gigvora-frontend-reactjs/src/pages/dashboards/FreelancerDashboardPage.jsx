import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowPathIcon,
  BriefcaseIcon,
  ChartBarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import useCachedResource from '../../hooks/useCachedResource.js';
import useFreelancerProfileOverview from '../../hooks/useFreelancerProfileOverview.js';
import { MENU_GROUPS, AVAILABLE_DASHBOARDS } from './freelancer/menuConfig.js';
import { DEFAULT_PROFILE } from './freelancer/sampleData.js';
import { fetchFreelancerDashboardOverview } from '../../services/freelancerDashboard.js';

function resolveFreelancerId(session) {
  if (!session) return null;
  const candidates = [session.freelancerId, session.id, session.userId];
  for (const value of candidates) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
}

function buildProfile(session, overview) {
  const base = { ...DEFAULT_PROFILE };
  if (!session) {
    return base;
  }
  const derivedName = session.name ?? [session.firstName, session.lastName].filter(Boolean).join(' ').trim();
  const displayName = derivedName || session.email || base.name;
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const avatarSeed = session.avatarSeed ?? displayName;
  const avatarUrl = session.avatarUrl ?? `https://avatar.vercel.sh/${encodeURIComponent(avatarSeed)}.svg?text=${initials}`;

  return {
    ...base,
    name: displayName,
    role: session.title ?? base.role,
    avatarUrl,
    followerCount: overview?.profile?.followerCount ?? base.followerCount,
    followerGoal: overview?.profile?.followerGoal ?? base.followerGoal,
    trustScore: overview?.profile?.trustScore ?? base.trustScore,
    rating: overview?.profile?.rating ?? base.rating,
    ratingCount: overview?.profile?.ratingCount ?? base.ratingCount,
    upcomingCount: overview?.upcomingSchedule?.length ?? base.upcomingCount,
  };
}

function SummaryCard({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return Number(value).toLocaleString();
}

function formatTrustScore(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${Math.round(Number(value))} / 100`;
}

export default function FreelancerDashboardPage() {
  const { session } = useSession();
  const freelancerId = useMemo(() => resolveFreelancerId(session), [session]);

  const overviewResource = useCachedResource(
    freelancerId ? `freelancer:${freelancerId}:dashboard-overview` : 'freelancer:dashboard-overview:pending',
    ({ signal }) => (freelancerId ? fetchFreelancerDashboardOverview(freelancerId, { signal }) : Promise.resolve(null)),
    { enabled: Boolean(freelancerId), dependencies: [freelancerId] },
  );

  const { overview: profileOverview } = useFreelancerProfileOverview({ userId: freelancerId, enabled: Boolean(freelancerId) });

  const profile = useMemo(() => buildProfile(session, profileOverview || overviewResource.data), [session, profileOverview, overviewResource.data]);

  const summaryMetrics = useMemo(
    () => [
      {
        id: 'followers',
        label: 'Followers',
        value: formatNumber(profile.followerCount),
        hint: profile.followerGoal ? `${formatNumber(profile.followerGoal)} goal` : 'Track your audience growth',
      },
      {
        id: 'trust-score',
        label: 'Trust score',
        value: formatTrustScore(profile.trustScore),
        hint: 'Stay above 80 for premium gigs',
      },
      {
        id: 'rating',
        label: 'Rating',
        value: profile.rating != null ? `${Number(profile.rating).toFixed(1)} / 5` : '—',
        hint: profile.ratingCount ? `${formatNumber(profile.ratingCount)} reviews` : 'Collect more testimonials',
      },
      {
        id: 'upcoming',
        label: 'Upcoming commitments',
        value: formatNumber(profile.upcomingCount),
        hint: 'Synced from planner and inbox',
      },
    ],
    [profile],
  );

  const navigationTiles = useMemo(() => {
    return MENU_GROUPS.flatMap((group) => group.items)
      .filter((item) => item.href)
      .slice(0, 8)
      .map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        href: item.href,
        Icon: item.icon ?? SquaresIcon,
      }));
  }, []);

  const dashboards = useMemo(() => AVAILABLE_DASHBOARDS, []);

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title="Freelancer mission control"
      subtitle="Signals, revenue, and relationships"
      description="Keep your Gigvora career in flow with a personalised control centre for operations, growth, and support."
      menuSections={MENU_GROUPS}
      availableDashboards={dashboards}
      activeMenuItem="profile-overview"
    >
      <div className="mx-auto w-full max-w-6xl space-y-10 px-6 py-10">
        <section className="rounded-4xl border border-slate-200 bg-gradient-to-br from-white via-white to-accentSoft/40 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <img src={profile.avatarUrl} alt={profile.name} className="h-16 w-16 rounded-2xl border border-white shadow-md" />
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">{profile.name}</h1>
                <p className="text-sm text-slate-500">{profile.role}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold uppercase tracking-wide">
                <ChartBarIcon className="h-4 w-4 text-accent" /> Performance synced
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold uppercase tracking-wide">
                <ArrowPathIcon className="h-4 w-4 text-accent" /> Autorefresh every hour
              </span>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryMetrics.map((metric) => (
              <SummaryCard key={metric.id} label={metric.label} value={metric.value} hint={metric.hint} />
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Workspace highlights</h2>
              <p className="mt-1 text-sm text-slate-500">
                Capture the latest activity across your planner, pipeline, and live engagements.
              </p>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {(overviewResource.data?.activityFeed ?? []).slice(0, 4).map((item) => (
                  <li key={item.id || item.label} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-3 py-2">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-accent" />
                    <div>
                      <p className="font-semibold text-slate-800">{item.label}</p>
                      {item.description ? <p className="text-xs text-slate-500">{item.description}</p> : null}
                    </div>
                  </li>
                ))}
                {!(overviewResource.data?.activityFeed?.length > 0) ? (
                  <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
                    Activity updates will appear once your workspace starts logging planner tasks, proposals, and mentor feedback.
                  </li>
                ) : null}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Quick launch</h2>
              <p className="mt-1 text-sm text-slate-500">Jump directly into the dashboards you use most.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {navigationTiles.map((tile) => (
                  <Link
                    key={tile.id}
                    to={tile.href}
                    className="flex h-full flex-col gap-2 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-accentSoft/30 p-4 transition hover:border-accent hover:shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <tile.Icon className="h-5 w-5 text-accent" />
                      <span className="font-semibold text-slate-900">{tile.name}</span>
                    </div>
                    {tile.description ? <p className="text-sm text-slate-500">{tile.description}</p> : null}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Pipeline outlook</h2>
              <p className="mt-1 text-sm text-slate-500">Stay ahead of hiring conversations and delivery milestones.</p>
              <ul className="mt-4 space-y-3">
                {(overviewResource.data?.pipeline ?? []).slice(0, 5).map((opportunity) => (
                  <li key={opportunity.id || opportunity.title} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm">
                    <p className="font-semibold text-slate-800">{opportunity.title}</p>
                    <p className="text-xs text-slate-500">{opportunity.stage ?? 'Pipeline'}</p>
                  </li>
                ))}
                {!(overviewResource.data?.pipeline?.length > 0) ? (
                  <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                    Sync opportunities from the pipeline HQ to monitor progress here.
                  </li>
                ) : null}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Mentors & partners</h2>
              <p className="mt-1 text-sm text-slate-500">Collaborators backing your growth across Gigvora.</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {(overviewResource.data?.supportNetwork ?? []).slice(0, 5).map((contact) => (
                  <li key={contact.id || contact.email} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-3 py-2">
                    <UserGroupIcon className="mt-1 h-5 w-5 text-accent" />
                    <div>
                      <p className="font-semibold text-slate-800">{contact.name}</p>
                      {contact.role ? <p className="text-xs text-slate-500">{contact.role}</p> : null}
                    </div>
                  </li>
                ))}
                {!(overviewResource.data?.supportNetwork?.length > 0) ? (
                  <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                    Invite mentors and collaborators to unlock shared planning and review workflows.
                  </li>
                ) : null}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Recommended next steps</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {((overviewResource.data?.recommendedActions ?? []) || []).slice(0, 4).map((action) => (
                  <li key={action.id || action.label} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-3 py-2">
                    <BriefcaseIcon className="mt-1 h-5 w-5 text-accent" />
                    <div>
                      <p className="font-semibold text-slate-800">{action.label}</p>
                      {action.description ? <p className="text-xs text-slate-500">{action.description}</p> : null}
                    </div>
                  </li>
                ))}
                {!(overviewResource.data?.recommendedActions?.length > 0) ? (
                  <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                    Optimise your profile and connect workflows to receive smart recommendations here.
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function SquaresIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <rect x="2" y="2" width="6" height="6" rx="2" className="fill-current opacity-80" />
      <rect x="12" y="2" width="6" height="6" rx="2" className="fill-current opacity-60" />
      <rect x="2" y="12" width="6" height="6" rx="2" className="fill-current opacity-60" />
      <rect x="12" y="12" width="6" height="6" rx="2" className="fill-current opacity-80" />
    </svg>
  );
}
