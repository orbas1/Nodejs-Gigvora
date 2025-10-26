import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowDownTrayIcon,
  BoltIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  PlayCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const DEFAULT_HISTORY = [
  {
    id: 'run-12',
    startedAt: '2024-02-12T08:15:00.000Z',
    duration: 38,
    urls: 1264,
    warnings: 2,
    notes: 'Auto pinged Google & Bing, 2 redirects trimmed',
  },
  {
    id: 'run-11',
    startedAt: '2024-02-05T05:00:00.000Z',
    duration: 41,
    urls: 1248,
    warnings: 0,
    notes: 'Manual run before investor launch microsite went live',
  },
];

const DEFAULT_SECTIONS = [
  { id: 'executive-hub', label: 'Executive Hub', urls: 420, priority: 1, changefreq: 'weekly' },
  { id: 'mentors', label: 'Mentor Marketplace', urls: 275, priority: 0.9, changefreq: 'daily' },
  { id: 'opportunities', label: 'Opportunities', urls: 368, priority: 0.8, changefreq: 'daily' },
  { id: 'resources', label: 'Resources & Playbooks', urls: 146, priority: 0.6, changefreq: 'monthly' },
];

const SCHEDULE_OPTIONS = [
  { id: 'hourly', label: 'Hourly refresh', detail: 'Best for high velocity publishing and commerce catalogs.' },
  { id: 'daily', label: 'Daily at 05:00', detail: 'Recommended for editorial calendars and routine deal updates.' },
  { id: 'weekly', label: 'Mondays at 04:30', detail: 'Ideal for static company pages and resource hubs.' },
];

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch (error) {
    return '--';
  }
}

function downloadXml({
  urls,
  changefreq,
  priority,
}) {
  if (typeof window === 'undefined') {
    return;
  }
  const payload = urls
    .map((item) => `  <url>\n    <loc>${item.loc}</loc>\n    <changefreq>${item.changefreq || changefreq}</changefreq>\n    <priority>${item.priority ?? priority}</priority>\n  </url>`)
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${payload}\n</urlset>`;
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'gigvora-sitemap.xml';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

function buildHealthSummary(sections, includeImages, includeVideo) {
  const urlCount = sections.reduce((total, section) => total + section.urls, 0);
  const highPriority = sections.filter((section) => section.priority >= 0.9).length;
  const freshness = sections.some((section) => section.changefreq === 'daily') ? 'Real-time ready' : 'Steady cadence';
  const coverage = includeImages || includeVideo ? 'Rich media indexed' : 'Text-first focus';
  return { urlCount, highPriority, freshness, coverage };
}

function generateSampleUrls(sections) {
  return sections.flatMap((section) =>
    Array.from({ length: Math.min(3, section.urls) }).map((_, index) => ({
      loc: `https://gigvora.com/${section.id}/${index + 1}`,
      changefreq: section.changefreq,
      priority: section.priority,
    })),
  );
}

