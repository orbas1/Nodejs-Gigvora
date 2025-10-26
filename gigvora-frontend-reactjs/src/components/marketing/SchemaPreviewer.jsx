import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  BoltIcon,
  BugAntIcon,
  ClipboardDocumentIcon,
  CommandLineIcon,
  DocumentDuplicateIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { classNames } from '../../utils/classNames.js';

function ValidationBadge({ variant }) {
  const palette = {
    success: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    warning: 'bg-amber-100 text-amber-600 border-amber-200',
    error: 'bg-rose-100 text-rose-600 border-rose-200',
    info: 'bg-accent/10 text-accent border-accent/20',
  };

  const config = palette[variant] ?? palette.info;

  return (
    <span
      className={classNames(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em]',
        config,
      )}
    >
      {variant === 'success' ? <BoltIcon className="h-4 w-4" aria-hidden="true" /> : null}
      {variant === 'warning' ? <InformationCircleIcon className="h-4 w-4" aria-hidden="true" /> : null}
      {variant === 'error' ? <BugAntIcon className="h-4 w-4" aria-hidden="true" /> : null}
      {variant === 'info' ? <CommandLineIcon className="h-4 w-4" aria-hidden="true" /> : null}
      <span>{variant}</span>
    </span>
  );
}

ValidationBadge.propTypes = {
  variant: PropTypes.oneOf(['success', 'warning', 'error', 'info']).isRequired,
};

function TemplateButton({ template, isActive, onApply }) {
  return (
    <button
      type="button"
      onClick={() => onApply(template)}
      className={classNames(
        'group flex w-full flex-col gap-2 rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        isActive
          ? 'border-accent bg-accent/5 text-accent shadow-[0_25px_55px_-35px_rgba(37,99,235,0.55)]'
          : 'border-slate-200/70 bg-white text-slate-600 hover:border-accent/60 hover:bg-accent/5 hover:text-accent',
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 group-hover:text-accent/80">
        {template.category}
      </span>
      <span className="text-sm font-semibold text-slate-900 group-hover:text-accentDark">{template.label}</span>
      <span className="text-xs text-slate-500/90 group-hover:text-accent/80">{template.description}</span>
      <span className="mt-1 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-accent">
        <DocumentDuplicateIcon className="h-3.5 w-3.5" aria-hidden="true" /> Apply template
      </span>
    </button>
  );
}

TemplateButton.propTypes = {
  template: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    payload: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  }).isRequired,
  isActive: PropTypes.bool,
  onApply: PropTypes.func.isRequired,
};

function deriveValidation(schemaText) {
  if (!schemaText) {
    return {
      status: 'info',
      message: 'Start by selecting a template or pasting JSON-LD to unlock validation.',
      issues: [],
      entities: [],
    };
  }

  try {
    const parsed = JSON.parse(schemaText);
    const nodes = Array.isArray(parsed) ? parsed : [parsed];
    const issues = [];
    const entities = nodes.map((node, index) => {
      const type = node['@type'] ?? 'Thing';
      if (!node['@context']) {
        issues.push({
          id: `context-${index}`,
          severity: 'warning',
          message: 'Missing @context declaration',
        });
      }
      if (type === 'Article' && !node.headline) {
        issues.push({
          id: `headline-${index}`,
          severity: 'error',
          message: 'Article schema requires a headline property',
        });
      }
      if (type === 'Event' && !node.startDate) {
        issues.push({
          id: `event-${index}`,
          severity: 'warning',
          message: 'Event schema benefits from startDate for discoverability',
        });
      }
      if (!node.description) {
        issues.push({
          id: `description-${index}`,
          severity: 'warning',
          message: `${type} schema should include a description for rich previews`,
        });
      }
      return {
        id: `${type}-${index}`,
        type,
        name: node.name ?? node.headline ?? 'Untitled entity',
        description: node.description ?? 'Add a description to unlock rich cards.',
      };
    });

    const highestSeverity = issues.find((issue) => issue.severity === 'error')
      ? 'error'
      : issues.find((issue) => issue.severity === 'warning')
        ? 'warning'
        : 'success';

    return {
      status: highestSeverity,
      message:
        highestSeverity === 'success'
          ? 'Schema validated. Preview the render to ensure metadata alignment.'
          : 'Review the flagged opportunities below to tighten schema fidelity.',
      issues,
      entities,
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Schema contains invalid JSON. Fix the syntax before validating again.',
      issues: [
        {
          id: 'parse-error',
          severity: 'error',
          message: error.message,
        },
      ],
      entities: [],
    };
  }
}

