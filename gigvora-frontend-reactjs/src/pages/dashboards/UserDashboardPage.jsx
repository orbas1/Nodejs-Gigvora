import { useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useCachedResource from '../../hooks/useCachedResource.js';
import DataStatus from '../../components/DataStatus.jsx';
import { fetchUserDashboard } from '../../services/userDashboard.js';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';
import DocumentStudioSection from '../../components/documentStudio/DocumentStudioSection.jsx';

const DEFAULT_USER_ID = 1;
const availableDashboards = ['user', 'freelancer', 'agency', 'company', 'headhunter'];

function formatNumber(value) {
  if (value == null) return '0';
  const formatter = new Intl.NumberFormat('en-GB');
  return formatter.format(Number(value));
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
  const documentStudio = data?.documentStudio;
  const documentSummary = documentStudio?.summary ?? {};
  const portfolioProjects = Array.isArray(documentStudio?.brandHub?.portfolioProjects)
    ? documentStudio.brandHub.portfolioProjects.length
    : documents.portfolioLinks?.length ?? 0;
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
          description: `${formatNumber(documentSummary.totalDocuments ?? summary.documentsUploaded ?? 0)} tailored assets ready to send.`,
          tags: ['resumes'],
        },
        {
          name: 'Portfolio evidence',
          description: `${formatNumber(portfolioProjects || portfolioCount)} public case studies, testimonials, and banners.`,
        },
        {
          name: 'Purchased gigs',
          description: `Review ${formatNumber(documentStudio?.purchasedGigs?.stats?.total ?? 0)} vendor deliverables feeding your workspace.`,
        },
      ],
    },
    {
      label: 'Insights & network',
      items: [
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
  const documentStudio = data?.documentStudio ?? null;
  const notifications = Array.isArray(data?.notifications?.recent) ? data.notifications.recent : [];
  const projectActivity = Array.isArray(data?.projectActivity?.recent) ? data.projectActivity.recent : [];
  const launchpadApplications = Array.isArray(data?.launchpad?.applications) ? data.launchpad.applications : [];

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

        {documentStudio ? <DocumentStudioSection data={documentStudio} /> : null}

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
