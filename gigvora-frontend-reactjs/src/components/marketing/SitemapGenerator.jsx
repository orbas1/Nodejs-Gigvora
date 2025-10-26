import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import { classNames } from '../../utils/classNames.js';

function StatPill({ tone, label, value, helper }) {
  const toneClasses = {
    accent: 'border-accent/30 bg-accent/10 text-accent',
    emerald: 'border-emerald-300/70 bg-emerald-50 text-emerald-600',
    amber: 'border-amber-300/70 bg-amber-50 text-amber-600',
    rose: 'border-rose-300/70 bg-rose-50 text-rose-600',
  };
  return (
    <div
      className={classNames(
        'space-y-1 rounded-[26px] border px-5 py-4 text-left shadow-soft',
        toneClasses[tone] ?? 'border-slate-200/70 bg-white text-slate-700',
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500/80">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
      {helper ? <p className="text-xs text-slate-600/80">{helper}</p> : null}
    </div>
  );
}

StatPill.propTypes = {
  tone: PropTypes.string,
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  helper: PropTypes.string,
};

function HealthIndicator({ status }) {
  const palette = {
    healthy: {
      tone: 'bg-emerald-100 text-emerald-600',
      label: 'Healthy',
    },
    warning: {
      tone: 'bg-amber-100 text-amber-600',
      label: 'Warning',
    },
    critical: {
      tone: 'bg-rose-100 text-rose-600',
      label: 'Critical',
    },
  };

  const current = palette[status] ?? { tone: 'bg-slate-100 text-slate-600', label: 'Unknown' };

  return (
    <span
      className={classNames(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
        current.tone,
      )}
    >
      <SignalIcon className="h-4 w-4" aria-hidden="true" />
      {current.label}
    </span>
  );
}

HealthIndicator.propTypes = {
  status: PropTypes.oneOf(['healthy', 'warning', 'critical', undefined]).isRequired,
};

function Toggle({ label, helper, checked, onChange }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-soft transition hover:border-accent/40">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
      </div>
      <span className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center">
        <input
          type="checkbox"
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
          checked={checked}
          onChange={(event) => onChange?.(event.target.checked)}
        />
        <span className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-accent/80" />
        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

Toggle.propTypes = {
  label: PropTypes.string.isRequired,
  helper: PropTypes.string,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
};

function deriveHealthStatus(summary, provided) {
  if (provided?.status) {
    return provided.status;
  }

  const errors = Number(summary?.errors ?? 0);
  const warnings = Number(summary?.warnings ?? 0);

  if (errors > 0) {
    return 'critical';
  }

  if (warnings > 0) {
    return 'warning';
  }

  return 'healthy';
}

function computeCoverageStats(summary) {
  const parseValue = (value) => {
    if (value == null) {
      return null;
    }

    const parsed = Number(String(value).replace(/[^0-9.]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  };

  const discovered = parseValue(summary?.discovered);
  const indexed = parseValue(summary?.indexed);

  if (discovered == null || indexed == null) {
    return null;
  }

  const safeDiscovered = discovered === 0 ? 1 : discovered;
  const rawPercent = Math.round((indexed / safeDiscovered) * 100);
  const coveragePercent = Math.max(0, Math.min(rawPercent, 100));

  let caption = 'Monitor after rollout to confirm coverage.';
  if (coveragePercent >= 95) {
    caption = 'Enterprise-ready coverage maintained.';
  } else if (coveragePercent >= 80) {
    caption = 'Strong coverage with room to scale evergreen hubs.';
  } else {
    caption = 'Focus crawl budget on missed sections before next launch.';
  }

  const healthTone = coveragePercent >= 90 ? 'healthy' : coveragePercent >= 70 ? 'warning' : 'critical';

  return {
    coveragePercent,
    caption,
    indexed,
    discovered,
    healthTone,
  };
}

function buildSitemapPreview(config) {
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>'];
  const namespaces = ["xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'"];

  if (config.includeImages) {
    namespaces.push("xmlns:image='http://www.google.com/schemas/sitemap-image/1.1'");
  }

  lines.push(`<urlset ${namespaces.join(' ')}>`);
  lines.push('  <url>');
  lines.push('    <loc>https://gigvora.com/enterprise</loc>');

  if (config.includeLastModified) {
    lines.push('    <lastmod>2024-01-15T12:00:00Z</lastmod>');
  }

  lines.push('    <priority>0.80</priority>');

  if (config.includeImages) {
    lines.push('    <image:image>');
    lines.push('      <image:loc>https://cdn.gigvora.com/library/enterprise-preview.jpg</image:loc>');
    lines.push('      <image:caption>Executive mentorship library</image:caption>');
    lines.push('    </image:image>');
  }

  lines.push('  </url>');
  lines.push('</urlset>');

  if (config.pingSearchEngines) {
    lines.push('<!-- Ping Google & Bing after publish -->');
  }

  return lines.join('\n');
}

export function SitemapGenerator({
  summary,
  scheduleOptions,
  selectedSchedule,
  onScheduleChange,
  configuration,
  onConfigurationChange,
  onGenerate,
  onDownload,
  onSubmit,
  logs,
  health,
  className,
  onAnalyticsEvent,
}) {
  const config = {
    includeImages: true,
    includeLastModified: true,
    pingSearchEngines: true,
    ...configuration,
  };

  const statusSummary = summary ?? {};
  const [isXmlCopied, setIsXmlCopied] = useState(false);

  const issues = useMemo(() => {
    const list = Array.isArray(statusSummary.issues) ? statusSummary.issues : [];
    return list.slice(0, 6);
  }, [statusSummary]);

  const emitAnalytics = useCallback(
    (event, detail) => {
      onAnalyticsEvent?.({
        source: 'SitemapGenerator',
        event,
        detail,
      });
    },
    [onAnalyticsEvent],
  );

  useEffect(() => {
    if (!isXmlCopied) {
      return undefined;
    }

    const timeout = setTimeout(() => setIsXmlCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [isXmlCopied]);

  const derivedHealthStatus = useMemo(() => deriveHealthStatus(statusSummary, health), [health, statusSummary]);
  const coverageStats = useMemo(() => computeCoverageStats(statusSummary), [statusSummary]);
  const xmlPreview = useMemo(() => buildSitemapPreview(config), [config]);

  useEffect(() => {
    emitAnalytics('sitemap_health_evaluated', {
      status: derivedHealthStatus,
      issueCount: issues.length,
    });
  }, [derivedHealthStatus, emitAnalytics, issues.length]);

  return (
    <section
      className={classNames(
        'space-y-8 rounded-[46px] border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 p-8 shadow-[0_45px_120px_-70px_rgba(15,23,42,0.55)]',
        'sm:p-10 lg:p-12',
        className,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-6 rounded-[36px] border border-accent/20 bg-gradient-to-r from-accent via-accentDark to-slate-900 p-6 text-white shadow-[0_35px_90px_-60px_rgba(37,99,235,0.7)]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.36em] text-white/80">Sitemap orchestrator</p>
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Automate discovery coverage with live health telemetry
          </h2>
          <p className="text-sm text-white/80 sm:max-w-xl">
            Scheduling, search console submissions, and analytics keep your sitemap trustworthy for every product launch.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="rounded-3xl border border-white/30 bg-white/10 px-4 py-3 text-left text-xs uppercase tracking-[0.32em]">
            <p className="font-semibold text-white/70">URLs indexed</p>
            <p className="text-2xl font-semibold text-white">
              {statusSummary.indexed != null ? statusSummary.indexed : '—'}
            </p>
          </div>
          <div className="rounded-3xl border border-white/30 bg-white/10 px-4 py-3 text-left text-xs uppercase tracking-[0.32em]">
            <p className="font-semibold text-white/70">Last generated</p>
            <p className="text-sm font-semibold text-white">
              {statusSummary.lastGenerated ?? 'Not run'}
            </p>
          </div>
          <HealthIndicator status={derivedHealthStatus} />
          <button
            type="button"
            onClick={() => {
              emitAnalytics('generate_requested', { configuration: config });
              onGenerate?.();
            }}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-accent transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
            Generate now
          </button>
        </div>
      </header>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)]">
        <div className="space-y-6">
          <div className="space-y-4 rounded-[30px] border border-slate-200/70 bg-white/95 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Scheduling</p>
              <CalendarDaysIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">Update cadence</span>
              <select
                value={selectedSchedule}
                onChange={(event) => {
                  const value = event.target.value;
                  emitAnalytics('schedule_changed', { value });
                  onScheduleChange?.(value);
                }}
                className="w-full rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm text-slate-800 shadow-soft focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {scheduleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 text-xs text-accent">
              Next run scheduled for <strong>{statusSummary.nextRun ?? 'configure cadence'}</strong>.
            </div>
          </div>

          <div className="space-y-3">
            <Toggle
              label="Include image & video sitemap"
              helper="Expose media assets for richer search surfaces"
              checked={config.includeImages}
              onChange={(checked) => {
                emitAnalytics('configuration_changed', { key: 'includeImages', value: checked });
                onConfigurationChange?.({ ...config, includeImages: checked });
              }}
            />
            <Toggle
              label="Attach last modified timestamps"
              helper="Helps crawlers prioritise re-indexing cadence"
              checked={config.includeLastModified}
              onChange={(checked) => {
                emitAnalytics('configuration_changed', { key: 'includeLastModified', value: checked });
                onConfigurationChange?.({ ...config, includeLastModified: checked });
              }}
            />
            <Toggle
              label="Ping Google & Bing after publish"
              helper="Automate search console submission after generation"
              checked={config.pingSearchEngines}
              onChange={(checked) => {
                emitAnalytics('configuration_changed', { key: 'pingSearchEngines', value: checked });
                onConfigurationChange?.({ ...config, pingSearchEngines: checked });
              }}
            />
          </div>

          <div className="space-y-4 rounded-[30px] border border-slate-200/70 bg-white/95 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Actions</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  emitAnalytics('download_requested', { discovered: statusSummary.discovered });
                  onDownload?.();
                }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent/60 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                Download XML
              </button>
              <button
                type="button"
                onClick={() => {
                  emitAnalytics('submit_requested', { coverage: coverageStats?.coveragePercent });
                  onSubmit?.();
                }}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
                Submit to Search Console
              </button>
            </div>
          </div>

          <div className="space-y-4 rounded-[30px] border border-slate-200/70 bg-white/95 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Sitemap XML preview</p>
              <HealthIndicator status={derivedHealthStatus} />
            </div>
            <pre className="max-h-56 overflow-auto rounded-2xl border border-slate-200/70 bg-slate-900/95 p-4 font-mono text-xs text-slate-100 shadow-soft">
              {xmlPreview}
            </pre>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  try {
                    if (navigator?.clipboard?.writeText) {
                      await navigator.clipboard.writeText(xmlPreview);
                    } else {
                      const textarea = document.createElement('textarea');
                      textarea.value = xmlPreview;
                      textarea.setAttribute('readonly', '');
                      textarea.style.position = 'absolute';
                      textarea.style.left = '-9999px';
                      document.body.appendChild(textarea);
                      textarea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textarea);
                    }
                    setIsXmlCopied(true);
                    emitAnalytics('sitemap_xml_copied', { length: xmlPreview.length });
                  } catch (error) {
                    emitAnalytics('sitemap_xml_copy_failed', { message: error.message });
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-white shadow-soft transition hover:bg-accentDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />
                {isXmlCopied ? 'Copied' : 'Copy XML'}
              </button>
              <p className="text-xs text-slate-500">Share this snippet with engineering during rollout rehearsals.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {coverageStats ? (
            <div className="space-y-4 rounded-[30px] border border-slate-200/70 bg-white/95 p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Coverage snapshot</p>
                <HealthIndicator status={coverageStats.healthTone} />
              </div>
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-slate-900">{coverageStats.coveragePercent}%</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Indexed</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200/70">
                  <span
                    className="block h-2 rounded-full bg-accent"
                    style={{ width: `${coverageStats.coveragePercent}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">Indexed {coverageStats.indexed} of {coverageStats.discovered} URLs.</p>
                <p className="text-xs font-semibold text-slate-600">{coverageStats.caption}</p>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <StatPill
              tone="emerald"
              label="URLs discovered"
              value={statusSummary.discovered ?? '—'}
              helper="Across primary and auxiliary sitemaps"
            />
            <StatPill tone="amber" label="Warnings" value={statusSummary.warnings ?? 0} helper="Needs monitoring" />
            <StatPill tone="rose" label="Errors" value={statusSummary.errors ?? 0} helper="Fix before next run" />
            <StatPill
              tone="accent"
              label="Average response"
              value={statusSummary.responseTime ?? '—'}
              helper="Search console processing time"
            />
          </div>

          <div className="space-y-4 rounded-[30px] border border-slate-200/70 bg-white/95 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Health log</p>
              <HealthIndicator status={derivedHealthStatus} />
            </div>
            <ul className="space-y-3">
              {issues.length === 0 ? (
                <li className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 p-4 text-sm text-emerald-700">
                  No issues detected. Keep monitoring after major releases.
                </li>
              ) : (
                issues.map((issue) => (
                  <li
                    key={issue.id}
                    className="flex items-start gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/80 p-4 text-sm text-amber-700"
                  >
                    <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-semibold">{issue.title}</p>
                      {issue.detail ? <p className="text-xs text-amber-800/80">{issue.detail}</p> : null}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="space-y-4 rounded-[30px] border border-slate-200/70 bg-white/95 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Activity timeline</p>
            </div>
            <ol className="space-y-4">
              {(logs ?? []).slice(0, 6).map((entry) => (
                <li key={entry.id} className="space-y-2 rounded-2xl border border-slate-200/70 bg-surfaceMuted/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">{entry.title}</p>
                    <span className="text-xs uppercase tracking-[0.32em] text-slate-400">{entry.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-500">{entry.detail}</p>
                  <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.32em]">
                    <span className="rounded-full bg-accent/10 px-3 py-1 text-accent">{entry.duration}</span>
                    <span className="rounded-full bg-slate-900/5 px-3 py-1 text-slate-500">{entry.actor ?? 'System'}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

SitemapGenerator.propTypes = {
  summary: PropTypes.shape({
    indexed: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    lastGenerated: PropTypes.string,
    nextRun: PropTypes.string,
    responseTime: PropTypes.string,
    discovered: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    warnings: PropTypes.number,
    errors: PropTypes.number,
    issues: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        detail: PropTypes.string,
      }),
    ),
  }),
  scheduleOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  selectedSchedule: PropTypes.string,
  onScheduleChange: PropTypes.func,
  configuration: PropTypes.shape({
    includeImages: PropTypes.bool,
    includeLastModified: PropTypes.bool,
    pingSearchEngines: PropTypes.bool,
  }),
  onConfigurationChange: PropTypes.func,
  onGenerate: PropTypes.func,
  onDownload: PropTypes.func,
  onSubmit: PropTypes.func,
  logs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      detail: PropTypes.string,
      timestamp: PropTypes.string.isRequired,
      duration: PropTypes.string,
      actor: PropTypes.string,
    }),
  ),
  health: PropTypes.shape({
    status: PropTypes.oneOf(['healthy', 'warning', 'critical']),
  }),
  className: PropTypes.string,
  onAnalyticsEvent: PropTypes.func,
};

SitemapGenerator.defaultProps = {
  summary: undefined,
  scheduleOptions: [
    { value: 'hourly', label: 'Hourly – For fast-moving publishing teams' },
    { value: 'daily', label: 'Daily – Recommended for most product surfaces' },
    { value: 'weekly', label: 'Weekly – For evergreen content and static hubs' },
  ],
  selectedSchedule: 'daily',
  onScheduleChange: undefined,
  configuration: undefined,
  onConfigurationChange: undefined,
  onGenerate: undefined,
  onDownload: undefined,
  onSubmit: undefined,
  logs: undefined,
  health: undefined,
  className: undefined,
  onAnalyticsEvent: undefined,
};

export default SitemapGenerator;
