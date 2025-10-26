import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  ArrowDownTrayIcon,
  ChartPieIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  QueueListIcon,
  SparklesIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import analytics from '../../../services/analytics.js';
import {
  fetchSeoConsoleSnapshot,
  fetchSeoSitemapJobs,
  generateSeoConsoleSitemap,
  submitSeoConsoleSitemapJob,
} from '../../../services/seoConsole.js';

const DEFAULT_ROUTES = [
  { path: '/', priority: 1, changefreq: 'daily', lastModified: '2024-05-12', type: 'Marketing', indexed: true },
  { path: '/launchpad', priority: 0.9, changefreq: 'weekly', lastModified: '2024-05-08', type: 'Product', indexed: true },
  { path: '/stories', priority: 0.7, changefreq: 'weekly', lastModified: '2024-05-04', type: 'Editorial', indexed: true },
  { path: '/stories/mentorship-operating-system', priority: 0.6, changefreq: 'monthly', lastModified: '2024-04-23', type: 'Editorial', indexed: false },
  { path: '/pricing', priority: 0.8, changefreq: 'monthly', lastModified: '2024-05-01', type: 'Marketing', indexed: true },
  { path: '/jobs', priority: 0.7, changefreq: 'daily', lastModified: '2024-05-12', type: 'Jobs', indexed: true },
  { path: '/mentors', priority: 0.6, changefreq: 'weekly', lastModified: '2024-05-09', type: 'Network', indexed: true },
  { path: '/press', priority: 0.5, changefreq: 'monthly', lastModified: '2024-04-29', type: 'Marketing', indexed: false },
];

const SCHEDULES = ['Hourly', 'Daily', 'Weekly', 'Monthly'];

function normaliseRoutes(routes) {
  const source = Array.isArray(routes) && routes.length ? routes : DEFAULT_ROUTES;
  return source
    .map((route) => {
      if (!route?.path) return null;
      const path = route.path.startsWith('/') ? route.path : `/${route.path}`;
      return {
        path,
        priority: typeof route.priority === 'number' ? route.priority : 0.5,
        changefreq: route.changefreq ?? 'monthly',
        lastModified: route.lastModified ?? null,
        type: route.collection ?? route.type ?? 'Other',
        indexed: route.indexed !== false,
        images: Array.isArray(route.images) ? route.images : [],
      };
    })
    .filter(Boolean);
}

