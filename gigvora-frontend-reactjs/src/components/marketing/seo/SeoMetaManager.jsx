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
import { fetchSeoConsoleSnapshot } from '../../../services/seoConsole.js';
import { updateSeoSettings } from '../../../services/seoSettings.js';

function keywordsToString(keywords) {
  if (!Array.isArray(keywords)) {
    return '';
  }
  return keywords.join(', ');
}

function stringToKeywords(value) {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

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

function canonicalPathFromUrl(url) {
  if (!url) {
    return null;
  }
  try {
    const parsed = new URL(url, 'https://example.com');
    return parsed.pathname || '/';
  } catch (error) {
    return url.startsWith('/') ? url : null;
  }
}

function matchTemplateForPath(templates, path) {
  const normalised = path || '/';
  return templates.find((template) => {
    const canonical = canonicalPathFromUrl(template.fields?.canonicalUrl);
    return canonical ? canonical === normalised : false;
  });
}

function buildMetaFromSources(settings, override, template, path) {
  if (!settings) {
    return {};
  }
  const templateFields = template?.fields ?? {};
  const baseKeywords = override?.keywords?.length
    ? override.keywords
    : Array.isArray(templateFields.keywords)
      ? templateFields.keywords
      : stringToKeywords(templateFields.keywords ?? '') || settings.defaultKeywords;
  const baseUrl = (settings.canonicalBaseUrl || '').replace(/\/$/, '');
  const canonicalFromSettings = baseUrl ? `${baseUrl}${path === '/' ? '' : path}` : '';

  return {
    title: override?.title || templateFields.title || settings.defaultTitle || '',
    description:
      override?.description || templateFields.description || settings.defaultDescription || '',
    canonicalUrl:
      override?.canonicalUrl || templateFields.canonicalUrl || canonicalFromSettings || '',
    robots: override?.robots || templateFields.robots || 'index,follow',
    focusKeyword: override?.focusKeyword || templateFields.focusKeyword || '',
    keywords: keywordsToString(baseKeywords),
    ogTitle:
      override?.social?.ogTitle || templateFields.ogTitle || settings.socialDefaults?.ogTitle || '',
    ogDescription:
      override?.social?.ogDescription ||
      templateFields.ogDescription ||
      settings.socialDefaults?.ogDescription ||
      '',
    ogImage:
      override?.social?.ogImageUrl ||
      templateFields.ogImageUrl ||
      settings.socialDefaults?.ogImageUrl ||
      '',
    twitterCard: override?.twitter?.cardType || templateFields.twitterCard || 'summary_large_image',
  };
}

const FIELD_LIMITS = {
  title: { min: 35, max: 60 },
  description: { min: 110, max: 160 },
  ogTitle: { min: 35, max: 65 },
  ogDescription: { min: 110, max: 200 },
};

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

export default function SeoMetaManager({
  pagePath = '/',
  initialMeta = {},
  analyticsMetadata = {},
  onChange,
  onSave,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedPath, setSelectedPath] = useState(pagePath || '/');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [meta, setMeta] = useState(normaliseInitialMeta(initialMeta));
  const [status, setStatus] = useState('editing');
  const [lastSavedAt, setLastSavedAt] = useState(null);

  useEffect(() => {
    onChange?.(meta);
  }, [meta, onChange]);

  useEffect(() => {
    let active = true;
    async function loadSnapshot() {
      setLoading(true);
      setError(null);
      try {
        const snapshot = await fetchSeoConsoleSnapshot();
        if (!active) return;
        const snapshotSettings = snapshot.settings ?? null;
        const snapshotTemplates = snapshot.metaTemplates ?? [];
        const snapshotRoutes = snapshot.routes?.entries ?? [];
        setSettings(snapshotSettings);
        setTemplates(snapshotTemplates);
        setRoutes(snapshotRoutes);
        const resolvedPath =
          snapshotRoutes.find((entry) => entry.path === (pagePath || '/'))?.path ||
          snapshotRoutes[0]?.path ||
          pagePath ||
          '/';
        setSelectedPath(resolvedPath);
        const matchedTemplate =
          matchTemplateForPath(snapshotTemplates, resolvedPath) ||
          snapshotTemplates.find((template) => template.isDefault) ||
          null;
        setSelectedTemplate(matchedTemplate?.slug ?? null);
        const override = snapshotSettings?.pageOverrides?.find((item) => item.path === resolvedPath);
        setMeta(
          buildMetaFromSources(snapshotSettings, override, matchedTemplate, resolvedPath),
        );
        setStatus('editing');
      } catch (err) {
        if (!active) return;
        setError(err);
        setMeta((previous) =>
          Object.keys(previous).length ? previous : normaliseInitialMeta(initialMeta),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadSnapshot();
    return () => {
      active = false;
    };
  }, [pagePath, initialMeta]);

  useEffect(() => {
    if (!settings) {
      return;
    }
    const override = settings.pageOverrides?.find((item) => item.path === selectedPath);
    const matchedTemplate =
      templates.find((template) => template.slug === selectedTemplate) ||
      matchTemplateForPath(templates, selectedPath) ||
      templates.find((template) => template.isDefault) ||
      null;
    setSelectedTemplate((previous) => previous ?? matchedTemplate?.slug ?? null);
    setMeta(buildMetaFromSources(settings, override, matchedTemplate, selectedPath));
    setStatus('editing');
  }, [selectedPath, settings, templates]);

  useEffect(() => {
    if (!settings || loading || error) {
      return;
    }
    analytics.track(
      'seo_meta_manager_viewed',
      { path: selectedPath, template: selectedTemplate },
      { source: analyticsMetadata.source ?? 'seo_console' },
    );
  }, [settings, loading, error, selectedPath, selectedTemplate, analyticsMetadata.source]);

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

  const selectedRoute = useMemo(
    () => routes.find((route) => route.path === selectedPath) ?? null,
    [routes, selectedPath],
  );

  const applyTemplate = (template) => {
    if (!template) {
      return;
    }
    const templateMeta = buildMetaFromSources(settings, null, template, selectedPath);
    setMeta((previous) => ({
      ...previous,
      ...templateMeta,
    }));
    setStatus('editing');
  };

  const handleTemplateChange = (slug) => {
    const template = templates.find((item) => item.slug === slug);
    setSelectedTemplate(slug);
    applyTemplate(template);
    if (template) {
      analytics.track(
        'seo_meta_template_selected',
        { template: slug, path: selectedPath },
        { source: analyticsMetadata.source ?? 'seo_console' },
      );
    }
  };

  const handleApplyTemplate = () => {
    const template = templates.find((item) => item.slug === selectedTemplate);
    if (!template) {
      return;
    }
    applyTemplate(template);
    analytics.track(
      'seo_meta_template_applied',
      { template: selectedTemplate, path: selectedPath },
      { source: analyticsMetadata.source ?? 'seo_console' },
    );
  };

  const handleFieldChange = (key, value) => {
    setMeta((previous) => ({
      ...previous,
      [key]: value,
    }));
    setStatus('editing');
  };

  const handleSave = async () => {
    if (!settings) {
      return;
    }
    setStatus('saving');
    const keywordsArray = stringToKeywords(meta.keywords);
    const existingOverride = settings.pageOverrides?.find((item) => item.path === selectedPath);
    const overridePayload = {
      ...(existingOverride?.id ? { id: existingOverride.id } : {}),
      path: selectedPath,
      title: meta.title.trim(),
      description: meta.description.trim(),
      keywords: keywordsArray,
      focusKeyword: meta.focusKeyword.trim(),
      canonicalUrl: meta.canonicalUrl.trim(),
      robots: meta.robots.trim(),
      ogTitle: meta.ogTitle.trim(),
      ogDescription: meta.ogDescription.trim(),
      ogImageUrl: meta.ogImage.trim(),
      twitterTitle: meta.ogTitle.trim(),
      twitterDescription: meta.ogDescription.trim(),
      twitterImageUrl: meta.ogImage.trim(),
      twitterCardType: meta.twitterCard,
      twitterHandle: existingOverride?.twitter?.twitterHandle ?? '',
      metaTags: existingOverride?.metaTags ?? [],
      noindex: existingOverride?.noindex ?? false,
      structuredData: existingOverride?.structuredData ?? {},
    };

    const payload = {
      siteName: settings.siteName,
      defaultTitle: settings.defaultTitle,
      defaultDescription: settings.defaultDescription,
      defaultKeywords: settings.defaultKeywords,
      canonicalBaseUrl: settings.canonicalBaseUrl,
      sitemapUrl: settings.sitemapUrl,
      allowIndexing: settings.allowIndexing,
      robotsPolicy: settings.robotsPolicy,
      noindexPaths: settings.noindexPaths,
      verificationCodes: settings.verificationCodes,
      socialDefaults: settings.socialDefaults,
      structuredData: settings.structuredData,
      pageOverrides: [
        ...(settings.pageOverrides?.filter((item) => item.path !== selectedPath) ?? []),
        overridePayload,
      ],
    };

    try {
      const response = await updateSeoSettings(payload);
      setSettings(response);
      const updatedOverride = response.pageOverrides?.find((item) => item.path === selectedPath);
      const template = templates.find((item) => item.slug === selectedTemplate) || null;
      setMeta(buildMetaFromSources(response, updatedOverride, template, selectedPath));
      analytics.track(
        'seo_meta_manager_saved',
        { score, completion, keyword: meta.focusKeyword, path: selectedPath },
        { source: analyticsMetadata.source ?? 'seo_console' },
      );
      setStatus('saved');
      setLastSavedAt(new Date());
      onSave?.(overridePayload);
    } catch (error) {
      setStatus('error');
      analytics.track(
        'seo_meta_manager_save_failed',
        { message: error?.message ?? 'unknown_error', path: selectedPath },
        { source: analyticsMetadata.source ?? 'seo_console' },
      );
    }
  };

  if (loading) {
    return (
      <section className="relative overflow-hidden rounded-4xl border border-white/10 bg-slate-950/70 p-10 text-white shadow-[0_50px_160px_rgba(8,47,73,0.55)]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_65%)]" aria-hidden="true" />
        <div className="flex min-h-[240px] items-center justify-center text-sm text-white/60">
          Loading SEO console data…
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative overflow-hidden rounded-4xl border border-rose-500/40 bg-rose-950/60 p-10 text-white shadow-[0_50px_160px_rgba(76,5,25,0.45)]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.12),_transparent_65%)]" aria-hidden="true" />
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-sm">
          <ExclamationTriangleIcon className="h-6 w-6 text-amber-300" aria-hidden="true" />
          <p className="text-center text-white/80">We couldn’t load the SEO console snapshot. Please retry later.</p>
          <p className="text-xs text-white/50">{error?.message ?? 'Unknown error'}</p>
        </div>
      </section>
    );
  }

  if (!settings) {
    return null;
  }

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

          <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.35)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">Active page</span>
                <p className="text-xs text-white/50">
                  {selectedRoute?.title ? `${selectedRoute.title} · ${selectedPath}` : selectedPath}
                </p>
              </div>
              <select
                value={selectedPath}
                onChange={(event) => setSelectedPath(event.target.value)}
                className="rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-white shadow-inner focus:border-cyan-200 focus:outline-none"
              >
                {routes.length === 0 && <option value={selectedPath}>{selectedPath}</option>}
                {routes.map((route) => (
                  <option key={route.path} value={route.path}>
                    {route.title ? `${route.title} · ${route.path}` : route.path}
                  </option>
                ))}
              </select>
            </div>
            {selectedRoute && (
              <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-white/50">
                <span
                  className={clsx(
                    'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
                    selectedRoute.indexed ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-100',
                  )}
                >
                  {selectedRoute.indexed ? 'Indexable' : 'Noindex'}
                </span>
                {selectedRoute.collection && <span>{selectedRoute.collection}</span>}
                {selectedRoute.indexingStatus === 'settings_noindex' && (
                  <span>Controlled by settings</span>
                )}
                {selectedRoute.indexingStatus === 'metadata_blocked' && <span>Metadata blocked</span>}
                {selectedRoute.indexingStatus === 'global_disabled' && <span>Global indexing disabled</span>}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {templates.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 px-4 py-6 text-center text-xs text-white/50">
                No SEO templates configured. Administrators can add templates in the SEO console settings.
              </div>
            ) : (
              templates.map((template) => {
                const active = template.slug === selectedTemplate;
                return (
                  <button
                    key={template.slug}
                    type="button"
                    onClick={() => handleTemplateChange(template.slug)}
                    className={clsx(
                      'group flex flex-col gap-2 rounded-3xl border px-4 py-5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300',
                      active
                        ? 'border-cyan-200/60 bg-cyan-200/10 shadow-[0_20px_60px_rgba(8,47,73,0.45)]'
                        : 'border-white/10 bg-white/5 hover:border-cyan-200/40 hover:bg-cyan-200/5',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-100/80">{template.label}</span>
                      {active ? (
                        <CheckCircleIcon className="h-5 w-5 text-cyan-200" aria-hidden="true" />
                      ) : (
                        <InformationCircleIcon className="h-5 w-5 text-white/40" aria-hidden="true" />
                      )}
                    </div>
                    <p className="text-xs text-white/60">{template.description || 'Curated metadata baseline for this page type.'}</p>
                  </button>
                );
              })
            )}
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
                onClick={handleApplyTemplate}
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
  pagePath: PropTypes.string,
  initialMeta: PropTypes.object,
  analyticsMetadata: PropTypes.shape({
    source: PropTypes.string,
  }),
  onChange: PropTypes.func,
  onSave: PropTypes.func,
};

SeoMetaManager.defaultProps = {
  pagePath: '/',
  initialMeta: {},
  analyticsMetadata: {},
  onChange: undefined,
  onSave: undefined,
};
