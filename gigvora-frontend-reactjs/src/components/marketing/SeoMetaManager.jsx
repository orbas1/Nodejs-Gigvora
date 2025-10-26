import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { classNames } from '../../utils/classNames.js';

const TITLE_BEST_PRACTICE = { min: 40, max: 60 };
const DESCRIPTION_BEST_PRACTICE = { min: 90, max: 160 };

function computeFieldStatus(valueLength, { min, max }) {
  if (valueLength >= min && valueLength <= max) {
    return 'success';
  }
  if (valueLength === 0) {
    return 'empty';
  }
  if (valueLength < min) {
    return 'warning';
  }
  return 'error';
}

function getStatusTone(status) {
  switch (status) {
    case 'success':
      return 'text-emerald-500 bg-emerald-50 border-emerald-200';
    case 'warning':
      return 'text-amber-500 bg-amber-50 border-amber-200';
    case 'error':
      return 'text-rose-500 bg-rose-50 border-rose-200';
    default:
      return 'text-slate-500 bg-slate-50 border-slate-200';
  }
}

function StatusBadge({ status, children }) {
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
        getStatusTone(status),
      )}
    >
      {status === 'success' ? (
        <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
      ) : status === 'warning' ? (
        <ExclamationCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
      ) : status === 'error' ? (
        <ExclamationCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
      ) : null}
      <span>{children}</span>
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.oneOf(['success', 'warning', 'error', 'empty']).isRequired,
  children: PropTypes.node.isRequired,
};

function formatUrlPreview(canonicalUrl, canonicalHost) {
  try {
    if (!canonicalUrl) {
      return canonicalHost ?? 'gigvora.com';
    }
    const url = new URL(canonicalUrl, canonicalHost ?? 'https://gigvora.com');
    return `${url.hostname}${url.pathname}`.replace(/\/?$/, '');
  } catch (error) {
    return canonicalUrl || canonicalHost || 'gigvora.com';
  }
}

function deriveOptimizationChecklist(value) {
  const titleLength = value.title.trim().length;
  const descriptionLength = value.description.trim().length;
  const keywordCount = value.keywords
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean).length;
  const hasSocialImage = Boolean(value.socialImage);
  const hasCanonical = Boolean(value.canonicalUrl);
  const canonicalLooksValid = (() => {
    try {
      if (!value.canonicalUrl) return false;
      // eslint-disable-next-line no-new
      new URL(value.canonicalUrl);
      return true;
    } catch (error) {
      return false;
    }
  })();

  return [
    {
      id: 'title-length',
      status: computeFieldStatus(titleLength, TITLE_BEST_PRACTICE),
      label: 'Title length',
      helper: `${titleLength} / ${TITLE_BEST_PRACTICE.max} characters`,
    },
    {
      id: 'description-length',
      status: computeFieldStatus(descriptionLength, DESCRIPTION_BEST_PRACTICE),
      label: 'Meta description richness',
      helper: `${descriptionLength} / ${DESCRIPTION_BEST_PRACTICE.max} characters`,
    },
    {
      id: 'keyword-coverage',
      status: keywordCount >= 3 && keywordCount <= 8 ? 'success' : keywordCount > 0 ? 'warning' : 'empty',
      label: 'Keyword coverage',
      helper:
        keywordCount === 0
          ? 'Add 3–8 high-intent keywords'
          : `${keywordCount} keyword${keywordCount === 1 ? '' : 's'} configured`,
    },
    {
      id: 'canonical-valid',
      status: canonicalLooksValid ? 'success' : hasCanonical ? 'error' : 'warning',
      label: 'Canonical URL health',
      helper: canonicalLooksValid ? 'Valid URL detected' : 'Add a valid canonical URL',
    },
    {
      id: 'social-image',
      status: hasSocialImage ? 'success' : 'warning',
      label: 'Social preview asset',
      helper: hasSocialImage ? 'Image linked for social cards' : 'Attach a 1200×630 cover image',
    },
  ];
}

function deriveOverallScore(checklist) {
  if (!Array.isArray(checklist) || checklist.length === 0) {
    return 0;
  }

  const total = checklist.reduce((accumulator, item) => {
    switch (item.status) {
      case 'success':
        return accumulator + 1;
      case 'warning':
        return accumulator + 0.6;
      case 'error':
        return accumulator + 0.2;
      default:
        return accumulator;
    }
  }, 0);

  return Math.round((total / checklist.length) * 100);
}

