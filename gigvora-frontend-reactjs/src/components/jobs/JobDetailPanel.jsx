import { useMemo } from 'react';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';
import { formatInteger, formatPercent } from '../../utils/number.js';
import { classNames } from '../../utils/classNames.js';

function normaliseList(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : `${item}`.trim()))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/\r?\n|•|\u2022|-/)
      .map((entry) => entry.replace(/^[:\s]+/, '').trim())
      .filter(Boolean);
  }
  return [];
}

function deriveTimeline(job) {
  const entries = [];
  const sources = [
    job?.timeline,
    job?.hiringTimeline,
    job?.metadata?.timeline,
    job?.metadata?.stages,
    job?.interviewProcess,
  ].filter(Boolean);

  sources.forEach((source) => {
    if (Array.isArray(source)) {
      source.forEach((item) => {
        if (!item) return;
        if (typeof item === 'string') {
          entries.push({ label: item.trim() });
          return;
        }
        const label = item.label ?? item.title ?? item.stage ?? null;
        const description = item.description ?? item.summary ?? null;
        const date = item.date ?? item.when ?? item.deadline ?? null;
        if (label || description || date) {
          entries.push({ label, description, date });
        }
      });
      return;
    }
    if (typeof source === 'object') {
      Object.entries(source).forEach(([key, value]) => {
        if (!value) return;
        if (typeof value === 'string') {
          entries.push({ label: key, description: value.trim() });
          return;
        }
        if (value && typeof value === 'object') {
          entries.push({
            label: value.label ?? key,
            description: value.description ?? value.summary ?? null,
            date: value.date ?? value.deadline ?? null,
          });
        }
      });
      return;
    }
    if (typeof source === 'string') {
      normaliseList(source).forEach((entry) => {
        entries.push({ label: entry });
      });
    }
  });

  if (job?.publishedAt) {
    entries.push({ label: 'Role published', date: job.publishedAt });
  }
  if (job?.closesAt) {
    entries.push({ label: 'Applications close', date: job.closesAt });
  }
  if (!entries.length && job?.updatedAt) {
    entries.push({ label: 'Last updated', date: job.updatedAt });
  }

  const unique = new Map();
  entries.forEach((entry) => {
    const key = `${entry.label ?? ''}-${entry.date ?? entry.description ?? ''}`;
    if (!unique.has(key)) {
      unique.set(key, entry);
    }
  });
  return Array.from(unique.values());
}

function deriveStats(job) {
  const compensation = job ? formatCurrency(job) : null;
  const stats = [];
  if (compensation) {
    stats.push({ label: 'Compensation', value: compensation, tone: 'accent' });
  }
  if (job?.employmentType) {
    stats.push({ label: 'Employment type', value: job.employmentType });
  }
  if (job?.isRemote) {
    stats.push({ label: 'Work style', value: 'Remote friendly' });
  } else if (job?.location) {
    stats.push({ label: 'Location', value: job.location });
  }
  if (Number.isFinite(Number(job?.metadata?.metrics?.applicationCount))) {
    stats.push({
      label: 'Applications',
      value: formatInteger(job.metadata.metrics.applicationCount),
    });
  }
  if (job?.metadata?.metrics?.favoriteCount != null) {
    stats.push({
      label: 'Saved by talent',
      value: formatInteger(job.metadata.metrics.favoriteCount),
    });
  }
  if (job?.status) {
    stats.push({ label: 'Status', value: job.status });
  }
  if (job?.updatedAt) {
    stats.push({ label: 'Updated', value: formatRelativeTime(job.updatedAt) });
  }
  return stats;
}

function formatCurrency(job) {
  const currency = job?.currency ?? job?.compensationCurrency ?? 'USD';
  const minimum = job?.salaryMin ?? job?.compensationMin ?? job?.rateMin ?? null;
  const maximum = job?.salaryMax ?? job?.compensationMax ?? job?.rateMax ?? null;
  if (minimum == null && maximum == null) {
    return null;
  }
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 0,
  });
  if (minimum != null && maximum != null) {
    return `${formatter.format(minimum)} – ${formatter.format(maximum)}`;
  }
  return formatter.format(minimum ?? maximum ?? 0);
}

