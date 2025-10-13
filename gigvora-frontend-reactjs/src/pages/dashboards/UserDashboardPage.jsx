import { useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useCachedResource from '../../hooks/useCachedResource.js';
import DataStatus from '../../components/DataStatus.jsx';
import { fetchUserDashboard } from '../../services/userDashboard.js';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

const DEFAULT_USER_ID = 1;
const availableDashboards = ['user', 'freelancer', 'agency', 'company', 'headhunter'];

function formatNumber(value) {
  if (value == null) return '0';
  const formatter = new Intl.NumberFormat('en-GB');
  return formatter.format(Number(value));
}

function formatPercent(value, fractionDigits = 1) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return formatter.format(Number(value) / 100);
}

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(Number(value));
}

function formatChangeBadge(change, { suffix = '' } = {}) {
  if (!change) {
    return { label: 'Stable', tone: 'neutral' };
  }
  const direction = change.direction;
  const symbol = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '→';
  const reference = change.absolute ?? change.percent;
  const value = reference == null ? null : Math.abs(Number(reference)).toFixed(1);
  return {
    label: value == null ? 'Stable' : `${symbol} ${value}${suffix}`,
    tone: direction === 'down' ? 'negative' : direction === 'up' ? 'positive' : 'neutral',
  };
}

function formatMinutesToHours(minutes) {
  if (!minutes || Number.isNaN(Number(minutes))) return '0m';
  const total = Math.max(0, Math.round(Number(minutes)));
  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  if (hours === 0) return `${remainder}m`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

function formatStatus(status) {
  if (!status) return 'Unknown';
  return status
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function buildProfileCard(data, summary) {
  const profile = data?.profile ?? {};
  const user = profile.user ?? {};
  const fallbackName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const name = profile.name ?? (fallbackName || 'Gigvora member');
  const headline = profile.headline || profile.missionStatement || 'Professional member';
  const initials = (profile.initials || name)
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const availability = profile.availability?.status ? formatStatus(profile.availability.status) : null;
  const launchpadStatus = profile.launchpadEligibility?.status === 'eligible' ? 'Launchpad ready' : null;
  const badges = [
    ...(profile.statusFlags?.slice?.(0, 2) ?? []),
    ...(launchpadStatus ? [launchpadStatus] : []),
  ].map(formatStatus);

  return {
    name,
    role: headline,
    initials,
    status: availability ? `Availability: ${availability}` : undefined,
    badges,
    metrics: [
      { label: 'Active applications', value: formatNumber(summary.activeApplications) },
      { label: 'Interviews', value: formatNumber(summary.interviewsScheduled) },
      { label: 'Offers in play', value: formatNumber(summary.offersNegotiating) },
      { label: 'Connections', value: formatNumber(summary.connections) },
    ],
  };
}

function buildMenuSections(data) {
  const summary = data?.summary ?? {};
  const documents = data?.documents ?? {};
  const portfolioCount = documents.portfolioLinks?.length ?? 0;
  return [
    {
      label: 'Career operations',
      items: [
        {
          name: 'Pipeline overview',
          description: `${formatNumber(summary.activeApplications)} live opportunities with ${formatNumber(summary.interviewsScheduled)} interviews scheduled.`,
          tags: ['applications', 'interviews'],
        },
        {
          name: 'Follow-ups',
          description: 'Track outstanding nudges and due diligence per opportunity.',
          tags: ['tasks'],
        },
        {
          name: 'Automation rules',
          description: 'Monitor launchpad readiness and availability automations.',
          tags: ['automation'],
        },
      ],
    },
    {
      label: 'Documents & branding',
      items: [
        {
          name: 'Document library',
          description: `${formatNumber(summary.documentsUploaded)} tailored CVs and cover letters ready to send.`,
          tags: ['resumes'],
        },
        {
          name: 'Portfolio evidence',
          description: `${portfolioCount} public links, including launchpad case studies and testimonials.`,
        },
        {
          name: 'Purchased gigs',
          description: 'Review vendor deliverables and attach outcomes to your projects.',
        },
      ],
    },
    {
      label: 'Insights & network',
      items: [
        {
          name: 'Insights, accountability, & support',
          description: 'Career analytics, rituals, advisors, and support in one command center.',
          tags: ['insights', 'support'],
          sectionId: 'insights-accountability-support',
        },
        {
          name: 'Talent intelligence',
          description: 'Track interview conversion, offer momentum, and market benchmarks.',
        },
        {
          name: 'Connections CRM',
          description: `Maintain ${formatNumber(summary.connections)} relationships for referrals and mentorship.`,
        },
        {
          name: 'Profile settings',
          description: 'Control availability, visibility, and launchpad eligibility signals.',
        },
      ],
    },
  ];
}

export default function UserDashboardPage() {
  const userId = DEFAULT_USER_ID;
  const {
    data,
    error,
    loading,
    fromCache,
    lastUpdated,
    refresh,
  } = useCachedResource(`dashboard:user:${userId}`, ({ signal }) => fetchUserDashboard(userId, { signal }), {
    ttl: 1000 * 60,
  });

  const summary = data?.summary ?? {
    totalApplications: 0,
    activeApplications: 0,
    interviewsScheduled: 0,
    offersNegotiating: 0,
    documentsUploaded: 0,
    connections: 0,
  };

  const pipeline = Array.isArray(data?.pipeline?.statuses) ? data.pipeline.statuses : [];
  const pipelineTotal = pipeline.reduce((accumulator, row) => accumulator + row.count, 0) || 1;
  const recentApplications = Array.isArray(data?.applications?.recent) ? data.applications.recent : [];
  const followUps = Array.isArray(data?.tasks?.followUps) ? data.tasks.followUps : [];
  const automations = Array.isArray(data?.tasks?.automations) ? data.tasks.automations : [];
  const interviews = Array.isArray(data?.interviews) ? data.interviews : [];
  const documents = data?.documents ?? { attachments: [], portfolioLinks: [] };
  const notifications = Array.isArray(data?.notifications?.recent) ? data.notifications.recent : [];
  const projectActivity = Array.isArray(data?.projectActivity?.recent) ? data.projectActivity.recent : [];
  const launchpadApplications = Array.isArray(data?.launchpad?.applications) ? data.launchpad.applications : [];

  const insights = data?.insights ?? {};
  const careerAnalytics = insights.careerAnalytics ?? {};
  const careerSummary = careerAnalytics.summary ?? {};
  const careerSnapshots = Array.isArray(careerAnalytics.snapshots) ? careerAnalytics.snapshots : [];
  const careerBenchmarks = Array.isArray(careerAnalytics.benchmarks) ? careerAnalytics.benchmarks : [];
  const careerDiversity = careerAnalytics.diversity ?? null;
  const careerFunnel = careerAnalytics.funnel ?? null;

  const weeklyDigest = insights.weeklyDigest ?? {};
  const digestSubscription = weeklyDigest.subscription ?? null;
  const digestIntegrations = Array.isArray(weeklyDigest.integrations) ? weeklyDigest.integrations : [];

  const calendarInsights = insights.calendar ?? {};
  const upcomingInterviewEvents = Array.isArray(calendarInsights.upcomingInterviews)
    ? calendarInsights.upcomingInterviews
    : [];
  const nextFocusBlock = calendarInsights.nextFocusBlock ?? null;
  const focusInsights = calendarInsights.focus ?? { sessions: [], totalMinutes: 0, byType: {} };
  const focusSessions = Array.isArray(focusInsights.sessions) ? focusInsights.sessions : [];
  const focusMinutesTotal = focusInsights.totalMinutes ?? 0;
  const focusByTypeEntries = focusInsights.byType ? Object.entries(focusInsights.byType) : [];

  const advisorInsights = insights.advisorCollaboration ?? {};
  const advisorCollaborations = Array.isArray(advisorInsights.collaborations)
    ? advisorInsights.collaborations
    : [];
  const advisorSummary = advisorInsights.summary ?? {};

  const supportDesk = insights.supportDesk ?? {};
  const supportCases = Array.isArray(supportDesk.cases) ? supportDesk.cases : [];
  const supportAutomation = Array.isArray(supportDesk.automation) ? supportDesk.automation : [];
  const supportArticles = Array.isArray(supportDesk.knowledgeArticles) ? supportDesk.knowledgeArticles : [];
  const supportSummary = supportDesk.summary ?? {};

  const menuSections = useMemo(() => buildMenuSections(data), [data]);
  const profileCard = useMemo(() => buildProfileCard(data, summary), [data, summary]);

  const summaryCards = [
    {
      label: 'Total applications',
      value: summary.totalApplications,
      description: 'Opportunities you have submitted or are drafting.',
    },
    {
      label: 'Active pipeline',
      value: summary.activeApplications,
      description: 'Applications requiring monitoring or follow-up.',
    },
    {
      label: 'Interviews scheduled',
      value: summary.interviewsScheduled,
      description: 'Confirmed interview touchpoints across your pipeline.',
    },
    {
      label: 'Documents uploaded',
      value: summary.documentsUploaded,
      description: 'Tailored CVs, cover letters, and supporting evidence.',
    },
  ];

  const heroTitle = 'User & Job Seeker Command Center';
  const heroSubtitle = 'Candidate success workspace';
  const heroDescription =
    'Monitor applications, interviews, documents, and collaborations with a single source of truth personalised to your Gigvora profile.';

  return (
    <DashboardLayout
      currentDashboard="user"
      title={heroTitle}
      subtitle={heroSubtitle}
      description={heroDescription}
      menuSections={menuSections}
      sections={[]}
      profile={profileCard}
      availableDashboards={availableDashboards}
    >
      <div className="space-y-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <DataStatus
            loading={loading}
            error={error?.message}
            fromCache={fromCache}
            lastUpdated={lastUpdated}
            onRetry={refresh}
          />
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm transition hover:border-accent/40 hover:shadow-soft"
            >
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{formatNumber(card.value)}</p>
              <p className="mt-2 text-sm text-slate-500">{card.description}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Pipeline health</h2>
              <span className="text-xs uppercase tracking-wide text-slate-500">Updated {formatRelativeTime(data?.pipeline?.lastActivityAt)}</span>
            </div>
            <div className="mt-6 space-y-4">
              {pipeline.length ? (
                pipeline.map((row) => {
                  const percent = Math.round((row.count / pipelineTotal) * 100);
                  return (
                    <div key={row.status}>
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span className="font-medium text-slate-700">{formatStatus(row.status)}</span>
                        <span>{formatNumber(row.count)}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-accent"
                          style={{ width: `${Math.min(100, Math.max(5, percent))}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">No applications yet — once you submit, pipeline insights will appear here.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900">Automations & readiness</h2>
            <div className="mt-4 space-y-3">
              {automations.length ? (
                automations.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-accent/30 bg-accentSoft/70 p-4">
                    <p className="text-sm font-semibold text-accent">{item.title}</p>
                    {item.detail ? <p className="text-xs uppercase tracking-wide text-accent/80">{item.detail}</p> : null}
                    <p className="mt-2 text-sm text-slate-600">{item.recommendation}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No automation alerts — keep availability and launchpad signals fresh to unlock new opportunities.</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent applications</h2>
            <span className="text-xs uppercase tracking-wide text-slate-500">Showing up to 10 latest updates</span>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-600">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="pb-3 pr-4">Opportunity</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Last update</th>
                  <th className="pb-3">Next step</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {recentApplications.length ? (
                  recentApplications.map((application) => (
                    <tr key={application.id} className="transition hover:bg-accentSoft/40">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-slate-800">
                          {application.target?.title || application.target?.name || `#${application.targetId}`}
                        </p>
                        <p className="text-xs text-slate-500">{application.targetType?.toUpperCase()}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex rounded-full border border-accent/40 bg-accentSoft px-3 py-1 text-xs font-medium text-accent">
                          {formatStatus(application.status)}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-500">{formatAbsolute(application.updatedAt)}</td>
                      <td className="py-3 text-slate-600">{application.nextStep}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-sm text-slate-500">
                      Start applying to opportunities to see your pipeline history.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Follow-ups & nudges</h2>
            <div className="mt-4 space-y-3">
              {followUps.length ? (
                followUps.map((item) => (
                  <div key={`${item.applicationId}-${item.targetName}`} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-medium text-slate-800">{item.targetName}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.overdue ? 'bg-rose-100 text-rose-600' : 'bg-accentSoft text-accent'}`}>
                        {item.overdue ? 'Overdue' : 'Upcoming'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{formatStatus(item.status)}</p>
                    <p className="mt-2 text-sm text-slate-600">{item.nextStep}</p>
                    {item.dueAt ? (
                      <p className="mt-2 text-xs text-slate-500">Suggested follow-up by {formatAbsolute(item.dueAt, { dateStyle: 'medium' })}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">You are fully up to date — new follow-up tasks will appear here as applications progress.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Interview schedule</h2>
            <div className="mt-4 space-y-3">
              {interviews.length ? (
                interviews.map((interview) => (
                  <div key={interview.applicationId} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-sm font-semibold text-slate-800">{interview.targetName}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{formatStatus(interview.status)}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {interview.scheduledAt ? `Scheduled ${formatAbsolute(interview.scheduledAt)}` : 'Awaiting confirmation'}
                    </p>
                    {interview.reviewer ? (
                      <p className="mt-1 text-xs text-slate-500">With {interview.reviewer.firstName} {interview.reviewer.lastName}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-500">{interview.nextStep}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No interviews booked yet — schedule notifications will appear here when recruiters confirm.</p>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Document workspace</h2>
            <div className="mt-4 space-y-3">
              {documents.attachments?.length ? (
                documents.attachments.map((file) => (
                  <div key={`${file.applicationId}-${file.fileName}`} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-sm font-semibold text-slate-800">{file.fileName}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">Application #{file.applicationId}</p>
                    <p className="mt-2 text-sm text-slate-600">Uploaded {formatAbsolute(file.uploadedAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Upload CVs, cover letters, and case studies to populate your document workspace.</p>
              )}
            </div>
            {documents.portfolioLinks?.length ? (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-800">Portfolio links</h3>
                <ul className="mt-2 space-y-2 text-sm text-accent">
                  {documents.portfolioLinks.map((link) => (
                    <li key={link.url}>
                      <a href={link.url} target="_blank" rel="noreferrer" className="hover:underline">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Launchpad & activity</h2>
            <div className="mt-4 space-y-3">
              {launchpadApplications.length ? (
                launchpadApplications.map((application) => (
                  <div key={application.id} className="rounded-2xl border border-accent/30 bg-accentSoft/70 p-4">
                    <p className="text-sm font-semibold text-accent">
                      {application.launchpad?.title || 'Launchpad application'}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-accent/80">{formatStatus(application.status)}</p>
                    {application.interviewScheduledAt ? (
                      <p className="mt-2 text-sm text-slate-600">Interview scheduled {formatAbsolute(application.interviewScheduledAt)}</p>
                    ) : null}
                    {application.qualificationScore ? (
                      <p className="mt-1 text-xs text-slate-500">Readiness score {application.qualificationScore}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Opt into launchpad cohorts to see readiness insights and interview milestones.</p>
              )}
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-800">Project activity</h3>
              <div className="mt-3 space-y-3">
                {projectActivity.length ? (
                  projectActivity.map((event) => (
                    <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="text-sm font-semibold text-slate-800">{event.project?.title || 'Project update'}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{formatStatus(event.eventType)}</p>
                      <p className="mt-2 text-xs text-slate-500">{formatRelativeTime(event.createdAt)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No recent project automation events.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section
          id="insights-accountability-support"
          className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Insights, accountability, &amp; support</h2>
              <p className="text-sm text-slate-500">
                Stay in the loop with market data, coach collaboration, calendars, and progress retrospectives.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="inline-flex items-center gap-1 rounded-full bg-accentSoft px-3 py-1 text-accent">
                {formatPercent(careerSummary.conversionRate ?? 0)} outreach conversion
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                {supportSummary.openCases ?? 0} open support cases
              </span>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Career analytics</h3>
                    <p className="text-sm text-slate-500">
                      Monitor conversions, interview momentum, and salary signals for your pipeline.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: 'Conversion', change: formatChangeBadge(careerSummary.conversionChange, { suffix: ' pts' }) },
                      { label: 'Interviews', change: formatChangeBadge(careerSummary.interviewChange, { suffix: ' pts' }) },
                      { label: 'Offers', change: formatChangeBadge(careerSummary.offerChange, { suffix: ' pts' }) },
                      { label: 'Salary', change: formatChangeBadge(careerSummary.salary?.change, { suffix: ' pts' }) },
                    ].map((item) => (
                      <span
                        key={item.label}
                        className={`inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-1 ${
                          item.change.tone === 'positive'
                            ? 'bg-emerald-50 text-emerald-600'
                            : item.change.tone === 'negative'
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span className="font-semibold">{item.change.label}</span>
                        <span className="font-normal text-slate-500">{item.label}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Outreach conversion</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {formatPercent(careerSummary.conversionRate ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Interview momentum</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {formatPercent(careerSummary.interviewMomentum ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Offer win rate</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {formatPercent(careerSummary.offerWinRate ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Median salary</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {formatCurrency(
                        careerSummary.salary?.value ?? null,
                        careerSummary.salary?.currency ?? 'USD',
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Period snapshots</h4>
                    <div className="mt-3 space-y-3 text-sm text-slate-600">
                      {careerSnapshots.length ? (
                        careerSnapshots.slice(0, 4).map((snapshot) => (
                          <div
                            key={`${snapshot.id ?? snapshot.timeframeEnd}-snapshot`}
                            className="rounded-xl border border-slate-200 bg-white/80 p-3"
                          >
                            <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                              <span className="font-semibold text-slate-700">
                                {formatAbsolute(snapshot.timeframeStart, { dateStyle: 'medium' })} –{' '}
                                {formatAbsolute(snapshot.timeframeEnd, { dateStyle: 'medium' })}
                              </span>
                            </div>
                            <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <dt className="text-slate-500">Conversion</dt>
                                <dd className="font-semibold text-slate-800">
                                  {formatPercent(snapshot.outreachConversionRate ?? 0)}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-slate-500">Interviews</dt>
                                <dd className="font-semibold text-slate-800">
                                  {formatPercent(snapshot.interviewMomentum ?? 0)}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-slate-500">Offers</dt>
                                <dd className="font-semibold text-slate-800">
                                  {formatPercent(snapshot.offerWinRate ?? 0)}
                                </dd>
                              </div>
                            </dl>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">
                          Submit applications to unlock conversion analytics and funnel retrospectives.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {careerDiversity ? (
                      <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
                        <h4 className="text-sm font-semibold text-slate-800">Diversity mix</h4>
                        <ul className="mt-3 space-y-2 text-xs text-slate-600">
                          {Object.entries(careerDiversity)
                            .slice(0, 4)
                            .map(([label, value]) => (
                              <li key={label} className="flex items-center justify-between">
                                <span className="font-medium text-slate-700">{formatStatus(label)}</span>
                                <span>{formatPercent(Number(value) ?? 0)}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    ) : null}

                    {careerFunnel ? (
                      <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
                        <h4 className="text-sm font-semibold text-slate-800">Pipeline funnel</h4>
                        <div className="mt-3 space-y-3 text-xs text-slate-600">
                          {Object.entries(careerFunnel)
                            .slice(0, 4)
                            .map(([label, value]) => (
                              <div key={label}>
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-slate-700">{formatStatus(label)}</span>
                                  <span>{formatNumber(value)}</span>
                                </div>
                                <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                                  <div
                                    className="h-1.5 rounded-full bg-accent"
                                    style={{ width: `${Math.min(100, Math.max(4, Number(value) * 5))}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Calendar &amp; rituals</h3>
                    <p className="text-sm text-slate-500">
                      Combine interviews, networking, deadlines, and wellbeing rituals in one focus layer.
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>Total focus time {formatMinutesToHours(focusMinutesTotal)}</p>
                    {nextFocusBlock?.startsAt ? (
                      <p>Next focus block {formatRelativeTime(nextFocusBlock.startsAt)}</p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-5 lg:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-800">Upcoming interviews</h4>
                    {upcomingInterviewEvents.length ? (
                      upcomingInterviewEvents.slice(0, 4).map((event) => (
                        <div key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-800">{event.title}</p>
                          <p className="text-xs uppercase tracking-wide text-slate-500">{formatStatus(event.eventType)}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatAbsolute(event.startsAt)}</p>
                          {event.location ? (
                            <p className="mt-1 text-xs text-slate-500">{event.location}</p>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No interviews scheduled yet — sync a calendar to stay ahead.</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-800">Focus sessions</h4>
                    {focusSessions.length ? (
                      focusSessions.slice(0, 4).map((session) => (
                        <div key={session.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-slate-800">{formatStatus(session.focusType)}</span>
                            <span className="text-xs text-slate-500">
                              {session.startedAt ? formatRelativeTime(session.startedAt) : 'Scheduled'}
                            </span>
                          </div>
                          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                            {session.completed ? 'Completed' : 'Planned'} • {formatMinutesToHours(session.durationMinutes)}
                          </p>
                          {session.notes ? (
                            <p className="mt-2 text-xs text-slate-600">{session.notes}</p>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        No focus sessions logged — block time for interview prep or relationship sprints.
                      </p>
                    )}

                    {focusByTypeEntries.length ? (
                      <div className="rounded-xl border border-slate-200 bg-white/80 p-3 text-xs text-slate-600">
                        <p className="font-semibold text-slate-700">Focus mix</p>
                        <ul className="mt-2 space-y-1">
                          {focusByTypeEntries.map(([key, value]) => (
                            <li key={key} className="flex items-center justify-between">
                              <span>{formatStatus(key)}</span>
                              <span>{formatMinutesToHours(value)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">Weekly digest &amp; integrations</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Weekly digest emails and on-demand dashboards keep your collaborators accountable.
                </p>

                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Digest subscription</p>
                  {digestSubscription ? (
                    <div className="mt-2 space-y-2">
                      <p>
                        Frequency:{' '}
                        <span className="font-semibold text-slate-800">
                          {formatStatus(digestSubscription.frequency)}
                        </span>
                      </p>
                      <p>
                        Status:{' '}
                        <span className={digestSubscription.isActive ? 'text-emerald-600' : 'text-amber-600'}>
                          {digestSubscription.isActive ? 'Active' : 'Paused'}
                        </span>
                      </p>
                      <p>
                        Last sent:{' '}
                        {digestSubscription.lastSentAt ? formatRelativeTime(digestSubscription.lastSentAt) : 'Never'}
                      </p>
                      <p>
                        Next scheduled:{' '}
                        {digestSubscription.nextScheduledAt
                          ? formatAbsolute(digestSubscription.nextScheduledAt)
                          : 'Not scheduled'}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2">Enable weekly digests to receive momentum recaps and coaching nudges.</p>
                  )}
                </div>

                <div className="mt-5 space-y-3">
                  <h4 className="text-sm font-semibold text-slate-800">Connected calendars</h4>
                  {digestIntegrations.length ? (
                    digestIntegrations.map((integration) => {
                      const statusTone =
                        integration.status === 'connected'
                          ? 'text-emerald-600'
                          : integration.status === 'syncing'
                            ? 'text-amber-600'
                            : integration.status === 'error'
                              ? 'text-rose-600'
                              : 'text-slate-500';
                      return (
                        <div key={integration.id ?? integration.provider} className="rounded-xl border border-slate-200 p-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-800">{formatStatus(integration.provider)}</span>
                            <span className={`text-xs font-semibold uppercase ${statusTone}`}>
                              {formatStatus(integration.status)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {integration.lastSyncedAt
                              ? `Last synced ${formatRelativeTime(integration.lastSyncedAt)}`
                              : 'Awaiting first sync'}
                          </p>
                          {integration.syncError ? (
                            <p className="mt-1 text-xs text-rose-500">{integration.syncError}</p>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-500">
                      Connect Google or Outlook to automate reminders and focus blocks.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">Peer benchmarks</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Compare against peers with similar skill stacks to calibrate expectations.
                </p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  {careerBenchmarks.length ? (
                    careerBenchmarks.slice(0, 6).map((benchmark) => (
                      <div
                        key={benchmark.id ?? `${benchmark.metric}-${benchmark.cohortKey}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-800">{formatStatus(benchmark.metric)}</span>
                          <span className="text-xs text-slate-500">{benchmark.cohortKey}</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {benchmark.value != null ? formatPercent(benchmark.value) : '—'}
                          {benchmark.percentile != null ? (
                            <span className="ml-2 text-xs font-medium text-slate-500">
                              {Math.round(benchmark.percentile)}th percentile
                            </span>
                          ) : null}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      Benchmarks will populate once enough peers match your skill stack.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Advisor collaboration</h3>
                  <p className="text-sm text-slate-500">
                    Invite mentors, agencies, or coaches with scoped permissions to co-manage parts of your search.
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>{advisorSummary.totalCollaborations ?? 0} workrooms</p>
                  <p>{advisorSummary.totalMembers ?? 0} collaborators</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {advisorCollaborations.length ? (
                  advisorCollaborations.slice(0, 3).map((collaboration) => (
                    <div key={collaboration.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-800">{collaboration.name}</span>
                        <span className="text-xs text-slate-500">{formatStatus(collaboration.status)}</span>
                      </div>
                      {collaboration.description ? (
                        <p className="mt-1 text-sm text-slate-600">{collaboration.description}</p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                        {collaboration.members.slice(0, 4).map((member) => (
                          <span
                            key={`${collaboration.id}-${member.email ?? member.user?.id ?? member.id}`}
                            className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-slate-600"
                          >
                            <span className="font-medium text-slate-800">
                              {member.user?.firstName
                                ? `${member.user.firstName} ${member.user.lastName ?? ''}`.trim()
                                : member.email ?? 'Pending invite'}
                            </span>
                            <span className="uppercase tracking-wide">{member.role}</span>
                          </span>
                        ))}
                      </div>
                      {collaboration.auditTrail?.length ? (
                        <div className="mt-3 space-y-1 text-xs text-slate-500">
                          {collaboration.auditTrail.slice(0, 2).map((audit) => (
                            <p key={audit.id}>
                              {formatRelativeTime(audit.createdAt)} – {audit.action}
                              {audit.actor?.firstName ? ` by ${audit.actor.firstName}` : ''}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    Invite an advisor to unlock shared pipelines, audit logs, and secure document rooms.
                  </p>
                )}
              </div>

              {advisorSummary.activeDocumentRooms ? (
                <p className="mt-4 text-xs text-slate-500">
                  {advisorSummary.activeDocumentRooms} secure document rooms active with expiration controls.
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Support desk</h3>
                  <p className="text-sm text-slate-500">
                    Access Gigvora support, automation logs, and troubleshooting guides right from the dashboard.
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>SLA breaches {supportSummary.slaBreached ?? 0}</p>
                  <p>Avg response {supportSummary.averageFirstResponseMinutes ?? '—'} mins</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-800">Open cases</h4>
                  {supportCases.length ? (
                    supportCases.slice(0, 3).map((supportCase) => (
                      <div key={supportCase.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-800">Case #{supportCase.id}</span>
                          <span className="text-xs text-slate-500">{formatStatus(supportCase.priority)}</span>
                        </div>
                        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                          {formatStatus(supportCase.status)} • {supportCase.ageHours ?? 0}h open
                        </p>
                        {supportCase.assignedAgent ? (
                          <p className="mt-1 text-xs text-slate-500">
                            Assigned to {supportCase.assignedAgent.firstName}{' '}
                            {supportCase.assignedAgent.lastName}
                          </p>
                        ) : null}
                        {supportCase.slaBreached ? (
                          <p className="mt-2 text-xs font-medium text-rose-600">SLA attention required</p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      No support conversations open — automation logs will appear here when triggered.
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-800">Automation &amp; knowledge base</h4>
                  <div className="space-y-2">
                    {supportAutomation.slice(0, 3).map((log) => (
                      <div key={log.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{formatStatus(log.source)}</span>
                          <span className="uppercase tracking-wide text-slate-500">{formatStatus(log.status)}</span>
                        </div>
                        <p className="mt-1">{log.action}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{formatRelativeTime(log.triggeredAt)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {supportArticles.slice(0, 3).map((article) => (
                      <div key={article.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                        <p className="font-semibold text-slate-800">{article.title}</p>
                        <p className="mt-1 text-slate-500">{article.summary}</p>
                        <p className="mt-1 text-[11px] text-slate-500">Audience: {formatStatus(article.audience)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white/80 p-3 text-xs text-slate-500">
                    <p>
                      Need help? Escalate to live chat or explore the knowledge base to keep SLAs on track.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
          <div className="mt-4 space-y-3">
            {notifications.length ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-2xl border p-4 ${notification.isUnread ? 'border-accent/50 bg-accentSoft/70' : 'border-slate-200 bg-slate-50/70'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{notification.title}</p>
                      {notification.body ? (
                        <p className="mt-1 text-sm text-slate-600">{notification.body}</p>
                      ) : null}
                    </div>
                    <span className="text-xs text-slate-500">{formatRelativeTime(notification.createdAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">You are all caught up — new notifications will appear here as recruiters or automations update your workflow.</p>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