function generateMetaMarkup(meta) {
  const safe = {
    title: meta.title?.trim(),
    description: meta.description?.trim(),
    keywords: meta.keywords
      ?.split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean)
      .join(', '),
    canonicalUrl: meta.canonicalUrl?.trim(),
    ogTitle: meta.ogTitle?.trim(),
    ogDescription: meta.ogDescription?.trim(),
    twitterTitle: meta.twitterTitle?.trim(),
    twitterDescription: meta.twitterDescription?.trim(),
    socialImage: meta.socialImage?.trim(),
  };

  const lines = [];

  if (safe.title) {
    lines.push(`<title>${safe.title}</title>`);
  }

  if (safe.description) {
    lines.push(`<meta name="description" content="${safe.description}" />`);
  }

  if (safe.keywords) {
    lines.push(`<meta name="keywords" content="${safe.keywords}" />`);
  }

  if (safe.canonicalUrl) {
    lines.push(`<link rel="canonical" href="${safe.canonicalUrl}" />`);
  }

  if (safe.ogTitle) {
    lines.push(`<meta property="og:title" content="${safe.ogTitle}" />`);
  }

  if (safe.ogDescription) {
    lines.push(`<meta property="og:description" content="${safe.ogDescription}" />`);
  }

  if (safe.socialImage) {
    lines.push(`<meta property="og:image" content="${safe.socialImage}" />`);
  }

  if (safe.twitterTitle) {
    lines.push(`<meta name="twitter:title" content="${safe.twitterTitle}" />`);
  }

  if (safe.twitterDescription) {
    lines.push(`<meta name="twitter:description" content="${safe.twitterDescription}" />`);
  }

  if (safe.socialImage) {
    lines.push(`<meta name="twitter:card" content="summary_large_image" />`);
    lines.push(`<meta name="twitter:image" content="${safe.socialImage}" />`);
  }

  return lines.join('\n');
}

function deriveAdvancedInsights(meta) {
  const insights = [];

  if (meta.canonicalUrl && meta.canonicalUrl.startsWith('http:')) {
    insights.push({
      id: 'canonical-insecure',
      status: 'warning',
      message: 'Switch canonical URLs to HTTPS to avoid mixed-content downgrades.',
      helper: 'Most search engines flag HTTP canonicals as insecure signals.',
    });
  }

  if (meta.ogTitle && meta.title && meta.ogTitle === meta.title) {
    insights.push({
      id: 'og-title-duplicate',
      status: 'warning',
      message: 'Differentiate the Open Graph title from the SERP title for social storytelling.',
      helper: 'Tailor the hook to how executives encounter the story on LinkedIn.',
    });
  }

  if (!meta.ogDescription && meta.description) {
    insights.push({
      id: 'og-description-missing',
      status: 'warning',
      message: 'Add an Open Graph description so shares showcase the narrative.',
      helper: 'Reuse the meta description as a baseline if you need a quick win.',
    });
  }

  if (meta.twitterDescription && meta.twitterDescription.length > 280) {
    insights.push({
      id: 'twitter-description-length',
      status: 'warning',
      message: 'Trim the X card description under 280 characters to avoid truncation.',
      helper: 'Keep the sharpest proof point up front to encourage click-through.',
    });
  }

  return insights;
}

function TemplateCard({ template, isActive, onApply }) {
  return (
    <button
      type="button"
      onClick={() => onApply(template)}
      className={classNames(
        'group relative flex w-full flex-col gap-2 overflow-hidden rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        isActive
          ? 'border-accent bg-accent/5 text-accent shadow-[0_25px_55px_-35px_rgba(37,99,235,0.55)]'
          : 'border-slate-200/70 bg-white text-slate-600 hover:border-accent/60 hover:bg-accent/5 hover:text-accent',
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 group-hover:text-accent/80">
        {template.persona}
      </span>
      <span className="text-sm font-semibold text-slate-900 group-hover:text-accentDark">
        {template.label}
      </span>
      <span className="text-xs text-slate-500/90 group-hover:text-accent/80">{template.description}</span>
      <span className="mt-1 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-accent">
        <SparklesIcon className="h-3.5 w-3.5" aria-hidden="true" /> Apply template
      </span>
    </button>
  );
}

TemplateCard.propTypes = {
  template: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    persona: PropTypes.string.isRequired,
    data: PropTypes.shape({
      title: PropTypes.string,
      description: PropTypes.string,
      keywords: PropTypes.string,
      canonicalUrl: PropTypes.string,
      ogTitle: PropTypes.string,
      ogDescription: PropTypes.string,
      twitterTitle: PropTypes.string,
      twitterDescription: PropTypes.string,
    }).isRequired,
  }).isRequired,
  isActive: PropTypes.bool,
  onApply: PropTypes.func.isRequired,
};