export default function SitemapGenerator({
  routes = DEFAULT_ROUTES,
  initialBaseUrl = 'https://gigvora.com',
  analyticsMetadata = {},
  onGenerate,
}) {
  const [settings, setSettings] = useState(null);
  const [routesState, setRoutesState] = useState(() => normaliseRoutes(routes));
  const fallbackRoutes = useMemo(() => normaliseRoutes(routes), [routes]);
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl || 'https://gigvora.com');
  const [selectedTypes, setSelectedTypes] = useState(new Set());
  const [includeImages, setIncludeImages] = useState(true);
  const [includeLastModified, setIncludeLastModified] = useState(true);
  const [schedule, setSchedule] = useState('Daily');
  const [xmlOutput, setXmlOutput] = useState('');
  const [activeJob, setActiveJob] = useState(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [excludedRoutes, setExcludedRoutes] = useState([]);
  const [generationStatus, setGenerationStatus] = useState('idle');
  const [generationError, setGenerationError] = useState(null);
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadJobs = useCallback(async () => {
    try {
      const response = await fetchSeoSitemapJobs({ limit: 10 });
      setJobs(Array.isArray(response?.jobs) ? response.jobs : []);
    } catch (err) {
      setJobs([]);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    let active = true;
    async function loadSnapshot() {
      setLoading(true);
      setError(null);
      try {
        const snapshot = await fetchSeoConsoleSnapshot();
        if (!active) return;
        const snapshotRoutes = normaliseRoutes(snapshot.routes?.entries);
        setRoutesState(snapshotRoutes.length ? snapshotRoutes : fallbackRoutes);
        setSettings(snapshot.settings ?? null);
        const resolvedBaseUrl =
          snapshot.settings?.canonicalBaseUrl ||
          snapshot.settings?.sitemapUrl ||
          initialBaseUrl ||
          'https://gigvora.com';
        setBaseUrl((current) => (current && current.length ? current : resolvedBaseUrl));
        if (snapshot.sitemap?.lastJob) {
          const lastJob = snapshot.sitemap.lastJob;
          setActiveJob(lastJob);
          setXmlOutput(lastJob.xml ?? '');
          setLastGeneratedAt(lastJob.generatedAt ? new Date(lastJob.generatedAt) : null);
          setSubmitStatus(lastJob.submittedAt ? 'submitted' : 'idle');
        }
      } catch (err) {
        if (!active) return;
        setError(err);
        setRoutesState((current) => (current.length ? current : fallbackRoutes));
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
  }, [fallbackRoutes, initialBaseUrl]);

  useEffect(() => {
    if (!routesState.length) {
      setSelectedTypes(new Set());
      return;
    }
    const availableTypes = new Set(routesState.map((route) => route.type ?? 'Other'));
    setSelectedTypes((previous) => {
      if (previous.size === 0) {
        return availableTypes;
      }
      const next = new Set();
      previous.forEach((type) => {
        if (availableTypes.has(type)) {
          next.add(type);
        }
      });
      if (next.size === 0) {
        return availableTypes;
      }
      availableTypes.forEach((type) => {
        if (!previous.has(type)) {
          next.add(type);
        }
      });
      return next;
    });
  }, [routesState]);
  const groupedRoutes = useMemo(() => {
    return routesState.reduce((accumulator, route) => {
      const key = route.type ?? 'Other';
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(route);
      return accumulator;
    }, {});
  }, [routesState]);

  const selectedRoutes = useMemo(() => {
    if (selectedTypes.size === 0) {
      return routesState;
    }
    return routesState.filter((route) => selectedTypes.has(route.type ?? 'Other'));
  }, [routesState, selectedTypes]);

  const coverage = useMemo(() => {
    const total = routesState.length;
    const selected = selectedRoutes.length;
    const indexed = selectedRoutes.filter((route) => route.indexed).length;
    const warnings = selectedRoutes.filter((route) => !route.indexed).length;
    return {
      total,
      selected,
      indexed,
      warnings,
      coverage: total === 0 ? 0 : Math.round((selected / total) * 100),
    };
  }, [routesState, selectedRoutes]);

  const healthStatus = useMemo(() => {
    if (!selectedRoutes.length) {
      return { label: 'Action required', tone: 'warning', helper: 'Select sections to generate a sitemap.' };
    }
    if (coverage.warnings > 0 || excludedRoutes.length > 0) {
      return {
        label: 'Needs attention',
        tone: 'warning',
        helper: excludedRoutes.length
          ? 'Excluded non-indexable URLs during generation. Review directives.'
          : 'Some selected URLs are marked noindex—review directives.',
      };
    }
    return { label: 'Healthy', tone: 'success', helper: 'All selected URLs are indexable.' };
  }, [coverage.warnings, excludedRoutes.length, selectedRoutes.length]);

  const displayedLastGeneratedAt = useMemo(() => {
    if (lastGeneratedAt) {
      return lastGeneratedAt;
    }
    if (activeJob?.generatedAt) {
      return new Date(activeJob.generatedAt);
    }
    if (jobs.length && jobs[0]?.generatedAt) {
      return new Date(jobs[0].generatedAt);
    }
    return null;
  }, [activeJob, jobs, lastGeneratedAt]);

  const submissionLabel = useMemo(() => {
    if (submitStatus === 'submitted') return 'Submitted to search console';
    if (submitStatus === 'submitting') return 'Submitting…';
    if (submitStatus === 'error') return 'Submission failed';
    if (activeJob) return 'Awaiting submission';
    return 'Generate sitemap first';
  }, [activeJob, submitStatus]);

  const submitButtonLabel = useMemo(() => {
    if (submitStatus === 'submitted') return 'Submitted';
    if (submitStatus === 'submitting') return 'Submitting…';
    if (submitStatus === 'error') return 'Retry submission';
    return 'Submit to console';
  }, [submitStatus]);

  const handleToggleType = (type) => {
    setSelectedTypes((previous) => {
      const next = new Set(previous);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const handleGenerate = async () => {
    setGenerationStatus('working');
    setGenerationError(null);
    try {
      const payload = {
        baseUrl: baseUrl?.trim(),
        includeImages,
        includeLastModified,
      };
      const response = await generateSeoConsoleSitemap(payload);
      const jobPayload = response?.job ?? null;
      setXmlOutput(response?.xml ?? '');
      setExcludedRoutes(response?.excluded ?? []);
      if (jobPayload) {
        setActiveJob(jobPayload);
        setLastGeneratedAt(jobPayload.generatedAt ? new Date(jobPayload.generatedAt) : new Date());
        setSubmitStatus(jobPayload.submittedAt ? 'submitted' : 'idle');
      } else {
        setLastGeneratedAt(new Date());
      }
      analytics.track(
        'seo_sitemap_generated',
        {
          baseUrl: payload.baseUrl,
          entryCount: jobPayload?.indexedUrls ?? selectedRoutes.length,
          schedule,
          includeImages,
          includeLastModified,
        },
        { source: analyticsMetadata.source ?? 'seo_console' },
      );
      onGenerate?.({
        xml: response?.xml ?? '',
        coverage,
        schedule,
        includeImages,
        includeLastModified,
        job: jobPayload,
      });
      await loadJobs();
    } catch (err) {
      setGenerationError(err);
      analytics.track(
        'seo_sitemap_generation_failed',
        { baseUrl, message: err?.message ?? 'unknown_error' },
        { source: analyticsMetadata.source ?? 'seo_console' },
      );
    } finally {
      setGenerationStatus('idle');
    }
  };

  const handleDownload = () => {
    if (!xmlOutput) return;
    const blob = new Blob([xmlOutput], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'sitemap.xml';
    anchor.click();
    URL.revokeObjectURL(url);
    analytics.track(
      'seo_sitemap_downloaded',
      { entries: activeJob?.indexedUrls ?? selectedRoutes.length },
      { source: analyticsMetadata.source ?? 'seo_console' },
    );
  };

  const handleSubmit = async () => {
    if (!activeJob?.id) {
      return;
    }
    setSubmitStatus('submitting');
    try {
      const response = await submitSeoConsoleSitemapJob(activeJob.id, {
        notes: `Submitted via SEO console on ${new Date().toISOString()}`,
      });
      const jobPayload = response?.job ?? response;
      setActiveJob(jobPayload);
      setSubmitStatus('submitted');
      await loadJobs();
      analytics.track(
        'seo_sitemap_submitted',
        { jobId: jobPayload.id, baseUrl },
        { source: analyticsMetadata.source ?? 'seo_console' },
      );
    } catch (err) {
      setSubmitStatus('error');
      analytics.track(
        'seo_sitemap_submission_failed',
        { jobId: activeJob.id, message: err?.message ?? 'unknown_error' },
        { source: analyticsMetadata.source ?? 'seo_console' },
      );
    }
  };

  if (loading) {
    return (
      <section className="relative overflow-hidden rounded-4xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-10 text-white shadow-[0_60px_180px_rgba(8,47,73,0.55)]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.18),_transparent_65%)]" aria-hidden="true" />
        <div className="flex min-h-[240px] items-center justify-center text-sm text-white/60">Loading sitemap console data…</div>
      </section>
    );
  }

  const excludedRoutePreview = excludedRoutes.slice(0, 5);

  return (
    <section className="relative overflow-hidden rounded-4xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-10 text-white shadow-[0_60px_180px_rgba(8,47,73,0.55)]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.18),_transparent_65%)]" aria-hidden="true" />
      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="flex w-full flex-col gap-8 lg:w-2/3">
          <header className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200/30 bg-emerald-200/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-100">
              Sitemap orchestration
              <SparklesIcon className="h-4 w-4" aria-hidden="true" />
            </p>
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Generate pristine XML sitemaps with analytics baked in.</h2>
              <p className="text-sm text-white/70">
                Pick the surfaces to crawl, tune scheduling, and download or submit your sitemap without leaving the marketing control centre.
              </p>
            </div>
            {error ? (
              <div className="rounded-3xl border border-amber-300/60 bg-amber-300/10 p-4 text-xs text-amber-100 shadow-[0_12px_36px_rgba(245,158,11,0.25)]">
                <p className="font-semibold uppercase tracking-[0.32em]">Snapshot unavailable</p>
                <p>{error?.message ?? 'We could not refresh the latest sitemap data. Using cached values.'}</p>
              </div>
            ) : null}
          </header>

          <div className="grid gap-6 rounded-4xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.4)]">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">Base URL</span>
              <input
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                className="rounded-full border border-white/15 bg-slate-950/40 px-4 py-3 text-sm text-white shadow-inner focus:border-emerald-300 focus:outline-none"
                placeholder="https://gigvora.com"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(groupedRoutes).map(([type, typeRoutes]) => {
                const active = selectedTypes.has(type);
                const count = typeRoutes.length;
                const indexed = typeRoutes.filter((route) => route.indexed).length;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleToggleType(type)}
                    className={clsx(
                      'group flex flex-col gap-1 rounded-3xl border px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300',
                      active
                        ? 'border-emerald-200/60 bg-emerald-200/10 shadow-[0_20px_60px_rgba(5,150,105,0.35)]'
                        : 'border-white/10 bg-white/5 hover:border-emerald-200/40 hover:bg-emerald-200/5',
                    )}
                  >
                    <span className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">{type}</span>
                    <span className="text-lg font-semibold text-white">{count} URLs</span>
                    <span className="text-[11px] text-white/50">{indexed} indexable</span>
                  </button>
                );
              })}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm shadow-inner">
                <span className="flex items-center gap-2 text-white/70">
                  <DocumentTextIcon className="h-5 w-5" aria-hidden="true" /> Include images
                </span>
                <input
                  type="checkbox"
                  checked={includeImages}
                  onChange={(event) => setIncludeImages(event.target.checked)}
                  className="h-5 w-5 rounded border border-white/30 bg-slate-900 text-emerald-400"
                />
              </label>
              <label className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm shadow-inner">
                <span className="flex items-center gap-2 text-white/70">
                  <SunIcon className="h-5 w-5" aria-hidden="true" /> Include last modified
                </span>
                <input
                  type="checkbox"
                  checked={includeLastModified}
                  onChange={(event) => setIncludeLastModified(event.target.checked)}
                  className="h-5 w-5 rounded border border-white/30 bg-slate-900 text-emerald-400"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">Regeneration cadence</span>
                <div className="flex flex-wrap gap-2">
                  {SCHEDULES.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSchedule(option)}
                      className={clsx(
                        'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] transition',
                        schedule === option
                          ? 'border-emerald-200/60 bg-emerald-200/20 text-white shadow-[0_12px_30px_rgba(5,150,105,0.35)]'
                          : 'border-white/15 bg-transparent text-white/60 hover:border-emerald-200/40 hover:text-white',
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </label>
            </div>
          </div>

          <footer className="flex flex-col gap-4 rounded-4xl border border-white/10 bg-white/5 p-6 shadow-[0_40px_100px_rgba(5,150,105,0.4)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <ChartPieIcon className="h-6 w-6 text-emerald-200" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-white">
                  {coverage.selected} of {coverage.total} URLs selected · Coverage {coverage.coverage}%
                </p>
                <p className="text-xs text-white/60">
                  {coverage.warnings + excludedRoutes.length
                    ? `${coverage.warnings + excludedRoutes.length} URL(s) flagged`
                    : 'All URLs indexable'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 px-6 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-slate-950 shadow-[0_20px_55px_rgba(20,184,166,0.5)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200 disabled:opacity-60"
                disabled={generationStatus === 'working'}
              >
                {generationStatus === 'working' ? 'Generating…' : 'Generate sitemap'}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-transparent px-5 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-white/80 transition hover:border-emerald-200/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200 disabled:opacity-60"
                disabled={!xmlOutput}
              >
                <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                Download XML
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-transparent px-5 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-emerald-100 transition hover:bg-emerald-200/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200 disabled:opacity-60"
                disabled={!activeJob || submitStatus === 'submitting'}
              >
                <CloudArrowUpIcon className="h-4 w-4" aria-hidden="true" />
                {submitButtonLabel}
              </button>
            </div>
          </footer>
          {generationError ? (
            <p className="text-xs text-rose-300">Failed to generate sitemap: {generationError.message}</p>
          ) : null}
        </div>

        <aside className="flex w-full flex-col gap-6 lg:w-1/3">
          <div className="space-y-4 rounded-4xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_90px_rgba(5,150,105,0.35)]">
            <h3 className="text-sm font-semibold uppercase tracking-[0.32em] text-white/70">Health insights</h3>
            <div
              className={clsx(
                'flex items-start gap-3 rounded-3xl border px-4 py-4 shadow-inner',
                healthStatus.tone === 'success'
                  ? 'border-emerald-200/50 bg-emerald-200/10 text-emerald-100'
                  : 'border-amber-200/50 bg-amber-200/10 text-amber-100',
              )}
            >
              {healthStatus.tone === 'success' ? (
                <CheckCircleIcon className="mt-0.5 h-5 w-5" aria-hidden="true" />
              ) : (
                <ExclamationTriangleIcon className="mt-0.5 h-5 w-5" aria-hidden="true" />
              )}
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.32em]">{healthStatus.label}</p>
                <p className="text-xs text-white/80">{healthStatus.helper}</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-left text-sm text-white/70">
              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-inner">
                <dt className="text-xs uppercase tracking-[0.32em] text-white/50">Last generated</dt>
                <dd>{displayedLastGeneratedAt ? displayedLastGeneratedAt.toLocaleString() : 'Not run yet'}</dd>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-inner">
                <dt className="text-xs uppercase tracking-[0.32em] text-white/50">Submission status</dt>
                <dd>{submissionLabel}</dd>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-inner">
                <dt className="text-xs uppercase tracking-[0.32em] text-white/50">Indexed URLs</dt>
                <dd>{coverage.indexed}</dd>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-inner">
                <dt className="text-xs uppercase tracking-[0.32em] text-white/50">Warnings</dt>
                <dd>{coverage.warnings + excludedRoutes.length}</dd>
              </div>
            </dl>
            {excludedRoutes.length > 0 ? (
              <div className="rounded-3xl border border-amber-200/40 bg-amber-200/10 p-4 text-xs text-amber-100 shadow-inner">
                <p className="mb-1 font-semibold uppercase tracking-[0.32em] text-amber-200/80">Excluded URLs</p>
                <ul className="space-y-1">
                  {excludedRoutePreview.map((item) => (
                    <li key={item.path} className="flex items-center justify-between gap-3">
                      <span>{item.path}</span>
                      <span className="uppercase tracking-[0.28em] text-amber-200/70">{item.status.replace(/_/g, ' ')}</span>
                    </li>
                  ))}
                </ul>
                {excludedRoutes.length > excludedRoutePreview.length ? (
                  <p className="mt-2 text-amber-200/70">+{excludedRoutes.length - excludedRoutePreview.length} more suppressed routes</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="space-y-4 rounded-4xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_90px_rgba(5,150,105,0.35)]">
            <h3 className="text-sm font-semibold uppercase tracking-[0.32em] text-white/70">Activity log</h3>
            <ul className="space-y-3 text-sm text-white/70">
              {jobs.length === 0 ? <li className="text-white/50">No generation events recorded yet.</li> : null}
              {jobs.map((job) => {
                const tone = job.status === 'submitted' || job.status === 'generated' ? 'success' : job.status?.includes('warning') ? 'warning' : 'success';
                return (
                  <li
                    key={job.id}
                    className={clsx(
                      'rounded-3xl border px-4 py-3 shadow-inner',
                      tone === 'success'
                        ? 'border-emerald-200/40 bg-emerald-200/10 text-emerald-100'
                        : 'border-amber-200/40 bg-amber-200/10 text-amber-100',
                    )}
                  >
                    <p className="text-xs uppercase tracking-[0.32em]">{job.generatedAt ? new Date(job.generatedAt).toLocaleString() : 'Pending'}</p>
                    <p className="text-sm font-semibold text-white">
                      {job.status === 'submitted' ? 'Submitted to Search Console' : job.message || 'Sitemap generated'}
                    </p>
                    <p className="text-xs text-white/80">{job.indexedUrls ?? job.totalUrls ?? 0} URL(s) indexed</p>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-4 rounded-4xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_90px_rgba(5,150,105,0.35)]">
            <h3 className="text-sm font-semibold uppercase tracking-[0.32em] text-white/70">XML output</h3>
            <div className="max-h-64 overflow-auto rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-xs text-emerald-100 shadow-inner">
              <pre className="whitespace-pre-wrap break-all">{xmlOutput || 'Generate your sitemap to view XML output here.'}</pre>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 text-xs text-white/60 shadow-inner">
              <p className="mb-2 font-semibold uppercase tracking-[0.32em] text-white/50">Crawl guidance</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <QueueListIcon className="mt-0.5 h-4 w-4 text-emerald-200" aria-hidden="true" />
                  Submit weekly sitemaps for editorial surfaces to capture fresh content quickly.
                </li>
                <li className="flex items-start gap-2">
                  <InformationCircleIcon className="mt-0.5 h-4 w-4 text-emerald-200" aria-hidden="true" />
                  Pair generation cadence with automation so search engines receive consistent updates.
                </li>
                {settings?.sitemapUrl ? (
                  <li className="flex items-start gap-2">
                    <InformationCircleIcon className="mt-0.5 h-4 w-4 text-emerald-200" aria-hidden="true" />
                    Current sitemap published at {settings.sitemapUrl}.
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

SitemapGenerator.propTypes = {
  routes: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      priority: PropTypes.number,
      changefreq: PropTypes.string,
      lastModified: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      type: PropTypes.string,
      indexed: PropTypes.bool,
      images: PropTypes.arrayOf(PropTypes.string),
    }),
  ),
  initialBaseUrl: PropTypes.string,
  analyticsMetadata: PropTypes.shape({
    source: PropTypes.string,
  }),
  onGenerate: PropTypes.func,
};
