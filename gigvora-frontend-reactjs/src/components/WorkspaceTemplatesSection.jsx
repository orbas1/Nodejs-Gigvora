import PropTypes from 'prop-types';
import { useMemo } from 'react';
import DataStatus from './DataStatus.jsx';
import UserAvatar from './UserAvatar.jsx';

function SectionTitle({ label }) {
  if (!label) return null;
  return <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{label}</h3>;
}

function RequirementList({ items = [] }) {
  if (!items.length) return null;
  return (
    <ul className="mt-3 space-y-2 text-sm text-slate-600">
      {items.map((item) => (
        <li key={typeof item === 'string' ? item : JSON.stringify(item)} className="flex gap-2">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" aria-hidden="true" />
          <span>{typeof item === 'string' ? item : item.step ?? item.title ?? ''}</span>
        </li>
      ))}
    </ul>
  );
}

function MetricsList({ metrics = [] }) {
  if (!metrics.length) return null;
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {metrics.map(({ name, target, unit, description }) => (
        <div key={name} className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
          <p className="text-sm font-semibold text-blue-900">{name}</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">
            {target != null ? target : '—'}
            {unit ? <span className="ml-1 text-xs font-medium uppercase tracking-wide text-blue-500">{unit}</span> : null}
          </p>
          {description ? <p className="mt-2 text-xs text-blue-600/80">{description}</p> : null}
        </div>
      ))}
    </div>
  );
}

