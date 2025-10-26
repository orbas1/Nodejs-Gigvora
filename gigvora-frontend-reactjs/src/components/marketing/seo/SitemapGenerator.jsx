import { useMemo, useState } from 'react';
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
  if (!Array.isArray(routes) || !routes.length) {
    return DEFAULT_ROUTES;
  }
  return routes
    .map((route) => {
      if (!route?.path) return null;
      return {
        path: route.path.startsWith('/') ? route.path : `/${route.path}`,
        priority: typeof route.priority === 'number' ? route.priority : 0.5,
        changefreq: route.changefreq ?? 'monthly',
        lastModified: route.lastModified ?? new Date().toISOString().slice(0, 10),
        type: route.type ?? 'Other',
        indexed: route.indexed ?? true,
        images: Array.isArray(route.images) ? route.images : [],
      };
    })
    .filter(Boolean);
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().split('T')[0];
}

function generateXml(baseUrl, routes, includeImages) {
  const origin = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const urls = routes
    .map((route) => {
      const parts = [];
      parts.push(`<url>`);
      parts.push(`<loc>${origin}${route.path}</loc>`);
      parts.push(`<priority>${route.priority.toFixed(1)}</priority>`);
      parts.push(`<changefreq>${route.changefreq}</changefreq>`);
      if (route.lastModified) {
        parts.push(`<lastmod>${formatDate(route.lastModified)}</lastmod>`);
      }
      if (includeImages && route.images?.length) {
        route.images.forEach((image) => {
          parts.push(`<image:image><image:loc>${image}</image:loc></image:image>`);
        });
      }
      parts.push(`</url>`);
      return parts.join('');
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${urls}</urlset>`;
}

export default function SitemapGenerator({
  routes = DEFAULT_ROUTES,
  initialBaseUrl = 'https://gigvora.com',
  analyticsMetadata = {},
  onGenerate,
}) {
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl);
  const normalisedRoutes = useMemo(() => normaliseRoutes(routes), [routes]);
  const [selectedTypes, setSelectedTypes] = useState(() => {
    const uniqueTypes = Array.from(new Set(normalisedRoutes.map((route) => route.type)));
    return new Set(uniqueTypes);
  });
  const [includeImages, setIncludeImages] = useState(true);
  const [includeLastModified, setIncludeLastModified] = useState(true);
  const [schedule, setSchedule] = useState('Daily');
  const [xmlOutput, setXmlOutput] = useState('');
  const [lastGeneratedAt, setLastGeneratedAt] = useState(null);
  const [logs, setLogs] = useState([]);
  const [submitStatus, setSubmitStatus] = useState('idle');

  const groupedRoutes = useMemo(() => {
    return normalisedRoutes.reduce((accumulator, route) => {
      const key = route.type ?? 'Other';
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(route);
      return accumulator;
    }, {});
  }, [normalisedRoutes]);

  const selectedRoutes = useMemo(() => {
    return normalisedRoutes.filter((route) => selectedTypes.has(route.type ?? 'Other'));
  }, [normalisedRoutes, selectedTypes]);

  const coverage = useMemo(() => {
    const total = normalisedRoutes.length;
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
  }, [normalisedRoutes.length, selectedRoutes]);

  const healthStatus = useMemo(() => {
    if (!selectedRoutes.length) {
      return { label: 'Action required', tone: 'warning', helper: 'Select sections to generate a sitemap.' };
    }
    if (coverage.warnings > 0) {
      return { label: 'Needs attention', tone: 'warning', helper: 'Some URLs are marked noindex—review directives.' };
    }
    return { label: 'Healthy', tone: 'success', helper: 'All selected URLs are indexable.' };
  }, [coverage.warnings, selectedRoutes.length]);

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

  const handleGenerate = () => {
    const routesForXml = includeLastModified
      ? selectedRoutes
      : selectedRoutes.map((route) => ({ ...route, lastModified: null }));
    const xml = generateXml(baseUrl, routesForXml, includeImages);
    setXmlOutput(xml);
    const timestamp = new Date();
    setLastGeneratedAt(timestamp);
    const logEntry = {
      id: timestamp.getTime(),
      status: coverage.warnings ? 'warning' : 'success',
      entries: routesForXml.length,
      message: coverage.warnings
        ? 'Generated sitemap with warnings (non-indexable URLs included).'
        : 'Sitemap generated successfully.',
      createdAt: timestamp,
    };
    setLogs((previous) => [logEntry, ...previous.slice(0, 6)]);
    analytics.track(
      'seo_sitemap_generated',
      {
        baseUrl,
        entryCount: routesForXml.length,
        schedule,
        includeImages,
        includeLastModified,
      },
      { source: analyticsMetadata.source ?? 'seo_console' },
    );
    onGenerate?.({ xml, coverage, schedule, includeImages, includeLastModified });
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
      { entries: selectedRoutes.length },
      { source: analyticsMetadata.source ?? 'seo_console' },
    );
  };

  const handleSubmit = () => {
    if (!xmlOutput) return;
    setSubmitStatus('submitting');
    setTimeout(() => {
      setSubmitStatus('success');
      analytics.track(
        'seo_sitemap_submitted',
        {
          schedule,
          baseUrl,
        },
        { source: analyticsMetadata.source ?? 'seo_console' },
      );
    }, 600);
  };

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
                Pick the surfaces to crawl, tune scheduling, and download or submit your sitemap without leaving the marketing
                control centre.
              </p>
            </div>
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
                <p className="text-xs text-white/60">{coverage.warnings ? `${coverage.warnings} URL(s) flagged noindex` : 'All URLs indexable'}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 px-6 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-slate-950 shadow-[0_20px_55px_rgba(20,184,166,0.5)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200"
              >
                Generate sitemap
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-transparent px-5 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-white/80 transition hover:border-emerald-200/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200"
                disabled={!xmlOutput}
              >
                <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                Download XML
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-transparent px-5 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-emerald-100 transition hover:bg-emerald-200/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200"
                disabled={!xmlOutput || submitStatus === 'submitting'}
              >
                <CloudArrowUpIcon className="h-4 w-4" aria-hidden="true" />
                Submit to console
              </button>
            </div>
          </footer>
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
                <dd>{lastGeneratedAt ? lastGeneratedAt.toLocaleString() : 'Not run yet'}</dd>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-inner">
                <dt className="text-xs uppercase tracking-[0.32em] text-white/50">Submission status</dt>
                <dd>
                  {submitStatus === 'success'
                    ? 'Submitted to search console'
                    : submitStatus === 'submitting'
                      ? 'Submitting…'
                      : 'Awaiting submission'}
                </dd>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-inner">
                <dt className="text-xs uppercase tracking-[0.32em] text-white/50">Indexed URLs</dt>
                <dd>{coverage.indexed}</dd>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-inner">
                <dt className="text-xs uppercase tracking-[0.32em] text-white/50">Warnings</dt>
                <dd>{coverage.warnings}</dd>
              </div>
            </dl>
          </div>

          <div className="space-y-4 rounded-4xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_90px_rgba(5,150,105,0.35)]">
            <h3 className="text-sm font-semibold uppercase tracking-[0.32em] text-white/70">Activity log</h3>
            <ul className="space-y-3 text-sm text-white/70">
              {logs.length === 0 ? <li className="text-white/50">No generation events recorded yet.</li> : null}
              {logs.map((log) => (
                <li
                  key={log.id}
                  className={clsx(
                    'rounded-3xl border px-4 py-3 shadow-inner',
                    log.status === 'success'
                      ? 'border-emerald-200/40 bg-emerald-200/10 text-emerald-100'
                      : 'border-amber-200/40 bg-amber-200/10 text-amber-100',
                  )}
                >
                  <p className="text-xs uppercase tracking-[0.32em]">{log.createdAt.toLocaleString()}</p>
                  <p className="text-sm font-semibold text-white">{log.message}</p>
                  <p className="text-xs text-white/80">{log.entries} URL(s) processed</p>
                </li>
              ))}
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
