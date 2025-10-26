import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const META_LIMITS = {
  title: { min: 35, max: 60 },
  description: { min: 110, max: 160 },
};

const DEFAULT_VALUE = {
  title: '',
  description: '',
  canonicalUrl: '',
  keywords: [],
  ogImage: '',
  twitterHandle: '',
};

const TEMPLATES = [
  {
    id: 'executive-insights',
    name: 'Executive Insights',
    title: 'Unlock elite opportunities with Gigvora | {primaryKeyword}',
    description:
      'Join Gigvora to access curated deal-flow, vetted mentors, and concierge support for {primaryKeyword}. Elevate your growth with enterprise-grade tools.',
  },
  {
    id: 'talent-network',
    name: 'Talent Network',
    title: 'Discover vetted {primaryKeyword} talent faster | Gigvora',
    description:
      'Hire top {primaryKeyword} specialists through Gigvora. Structured vetting, collaborative workspaces, and transparent project governance.',
  },
  {
    id: 'mentor-landing',
    name: 'Mentor Landing',
    title: 'Scale founders with board-level mentorship | Gigvora',
    description:
      'Gigvora mentors accelerate strategic execution with data-backed playbooks, live dashboards, and premium community access.',
  },
];

function computeKeywordArray(rawKeywords) {
  if (Array.isArray(rawKeywords)) {
    return rawKeywords.map((item) => item.trim()).filter(Boolean);
  }
  if (typeof rawKeywords === 'string') {
    return rawKeywords
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function formatKeywords(keywords) {
  return computeKeywordArray(keywords).join(', ');
}

function scoreAgainstLimit(value = '', { min, max }) {
  const length = value.trim().length;
  if (!length) {
    return { state: 'warning', message: 'Add copy to unlock ranking potential.', progress: 0 };
  }
  if (length < min) {
    return {
      state: 'warning',
      message: `Add ${min - length} more characters for optimal reach.`,
      progress: Math.round((length / max) * 100),
    };
  }
  if (length > max) {
    return {
      state: 'warning',
      message: `Trim ${length - max} characters to avoid truncation.`,
      progress: 100,
    };
  }
  return { state: 'success', message: 'Perfectly balanced.', progress: Math.round((length / max) * 100) };
}

function extractPrimaryKeyword(keywords) {
  return computeKeywordArray(keywords)[0] ?? 'growth';
}

function buildValidationMessages(value) {
  const messages = [];
  const titleScore = scoreAgainstLimit(value.title, META_LIMITS.title);
  const descriptionScore = scoreAgainstLimit(value.description, META_LIMITS.description);
  if (titleScore.state === 'warning') {
    messages.push({ level: 'warning', source: 'Title', detail: titleScore.message });
  }
  if (descriptionScore.state === 'warning') {
    messages.push({ level: 'warning', source: 'Description', detail: descriptionScore.message });
  }
  if (!value.canonicalUrl) {
    messages.push({ level: 'error', source: 'Canonical URL', detail: 'Add the definitive page URL to prevent duplicate indexing.' });
  } else if (!/^https?:\/\//i.test(value.canonicalUrl)) {
    messages.push({ level: 'error', source: 'Canonical URL', detail: 'Include http or https to create a valid canonical tag.' });
  }
  const keywords = computeKeywordArray(value.keywords);
  if (!keywords.length) {
    messages.push({ level: 'warning', source: 'Keywords', detail: 'Add at least one focus keyword to steer optimization tips.' });
  }
  if (!value.ogImage) {
    messages.push({ level: 'info', source: 'Open Graph', detail: 'Add a 1200x630px cover image to elevate link sharing on social feeds.' });
  }
  if (value.twitterHandle && !value.twitterHandle.startsWith('@')) {
    messages.push({ level: 'warning', source: 'Twitter Handle', detail: 'Start the handle with @ to ensure valid Twitter metadata.' });
  }
  return messages;
}

function buildOptimizationTips(value) {
  const tips = [];
  const keywords = computeKeywordArray(value.keywords);
  if (keywords.length >= 3) {
    tips.push('Consider grouping long-tail keywords into themed landing pages to increase relevance.');
  }
  if (value.description.toLowerCase().includes('gigvora') === false) {
    tips.push('Reference the Gigvora brand within the description to reinforce trust and brand recall.');
  }
  if (!value.description.includes(' | ')) {
    tips.push('Use separators like “ | ” to balance keyword density with readability.');
  }
  if (value.ogImage) {
    tips.push('Preview social share cards to confirm the Open Graph image aligns with campaign visuals.');
  }
  if (value.canonicalUrl) {
    tips.push('Register the canonical URL with Search Console to fast-track indexation.');
  }
  if (!tips.length) {
    tips.push('Metadata looks strong. Monitor performance in the SEO analytics dashboard for continuous improvement.');
  }
  return tips;
}

function serpPreview(value) {
  const url = value.canonicalUrl
    .replace(/^https?:\/\/(www\.)?/i, '')
    .replace(/\/$/, '')
    .slice(0, 60);
  return {
    title: value.title.trim() || 'Preview: Optimise your listing for executives',
    description:
      value.description.trim() ||
      'Deliver a premium first impression. Tuning your metadata helps Gigvora content surface beside LinkedIn-class experiences.',
    url: url || 'gigvora.com/opportunity-suite',
  };
}

function metadataScore(value) {
  const messages = buildValidationMessages(value);
  const errorCount = messages.filter((item) => item.level === 'error').length;
  const warningCount = messages.filter((item) => item.level === 'warning').length;
  const base = 100;
  return Math.max(10, base - errorCount * 25 - warningCount * 10);
}

export default function SeoMetaManager({ value, onChange, onSave, saving }) {
  const [localValue, setLocalValue] = useState(() => ({ ...DEFAULT_VALUE, ...value }));

  useEffect(() => {
    setLocalValue((current) => ({ ...current, ...value }));
  }, [value?.title, value?.description, value?.canonicalUrl, value?.keywords, value?.ogImage, value?.twitterHandle]);

  const preview = useMemo(() => serpPreview(localValue), [localValue]);
  const validation = useMemo(() => buildValidationMessages(localValue), [localValue]);
  const tips = useMemo(() => buildOptimizationTips(localValue), [localValue]);
  const titleScore = useMemo(() => scoreAgainstLimit(localValue.title, META_LIMITS.title), [localValue.title]);
  const descriptionScore = useMemo(
    () => scoreAgainstLimit(localValue.description, META_LIMITS.description),
    [localValue.description],
  );
  const score = useMemo(() => metadataScore(localValue), [localValue]);

  const handleFieldChange = (field) => (event) => {
    const nextValue = field === 'keywords'
      ? computeKeywordArray(event.target.value)
      : event.target.value;
    setLocalValue((current) => {
      const merged = { ...current, [field]: nextValue };
      onChange?.(merged);
      return merged;
    });
  };

  const handleApplyTemplate = (template) => {
    const keyword = extractPrimaryKeyword(localValue.keywords);
    const hydrated = {
      ...localValue,
      title: template.title.replace('{primaryKeyword}', keyword),
      description: template.description.replace('{primaryKeyword}', keyword),
    };
    setLocalValue(hydrated);
    onChange?.(hydrated);
  };

  const handleCopyDescription = async () => {
    try {
      await navigator.clipboard.writeText(localValue.description);
    } catch (error) {
      // ignore clipboard errors silently to avoid breaking UX in unsupported browsers
    }
  };

  const keywordInputValue = useMemo(() => formatKeywords(localValue.keywords), [localValue.keywords]);

  return (
    <section className="space-y-8">
      <header className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-sky-700 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-white/70">SEO Control Centre</p>
            <h2 className="text-3xl font-semibold leading-tight lg:text-4xl">Craft magnetic search snippets</h2>
            <p className="max-w-2xl text-base text-white/80">
              Align every metadata element with Gigvora&apos;s premium positioning. Templates, validation, and live previews make it
              effortless to rival Fortune 500 polish.
            </p>
          </div>
          <div className="flex min-w-[220px] flex-col items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
            <span className="text-xs uppercase tracking-wide text-white/60">Optimization Score</span>
            <p className="text-4xl font-semibold leading-none">{score}</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${Math.min(100, score)}%` }}
              />
            </div>
            <p className="text-xs text-white/70">Scores update live as you perfect copy and technical attributes.</p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 xl:grid-cols-[2fr,1fr]">
        <div className="space-y-8">
          <article className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-[0_40px_80px_-32px_rgba(15,23,42,0.25)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Guided metadata builder</h3>
                <p className="text-sm text-slate-500">Apply a template, fine-tune copy, and monitor character health instantly.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleApplyTemplate(template)}
                    className="rounded-full border border-white/0 bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow hover:bg-slate-700"
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <label className="block">
                <span className="flex items-center justify-between text-sm font-medium text-slate-900">
                  Meta title
                  <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <span>{localValue.title.trim().length} / {META_LIMITS.title.max}</span>
                    {titleScore.state === 'success' ? (
                      <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
                    )}
                  </span>
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="Gigvora | Orchestrate elite growth"
                  value={localValue.title}
                  onChange={handleFieldChange('title')}
                />
                <p className="mt-2 text-xs text-slate-500">{titleScore.message}</p>
              </label>

              <label className="block">
                <span className="flex items-center justify-between text-sm font-medium text-slate-900">
                  Meta description
                  <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <span>{localValue.description.trim().length} / {META_LIMITS.description.max}</span>
                    {descriptionScore.state === 'success' ? (
                      <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
                    )}
                  </span>
                </span>
                <textarea
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  rows={4}
                  placeholder="Gigvora pairs ambitious teams with mentors, capital partners, and concierge services to accelerate outcomes."
                  value={localValue.description}
                  onChange={handleFieldChange('description')}
                />
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{descriptionScore.message}</span>
                  <button
                    type="button"
                    onClick={handleCopyDescription}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    <DocumentDuplicateIcon className="h-3.5 w-3.5" />
                    Copy
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-900">Canonical URL</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="https://gigvora.com/executive-growth-suite"
                  value={localValue.canonicalUrl}
                  onChange={handleFieldChange('canonicalUrl')}
                />
                <p className="mt-2 text-xs text-slate-500">Ensure this URL resolves with a 200 status and is referenced in your XML sitemap.</p>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-900">Focus keywords</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="executive networking, venture dealflow"
                  value={keywordInputValue}
                  onChange={handleFieldChange('keywords')}
                />
                <p className="mt-2 text-xs text-slate-500">Separate keywords with commas. Use 1-3 primary phrases to avoid cannibalisation.</p>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-900">Open Graph image URL</span>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    placeholder="https://cdn.gigvora.com/og/executive-suite.png"
                    value={localValue.ogImage}
                    onChange={handleFieldChange('ogImage')}
                  />
                  <p className="mt-2 text-xs text-slate-500">Use 1200×630px imagery with clear focal areas for crisp sharing.</p>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-900">Twitter handle</span>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    placeholder="@GigvoraHQ"
                    value={localValue.twitterHandle}
                    onChange={handleFieldChange('twitterHandle')}
                  />
                  <p className="mt-2 text-xs text-slate-500">Include the brand handle to unlock Twitter card analytics.</p>
                </label>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <SparklesIcon className="h-5 w-5 text-indigo-500" />
                Live validation updates with every keystroke.
              </div>
              <button
                type="button"
                onClick={() => onSave?.(localValue)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-500 hover:to-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Saving…' : 'Save metadata'}
              </button>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-[0_32px_60px_-28px_rgba(15,23,42,0.2)]">
            <h3 className="text-lg font-semibold text-slate-900">Optimization tips</h3>
            <p className="mt-1 text-sm text-slate-500">Actionable recommendations generated from your metadata quality signals.</p>
            <ul className="mt-4 space-y-3">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-700">
                  <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-none text-emerald-500" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </article>

          {validation.length > 0 && (
            <article className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-[0_32px_60px_-28px_rgba(15,23,42,0.2)]">
              <h3 className="text-lg font-semibold text-slate-900">Validation stream</h3>
              <p className="mt-1 text-sm text-slate-500">Resolve these findings to unlock the highest possible ranking quality.</p>
              <ul className="mt-4 space-y-3">
                {validation.map((item, index) => (
                  <li
                    key={`${item.source}-${index}`}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 p-4 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{item.source}</p>
                      <p className="mt-1 text-slate-600">{item.detail}</p>
                    </div>
                    {item.level === 'error' ? (
                      <ExclamationTriangleIcon className="mt-1 h-5 w-5 flex-none text-rose-500" />
                    ) : (
                      <SparklesIcon className="mt-1 h-5 w-5 flex-none text-amber-500" />
                    )}
                  </li>
                ))}
              </ul>
            </article>
          )}
        </div>

        <aside className="space-y-8">
          <article className="rounded-3xl border border-slate-200/60 bg-slate-900 p-6 text-white shadow-[0_40px_80px_-28px_rgba(15,23,42,0.45)]">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/50">
              <span>Live SERP Preview</span>
              <span>Gigvora Rank Lab</span>
            </div>
            <div className="mt-6 rounded-2xl bg-white/5 p-5 shadow-inner">
              <p className="text-sm text-emerald-300">{preview.url}</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{preview.title}</h3>
              <p className="mt-2 text-sm text-white/80">{preview.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {computeKeywordArray(localValue.keywords).map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200"
                  >
                    {keyword}
                  </span>
                ))}
                {!computeKeywordArray(localValue.keywords).length && (
                  <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
                    Add keywords to visualise search intent
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSave?.(localValue)}
              disabled={saving}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export meta tags
            </button>
          </article>

          <article className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-[0_32px_60px_-28px_rgba(15,23,42,0.2)]">
            <h3 className="text-lg font-semibold text-slate-900">Engagement analytics hooks</h3>
            <p className="mt-1 text-sm text-slate-500">
              Instrument these events in your analytics suite to monitor SEO impact across the funnel.
            </p>
            <dl className="mt-4 space-y-4 text-sm text-slate-600">
              <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 p-4">
                <div>
                  <dt className="font-semibold text-slate-900">seo_meta.save</dt>
                  <dd className="mt-1 text-xs text-slate-500">Fire when metadata is saved to track iteration cadence.</dd>
                </div>
                <CheckCircleIcon className="mt-1 h-5 w-5 text-indigo-500" />
              </div>
              <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 p-4">
                <div>
                  <dt className="font-semibold text-slate-900">seo_meta.preview</dt>
                  <dd className="mt-1 text-xs text-slate-500">Capture SERP preview interactions to inform UX improvements.</dd>
                </div>
                <CheckCircleIcon className="mt-1 h-5 w-5 text-indigo-500" />
              </div>
              <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 p-4">
                <div>
                  <dt className="font-semibold text-slate-900">seo_meta.template_applied</dt>
                  <dd className="mt-1 text-xs text-slate-500">Log template usage to align messaging with campaign priorities.</dd>
                </div>
                <CheckCircleIcon className="mt-1 h-5 w-5 text-indigo-500" />
              </div>
            </dl>
          </article>
        </aside>
      </div>
    </section>
  );
}

SeoMetaManager.propTypes = {
  value: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    canonicalUrl: PropTypes.string,
    keywords: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
    ogImage: PropTypes.string,
    twitterHandle: PropTypes.string,
  }),
  onChange: PropTypes.func,
  onSave: PropTypes.func,
  saving: PropTypes.bool,
};

SeoMetaManager.defaultProps = {
  value: DEFAULT_VALUE,
  onChange: undefined,
  onSave: undefined,
  saving: false,
};