function StagePanel({ stages = [] }) {
  if (!stages.length) return null;
  return (
    <div className="mt-6 space-y-4">
      {stages.map((stage) => (
        <div key={stage.id ?? stage.slug} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">{stage.stageType}</p>
              <p className="text-base font-semibold text-slate-900">{stage.title}</p>
            </div>
            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              Step {stage.sortOrder ?? 0}
            </span>
          </div>
          {stage.description ? <p className="mt-3 text-sm text-slate-600">{stage.description}</p> : null}
          {stage.checklists?.length ? (
            <div className="mt-4">
              <SectionTitle label="Checklists" />
              <RequirementList items={stage.checklists} />
            </div>
          ) : null}
          {stage.questionnaires?.length ? (
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <SectionTitle label="Questionnaires" />
              {stage.questionnaires.map((questionnaire) => (
                <div key={JSON.stringify(questionnaire)} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <p className="font-medium text-slate-800">{questionnaire.title ?? 'Questionnaire'}</p>
                  <p className="text-xs text-slate-500">
                    {questionnaire.questions ? `${questionnaire.questions} questions` : 'Dynamic branching'} ·{' '}
                    {questionnaire.delivery ?? 'Workspace form'}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
          {stage.automations?.length ? (
            <div className="mt-4">
              <SectionTitle label="Automations" />
              <RequirementList items={stage.automations} />
            </div>
          ) : null}
          {stage.deliverables?.length ? (
            <div className="mt-4">
              <SectionTitle label="Deliverables" />
              <RequirementList items={stage.deliverables} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ResourceList({ resources = [] }) {
  if (!resources.length) return null;
  return (
    <div className="mt-6 space-y-3">
      {resources.map((resource) => (
        <a
          key={resource.id}
          href={resource.url ?? '#'}
          target={resource.url ? '_blank' : undefined}
          rel={resource.url ? 'noopener noreferrer' : undefined}
          className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-blue-300 hover:bg-blue-50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-sm font-semibold uppercase tracking-wide text-blue-700">
            {resource.resourceType?.slice(0, 2) ?? 'RT'}
          </div>
          <div>
            <p className="font-semibold text-slate-900 group-hover:text-blue-700">{resource.title}</p>
            {resource.description ? <p className="mt-1 text-sm text-slate-600">{resource.description}</p> : null}
            {resource.metadata ? (
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-400">
                {Object.entries(resource.metadata)
                  .filter(([, value]) => value !== null && value !== undefined && `${value}`.length > 0)
                  .map(([key, value]) => (
                    <span key={key} className="rounded-full border border-slate-200 px-2 py-0.5">
                      {key}: {value}
                    </span>
                  ))}
              </div>
            ) : null}
          </div>
        </a>
      ))}
    </div>
  );
}

export default function WorkspaceTemplatesSection({
  categories = [],
  templates = [],
  stats,
  meta,
  loading,
  error,
  onRetry,
  activeCategory,
  onCategoryChange,
  selectedTemplate,
  onSelectTemplate,
}) {
  const summaryStats = useMemo(() => {
    const generatedAt = stats?.generatedAt ? new Date(stats.generatedAt) : null;
    return {
      totalTemplates: stats?.totalTemplates ?? templates.length,
      averageAutomationLevel: stats?.averageAutomationLevel ?? 0,
      averageQualityScore: stats?.averageQualityScore ?? 0,
      industries: stats?.industries ?? [],
      generatedAt,
    };
  }, [stats, templates.length]);

  const categoryFilters = useMemo(() => {
    const base = [{ slug: 'all', name: 'All templates', templateCount: templates.length }];
    return base.concat(
      categories.map((category) => ({
        slug: category.slug,
        name: category.name,
        templateCount: category.templateCount ?? 0,
      })),
    );
  }, [categories, templates.length]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DataStatus
          loading={Boolean(loading)}
          fromCache={Boolean(meta?.cached)}
          lastUpdated={summaryStats.generatedAt}
          onRefresh={onRetry}
        />
        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-600">
            {summaryStats.totalTemplates} templates
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-600">
            {summaryStats.averageAutomationLevel}% automation readiness
          </span>
          <span className="rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-600">
            {summaryStats.averageQualityScore} quality score
          </span>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Unable to load workspace templates.</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700 transition hover:border-red-400 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="lg:w-[38%] xl:w-[34%]">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <SectionTitle label="Template families" />
            <div className="mt-3 flex flex-wrap gap-2">
              {categoryFilters.map((category) => {
                const isActive = (activeCategory ?? 'all') === category.slug;
                return (
                  <button
                    type="button"
                    key={category.slug}
                    onClick={() => onCategoryChange?.(category.slug)}
                    className={`${
                      isActive
                        ? 'border-blue-500 bg-blue-100 text-blue-700'
                        : 'border-slate-200 bg-slate-100 text-slate-600 hover:border-blue-300 hover:text-blue-600'
                    } rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition`}
                  >
                    {category.name}
                    <span className="ml-2 rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] text-slate-500">{category.templateCount}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-3">
              {loading ? (
                <div className="animate-pulse rounded-2xl border border-slate-200 bg-slate-100/60 p-4 text-sm text-slate-500">
                  Loading templates…
                </div>
              ) : null}
              {!loading && !templates.length ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No templates available for this filter yet.
                </div>
              ) : null}
              {templates.map((template) => {
                const isSelected = selectedTemplate && selectedTemplate.slug === template.slug;
                return (
                  <button
                    type="button"
                    key={template.slug}
                    onClick={() => onSelectTemplate?.(template.slug)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.45)]'
                        : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{template.name}</p>
                        {template.tagline ? <p className="text-xs text-slate-500">{template.tagline}</p> : null}
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        {template.industry ?? 'general'}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      <span className="rounded-full bg-white/70 px-2 py-0.5">{template.automationLevel}% automation</span>
                      {template.recommendedTeamSize ? (
                        <span className="rounded-full bg-white/70 px-2 py-0.5">{template.recommendedTeamSize}</span>
                      ) : null}
                      {template.estimatedDurationDays ? (
                        <span className="rounded-full bg-white/70 px-2 py-0.5">{template.estimatedDurationDays} day run</span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            {selectedTemplate ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <UserAvatar name={selectedTemplate.name} className="h-12 w-12" />
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">{selectedTemplate.name}</h3>
                        {selectedTemplate.category ? (
                          <p className="text-sm text-slate-500">{selectedTemplate.category.name}</p>
                        ) : null}
                      </div>
                    </div>
                    {selectedTemplate.description ? (
                      <p className="mt-4 max-w-2xl text-sm text-slate-600">{selectedTemplate.description}</p>
                    ) : null}
                    {selectedTemplate.clientExperience ? (
                      <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                        {selectedTemplate.clientExperience}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2 text-xs text-slate-500">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold uppercase tracking-wide">
                      Workflow: {selectedTemplate.workflowType ?? 'custom'}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold uppercase tracking-wide">
                      Automation: {selectedTemplate.automationLevel}%
                    </span>
                    {selectedTemplate.qualityScore != null ? (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold uppercase tracking-wide">
                        Quality score: {selectedTemplate.qualityScore}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <SectionTitle label="Requirements" />
                    <RequirementList items={selectedTemplate.requirementChecklist} />
                  </div>
                  <div>
                    <SectionTitle label="Onboarding sequence" />
                    {selectedTemplate.onboardingSequence?.length ? (
                      <ol className="mt-3 space-y-3 text-sm text-slate-600">
                        {selectedTemplate.onboardingSequence.map((step) => (
                          <li key={step.step} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                            <p className="font-medium text-slate-800">{step.step}</p>
                            <p className="text-xs text-slate-500">
                              Owner: {step.owner ?? 'Project lead'} · {step.automation ?? 'Manual trigger'}
                            </p>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">No automation steps defined yet.</p>
                    )}
                  </div>
                </div>

                <div>
                  <SectionTitle label="Deliverables" />
                  <RequirementList items={selectedTemplate.deliverables} />
                </div>

                <div>
                  <SectionTitle label="Outcome metrics" />
                  <MetricsList metrics={selectedTemplate.metrics} />
                </div>

                <div>
                  <SectionTitle label="Workflow stages" />
                  <StagePanel stages={selectedTemplate.stages} />
                </div>

                <div>
                  <SectionTitle label="Resources" />
                  <ResourceList resources={selectedTemplate.resources} />
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-slate-500">
                <p className="text-lg font-semibold text-slate-600">Select a workspace template to inspect its playbook.</p>
                <p className="max-w-md text-sm text-slate-500">
                  Choose a template from the left to preview automation steps, questionnaires, and delivery checklists ready for
                  client onboarding.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const categoryShape = PropTypes.shape({
  slug: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  templateCount: PropTypes.number,
});

const templateShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  slug: PropTypes.string,
  name: PropTypes.string,
  description: PropTypes.string,
  owner: PropTypes.shape({
    name: PropTypes.string,
    title: PropTypes.string,
  }),
  category: categoryShape,
  automationLevel: PropTypes.number,
  qualityScore: PropTypes.number,
  workflowType: PropTypes.string,
  requirementChecklist: PropTypes.array,
  onboardingSequence: PropTypes.array,
  deliverables: PropTypes.array,
  metrics: PropTypes.array,
  stages: PropTypes.array,
  resources: PropTypes.array,
  clientExperience: PropTypes.string,
});

WorkspaceTemplatesSection.propTypes = {
  categories: PropTypes.arrayOf(categoryShape),
  templates: PropTypes.arrayOf(templateShape),
  stats: PropTypes.shape({
    generatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    totalTemplates: PropTypes.number,
    averageAutomationLevel: PropTypes.number,
    averageQualityScore: PropTypes.number,
    industries: PropTypes.arrayOf(PropTypes.string),
  }),
  meta: PropTypes.shape({
    cached: PropTypes.bool,
  }),
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onRetry: PropTypes.func,
  activeCategory: PropTypes.string,
  onCategoryChange: PropTypes.func,
  selectedTemplate: templateShape,
  onSelectTemplate: PropTypes.func,
};