function PreviewTile({ entity, variant }) {
  const tone =
    variant === 'success'
      ? 'border-emerald-300/70 bg-emerald-50'
      : variant === 'warning'
        ? 'border-amber-300/70 bg-amber-50'
        : 'border-rose-300/70 bg-rose-50';
  return (
    <article className={classNames('space-y-2 rounded-3xl border p-5 shadow-soft', tone)}>
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">{entity.type}</p>
      <h3 className="text-lg font-semibold text-slate-900">{entity.name}</h3>
      <p className="text-sm text-slate-600">{entity.description}</p>
      <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">
        <span className="rounded-full bg-white/40 px-3 py-1">Rich result</span>
        <span className="rounded-full bg-white/60 px-3 py-1">Structured</span>
      </div>
    </article>
  );
}

PreviewTile.propTypes = {
  entity: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
  variant: PropTypes.oneOf(['success', 'warning', 'error']).isRequired,
};

export function SchemaPreviewer({
  schema,
  onSchemaChange,
  templates,
  insights,
  onValidate,
  validation,
  className,
  onAnalyticsEvent,
}) {
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [isValidationTouched, setIsValidationTouched] = useState(false);
  const [isSchemaCopied, setIsSchemaCopied] = useState(false);

  const schemaText = schema ?? '';

  const computedValidation = useMemo(() => deriveValidation(schemaText), [schemaText]);
  const validationState = validation ?? computedValidation;

  const previewVariant =
    validationState.status === 'success'
      ? 'success'
      : validationState.status === 'warning'
        ? 'warning'
        : 'error';

  const schemaStats = useMemo(() => {
    const issues = Array.isArray(validationState.issues) ? validationState.issues : [];
    const errorCount = issues.filter((issue) => issue.severity === 'error').length;
    const warningCount = issues.filter((issue) => issue.severity === 'warning').length;

    return {
      entityCount: validationState.entities.length,
      errorCount,
      warningCount,
    };
  }, [validationState]);

  const combinedInsights = useMemo(() => {
    const base = Array.isArray(insights) ? insights : [];
    if (!validationState.issues?.length) {
      return base;
    }
    const derived = validationState.issues.map((issue) => ({
      id: issue.id,
      status: issue.severity === 'error' ? 'error' : 'warning',
      message: issue.message,
    }));
    return [...derived, ...base];
  }, [insights, validationState]);

  const emitAnalytics = useCallback(
    (event, detail) => {
      onAnalyticsEvent?.({
        source: 'SchemaPreviewer',
        event,
        detail,
      });
    },
    [onAnalyticsEvent],
  );

  useEffect(() => {
    if (!isSchemaCopied) {
      return undefined;
    }

    const timeout = setTimeout(() => setIsSchemaCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [isSchemaCopied]);

  useEffect(() => {
    emitAnalytics('validation_state_updated', {
      status: validationState.status,
      errorCount: schemaStats.errorCount,
      warningCount: schemaStats.warningCount,
      entityCount: schemaStats.entityCount,
    });
  }, [emitAnalytics, schemaStats.entityCount, schemaStats.errorCount, schemaStats.warningCount, validationState.status]);

  useEffect(() => {
    if (!isValidationTouched) {
      return undefined;
    }

    const timer = setTimeout(() => {
      const result = deriveValidation(schemaText);
      onValidate?.(result);
      emitAnalytics('auto_validation', { issueCount: result.issues.length });
    }, 400);

    return () => clearTimeout(timer);
  }, [emitAnalytics, isValidationTouched, onValidate, schemaText]);

  const handleSchemaInput = (value) => {
    onSchemaChange?.(value);
    emitAnalytics('schema_updated', { length: value.length });
  };

  const handleTemplateApply = (template) => {
    setActiveTemplate(template.id);
    const payload =
      typeof template.payload === 'string' ? template.payload : JSON.stringify(template.payload, null, 2);
    handleSchemaInput(payload);
    setIsValidationTouched(false);
    emitAnalytics('template_applied', { templateId: template.id });
  };

  const handleValidate = () => {
    setIsValidationTouched(true);
    const result = deriveValidation(schemaText);
    onValidate?.(result);
    emitAnalytics('manual_validate', { issueCount: result.issues.length });
  };

  const handleCopySchema = useCallback(async () => {
    if (!schemaText.trim()) {
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(schemaText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = schemaText;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setIsSchemaCopied(true);
      emitAnalytics('schema_copied', { length: schemaText.length });
    } catch (error) {
      emitAnalytics('schema_copy_failed', { message: error.message });
    }
  }, [emitAnalytics, schemaText]);

  return (
    <section
      className={classNames(
        'space-y-8 rounded-[46px] border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 p-8 shadow-[0_45px_120px_-70px_rgba(15,23,42,0.55)]',
        'sm:p-10 lg:p-12',
        className,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-6 rounded-[36px] border border-indigo-200/60 bg-gradient-to-r from-indigo-500 via-accent to-slate-900 p-6 text-white shadow-[0_35px_90px_-60px_rgba(79,70,229,0.65)]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.36em] text-white/80">Schema previewer</p>
          <h2 className="text-2xl font-semibold sm:text-3xl">Validate JSON-LD with multi-entity previews</h2>
          <p className="text-sm text-white/80 sm:max-w-xl">
            Inline validation, templated starters, and premium previews keep marketing and engineering aligned on structured data
            quality.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <ValidationBadge variant={validationState.status ?? 'info'} />
          <button
            type="button"
            onClick={handleValidate}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-accent transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />
            Validate schema
          </button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1 rounded-2xl border border-emerald-200/70 bg-emerald-50/80 p-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700/80">Entities</p>
          <p className="text-xl font-semibold text-emerald-700">{schemaStats.entityCount}</p>
          <p className="text-xs text-emerald-700/70">Ready for preview tiles</p>
        </div>
        <div className="space-y-1 rounded-2xl border border-amber-200/70 bg-amber-50/80 p-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-700/80">Warnings</p>
          <p className="text-xl font-semibold text-amber-700">{schemaStats.warningCount}</p>
          <p className="text-xs text-amber-700/70">Opportunities to enrich data</p>
        </div>
        <div className="space-y-1 rounded-2xl border border-rose-200/70 bg-rose-50/80 p-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-700/80">Errors</p>
          <p className="text-xl font-semibold text-rose-700">{schemaStats.errorCount}</p>
          <p className="text-xs text-rose-700/70">Fix before publishing</p>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)]">
        <div className="space-y-6">
          {Array.isArray(templates) && templates.length > 0 ? (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Templates</p>
              <div className="grid gap-3 lg:grid-cols-2">
                {templates.map((template) => (
                  <TemplateButton
                    key={template.id}
                    template={template}
                    isActive={activeTemplate === template.id}
                    onApply={handleTemplateApply}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">JSON-LD editor</span>
            <textarea
              value={schemaText}
              onChange={(event) => handleSchemaInput(event.target.value)}
              rows={18}
              spellCheck={false}
              className="w-full rounded-[28px] border border-slate-200/70 bg-slate-900/95 px-5 py-4 font-mono text-sm text-slate-100 shadow-[0_35px_80px_-60px_rgba(15,23,42,0.65)] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="Paste JSON-LD here"
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Use the validated snippet to update your CMS or tag manager.</p>
            <button
              type="button"
              onClick={handleCopySchema}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-700 transition hover:border-accent/60 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              disabled={!schemaText.trim()}
            >
              <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />
              {isSchemaCopied ? 'Copied' : 'Copy JSON-LD'}
            </button>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 text-xs text-slate-500">
            Tip: Use templates as a starting point, then extend with properties referenced in Google’s structured data guides.
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4 rounded-[30px] border border-slate-200/70 bg-white/95 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Render preview</p>
              <ValidationBadge variant={validationState.status ?? 'info'} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {validationState.entities.length === 0 ? (
                <div className="rounded-3xl border border-slate-200/70 bg-surfaceMuted/60 p-6 text-sm text-slate-500">
                  Add or paste schema to preview how structured data surfaces in search cards.
                </div>
              ) : (
                validationState.entities.map((entity) => (
                  <PreviewTile key={entity.id} entity={entity} variant={previewVariant} />
                ))
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-[30px] border border-slate-200/70 bg-white/95 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Validation feed</p>
              {isValidationTouched ? (
                <ValidationBadge variant={validationState.status ?? 'info'} />
              ) : (
                <ValidationBadge variant="info" />
              )}
            </div>
            <ul className="space-y-3">
              {combinedInsights.length === 0 ? (
                <li className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 text-sm text-slate-500">
                  No insights yet. Validate to unlock structured data guidance.
                </li>
              ) : (
                combinedInsights.map((insight) => (
                  <li
                    key={insight.id}
                    className="flex items-start gap-3 rounded-2xl bg-surfaceMuted/60 p-4 text-sm text-slate-600"
                  >
                    <ValidationBadge variant={insight.status === 'error' ? 'error' : 'warning'} />
                    <span>{insight.message}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="space-y-3 rounded-[30px] border border-slate-200/70 bg-white/95 p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Best practices</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="rounded-2xl border border-slate-200/70 bg-surfaceMuted/60 px-4 py-3">
                Ensure every entity lists <code className="rounded bg-slate-900/10 px-1.5 py-0.5 text-xs">@context</code> and
                <code className="ml-1 rounded bg-slate-900/10 px-1.5 py-0.5 text-xs">@type</code> to remain eligible for rich
                results.
              </li>
              <li className="rounded-2xl border border-slate-200/70 bg-surfaceMuted/60 px-4 py-3">
                Provide comprehensive descriptions and highlight key metrics so executives scanning the preview immediately feel
                the value.
              </li>
              <li className="rounded-2xl border border-slate-200/70 bg-surfaceMuted/60 px-4 py-3">
                Keep schema in sync with live page content and analytics to avoid manual overrides that erode trust.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

SchemaPreviewer.propTypes = {
  schema: PropTypes.string,
  onSchemaChange: PropTypes.func,
  templates: PropTypes.arrayOf(TemplateButton.propTypes.template),
  insights: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      status: PropTypes.oneOf(['success', 'warning', 'error', 'info']).isRequired,
      message: PropTypes.string.isRequired,
    }),
  ),
  onValidate: PropTypes.func,
  validation: PropTypes.shape({
    status: PropTypes.oneOf(['success', 'warning', 'error', 'info']),
    message: PropTypes.string,
    issues: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        severity: PropTypes.oneOf(['success', 'warning', 'error']).isRequired,
        message: PropTypes.string.isRequired,
      }),
    ),
    entities: PropTypes.arrayOf(PreviewTile.propTypes.entity),
  }),
  className: PropTypes.string,
  onAnalyticsEvent: PropTypes.func,
};

SchemaPreviewer.defaultProps = {
  schema: '',
  onSchemaChange: undefined,
  templates: [
    {
      id: 'article',
      label: 'Thought leadership article',
      description: 'Prime executive insights for LinkedIn-grade distribution.',
      category: 'Content',
      payload: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'The mentorship advantage for venture-backed founders',
        description: 'Gigvora founders reveal how guided mentorship accelerated hiring and deal flow.',
        author: {
          '@type': 'Person',
          name: 'Amani Patel',
        },
        datePublished: '2024-05-02',
        mainEntityOfPage: 'https://gigvora.com/insights/mentorship-advantage',
      },
    },
    {
      id: 'event',
      label: 'Executive roundtable',
      description: 'Spotlight a leadership community session.',
      category: 'Community',
      payload: {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'C-Suite Roundtable: Scaling mentorship programmes',
        description: 'Live dialogue with mentors and founders on orchestrating premium guidance.',
        startDate: '2024-07-18T17:00:00+00:00',
        endDate: '2024-07-18T18:30:00+00:00',
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
        location: {
          '@type': 'VirtualLocation',
          url: 'https://gigvora.com/events/roundtable',
        },
      },
    },
  ],
  insights: undefined,
  onValidate: undefined,
  validation: undefined,
  className: undefined,
  onAnalyticsEvent: undefined,
};

export default SchemaPreviewer;
