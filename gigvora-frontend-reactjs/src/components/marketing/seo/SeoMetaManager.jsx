import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  BoltIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LinkIcon,
  SparklesIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import analytics from '../../../services/analytics.js';

const SEO_TEMPLATES = [
  {
    id: 'standard',
    label: 'Standard landing',
    helper: 'Balanced metadata for marketing and conversion pages.',
    fields: {
      title: 'Accelerate growth with Gigvora',
      description:
        'Discover curated opportunities, automate workflows, and activate mentorship loops built for modern operators.',
      canonicalUrl: 'https://gigvora.com/',
      robots: 'index,follow',
      ogTitle: 'Gigvora · Growth, mentorship & opportunity network',
      ogDescription:
        'A trusted platform for founders, freelancers, and hiring teams to connect, collaborate, and scale responsibly.',
      ogImage: 'https://cdn.gigvora.com/og/marketing-default.png',
      twitterCard: 'summary_large_image',
      focusKeyword: 'growth platform',
      keywords: 'professional network, mentorship, opportunity marketplace',
    },
  },
  {
    id: 'product-launch',
    label: 'Product launch',
    helper: 'Optimised for feature releases and press drops.',
    fields: {
      title: 'Launchpad by Gigvora — AI scouting for elite teams',
      description:
        'Unveil Launchpad: AI-powered scouting that surfaces vetted founders, creators, and operators with enterprise-grade insights.',
      canonicalUrl: 'https://gigvora.com/launchpad',
      robots: 'index,follow',
      ogTitle: 'Launchpad · AI scouting by Gigvora',
      ogDescription:
        'Precision-matched opportunities and insights for executives and recruiters seeking their next strategic hire.',
      ogImage: 'https://cdn.gigvora.com/og/launchpad.png',
      twitterCard: 'summary_large_image',
      focusKeyword: 'AI scouting platform',
      keywords: 'AI scouting, recruitment intelligence, launchpad',
    },
  },
  {
    id: 'thought-leadership',
    label: 'Thought leadership',
    helper: 'Built for editorial and long-form brand stories.',
    fields: {
      title: 'The mentorship operating system redefining modern work',
      description:
        'Explore how Gigvora pairs mentorship intelligence with deal flow to help ambitious talent unlock compounding outcomes.',
      canonicalUrl: 'https://gigvora.com/stories/mentorship-operating-system',
      robots: 'index,follow',
      ogTitle: 'Gigvora Stories · Mentorship operating system',
      ogDescription:
        'A premium look into the mentorship models powering today’s top operators and global teams.',
      ogImage: 'https://cdn.gigvora.com/og/story-mentorship.png',
      twitterCard: 'summary_large_image',
      focusKeyword: 'mentorship operating system',
      keywords: 'mentorship, professional growth, gigvora stories',
    },
  },
];

const FIELD_LIMITS = {
  title: { min: 35, max: 60 },
  description: { min: 110, max: 160 },
  ogTitle: { min: 35, max: 65 },
  ogDescription: { min: 110, max: 200 },
};

function normaliseInitialMeta(initialMeta) {
  if (!initialMeta || typeof initialMeta !== 'object') {
    return {};
  }
  return Object.keys(initialMeta).reduce((accumulator, key) => {
    const value = initialMeta[key];
    if (value === undefined || value === null) {
      return accumulator;
    }
    return {
      ...accumulator,
      [key]: typeof value === 'string' ? value : String(value),
    };
  }, {});
}