export default function JobDetailPanel({
  job,
  open = Boolean(job),
  onClose,
  onApply,
  resumeInsights,
}) {
  const stats = useMemo(() => deriveStats(job), [job]);
  const responsibilities = useMemo(() => normaliseList(job?.responsibilities ?? job?.responsibilitiesHtml), [job?.responsibilities, job?.responsibilitiesHtml]);
  const requirements = useMemo(() => normaliseList(job?.requirements ?? job?.requirementsHtml), [job?.requirements, job?.requirementsHtml]);
  const benefits = useMemo(() => normaliseList(job?.benefits ?? job?.perks), [job?.benefits, job?.perks]);
  const timeline = useMemo(() => deriveTimeline(job), [job]);

  const matchScore = job?.matchScore ?? job?.aiSignals?.total ?? null;
  const matchPercent = Number.isFinite(Number(matchScore))
    ? formatPercent(matchScore, { maximumFractionDigits: 0 })
    : null;

  return (
    <aside
      className={classNames(
        'relative flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm transition-all',
        open ? 'opacity-100' : 'opacity-60',
      )}
      aria-live="polite"
    >
      <header className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-accent/90 via-accent/70 to-violet-600 p-6 text-white shadow-soft">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_55%)]" aria-hidden="true" />
        <div className="relative flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Opportunity spotlight</p>
              <h2 className="mt-2 text-2xl font-semibold leading-snug">{job?.title ?? 'Select a role to preview details'}</h2>
              <p className="mt-1 text-sm text-white/80">
                {job?.companyName ?? job?.clientName ?? 'Choose a role from the marketplace to unlock timeline, match insights, and apply actions.'}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              {onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center rounded-full border border-white/40 px-3 py-1 text-xs font-semibold text-white/80 transition hover:border-white hover:text-white"
                >
                  Close
                </button>
              ) : null}
              {job ? (
                <button
                  type="button"
                  onClick={() => job && onApply?.(job)}
                  className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-accent shadow-sm transition hover:bg-white"
                >
                  Start application <span aria-hidden="true">→</span>
                </button>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/80">
            {job?.location ? <span>{job.location}</span> : null}
            {job?.employmentType ? <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white">{job.employmentType}</span> : null}
            {job?.isRemote ? <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white">Remote friendly</span> : null}
            {matchPercent ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-accent">
                Match {matchPercent}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      {job ? (
        <div className="space-y-6">
          {stats.length ? (
            <dl className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-inner sm:grid-cols-2">
              {stats.map((item) => (
                <div key={`${item.label}-${item.value}`} className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</dt>
                  <dd className={classNames('text-sm font-semibold', item.tone === 'accent' ? 'text-accent' : 'text-slate-900')}>
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          {job?.summary ? (
            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <h3 className="text-sm font-semibold text-slate-900">Role mission</h3>
              <p className="mt-2 text-sm text-slate-600">{job.summary}</p>
            </section>
          ) : null}

          {responsibilities.length ? (
            <section>
              <h3 className="text-sm font-semibold text-slate-900">Responsibilities</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {responsibilities.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-accent" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {requirements.length ? (
            <section>
              <h3 className="text-sm font-semibold text-slate-900">What you bring</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {requirements.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-slate-300" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {benefits.length ? (
            <section>
              <h3 className="text-sm font-semibold text-slate-900">Benefits & culture</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {benefits.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-emerald-400" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {timeline.length ? (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Hiring timeline</h3>
              <ol className="space-y-3 text-sm text-slate-600">
                {timeline.map((entry, index) => (
                  <li key={`${entry.label ?? 'stage'}-${index}`} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">{entry.label ?? 'Milestone'}</p>
                      {entry.date ? (
                        <span className="text-xs text-slate-400">{formatAbsolute(entry.date)}</span>
                      ) : null}
                    </div>
                    {entry.description ? <p className="mt-2 text-sm text-slate-600">{entry.description}</p> : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {(resumeInsights?.summary || resumeInsights?.recommendation) && (
            <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 text-sm text-slate-600 shadow-inner">
              <h3 className="text-sm font-semibold text-slate-900">Resume readiness</h3>
              <div className="mt-2 space-y-2">
                {resumeInsights?.summary ? <p>{resumeInsights.summary}</p> : null}
                {resumeInsights?.recommendation ? (
                  <p className="text-xs text-slate-500">{resumeInsights.recommendation}</p>
                ) : null}
                {resumeInsights?.lastUpdated ? (
                  <p className="text-xs text-slate-400">Updated {formatRelativeTime(resumeInsights.lastUpdated)}</p>
                ) : null}
              </div>
            </section>
          )}

          {(job?.hiringManagerName || job?.hiringManagerEmail || job?.companyWebsite) && (
            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-sm text-slate-600">
              <h3 className="text-sm font-semibold text-slate-900">Team introduction</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {job?.hiringManagerName ? <li>Hiring manager: {job.hiringManagerName}</li> : null}
                {job?.hiringManagerEmail ? <li>Email: {job.hiringManagerEmail}</li> : null}
                {job?.companyWebsite ? (
                  <li>
                    Website:{' '}
                    <a
                      href={job.companyWebsite}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-accent hover:underline"
                    >
                      {job.companyWebsite}
                    </a>
                  </li>
                ) : null}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Browse the job marketplace and choose a role to view skill match insights, interview timelines, and benefits before you
          apply.
        </p>
      )}
    </aside>
  );
}