function TextField({ label, helper, value, onChange, maxLength, placeholder, tone }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">{label}</span>
      <div
        className={classNames(
          'rounded-2xl border bg-white/90 px-4 py-3 shadow-soft transition focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/40',
          tone === 'warning'
            ? 'border-amber-300/80'
            : tone === 'error'
              ? 'border-rose-300/80'
              : 'border-slate-200/70',
        )}
      >
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />
      </div>
      {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
    </label>
  );
}

TextField.propTypes = {
  label: PropTypes.string.isRequired,
  helper: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  maxLength: PropTypes.number,
  placeholder: PropTypes.string,
  tone: PropTypes.oneOf(['warning', 'error']),
};

function TextAreaField({ label, helper, value, onChange, maxLength, rows, placeholder, tone }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">{label}</span>
      <div
        className={classNames(
          'rounded-2xl border bg-white/90 px-4 py-3 shadow-soft transition focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/40',
          tone === 'warning'
            ? 'border-amber-300/80'
            : tone === 'error'
              ? 'border-rose-300/80'
              : 'border-slate-200/70',
        )}
      >
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={maxLength}
          rows={rows}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />
      </div>
      {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
    </label>
  );
}

TextAreaField.propTypes = {
  label: PropTypes.string.isRequired,
  helper: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  maxLength: PropTypes.number,
  rows: PropTypes.number,
  placeholder: PropTypes.string,
  tone: PropTypes.oneOf(['warning', 'error']),
};

function PreviewCard({ title, url, description, socialImage, accent }) {
  return (
    <div className="space-y-3 rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_35px_80px_-60px_rgba(15,23,42,0.45)]">
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Live preview</span>
        <p className="text-xs font-medium text-slate-400">Search result</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-accent">{url}</p>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      {socialImage ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80">
          <img src={socialImage} alt="Social preview" className="h-36 w-full object-cover" loading="lazy" />
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2 pt-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
          <BoltIcon className="h-4 w-4" aria-hidden="true" /> {accent}
        </span>
      </div>
    </div>
  );
}

PreviewCard.propTypes = {
  title: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  socialImage: PropTypes.string,
  accent: PropTypes.string.isRequired,
};