function countWords(value) {
  if (!value) return 0;
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function evaluateFieldLength(value, field) {
  const limits = FIELD_LIMITS[field];
  if (!limits) {
    return { status: 'ok', message: null };
  }
  const length = value?.length ?? 0;
  if (length === 0) {
    return { status: 'error', message: 'Required for rich previews.' };
  }
  if (length < limits.min) {
    return { status: 'warning', message: `Add ${limits.min - length} more characters to maximise impact.` };
  }
  if (length > limits.max) {
    return { status: 'warning', message: `Trim ${length - limits.max} characters for clarity.` };
  }
  return { status: 'ok', message: 'Looking great.' };
}

function buildOptimizationTips(meta, issues) {
  const tips = [];
  if (!meta.focusKeyword) {
    tips.push('Add a focus keyphrase so the optimisation engine can grade relevance.');
  }
  if (meta.focusKeyword && meta.title && !meta.title.toLowerCase().includes(meta.focusKeyword.toLowerCase())) {
    tips.push('Incorporate the focus keyphrase into the title for stronger SERP alignment.');
  }
  if (meta.focusKeyword && meta.description && !meta.description.toLowerCase().includes(meta.focusKeyword.toLowerCase())) {
    tips.push('Mention the focus keyphrase inside the meta description to reinforce intent.');
  }
  if (!meta.ogImage) {
    tips.push('Upload a 1200x630 image to elevate social sharing snippets.');
  }
  if (!meta.canonicalUrl) {
    tips.push('Set a canonical URL to avoid duplicate indexing penalties.');
  }
  if (!meta.keywords) {
    tips.push('Curate a short keyword list to support internal search optimisation.');
  }
  if (!tips.length && !issues.length) {
    tips.push('Metadata is production-ready—run a final QA and ship it.');
  }
  return tips;
}

function computeScore(meta, validation, issues) {
  let score = 40;
  const filledKeys = ['title', 'description', 'canonicalUrl', 'robots', 'ogTitle', 'ogDescription', 'ogImage', 'twitterCard'];
  const filled = filledKeys.filter((key) => meta[key]);
  score += (filled.length / filledKeys.length) * 40;
  const goodFields = Object.keys(validation).filter((key) => validation[key].status === 'ok');
  score += goodFields.length * 2.5;
  score -= issues.filter((issue) => issue.severity === 'error').length * 8;
  score -= issues.filter((issue) => issue.severity === 'warning').length * 4;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildIssues(meta) {
  const issues = [];
  if (!meta.title) {
    issues.push({ label: 'Title is required', severity: 'error', field: 'title' });
  }
  if (!meta.description) {
    issues.push({ label: 'Meta description missing', severity: 'error', field: 'description' });
  }
  if (meta.description && meta.description.length < FIELD_LIMITS.description.min) {
    issues.push({
      label: `Description should be at least ${FIELD_LIMITS.description.min} characters`,
      severity: 'warning',
      field: 'description',
    });
  }
  if (!meta.canonicalUrl) {
    issues.push({ label: 'Canonical URL missing', severity: 'warning', field: 'canonicalUrl' });
  }
  if (meta.canonicalUrl && !/^https?:\/\//i.test(meta.canonicalUrl)) {
    issues.push({ label: 'Canonical URL must be absolute', severity: 'error', field: 'canonicalUrl' });
  }
  if (meta.robots && !/index|noindex/.test(meta.robots)) {
    issues.push({ label: 'Robots directive should declare index/noindex', severity: 'warning', field: 'robots' });
  }
  if (!meta.ogImage) {
    issues.push({ label: 'Add an Open Graph image for richer social previews', severity: 'warning', field: 'ogImage' });
  }
  if (meta.focusKeyword && meta.keywords && !meta.keywords.toLowerCase().includes(meta.focusKeyword.toLowerCase())) {
    issues.push({ label: 'Include the focus keyphrase inside keyword tags', severity: 'warning', field: 'keywords' });
  }
  return issues;
}

function serpPreview(meta) {
  const title = meta.title || 'Preview your title here';
  const description = meta.description || 'Meta descriptions around 150 characters drive stronger click-through rates.';
  const url = meta.canonicalUrl?.replace(/^https?:\/\//, '') || 'gigvora.com/your-page';
  return { title, description, url };
}

const FIELD_CONFIG = [
  { key: 'title', label: 'Meta title', helper: '35-60 characters, include a focus keyphrase.' },
  { key: 'description', label: 'Meta description', helper: '110-160 characters describing the value proposition.' },
  { key: 'canonicalUrl', label: 'Canonical URL', helper: 'Use absolute URLs to guide search engines.' },
  { key: 'robots', label: 'Robots directive', helper: 'Declare crawl directives (e.g., index,follow).' },
  { key: 'focusKeyword', label: 'Focus keyphrase', helper: 'Anchor optimisation guidance around this phrase.' },
  { key: 'keywords', label: 'Keyword tags', helper: 'Comma-separated keywords for internal analytics.' },
  { key: 'ogTitle', label: 'Open Graph title', helper: 'Appears on LinkedIn, X, and Facebook shares.' },
  { key: 'ogDescription', label: 'Open Graph description', helper: 'Add context for social networks and messaging apps.' },
  { key: 'ogImage', label: 'Open Graph image URL', helper: 'Optimise for 1200x630px assets.' },
  { key: 'twitterCard', label: 'Twitter card type', helper: 'summary or summary_large_image recommended.' },
];

export default function SeoMetaManager({ initialMeta = {}, analyticsMetadata = {}, onChange, onSave }) {
  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  const [meta, setMeta] = useState(() => ({ ...SEO_TEMPLATES[0].fields, ...normaliseInitialMeta(initialMeta) }));
  const [status, setStatus] = useState('editing');
  const [lastSavedAt, setLastSavedAt] = useState(null);

  useEffect(() => {
    onChange?.(meta);
  }, [meta, onChange]);

  useEffect(() => {
    analytics.track(
      'seo_meta_manager_viewed',
      {
        template: selectedTemplate,
        keyword: meta.focusKeyword,
      },
      { source: analyticsMetadata.source ?? 'seo_console' },
    );
  }, [analyticsMetadata.source, meta.focusKeyword, selectedTemplate]);

  const validation = useMemo(() => {
    return FIELD_CONFIG.reduce((accumulator, field) => {
      const result = evaluateFieldLength(meta[field.key], field.key);
      return {
        ...accumulator,
        [field.key]: result,
      };
    }, {});
  }, [meta]);

  const issues = useMemo(() => buildIssues(meta), [meta]);
  const optimisationTips = useMemo(() => buildOptimizationTips(meta, issues), [issues, meta]);
  const score = useMemo(() => computeScore(meta, validation, issues), [meta, validation, issues]);
  const preview = useMemo(() => serpPreview(meta), [meta]);

  const completion = useMemo(() => {
    const total = FIELD_CONFIG.length;
    const filled = FIELD_CONFIG.filter((field) => meta[field.key]).length;
    return Math.round((filled / total) * 100);
  }, [meta]);

  const keywordDensity = useMemo(() => {
    if (!meta.description || !meta.focusKeyword) return 0;
    const phraseCount = meta.description.toLowerCase().split(meta.focusKeyword.toLowerCase()).length - 1;
    if (phraseCount <= 0) return 0;
    return Math.min(12, Math.round((phraseCount / countWords(meta.description)) * 1000) / 10);
  }, [meta.description, meta.focusKeyword]);

  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId);
    const template = SEO_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;
    const merged = { ...meta, ...template.fields };
    setMeta(merged);
    setStatus('editing');
  };

  const handleFieldChange = (key, value) => {
    setMeta((previous) => ({
      ...previous,
      [key]: value,
    }));
    setStatus('editing');
  };

  const handleSave = async () => {
    setStatus('saving');
    const payload = { ...meta, updatedAt: new Date().toISOString() };
    try {
      await onSave?.(payload);
      analytics.track(
        'seo_meta_manager_saved',
        {
          score,
          completion,
          keyword: meta.focusKeyword,
        },
        { source: analyticsMetadata.source ?? 'seo_console' },
      );
      setStatus('saved');
      setLastSavedAt(new Date());
    } catch (error) {
      setStatus('error');
      analytics.track(
        'seo_meta_manager_save_failed',
        {
          message: error?.message ?? 'unknown_error',
        },
        { source: analyticsMetadata.source ?? 'seo_console' },
      );
    }
  };

  return (
    <section className="relative overflow-hidden rounded-4xl border border-white/10 bg-slate-950/70 p-10 text-white shadow-[0_50px_160px_rgba(8,47,73,0.55)]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_65%)]" aria-hidden="true" />
      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="flex w-full flex-col gap-8 lg:w-2/3">
          <header className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-100">
              SEO control centre
              <SparklesIcon className="h-4 w-4" aria-hidden="true" />
            </p>
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Craft metadata that wins premium SERP real estate.</h2>
              <p className="text-sm text-slate-200/70">
                Apply guided templates, resolve issues in-line, and preview how your page appears across Google, LinkedIn, and X
                in seconds.
              </p>
            </div>
          </header>

          <div className="grid gap-4 sm:grid-cols-3">
            {SEO_TEMPLATES.map((template) => {
              const active = template.id === selectedTemplate;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateChange(template.id)}
                  className={clsx(
                    'group flex flex-col gap-2 rounded-3xl border px-4 py-5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300',
                    active
                      ? 'border-cyan-200/60 bg-cyan-200/10 shadow-[0_20px_60px_rgba(8,47,73,0.45)]'
                      : 'border-white/10 bg-white/5 hover:border-cyan-200/40 hover:bg-cyan-200/5',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-100/80">{template.label}</span>
                    {active ? <CheckCircleIcon className="h-5 w-5 text-cyan-200" aria-hidden="true" /> : <InformationCircleIcon className="h-5 w-5 text-white/40" aria-hidden="true" />}
                  </div>
                  <p className="text-xs text-white/60">{template.helper}</p>
                </button>
              );
            })}
          </div>

          <div className="grid gap-6 rounded-4xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.35)] lg:grid-cols-2">
            {FIELD_CONFIG.map((field) => {
              const value = meta[field.key] ?? '';
              const validationState = validation[field.key];
              const issue = issues.find((item) => item.field === field.key);
              const isTextarea = field.key === 'description' || field.key === 'ogDescription';
              return (
                <label key={field.key} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">{field.label}</span>
                    <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/50">{value.length} chars</span>
                  </div>
                  {isTextarea ? (
                    <textarea
                      value={value}
                      onChange={(event) => handleFieldChange(field.key, event.target.value)}
                      rows={4}
                      className={clsx(
                        'rounded-3xl border bg-slate-950/40 p-4 text-sm text-white shadow-inner transition focus:border-cyan-200 focus:outline-none',
                        issue?.severity === 'error'
                          ? 'border-rose-400/70 shadow-[0_0_0_2px_rgba(248,113,113,0.45)]'
                          : issue?.severity === 'warning'
                            ? 'border-amber-300/70'
                            : 'border-white/10 focus:border-cyan-200/80',
                      )}
                    />
                  ) : (
                    <input
                      value={value}
                      onChange={(event) => handleFieldChange(field.key, event.target.value)}
                      className={clsx(
                        'rounded-full border bg-slate-950/40 px-4 py-3 text-sm text-white shadow-inner transition focus:border-cyan-200 focus:outline-none',
                        issue?.severity === 'error'
                          ? 'border-rose-400/70 shadow-[0_0_0_2px_rgba(248,113,113,0.35)]'
                          : issue?.severity === 'warning'
                            ? 'border-amber-300/70'
                            : 'border-white/10 focus:border-cyan-200/80',
                      )}
                    />
                  )}
                  <div className="flex items-center gap-2 text-[11px] text-white/50">
                    {issue ? (
                      issue.severity === 'error' ? (
                        <ExclamationTriangleIcon className="h-4 w-4 text-rose-400" aria-hidden="true" />
                      ) : (
                        <InformationCircleIcon className="h-4 w-4 text-amber-300" aria-hidden="true" />
                      )
                    ) : (
                      <CheckCircleIcon className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                    )}
                    <span>{issue?.label ?? validationState.message ?? field.helper}</span>
                  </div>
                </label>
              );
            })}
          </div>

          <footer className="flex flex-col gap-4 rounded-4xl border border-white/10 bg-white/5 p-6 shadow-[0_40px_100px_rgba(8,47,73,0.45)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <BoltIcon className="h-6 w-6 text-cyan-200" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-white">Completion {completion}% · SEO score {score}/100</p>
                <p className="text-xs text-white/60">Keyword density: {keywordDensity}%</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setMeta((previous) => ({ ...previous, ...SEO_TEMPLATES.find((item) => item.id === selectedTemplate)?.fields }))}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-200/60 bg-transparent px-5 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100 transition hover:bg-cyan-200/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
              >
                <SparklesIcon className="h-4 w-4" aria-hidden="true" />
                Apply template
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 px-6 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-slate-950 shadow-[0_18px_45px_rgba(34,211,238,0.45)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
                disabled={status === 'saving'}
              >
                Save metadata
              </button>
              <button
                type="button"
                onClick={() => setStatus('preview')}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-transparent px-5 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-white/80 transition hover:border-cyan-200/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
              >
                <EyeIcon className="h-4 w-4" aria-hidden="true" />
                Preview modes
              </button>
            </div>
          </footer>
          {lastSavedAt ? (
            <p className="text-xs text-white/50">Last saved {lastSavedAt.toLocaleString()}</p>
          ) : null}
          {status === 'error' ? (
            <p className="text-xs text-rose-300">We couldn’t save changes—retry or check your connection.</p>
          ) : null}
        </div>

        <aside className="flex w-full flex-col gap-6 lg:w-1/3">
          <div className="space-y-4 rounded-4xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_rgba(8,47,73,0.45)]">
            <h3 className="text-sm font-semibold uppercase tracking-[0.32em] text-white/70">SERP preview</h3>
            <div className="space-y-2 rounded-3xl border border-white/10 bg-slate-950/60 p-5 text-left shadow-inner">
              <p className="text-sm text-emerald-300">{preview.url}</p>
              <p className="text-lg font-semibold text-blue-100">{preview.title}</p>
              <p className="text-sm text-white/70">{preview.description}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 shadow-inner">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">Social preview</p>
              <div className="mt-3 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80">
                <div className="h-32 w-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" aria-hidden="true" />
                <div className="space-y-2 p-4">
                  <p className="text-sm font-semibold text-white">{meta.ogTitle || 'Open Graph title preview'}</p>
                  <p className="text-xs text-white/60">{meta.ogDescription || 'Add an Open Graph description to shine on social.'}</p>
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/40">
                    <LinkIcon className="h-4 w-4" aria-hidden="true" />
                    {meta.canonicalUrl?.replace(/^https?:\/\//, '') || 'gigvora.com'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-4xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_rgba(8,47,73,0.45)]">
            <h3 className="text-sm font-semibold uppercase tracking-[0.32em] text-white/70">Issues & optimisation tips</h3>
            <ul className="space-y-3 text-sm text-white/70">
              {issues.map((item) => (
                <li key={item.field} className="flex items-start gap-2">
                  {item.severity === 'error' ? (
                    <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 text-rose-400" aria-hidden="true" />
                  ) : (
                    <InformationCircleIcon className="mt-0.5 h-4 w-4 text-amber-300" aria-hidden="true" />
                  )}
                  <span>{item.label}</span>
                </li>
              ))}
              {issues.length === 0 ? <li className="flex items-start gap-2 text-emerald-200"><CheckCircleIcon className="mt-0.5 h-4 w-4" aria-hidden="true" /> All checks passed.</li> : null}
            </ul>
            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 text-xs text-white/60 shadow-inner">
              <p className="mb-2 font-semibold uppercase tracking-[0.32em] text-white/50">Optimisation guidance</p>
              <ul className="space-y-2">
                {optimisationTips.map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <ClipboardDocumentListIcon className="mt-0.5 h-4 w-4 text-cyan-200" aria-hidden="true" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-4 rounded-4xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_rgba(8,47,73,0.45)]">
            <h3 className="text-sm font-semibold uppercase tracking-[0.32em] text-white/70">Engagement telemetry</h3>
            <dl className="grid grid-cols-2 gap-4 text-left text-sm">
              <div className="space-y-1 rounded-3xl border border-white/10 bg-slate-950/50 p-4 shadow-inner">
                <dt className="text-xs uppercase tracking-[0.32em] text-white/50">Focus keyphrase</dt>
                <dd className="text-white/80">{meta.focusKeyword || 'Not set'}</dd>
              </div>
              <div className="space-y-1 rounded-3xl border border-white/10 bg-slate-950/50 p-4 shadow-inner">
                <dt className="text-xs uppercase tracking-[0.32em] text-white/50">Word count</dt>
                <dd className="text-white/80">{countWords(meta.description)} words</dd>
              </div>
              <div className="space-y-1 rounded-3xl border border-white/10 bg-slate-950/50 p-4 shadow-inner">
                <dt className="text-xs uppercase tracking-[0.32em] text-white/50">Preview status</dt>
                <dd className="text-white/80">{status === 'preview' ? 'Serp & social previews synced' : 'Live editing'}</dd>
              </div>
              <div className="space-y-1 rounded-3xl border border-white/10 bg-slate-950/50 p-4 shadow-inner">
                <dt className="text-xs uppercase tracking-[0.32em] text-white/50">Templates applied</dt>
                <dd className="text-white/80">{selectedTemplate}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </section>
  );
}

SeoMetaManager.propTypes = {
  initialMeta: PropTypes.object,
  analyticsMetadata: PropTypes.shape({
    source: PropTypes.string,
  }),
  onChange: PropTypes.func,
  onSave: PropTypes.func,
};