export default function SitemapGenerator({ sections, history, autoPing, includeImages, includeVideo, onGenerate }) {
  const [activeSections, setActiveSections] = useState(() => sections ?? DEFAULT_SECTIONS);
  const [runHistory, setRunHistory] = useState(() => history ?? DEFAULT_HISTORY);
  const [selectedSchedule, setSelectedSchedule] = useState('daily');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState(['Initiated sitemap session']);
  const [shouldPing, setShouldPing] = useState(autoPing);
  const [withImages, setWithImages] = useState(includeImages);
  const [withVideo, setWithVideo] = useState(includeVideo);

  const health = useMemo(
    () => buildHealthSummary(activeSections, withImages, withVideo),
    [activeSections, withImages, withVideo],
  );

  const timeline = useMemo(
    () =>
      runHistory.map((item) => ({
        ...item,
        formattedDate: formatDate(item.startedAt),
      })),
    [runHistory],
  );

  useEffect(() => {
    if (!isGenerating) {
      return undefined;
    }
    setProgress(12);
    const timeout = setTimeout(() => {
      setProgress(48);
      setLog((entries) => [...entries, 'Inventorying URLs across active sections']);
    }, 600);
    const timeout2 = setTimeout(() => {
      setProgress(76);
      setLog((entries) => [...entries, 'Validating canonical references and hreflang tags']);
    }, 1300);
    const timeout3 = setTimeout(() => {
      setProgress(100);
      setLog((entries) => [
        ...entries,
        shouldPing ? 'Pinging Google, Bing, and Brave discovery endpoints' : 'Skipping auto-ping per configuration',
        'Sitemap build complete. Ready for download.',
      ]);
      const run = {
        id: `run-${String(runHistory.length + 1).padStart(2, '0')}`,
        startedAt: new Date().toISOString(),
        duration: 35,
        urls: activeSections.reduce((total, section) => total + section.urls, 0),
        warnings: shouldPing ? 0 : 1,
        notes: shouldPing ? 'Full run with search engine ping' : 'Manual distribution required',
      };
      setRunHistory((entries) => [run, ...entries]);
      onGenerate?.({
        sections: activeSections,
        pingSearchEngines: shouldPing,
        includeImages: withImages,
        includeVideo: withVideo,
      });
      setIsGenerating(false);
    }, 2200);
    return () => {
      clearTimeout(timeout);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [activeSections, isGenerating, onGenerate, runHistory.length, shouldPing, withImages, withVideo]);

  const handleSectionToggle = (sectionId) => {
    setActiveSections((current) =>
      current.map((section) =>
        section.id === sectionId ? { ...section, enabled: section.enabled === false ? true : !section.enabled } : section,
      ),
    );
  };

  const handleSectionPriority = (sectionId, delta) => {
    setActiveSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? { ...section, priority: Math.min(1, Math.max(0.1, Number((section.priority + delta).toFixed(1)))) }
          : section,
      ),
    );
  };

  const handleGenerate = () => {
    if (isGenerating) {
      return;
    }
    setLog(['Initiated sitemap session', `Schedule: ${selectedSchedule}`]);
    setProgress(8);
    setIsGenerating(true);
  };

  const sampleUrls = useMemo(() => generateSampleUrls(activeSections), [activeSections]);

  return (
    <section className="space-y-8">
      <header className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-700 p-8 text-white shadow-2xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Sitemap Orchestration</p>
            <h2 className="text-3xl font-semibold leading-tight lg:text-4xl">Keep search engines in lockstep with Gigvora</h2>
            <p className="max-w-2xl text-sm text-white/80">
              Generate and distribute XML sitemaps with confidence. Automations handle pinging, validation, and governance so your
              marketing squad can focus on campaigns.
            </p>
          </div>
          <div className="flex min-w-[220px] flex-col gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
            <span className="text-xs uppercase tracking-wide text-white/60">Active URLs</span>
            <p className="text-4xl font-semibold leading-none">{health.urlCount}</p>
            <p className="text-xs text-white/70">{health.coverage} • {health.freshness}</p>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <ShieldCheckIcon className="h-4 w-4" /> {health.highPriority} sections marked mission critical
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-8 xl:grid-cols-[2fr,1fr]">
        <div className="space-y-8">
          <article className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-[0_40px_80px_-36px_rgba(15,23,42,0.25)]">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Section governance</h3>
                <p className="text-sm text-slate-500">
                  Prioritise the sections that deserve search prominence. Adjust priority scores and refresh cadence inline.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <PlayCircleIcon className="h-5 w-5" />
                {isGenerating ? 'Running…' : 'Run generator'}
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {activeSections.map((section) => (
                <div
                  key={section.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 shadow-sm transition hover:border-slate-200"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleSectionToggle(section.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                            section.enabled === false
                              ? 'bg-slate-300'
                              : 'bg-gradient-to-r from-indigo-500 to-sky-500'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                              section.enabled === false ? 'translate-x-1' : 'translate-x-5'
                            }`}
                          />
                        </button>
                        <h4 className="text-base font-semibold text-slate-900">{section.label}</h4>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{section.urls.toLocaleString()} URLs • {section.changefreq} crawl cadence</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleSectionPriority(section.id, -0.1)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        –
                      </button>
                      <span className="text-sm font-semibold text-slate-900">Priority {section.priority.toFixed(1)}</span>
                      <button
                        type="button"
                        onClick={() => handleSectionPriority(section.id, 0.1)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-[0_36px_70px_-34px_rgba(15,23,42,0.22)]">
            <h3 className="text-lg font-semibold text-slate-900">Automation & distribution</h3>
            <p className="mt-1 text-sm text-slate-500">Fine-tune ping strategy, media coverage, and scheduling discipline.</p>
            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <label className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={shouldPing}
                    onChange={(event) => setShouldPing(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Auto ping Google, Bing, Brave upon completion
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={withImages}
                    onChange={(event) => setWithImages(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Include image sitemap references
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={withVideo}
                    onChange={(event) => setWithVideo(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Include video sitemap references
                </label>
              </div>
              <div className="space-y-3">
                {SCHEDULE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedSchedule(option.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      selectedSchedule === option.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200 hover:text-slate-900'
                    }`}
                  >
                    <p className="font-semibold">{option.label}</p>
                    <p className="mt-1 text-xs">{option.detail}</p>
                  </button>
                ))}
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-[0_36px_70px_-34px_rgba(15,23,42,0.22)]">
            <h3 className="text-lg font-semibold text-slate-900">Generation log</h3>
            <p className="mt-1 text-sm text-slate-500">Stay audit ready with a transparent record of every sitemap run.</p>
            <div className="mt-4 space-y-3">
              {log.map((entry, index) => (
                <div key={`${entry}-${index}`} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-700">
                  <BoltIcon className="mt-0.5 h-5 w-5 text-indigo-500" />
                  <span>{entry}</span>
                </div>
              ))}
              {isGenerating && (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-700">
                  <p className="font-semibold">Progress {progress}%</p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-indigo-100">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-sky-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          </article>
        </div>

        <aside className="space-y-8">
          <article className="rounded-3xl border border-slate-200/60 bg-slate-900 p-6 text-white shadow-[0_40px_80px_-36px_rgba(15,23,42,0.45)]">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
              <span>XML Blueprint</span>
              <span>Preview</span>
            </div>
            <div className="mt-6 space-y-4">
              {sampleUrls.map((item) => (
                <div key={item.loc} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                  <p className="flex items-center gap-2 text-emerald-300">
                    <LinkIcon className="h-4 w-4" />
                    {item.loc}
                  </p>
                  <p className="mt-2 text-xs text-white/70">{item.changefreq} • Priority {item.priority}</p>
                </div>
              ))}
              <button
                type="button"
                onClick={() => downloadXml({ urls: sampleUrls, changefreq: 'daily', priority: 0.8 })}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Download XML sample
              </button>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-[0_36px_70px_-34px_rgba(15,23,42,0.22)]">
            <h3 className="text-lg font-semibold text-slate-900">Run history</h3>
            <p className="mt-1 text-sm text-slate-500">Monitor velocity, spot anomalies, and keep leadership informed.</p>
            <ul className="mt-4 space-y-3">
              {timeline.map((item) => (
                <li key={item.id} className="rounded-2xl border border-slate-100 p-4 text-sm text-slate-700">
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
                    <span>{item.formattedDate}</span>
                    <span>{item.duration} sec</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{item.urls.toLocaleString()} URLs indexed</p>
                  <p className="mt-1 text-xs text-slate-500">{item.notes}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    {item.warnings > 0 ? (
                      <>
                        <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
                        <span className="text-amber-600">{item.warnings} warnings</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                        <span className="text-emerald-600">Clean run</span>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-[0_36px_70px_-34px_rgba(15,23,42,0.22)]">
            <h3 className="text-lg font-semibold text-slate-900">Operations playbook</h3>
            <p className="mt-1 text-sm text-slate-500">Align marketing, engineering, and compliance around sitemap governance.</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-3 rounded-2xl border border-slate-100 p-4">
                <ClockIcon className="mt-1 h-5 w-5 text-indigo-500" />
                <span>Review crawl stats every Monday to confirm freshness and resolve anomalies fast.</span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-slate-100 p-4">
                <CloudArrowUpIcon className="mt-1 h-5 w-5 text-indigo-500" />
                <span>Sync sitemap pushes with major launches to keep search engines aligned with campaigns.</span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-slate-100 p-4">
                <CalendarDaysIcon className="mt-1 h-5 w-5 text-indigo-500" />
                <span>Archive run logs quarterly to document compliance with enterprise search governance.</span>
              </li>
            </ul>
          </article>
        </aside>
      </div>
    </section>
  );
}

SitemapGenerator.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      urls: PropTypes.number.isRequired,
      priority: PropTypes.number.isRequired,
      changefreq: PropTypes.string.isRequired,
    }),
  ),
  history: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      startedAt: PropTypes.string.isRequired,
      duration: PropTypes.number.isRequired,
      urls: PropTypes.number.isRequired,
      warnings: PropTypes.number.isRequired,
      notes: PropTypes.string.isRequired,
    }),
  ),
  autoPing: PropTypes.bool,
  includeImages: PropTypes.bool,
  includeVideo: PropTypes.bool,
  onGenerate: PropTypes.func,
};

SitemapGenerator.defaultProps = {
  sections: DEFAULT_SECTIONS,
  history: DEFAULT_HISTORY,
  autoPing: true,
  includeImages: true,
  includeVideo: false,
  onGenerate: undefined,
};