export function SeoMetaManager({
  value,
  onChange,
  templates,
  insights,
  canonicalHost,
  status,
  onRequestAudit,
  className,
  onAnalyticsEvent,
}) {
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  const [activeSocialPreview, setActiveSocialPreview] = useState('google');
  const [isMarkupCopied, setIsMarkupCopied] = useState(false);

  const mergedValue = {
    title: '',
    description: '',
    keywords: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    twitterTitle: '',
    twitterDescription: '',
    socialImage: '',
    ...value,
  };

  const titleLength = mergedValue.title.trim().length;
  const descriptionLength = mergedValue.description.trim().length;

  const titleStatus = computeFieldStatus(titleLength, TITLE_BEST_PRACTICE);
  const descriptionStatus = computeFieldStatus(descriptionLength, DESCRIPTION_BEST_PRACTICE);

  const computedChecklist = useMemo(() => deriveOptimizationChecklist(mergedValue), [mergedValue]);
  const computedScore = useMemo(() => deriveOverallScore(computedChecklist), [computedChecklist]);

  const serpUrl = formatUrlPreview(mergedValue.canonicalUrl, canonicalHost);
  const metaMarkup = useMemo(() => generateMetaMarkup(mergedValue), [mergedValue]);
  const advancedInsights = useMemo(() => deriveAdvancedInsights(mergedValue), [mergedValue]);

  const emitAnalytics = useCallback(
    (event, detail) => {
      onAnalyticsEvent?.({
        source: 'SeoMetaManager',
        event,
        detail,
      });
    },
    [onAnalyticsEvent],
  );

  useEffect(() => {
    if (!isMarkupCopied) {
      return undefined;
    }

    const timeout = setTimeout(() => setIsMarkupCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [isMarkupCopied]);

  const recommendationFeed = useMemo(() => {
    const baseInsights = Array.isArray(insights) ? insights : [];
    return [
      ...advancedInsights,
      ...computedChecklist.map((item) => ({
        id: item.id,
        status: item.status,
        message: `${item.label}: ${item.helper}`,
      })),
      ...baseInsights,
    ];
  }, [advancedInsights, computedChecklist, insights]);

  useEffect(() => {
    const summary = computedChecklist.reduce(
      (accumulator, item) => {
        accumulator[item.status] = (accumulator[item.status] ?? 0) + 1;
        return accumulator;
      },
      {},
    );

    emitAnalytics('checklist_evaluated', {
      score: computedScore,
      summary,
    });
  }, [computedChecklist, computedScore, emitAnalytics]);

  const handleFieldChange = (field, nextValue) => {
    onChange?.({
      ...mergedValue,
      [field]: nextValue,
    });
  };

  const handleTemplateApply = (template) => {
    setActiveTemplateId(template.id);
    onChange?.({
      ...mergedValue,
      ...template.data,
    });
    emitAnalytics('template_applied', { templateId: template.id });
  };

  const handlePreviewSwitch = (key) => {
    setActiveSocialPreview(key);
    emitAnalytics('preview_switched', { preview: key });
  };

  const handleCopyMarkup = useCallback(async () => {
    if (!metaMarkup) {
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(metaMarkup);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = metaMarkup;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setIsMarkupCopied(true);
      emitAnalytics('markup_copied', { length: metaMarkup.length });
    } catch (error) {
      emitAnalytics('markup_copy_failed', { message: error.message });
    }
  }, [emitAnalytics, metaMarkup]);

  const handleAuditRequest = () => {
    emitAnalytics('audit_requested', { score: computedScore });
    onRequestAudit?.();
  };

  const socialPreviews = {
    google: {
      title: mergedValue.title || 'Add a compelling meta title',
      description: mergedValue.description || 'Craft a meta description that celebrates your value in under 160 characters.',
    },
    openGraph: {
      title: mergedValue.ogTitle || mergedValue.title || 'Add an Open Graph title',
      description:
        mergedValue.ogDescription ||
        mergedValue.description ||
        'Refine your Open Graph description to reinforce the narrative across social platforms.',
    },
    twitter: {
      title: mergedValue.twitterTitle || mergedValue.title || 'Add an X card title',
      description:
        mergedValue.twitterDescription ||
        mergedValue.description ||
        'Deliver a concise summary optimised for X card previews with 240 characters.',
    },
  };

  const headerStatus = status ?? {};
  const displayScore = headerStatus.score ?? computedScore;

  return (
    <section
      className={classNames(
        'relative space-y-8 overflow-hidden rounded-[46px] border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50/70 p-8 shadow-[0_45px_130px_-70px_rgba(15,23,42,0.55)]',
        'before:absolute before:-left-24 before:-top-32 before:h-72 before:w-72 before:rounded-full before:bg-accent/10 before:blur-3xl',
        'after:absolute after:-bottom-24 after:-right-12 after:h-96 after:w-96 after:rounded-full after:bg-indigo-200/20 after:blur-[140px]',
        'sm:p-10 lg:p-12',
        className,
      )}
    >
      <div className="relative flex flex-wrap items-center justify-between gap-6 rounded-[36px] border border-white/40 bg-gradient-to-r from-accent via-accentDark to-slate-900 p-6 text-white shadow-[0_35px_90px_-60px_rgba(37,99,235,0.75)]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.36em] text-white/80">SEO meta manager</p>
          <h2 className="text-2xl font-semibold leading-snug sm:text-3xl">
            Curate metadata experiences that mirror enterprise polish
          </h2>
          <p className="text-sm text-white/85 sm:max-w-xl">
            Templates, live previews, and guided validation keep every launch aligned with growth goals across marketing and
            product journeys.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="rounded-3xl border border-white/40 bg-white/10 px-4 py-3 text-left text-xs uppercase tracking-[0.32em]">
            <p className="font-semibold text-white/80">Health score</p>
            <p className="text-2xl font-semibold text-white">
              {displayScore != null ? `${displayScore}%` : 'Calibrate'}
            </p>
          </div>
          <div className="rounded-3xl border border-white/40 bg-white/10 px-4 py-3 text-left text-xs uppercase tracking-[0.32em]">
            <p className="font-semibold text-white/80">Last audit</p>
            <p className="text-sm font-semibold text-white">
              {headerStatus.lastAudit ?? 'Review pending'}
            </p>
          </div>
          {onRequestAudit ? (
            <button
              type="button"
              onClick={handleAuditRequest}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-accent transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
              Run audit
            </button>
          ) : null}
        </div>
      </div>

      <div className="relative grid gap-10 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)]">
        <div className="space-y-8">
          {Array.isArray(templates) && templates.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Templates</p>
                <StatusBadge status="success">Persona ready</StatusBadge>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isActive={activeTemplateId === template.id}
                    onApply={handleTemplateApply}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <TextField
              label="Meta title"
              value={mergedValue.title}
              onChange={(text) => handleFieldChange('title', text)}
              maxLength={70}
              helper={`${titleLength} of 70 characters • Aim for 50–60`}
              tone={titleStatus === 'warning' ? 'warning' : titleStatus === 'error' ? 'error' : undefined}
              placeholder="Craft a magnetic headline"
            />
            <TextField
              label="Canonical URL"
              value={mergedValue.canonicalUrl}
              onChange={(text) => handleFieldChange('canonicalUrl', text)}
              helper="Paste the primary URL served to search crawlers"
              placeholder="https://www.gigvora.com/blog/impact-story"
            />
            <TextAreaField
              label="Meta description"
              value={mergedValue.description}
              onChange={(text) => handleFieldChange('description', text)}
              rows={4}
              maxLength={180}
              helper={`${descriptionLength} of 180 characters • Keep between 90–160`}
              tone={descriptionStatus === 'warning' ? 'warning' : descriptionStatus === 'error' ? 'error' : undefined}
              placeholder="Guide executives through why this page matters."
            />
            <TextField
              label="Focus keywords"
              value={mergedValue.keywords}
              onChange={(text) => handleFieldChange('keywords', text)}
              helper="Separate keywords with commas to keep reporting clean"
              placeholder="exec mentoring, founder community"
            />
            <TextField
              label="Social image URL"
              value={mergedValue.socialImage}
              onChange={(text) => handleFieldChange('socialImage', text)}
              helper="Use 1200×630 artwork for crisp previews"
              placeholder="https://cdn.gigvora.com/og/insights.jpg"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <TextField
              label="Open Graph title"
              value={mergedValue.ogTitle}
              onChange={(text) => handleFieldChange('ogTitle', text)}
              helper="Tailor for LinkedIn and Facebook shares"
              placeholder="Lead with the transformation"
            />
            <TextField
              label="X card title"
              value={mergedValue.twitterTitle}
              onChange={(text) => handleFieldChange('twitterTitle', text)}
              helper="Optimise for short-form amplification"
              placeholder="Inspire the scroll"
            />
            <TextAreaField
              label="Open Graph description"
              value={mergedValue.ogDescription}
              onChange={(text) => handleFieldChange('ogDescription', text)}
              rows={3}
              helper="Give social audiences context and intrigue"
              placeholder="Summarise the payoff in under 110 characters."
            />
            <TextAreaField
              label="X card description"
              value={mergedValue.twitterDescription}
              onChange={(text) => handleFieldChange('twitterDescription', text)}
              rows={3}
              helper="Provide a succinct hook for X audiences"
              placeholder="Highlight a key stat or takeaway."
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[30px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_35px_80px_-60px_rgba(15,23,42,0.45)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Preview modes</p>
              <div className="flex gap-2">
                {Object.entries(socialPreviews).map(([key]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handlePreviewSwitch(key)}
                    className={classNames(
                      'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition',
                      activeSocialPreview === key
                        ? 'border-accent bg-accent text-white shadow-soft'
                        : 'border-slate-200/80 bg-white text-slate-500 hover:border-accent/60 hover:text-accent',
                    )}
                  >
                    {key === 'google' ? 'SERP' : key === 'openGraph' ? 'LinkedIn' : 'X Card'}
                    {activeSocialPreview === key ? (
                      <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-4">
              <PreviewCard
                title={socialPreviews[activeSocialPreview].title}
                description={socialPreviews[activeSocialPreview].description}
                url={serpUrl}
                socialImage={mergedValue.socialImage}
                accent={activeSocialPreview === 'google' ? 'SERP' : activeSocialPreview === 'openGraph' ? 'LinkedIn' : 'X Card'}
              />
            </div>
          </div>

          <div className="space-y-4 rounded-[30px] border border-slate-200/70 bg-white/95 p-6 shadow-[0_35px_80px_-60px_rgba(15,23,42,0.45)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Markup export</p>
              <StatusBadge status={metaMarkup ? 'success' : 'warning'}>
                {metaMarkup ? 'Ready' : 'Draft'}
              </StatusBadge>
            </div>
            <pre className="max-h-60 overflow-auto rounded-2xl border border-slate-200/70 bg-slate-900/95 p-4 font-mono text-xs text-slate-100 shadow-[0_30px_60px_-50px_rgba(15,23,42,0.6)]">
              {metaMarkup || 'Add metadata to generate production-ready markup.'}
            </pre>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCopyMarkup}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-white shadow-soft transition hover:bg-accentDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                disabled={!metaMarkup}
              >
                <BoltIcon className="h-4 w-4" aria-hidden="true" />
                {isMarkupCopied ? 'Copied' : 'Copy markup'}
              </button>
              <p className="text-xs text-slate-500">
                Export snippet bundles canonical, SERP, and social tags for developer handoff.
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-[30px] border border-slate-200/70 bg-white/95 p-6 shadow-[0_35px_80px_-60px_rgba(15,23,42,0.45)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Optimization checklist</p>
              <StatusBadge status="success">Live</StatusBadge>
            </div>
            <ul className="space-y-3">
              {computedChecklist.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-surfaceMuted/60 px-4 py-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.helper}</p>
                  </div>
                  <StatusBadge status={item.status}>
                    {item.status === 'success'
                      ? 'Optimised'
                      : item.status === 'warning'
                        ? 'Needs attention'
                        : item.status === 'error'
                          ? 'Action required'
                          : 'Missing'}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 rounded-[30px] border border-slate-200/70 bg-white/95 p-6 shadow-[0_35px_80px_-60px_rgba(15,23,42,0.45)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Insights feed</p>
              <StatusBadge status="success">Realtime</StatusBadge>
            </div>
            <ul className="space-y-3">
              {recommendationFeed.map((insight) => (
                <li key={insight.id} className="flex items-start gap-3 rounded-2xl bg-surfaceMuted/60 p-4">
                  <div
                    className={classNames(
                      'mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold uppercase tracking-wide',
                      insight.status === 'success'
                        ? 'bg-emerald-100 text-emerald-600'
                        : insight.status === 'warning'
                          ? 'bg-amber-100 text-amber-600'
                          : insight.status === 'error'
                            ? 'bg-rose-100 text-rose-600'
                            : 'bg-slate-100 text-slate-600',
                    )}
                  >
                    {insight.status === 'success' ? 'OK' : insight.status === 'warning' ? 'FYI' : 'FIX'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{insight.message}</p>
                    {insight.helper ? <p className="text-xs text-slate-500">{insight.helper}</p> : null}
                  </div>
                </li>
              ))}
              {recommendationFeed.length === 0 ? (
                <li className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-sm text-slate-500">
                  No insights yet. Start drafting metadata to unlock tailored recommendations.
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

SeoMetaManager.propTypes = {
  value: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    keywords: PropTypes.string,
    canonicalUrl: PropTypes.string,
    ogTitle: PropTypes.string,
    ogDescription: PropTypes.string,
    twitterTitle: PropTypes.string,
    twitterDescription: PropTypes.string,
    socialImage: PropTypes.string,
  }),
  onChange: PropTypes.func,
  templates: PropTypes.arrayOf(TemplateCard.propTypes.template),
  insights: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      status: PropTypes.oneOf(['success', 'warning', 'error', 'empty']).isRequired,
      message: PropTypes.string.isRequired,
      helper: PropTypes.string,
    }),
  ),
  canonicalHost: PropTypes.string,
  status: PropTypes.shape({
    score: PropTypes.number,
    lastAudit: PropTypes.string,
  }),
  onRequestAudit: PropTypes.func,
  className: PropTypes.string,
  onAnalyticsEvent: PropTypes.func,
};

SeoMetaManager.defaultProps = {
  value: undefined,
  onChange: undefined,
  templates: undefined,
  insights: undefined,
  canonicalHost: 'https://gigvora.com',
  status: undefined,
  onRequestAudit: undefined,
  className: undefined,
  onAnalyticsEvent: undefined,
};

export default SeoMetaManager;
