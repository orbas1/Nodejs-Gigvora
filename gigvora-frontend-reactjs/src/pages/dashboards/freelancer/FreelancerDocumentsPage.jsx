import { useMemo } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import useSession from '../../../hooks/useSession.js';
import useCachedResource from '../../../hooks/useCachedResource.js';
import { fetchCvWorkspace } from '../../../services/cvDocuments.js';
import {
  fetchCoverLetterWorkspace,
} from '../../../services/coverLetters.js';
import CvCreationFlow from '../../../components/documentStudio/CvCreationFlow.jsx';
import CoverLetterComposer from '../../../components/documentStudio/CoverLetterComposer.jsx';
import StoryBlockWorkshop from '../../../components/documentStudio/StoryBlockWorkshop.jsx';
import { MENU_GROUPS, AVAILABLE_DASHBOARDS } from '../menuConfig.js';
import { formatRelativeTime } from '../../../utils/date.js';

function SummaryCard({ label, value, description }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}

function Badge({ tone = 'default', children }) {
  const toneClasses = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    accent: 'bg-accentSoft text-accent border-accent/40',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${toneClasses[tone] || toneClasses.default}`}>
      {children}
    </span>
  );
}

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 }).format(Number(value));
}

export default function FreelancerDocumentsPage() {
  const { session } = useSession();
  const userId = useMemo(() => {
    const candidates = [session?.freelancerId, session?.id, session?.userId];
    for (const candidate of candidates) {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return null;
  }, [session]);

  const cvCacheKey = userId ? `freelancer:${userId}:cv-workspace` : 'freelancer:cv-workspace:pending';
  const coverCacheKey = userId ? `freelancer:${userId}:cover-workspace` : 'freelancer:cover-workspace:pending';

  const cvWorkspace = useCachedResource(
    cvCacheKey,
    ({ signal }) => (userId ? fetchCvWorkspace(userId, { signal }) : Promise.resolve(null)),
    { dependencies: [userId], enabled: Boolean(userId) },
  );

  const coverWorkspace = useCachedResource(
    coverCacheKey,
    ({ signal }) => (userId ? fetchCoverLetterWorkspace(userId, { signal }) : Promise.resolve(null)),
    { dependencies: [userId], enabled: Boolean(userId) },
  );

  const cvData = cvWorkspace.data ?? { summary: {}, baseline: null, variants: [], documents: [] };
  const coverData = coverWorkspace.data ?? { summary: {}, templates: [], storyBlocks: [], toneSummary: {} };

  const baseline = cvData.baseline ?? null;
  const variants = Array.isArray(cvData.variants) ? cvData.variants : [];
  const templates = Array.isArray(coverData.templates) ? coverData.templates : [];
  const storyBlocks = Array.isArray(coverData.storyBlocks) ? coverData.storyBlocks : [];

  const summaryCards = [
    {
      id: 'cv-total',
      label: 'CV documents',
      value: formatNumber(cvData.summary?.totalDocuments ?? cvData.documents?.length ?? 0),
      description: `${formatNumber(cvData.summary?.totalVersions ?? 0)} tracked versions`,
    },
    {
      id: 'cover-letters',
      label: 'Cover letters',
      value: formatNumber(coverData.summary?.totalTemplates ?? templates.length),
      description: `${formatNumber(coverData.summary?.totalStoryBlocks ?? storyBlocks.length)} story blocks`,
    },
    {
      id: 'ai-assisted',
      label: 'AI assisted',
      value: formatNumber(
        (cvData.summary?.aiAssistedCount ?? 0) + (coverData.summary?.aiAssistedCount ?? 0),
      ),
      description: 'Documents with AI scoring or generation',
    },
  ];

  const lastUpdated = useMemo(() => {
    const timestamps = [];
    if (cvData.summary?.lastUpdatedAt) {
      timestamps.push(cvData.summary.lastUpdatedAt);
    }
    if (coverData.summary?.lastUpdatedAt) {
      timestamps.push(coverData.summary.lastUpdatedAt);
    }
    if (!timestamps.length) {
      return null;
    }
    const latest = timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
    return formatRelativeTime(latest);
  }, [cvData.summary?.lastUpdatedAt, coverData.summary?.lastUpdatedAt]);

  const menuSections = useMemo(() => MENU_GROUPS, []);
  const dashboards = useMemo(() => AVAILABLE_DASHBOARDS, []);

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title="Document studio"
      subtitle="CVs, cover letters, and story blocks"
      description="Craft recruiter-ready assets, track versions, and collaborate with mentors without leaving your workspace."
      menuSections={menuSections}
      availableDashboards={dashboards}
      activeMenuItem="documents"
      onMenuItemSelect={() => {}}
    >
      <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-10">
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-accentSoft/30 p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Career document mission control</h1>
              <p className="text-sm text-slate-600">
                Govern every CV, cover letter, and narrative block powering your Gigvora profile and client outreach.
              </p>
            </div>
            {lastUpdated ? (
              <span className="text-xs uppercase tracking-wide text-slate-500">Updated {lastUpdated}</span>
            ) : null}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {summaryCards.map((card) => (
              <SummaryCard key={card.id} label={card.label} value={card.value} description={card.description} />
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">Baseline CV</p>
                  <h2 className="text-xl font-semibold text-slate-900">{baseline?.title ?? 'Create your baseline CV'}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {baseline?.roleTag ? <Badge>{baseline.roleTag}</Badge> : null}
                    {baseline?.geographyTag ? <Badge>{baseline.geographyTag}</Badge> : null}
                    {Array.isArray(baseline?.tags)
                      ? baseline.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag}>{tag}</Badge>
                        ))
                      : null}
                    {baseline?.latestVersion?.approvalStatus ? (
                      <Badge tone={baseline.latestVersion.approvalStatus === 'approved' ? 'success' : 'warning'}>
                        {baseline.latestVersion.approvalStatus.replace('_', ' ')}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  {baseline?.updatedAt ? `Updated ${formatRelativeTime(baseline.updatedAt)}` : 'No baseline yet'}
                </div>
              </div>
              {baseline ? (
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  {baseline.metadata?.persona ? (
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-500">Persona</dt>
                      <dd className="text-sm font-semibold text-slate-800">{baseline.metadata.persona}</dd>
                    </div>
                  ) : null}
                  {baseline.metadata?.impact ? (
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-500">Impact</dt>
                      <dd className="text-sm font-semibold text-slate-800">{baseline.metadata.impact}</dd>
                    </div>
                  ) : null}
                  {baseline.latestVersion?.metrics?.aiCopyScore != null ? (
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-500">AI quality</dt>
                      <dd className="text-sm font-semibold text-slate-800">{`${formatNumber(baseline.latestVersion.metrics.aiCopyScore * 100)}%`}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  Set a baseline CV to unlock variant tracking, recruiter annotations, and share links.
                </p>
              )}
            </div>

            <div className="space-y-3">
              {variants.length ? (
                variants.map((variant) => (
                  <div key={variant.id || variant.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{variant.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          {variant.roleTag ? <Badge>{variant.roleTag}</Badge> : null}
                          {variant.geographyTag ? <Badge>{variant.geographyTag}</Badge> : null}
                          {variant.approvalStatus ? (
                            <Badge tone={variant.approvalStatus === 'approved' ? 'success' : 'warning'}>
                              {variant.approvalStatus.replace('_', ' ')}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">Updated {variant.updatedAt ? formatRelativeTime(variant.updatedAt) : 'recently'}</div>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3 text-xs text-slate-500">
                      <div>
                        <span className="font-semibold text-slate-700">{variant.trackedEditCount ?? 0}</span>
                        <p>Tracked edits</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">{variant.annotationCount ?? 0}</span>
                        <p>Annotations</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">
                          {variant.latestVersion?.metrics?.toneScore != null
                            ? `${formatNumber(variant.latestVersion.metrics.toneScore * 100)}%`
                            : '—'}
                        </span>
                        <p>Tone score</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                  Create role-specific variants to compare positioning and export personalised resumes instantly.
                </div>
              )}
            </div>

            {userId ? <CvCreationFlow userId={userId} baseline={baseline} onSuccess={() => cvWorkspace.refresh({ force: true })} /> : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Cover letter templates</h2>
                  <p className="text-sm text-slate-500">
                    Tone-coached templates with analytics and mentor collaboration.
                  </p>
                </div>
                <Badge tone="accent">{templates.length} templates</Badge>
              </div>
              <div className="mt-4 space-y-3">
                {templates.length ? (
                  templates.map((template) => (
                    <div key={template.id || template.title} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{template.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            {template.approvalStatus ? (
                              <Badge tone={template.approvalStatus === 'approved' ? 'success' : 'warning'}>
                                {template.approvalStatus.replace('_', ' ')}
                              </Badge>
                            ) : null}
                            <Badge>{`${template.storyBlocksUsed?.length ?? 0} story blocks`}</Badge>
                            {template.toneScore != null ? (
                              <Badge tone="accent">Tone {formatNumber(template.toneScore * 100)}%</Badge>
                            ) : null}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {template.lastUpdatedAt ? `Updated ${formatRelativeTime(template.lastUpdatedAt)}` : 'Recently updated'}
                        </div>
                      </div>
                      {template.aiSummary ? (
                        <p className="mt-2 text-sm text-slate-600">{template.aiSummary}</p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    Draft your first template to unlock tone suggestions, reuse analytics, and mentor co-editing.
                  </p>
                )}
              </div>
            </div>

            {userId ? (
              <CoverLetterComposer
                userId={userId}
                templates={templates}
                storyBlocks={storyBlocks}
                onSuccess={() => {
                  coverWorkspace.refresh({ force: true });
                }}
              />
            ) : null}

            {userId ? (
              <StoryBlockWorkshop
                userId={userId}
                storyBlocks={storyBlocks}
                onSuccess={() => coverWorkspace.refresh({ force: true })}
              />
            ) : null}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
