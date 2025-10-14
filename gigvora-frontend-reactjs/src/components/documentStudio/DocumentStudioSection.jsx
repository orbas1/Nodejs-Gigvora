import PropTypes from 'prop-types';
import { useCallback, useMemo } from 'react';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';
import CvCreationFlow from './CvCreationFlow.jsx';

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 }).format(Number(value));
}

function formatPercentage(value) {
  if (!Number.isFinite(value)) return '0%';
  return `${Math.round(value)}%`;
}

function DocumentMetricCard({ label, value, description }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:border-accent/40 hover:shadow-soft">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}

DocumentMetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  description: PropTypes.string,
};

function Badge({ children, tone = 'default' }) {
  const toneClasses = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    accent: 'bg-accentSoft text-accent border-accent/40',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        toneClasses[tone] || toneClasses.default
      }`}
    >
      {children}
    </span>
  );
}

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  tone: PropTypes.oneOf(['default', 'accent', 'success', 'warning']),
};

function VariantRow({ variant }) {
  const statusTone = variant.approvalStatus === 'approved' ? 'success' : variant.approvalStatus === 'pending_review' ? 'warning' : 'default';
  const lastUpdated = variant.updatedAt ? formatRelativeTime(variant.updatedAt) : 'Recently generated';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{variant.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {variant.roleTag ? <Badge>{variant.roleTag}</Badge> : null}
            {variant.geographyTag ? <Badge>{variant.geographyTag}</Badge> : null}
            {Array.isArray(variant.tags)
              ? variant.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))
              : null}
            <Badge tone={statusTone}>{variant.approvalStatus.replace('_', ' ')}</Badge>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500">Updated {lastUpdated}</div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Tracked edits</p>
          <p className="text-sm font-semibold text-slate-800">{variant.trackedEditCount ?? 0}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Annotations</p>
          <p className="text-sm font-semibold text-slate-800">{variant.annotationCount ?? 0}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">AI tone</p>
          <p className="text-sm font-semibold text-slate-800">{variant.toneScore != null ? formatNumber(variant.toneScore * 100) + '%' : '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">AI quality</p>
          <p className="text-sm font-semibold text-slate-800">{variant.aiCopyScore != null ? formatNumber(variant.aiCopyScore * 100) + '%' : '—'}</p>
        </div>
      </div>
      {Array.isArray(variant.collaborators) && variant.collaborators.length ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Collaboration:</span>
          {variant.collaborators.slice(0, 4).map((collaborator) => (
            <Badge key={collaborator.id || collaborator.collaboratorId} tone="accent">
              {collaborator.collaborator?.name || collaborator.collaborator?.email || 'Collaborator'}
            </Badge>
          ))}
        </div>
      ) : null}
      {Array.isArray(variant.exports) && variant.exports.length ? (
        <div className="mt-4 text-xs text-slate-500">
          <p className="font-semibold text-slate-600">Recent exports</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {variant.exports.map((record) => (
              <Badge key={`${record.id}-${record.format}`}>{record.format.toUpperCase()}</Badge>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

VariantRow.propTypes = {
  variant: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    roleTag: PropTypes.string,
    geographyTag: PropTypes.string,
    tags: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    approvalStatus: PropTypes.string,
    trackedEditCount: PropTypes.number,
    annotationCount: PropTypes.number,
    toneScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    aiCopyScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    collaborators: PropTypes.array,
    exports: PropTypes.array,
    updatedAt: PropTypes.string,
  }).isRequired,
};

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

SectionHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  action: PropTypes.node,
};

export default function DocumentStudioSection({ data, userId, onRefresh }) {
  const summary = data?.summary ?? {
    totalDocuments: 0,
    cvCount: 0,
    coverLetterCount: 0,
    portfolioCount: 0,
    brandAssetCount: 0,
    storyBlockCount: 0,
    totalVersions: 0,
    aiAssistedCount: 0,
    lastUpdatedAt: null,
  };

  const cvStudio = data?.cvStudio ?? {};
  const coverLetters = data?.coverLetters ?? {};
  const brandHub = data?.brandHub ?? {};
  const analytics = data?.analytics ?? { totals: {}, topPerformers: [], byGeography: [], bySeniority: [], recentExports: [] };
  const purchasedGigs = data?.purchasedGigs ?? { stats: {}, orders: [], upcomingDeliverables: [] };

  const baseline = cvStudio.baseline ?? null;
  const variants = Array.isArray(cvStudio.variants) ? cvStudio.variants : [];
  const coverLetterTemplates = Array.isArray(coverLetters.templates) ? coverLetters.templates : [];
  const storyBlocks = Array.isArray(coverLetters.storyBlocks) ? coverLetters.storyBlocks : [];
  const toneSummary = coverLetters.toneSummary ?? { average: null, samples: 0 };
  const testimonials = Array.isArray(brandHub.testimonials) ? brandHub.testimonials : [];
  const caseStudies = Array.isArray(brandHub.caseStudies) ? brandHub.caseStudies : [];
  const pressFeatures = Array.isArray(brandHub.pressFeatures) ? brandHub.pressFeatures : [];
  const topPerformers = Array.isArray(analytics.topPerformers) ? analytics.topPerformers : [];
  const geographyBreakdown = Array.isArray(analytics.byGeography) ? analytics.byGeography : [];
  const seniorityBreakdown = Array.isArray(analytics.bySeniority) ? analytics.bySeniority : [];
  const recentExports = Array.isArray(analytics.recentExports) ? analytics.recentExports : [];
  const gigOrders = Array.isArray(purchasedGigs.orders) ? purchasedGigs.orders : [];
  const upcomingDeliverables = Array.isArray(purchasedGigs.upcomingDeliverables)
    ? purchasedGigs.upcomingDeliverables
    : [];

  const baselineHighlights = useMemo(() => {
    if (!baseline) return [];
    const highlights = [];
    if (baseline.metadata?.persona) {
      highlights.push({ label: 'Persona', value: baseline.metadata.persona });
    }
    if (baseline.metadata?.impact) {
      highlights.push({ label: 'Impact', value: baseline.metadata.impact });
    }
    if (baseline.latestVersion?.metrics?.aiCopyScore != null) {
      highlights.push({ label: 'AI quality', value: `${formatNumber(baseline.latestVersion.metrics.aiCopyScore * 100)}%` });
    }
    if (baseline.latestVersion?.metrics?.keywords) {
      const keywords = Array.isArray(baseline.latestVersion.metrics.keywords)
        ? baseline.latestVersion.metrics.keywords.join(', ')
        : baseline.latestVersion.metrics.keywords;
      highlights.push({ label: 'Keywords', value: keywords });
    }
    return highlights;
  }, [baseline]);

  const handleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  return (
    <section id="document-studio" className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-accentSoft/30 p-6 shadow-sm">
        <SectionHeader
          title="Document studio & branding"
          subtitle="Craft and monitor every asset powering interviews, launches, and personal brand moments."
          action={
            summary.lastUpdatedAt ? (
              <span className="text-xs uppercase tracking-wide text-slate-500">
                Updated {formatRelativeTime(summary.lastUpdatedAt)}
              </span>
            ) : null
          }
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <DocumentMetricCard label="Documents in library" value={formatNumber(summary.totalDocuments)} description="Across CVs, cover letters, and case studies." />
          <DocumentMetricCard label="CV variants" value={formatNumber(summary.cvCount)} description={`${formatNumber(summary.totalVersions)} tracked versions`} />
          <DocumentMetricCard label="Cover letters" value={formatNumber(summary.coverLetterCount)} description={`${formatNumber(summary.storyBlockCount)} reusable story blocks`} />
          <DocumentMetricCard label="Brand assets" value={formatNumber(summary.brandAssetCount)} description="Testimonials, banners, and video" />
          <DocumentMetricCard label="Portfolio projects" value={formatNumber(summary.portfolioCount)} description="Published case studies" />
          <DocumentMetricCard label="AI assisted" value={formatNumber(summary.aiAssistedCount)} description="Documents with AI copy + scoring" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-7">
        <div className="xl:col-span-4 space-y-4">
          <SectionHeader
            title="CV studio"
            subtitle="Baseline profile and role-specific variants with AI copy suggestions and recruiter annotations."
            action={baseline?.latestVersion?.approvalStatus ? (
              <Badge tone={baseline.latestVersion.approvalStatus === 'approved' ? 'success' : 'warning'}>
                {baseline.latestVersion.approvalStatus.replace('_', ' ')}
              </Badge>
            ) : null}
          />
          {baseline ? (
            <div className="rounded-3xl border border-accent/40 bg-white p-6 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-accent">Baseline CV</p>
                  <h3 className="text-xl font-semibold text-slate-900">{baseline.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {baseline.roleTag ? <Badge>{baseline.roleTag}</Badge> : null}
                    {baseline.geographyTag ? <Badge>{baseline.geographyTag}</Badge> : null}
                    {Array.isArray(baseline.tags)
                      ? baseline.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag}>{tag}</Badge>
                        ))
                      : null}
                  </div>
                </div>
                <div className="text-right text-sm text-slate-500">
                  {baseline.latestVersion?.versionNumber ? (
                    <p className="font-semibold text-slate-700">v{baseline.latestVersion.versionNumber}</p>
                  ) : null}
                  <p>Last updated {baseline.updatedAt ? formatRelativeTime(baseline.updatedAt) : 'recently'}</p>
                  {baseline.shareUrl ? (
                    <a
                      href={baseline.shareUrl}
                      className="mt-2 inline-flex items-center text-xs font-semibold text-accent hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View share link
                    </a>
                  ) : null}
                </div>
              </div>
              {baselineHighlights.length ? (
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  {baselineHighlights.map((item) => (
                    <div key={item.label}>
                      <dt className="text-xs uppercase tracking-wide text-slate-500">{item.label}</dt>
                      <dd className="text-sm font-semibold text-slate-800">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {Array.isArray(baseline.collaborators) && baseline.collaborators.length ? (
                <div className="mt-4 text-xs text-slate-500">
                  <p className="font-semibold text-slate-600">Collaborators</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {baseline.collaborators.map((collaborator) => (
                      <Badge key={collaborator.id || collaborator.collaboratorId} tone="accent">
                        {collaborator.collaborator?.name || collaborator.collaborator?.email || 'Collaborator'}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              Set your baseline CV to unlock AI variants and recruiter annotation tracking.
            </div>
          )}
          <div className="space-y-3">
            {variants.length ? (
              variants.map((variant) => <VariantRow key={variant.id || variant.title} variant={variant} />)
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                Create role-specific variants to compare achievements and export personalised resumes instantly.
              </div>
            )}
          </div>
          <div className="pt-4">
            <CvCreationFlow userId={userId} baseline={baseline} onSuccess={handleRefresh} />
          </div>
        </div>

        <div className="xl:col-span-3 space-y-4">
          <SectionHeader
            title="Cover letter composer"
            subtitle="Reusable story blocks, tone coaching, and mentor collaboration to tailor every outreach."
          />
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Tone coach score</p>
                <p className="text-sm text-slate-500">
                  {toneSummary.average != null
                    ? `${formatNumber(toneSummary.average * 100)} / 100 across ${toneSummary.samples} templates`
                    : 'No tone coaching data yet'}
                </p>
              </div>
              <Badge tone="accent">Real-time collaboration</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {coverLetterTemplates.length ? (
                coverLetterTemplates.map((template) => (
                  <div key={template.id || template.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold text-slate-900">{template.title}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <Badge tone={template.approvalStatus === 'approved' ? 'success' : 'warning'}>
                          {template.approvalStatus.replace('_', ' ')}
                        </Badge>
                        <Badge>{`Tone ${template.toneScore != null ? formatNumber(template.toneScore * 100) : '—'}%`}</Badge>
                        <Badge>{`Quality ${template.qualityScore != null ? formatNumber(template.qualityScore * 100) : '—'}%`}</Badge>
                        <Badge>{`${template.storyBlocksUsed?.length ?? 0} story blocks`}</Badge>
                        <Badge>{`${template.collaboratorCount ?? 0} collaborators`}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {template.lastUpdatedAt ? `Updated ${formatRelativeTime(template.lastUpdatedAt)}` : 'Recently updated'}
                      </p>
                      {template.aiSummary ? (
                        <p className="mt-2 text-sm text-slate-600">{template.aiSummary}</p>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Draft your first template to unlock tone suggestions, story block reuse analytics, and mentor co-editing.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader title="Story block library" subtitle="Track approved narratives and reuse metrics." />
            {storyBlocks.length ? (
              <div className="mt-3 space-y-3">
                {storyBlocks.map((block) => (
                  <div key={block.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">{block.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <Badge>{block.tone}</Badge>
                      <Badge tone={block.approvalStatus === 'approved' ? 'success' : 'warning'}>
                        {block.approvalStatus.replace('_', ' ')}
                      </Badge>
                      <Badge>{`${block.useCount ?? 0} uses`}</Badge>
                      {block.metrics?.avgImpactScore != null ? (
                        <Badge tone="accent">Impact {formatNumber(block.metrics.avgImpactScore * 100)}%</Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-3">{block.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Convert your success stories into approved building blocks to accelerate personalised outreach.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <SectionHeader
            title="Personal brand hub"
            subtitle="Curate testimonials, case studies, and public assets feeding Gigvora profile and proposals."
            action={brandHub.portfolioProjects?.length ? <Badge>{`${brandHub.portfolioProjects.length} projects`}</Badge> : null}
          />
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              {brandHub.featuredBanner ? (
                <div className="rounded-2xl border border-accent/40 bg-accentSoft/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">Featured banner</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{brandHub.featuredBanner.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{brandHub.featuredBanner.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    {Array.isArray(brandHub.featuredBanner.tags)
                      ? brandHub.featuredBanner.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)
                      : null}
                    {brandHub.featuredBanner.metrics?.impressions != null ? (
                      <Badge tone="accent">{formatNumber(brandHub.featuredBanner.metrics.impressions)} impressions</Badge>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  Publish a hero banner to elevate Gigvora profile visits and proposals.
                </div>
              )}

              {brandHub.videoSpotlight ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-900/90 p-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent/80">Video introduction</p>
                  <p className="mt-1 text-sm font-semibold">{brandHub.videoSpotlight.title}</p>
                  <p className="mt-2 text-xs text-slate-200">{brandHub.videoSpotlight.description}</p>
                  {brandHub.videoSpotlight.metrics?.viewTimeSeconds != null ? (
                    <p className="mt-3 text-xs text-accent/80">
                      Avg watch time {formatNumber(brandHub.videoSpotlight.metrics.viewTimeSeconds / 60)} min
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  Embed a video introduction to personalise outreach and launchpad showcases.
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Testimonials</p>
                {testimonials.length ? (
                  <ul className="mt-2 space-y-2 text-sm text-slate-700">
                    {testimonials.slice(0, 3).map((testimonial) => (
                      <li key={testimonial.id}>
                        <p className="font-semibold text-slate-900">{testimonial.title}</p>
                        <p className="text-xs text-slate-500">{testimonial.description}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Request testimonials from recent engagements to boost credibility.</p>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Case studies</p>
                {caseStudies.length ? (
                  <ul className="mt-2 space-y-2 text-sm text-slate-700">
                    {caseStudies.slice(0, 3).map((study) => (
                      <li key={study.id}>
                        <p className="font-semibold text-slate-900">{study.title}</p>
                        <p className="text-xs text-slate-500">{study.description}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Document your impact to power Gigvora pitch decks and credentialing.</p>
                )}
              </div>
            </div>

            {pressFeatures.length ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Press & social proof</p>
                <ul className="mt-2 space-y-2 text-sm text-slate-700">
                  {pressFeatures.slice(0, 3).map((press) => (
                    <li key={press.id} className="flex items-center justify-between">
                      <span>{press.title}</span>
                      <span className="text-xs text-slate-500">{press.metrics?.potentialReach ? `${formatNumber(press.metrics.potentialReach)} reach` : 'Pending review'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeader title="Document analytics" subtitle="Optimise based on recruiter engagement and outcomes." />
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-3 gap-3 text-center text-xs text-slate-600">
              <div>
                <p className="font-semibold text-slate-900 text-base">{formatNumber(analytics.totals?.opens ?? 0)}</p>
                <p>Opens</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-base">{formatNumber(analytics.totals?.downloads ?? 0)}</p>
                <p>Downloads</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-base">{formatNumber(analytics.totals?.offers ?? 0)}</p>
                <p>Offers</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {topPerformers.length ? (
                topPerformers.map((performer) => (
                  <div key={performer.documentId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">{performer.title}</p>
                    <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-slate-500">
                      <div>
                        <p className="font-semibold text-slate-700">{formatNumber(performer.opens)}</p>
                        <p>Opens</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">{formatNumber(performer.downloads)}</p>
                        <p>Downloads</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">{formatNumber(performer.interviews)}</p>
                        <p>Interviews</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">{formatPercentage(performer.conversionRate)}</p>
                        <p>Interview rate</p>
                      </div>
                    </div>
                    {performer.lastInteractionAt ? (
                      <p className="mt-2 text-xs text-slate-400">
                        Last viewed {formatAbsolute(performer.lastInteractionAt, { dateStyle: 'medium' })}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Share documents to start measuring recruiter engagement and conversion.</p>
              )}
            </div>
            <div className="mt-4 grid gap-3 text-xs text-slate-600">
              {geographyBreakdown.length ? (
                <div>
                  <p className="font-semibold text-slate-800">Geography performance</p>
                  <ul className="mt-2 space-y-1">
                    {geographyBreakdown.slice(0, 4).map((row) => (
                      <li key={row.label} className="flex items-center justify-between">
                        <span>{row.label}</span>
                        <span>{formatPercentage(row.conversionRate)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {seniorityBreakdown.length ? (
                <div>
                  <p className="font-semibold text-slate-800">Seniority conversion</p>
                  <ul className="mt-2 space-y-1">
                    {seniorityBreakdown.slice(0, 4).map((row) => (
                      <li key={row.label} className="flex items-center justify-between">
                        <span>{row.label}</span>
                        <span>{formatPercentage(row.conversionRate)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            {recentExports.length ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent exports</p>
                <ul className="mt-2 space-y-1 text-xs text-slate-600">
                  {recentExports.slice(0, 5).map((exportRecord) => (
                    <li key={exportRecord.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        {exportRecord.documentTitle} · {exportRecord.format.toUpperCase()}
                      </span>
                      <span>{formatRelativeTime(exportRecord.exportedAt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Purchased gigs & vendor deliverables"
          subtitle="Track copywriting or design vendors supplying collateral to your document workspace."
          action={
            purchasedGigs.stats?.total ? (
              <Badge tone="accent">{`${formatNumber(purchasedGigs.stats.total)} active engagements`}</Badge>
            ) : null
          }
        />
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Pending requirements</p>
            <p className="text-lg font-semibold text-slate-900">
              {formatNumber(purchasedGigs.stats?.pendingRequirements ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Revision cycles</p>
            <p className="text-lg font-semibold text-slate-900">
              {formatNumber(purchasedGigs.stats?.pendingRevisions ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Average progress</p>
            <p className="text-lg font-semibold text-slate-900">
              {formatPercentage(purchasedGigs.stats?.averageProgress ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Active vendors</p>
            <p className="text-lg font-semibold text-slate-900">
              {formatNumber(purchasedGigs.stats?.active ?? 0)}
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-800">In-progress deliverables</p>
            {gigOrders.length ? (
              gigOrders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{order.gig?.title || order.orderNumber}</p>
                      <p className="text-xs text-slate-500">{order.clientCompanyName}</p>
                    </div>
                    <Badge tone={order.status === 'awaiting_requirements' ? 'warning' : 'accent'}>
                      {order.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-500">
                    <div>
                      <span className="font-semibold text-slate-700">{formatNumber(order.outstandingRequirements ?? 0)}</span>
                      <p>Requirements</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">{formatNumber(order.activeRevisions ?? 0)}</span>
                      <p>Revisions</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">{formatPercentage(order.progressPercent ?? 0)}</span>
                      <p>Progress</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Next milestone {order.nextRequirementDueAt ? formatAbsolute(order.nextRequirementDueAt) : 'Not scheduled'}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Purchased gigs will appear here to coordinate vendor deliverables.</p>
            )}
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-800">Upcoming deliverables</p>
            {upcomingDeliverables.length ? (
              <ul className="space-y-2 text-sm text-slate-700">
                {upcomingDeliverables.map((deliverable) => (
                  <li key={`${deliverable.orderId}-${deliverable.dueAt}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">
                        {deliverable.gig?.title || deliverable.orderNumber}
                      </span>
                      <Badge>{deliverable.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Due {deliverable.dueAt ? formatAbsolute(deliverable.dueAt) : 'TBD'}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Outstanding requirements: {formatNumber(deliverable.outstandingRequirements ?? 0)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No upcoming deliverables scheduled — vendors are on track.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

DocumentStudioSection.propTypes = {
  data: PropTypes.shape({
    summary: PropTypes.object,
    cvStudio: PropTypes.object,
    coverLetters: PropTypes.object,
    brandHub: PropTypes.object,
    analytics: PropTypes.object,
    purchasedGigs: PropTypes.object,
  }),
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onRefresh: PropTypes.func,
};

DocumentStudioSection.defaultProps = {
  data: null,
  onRefresh: undefined,
};
