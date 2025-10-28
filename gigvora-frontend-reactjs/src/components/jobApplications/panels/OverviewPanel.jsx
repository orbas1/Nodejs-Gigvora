import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  DocumentMagnifyingGlassIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const PERSONA_TABS = [
  { id: 'company', label: 'Company', icon: BuildingOfficeIcon },
  { id: 'headhunter', label: 'Headhunter', icon: UserGroupIcon },
  { id: 'agency', label: 'Agency', icon: BriefcaseIcon },
];

const STATS_BLUEPRINT = [
  { id: 'totalApplications', label: 'Total apps', icon: ClipboardDocumentListIcon },
  { id: 'activeApplications', label: 'Active', icon: ArrowTrendingUpIcon },
  { id: 'interviewsScheduled', label: 'Interviews', icon: CalendarIcon },
  { id: 'offersNegotiating', label: 'Offers', icon: CheckCircleIcon },
];

const PIPELINE_TEMPLATE = [
  { id: 'sourcing', label: 'Sourcing' },
  { id: 'applied', label: 'Applied' },
  { id: 'interviewing', label: 'Interviewing' },
  { id: 'offer', label: 'Offer' },
  { id: 'hired', label: 'Hired' },
];

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return '0';
  return new Intl.NumberFormat('en-US').format(numeric);
}

function formatPercent(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return '—';
  return `${numeric.toFixed(0)}%`;
}

function formatCurrencyRange(salary) {
  if (!salary || typeof salary !== 'object') return null;
  const { min, max, currency = 'USD', period } = salary;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toString().toUpperCase(),
    maximumFractionDigits: 0,
  });
  const minValue = Number.isFinite(Number(min)) ? formatter.format(Number(min)) : null;
  const maxValue = Number.isFinite(Number(max)) ? formatter.format(Number(max)) : null;
  const base = minValue && maxValue ? `${minValue} – ${maxValue}` : minValue || maxValue;
  if (!base) return null;
  if (!period) return base;
  const normalised = period.toString().toLowerCase();
  if (normalised.includes('hour')) return `${base} / hr`;
  if (normalised.includes('month')) return `${base} / mo`;
  if (normalised.includes('week')) return `${base} / wk`;
  if (normalised.includes('day')) return `${base} / day`;
  return `${base} / yr`;
}

function formatLocation(location) {
  if (!location) return null;
  if (typeof location === 'string') return location;
  const parts = [location.city, location.state || location.region, location.country]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean);
  const remoteFlag = location.remote || location.isRemote;
  if (parts.length === 0) {
    return remoteFlag ? 'Remote' : null;
  }
  const base = parts.join(', ');
  return remoteFlag ? `${base} · Remote` : base;
}

function resolveStageId(status) {
  const value = status ? status.toString().toLowerCase() : '';
  if (value.includes('source') || value.includes('prospect')) return 'sourcing';
  if (value.includes('interview')) return 'interviewing';
  if (value.includes('offer')) return 'offer';
  if (value.includes('hire') || value.includes('accepted') || value.includes('won')) return 'hired';
  if (value.includes('appl') || value.includes('submit')) return 'applied';
  return 'applied';
}

function buildPipeline(stages = [], candidates = [], breakdown = []) {
  const map = new Map();
  PIPELINE_TEMPLATE.forEach((stage) => {
    map.set(stage.id, { ...stage, count: 0, conversion: null });
  });

  safeArray(stages).forEach((stage) => {
    if (!stage || typeof stage !== 'object') return;
    const current = map.get(stage.id);
    if (!current) return;
    map.set(stage.id, {
      ...current,
      count: Number.isFinite(Number(stage.count)) ? Number(stage.count) : current.count,
      conversion: Number.isFinite(Number(stage.conversion)) ? Number(stage.conversion) : current.conversion,
    });
  });

  safeArray(candidates).forEach((candidate) => {
    if (!candidate) return;
    const stageId = resolveStageId(candidate.stage || candidate.status);
    const entry = map.get(stageId);
    if (!entry) return;
    entry.count += 1;
  });

  safeArray(breakdown).forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const stageId = resolveStageId(item.status);
    const entry = map.get(stageId);
    if (!entry) return;
    const count = Number.isFinite(Number(item.count)) ? Number(item.count) : 0;
    if (count > entry.count) {
      entry.count = count;
    }
  });

  return Array.from(map.values());
}

function normaliseJobs(jobListings, pipelineSnapshot, statusBreakdown, applications) {
  const listings = safeArray(jobListings).map((listing, index) => {
    const jobId = listing.id || `job-${index}`;
    const linkedApplications = safeArray(applications).filter((application) => {
      if (!application) return false;
      if (application.listingId && application.listingId === jobId) return true;
      const title = application.detail?.title;
      return title && listing.title && title.toLowerCase() === listing.title.toLowerCase();
    });

    const pipeline = buildPipeline(
      listing.pipeline?.stages,
      linkedApplications.map((item) => ({ stage: item.status })),
      listing.pipeline?.statusBreakdown,
    );

    return {
      id: jobId,
      title: listing.title || 'Untitled role',
      company: listing.company || listing.companyName || null,
      location: formatLocation(listing.location),
      salary: formatCurrencyRange(listing.salary),
      metrics: listing.metrics || {},
      openings: Number.isFinite(Number(listing.openings)) ? Number(listing.openings) : null,
      postedAt: listing.postedAt || listing.createdAt || null,
      updatedAt: listing.updatedAt || null,
      pipeline,
      candidates: linkedApplications,
      screening: safeArray(listing.questions).map((question) => ({
        id: question.id || question.prompt,
        prompt: question.prompt || question.question,
      })),
      tags: safeArray(listing.tags),
    };
  });

  if (listings.length > 0) {
    return listings;
  }

  const fallbackPipeline = buildPipeline(
    pipelineSnapshot?.stages,
    safeArray(applications).map((item) => ({ stage: item.status })),
    statusBreakdown,
  );

  return [
    {
      id: 'aggregate',
      title: 'Active talent pipeline',
      company: null,
      location: null,
      salary: null,
      metrics: pipelineSnapshot?.metrics || {},
      openings: null,
      postedAt: null,
      updatedAt: null,
      pipeline: fallbackPipeline,
      candidates: safeArray(applications),
      screening: [],
      tags: [],
    },
  ];
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-700">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-lg font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

StatCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

function PipelineRow({ stage, conversion, count }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-slate-900">{stage}</span>
      </div>
      <div className="flex items-center gap-4 text-sm text-slate-600">
        <span>{formatNumber(count)}</span>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500">
          {formatPercent(conversion)}
        </span>
      </div>
    </div>
  );
}

PipelineRow.propTypes = {
  stage: PropTypes.string.isRequired,
  conversion: PropTypes.number,
  count: PropTypes.number,
};

PipelineRow.defaultProps = {
  conversion: null,
  count: 0,
};

function CandidateRow({ candidate }) {
  const location = formatLocation(candidate.detail?.location);
  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900">{candidate.candidateName || 'Candidate'}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {candidate.status ? <span className="rounded-full bg-slate-900/5 px-2 py-1 font-semibold text-slate-600">{candidate.status}</span> : null}
          {candidate.matchScore ? (
            <span className="rounded-full bg-emerald-500/10 px-2 py-1 font-semibold text-emerald-600">
              Match {Math.round(candidate.matchScore)}%
            </span>
          ) : null}
          {location ? <span>{location}</span> : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {safeArray(candidate.matchedSkills).slice(0, 3).map((skill) => (
          <span
            key={skill}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
          >
            {skill}
          </span>
        ))}
      </div>
    </li>
  );
}

CandidateRow.propTypes = {
  candidate: PropTypes.object.isRequired,
};

function ScreeningRow({ prompt }) {
  return (
    <li className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{prompt}</li>
  );
}

ScreeningRow.propTypes = {
  prompt: PropTypes.string.isRequired,
};

export default function OverviewPanel({
  summary,
  statusBreakdown,
  recommendedActions,
  jobListings,
  pipelineSnapshot,
  applications,
  onCreateJob,
  onCreateApplication,
  onCreateInterview,
  onCreateFavourite,
  onCreateResponse,
  defaultPersona,
}) {
  const stats = useMemo(
    () =>
      STATS_BLUEPRINT.map((item) => ({
        ...item,
        value: formatNumber(summary?.[item.id] ?? 0),
      })),
    [summary],
  );

  const jobs = useMemo(
    () => normaliseJobs(jobListings, pipelineSnapshot, statusBreakdown, applications),
    [jobListings, pipelineSnapshot, statusBreakdown, applications],
  );

  const [activePersona, setActivePersona] = useState(defaultPersona && PERSONA_TABS.some((tab) => tab.id === defaultPersona)
    ? defaultPersona
    : PERSONA_TABS[0].id);

  useEffect(() => {
    if (defaultPersona && PERSONA_TABS.some((tab) => tab.id === defaultPersona)) {
      setActivePersona(defaultPersona);
    }
  }, [defaultPersona]);

  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id ?? null);

  useEffect(() => {
    if (jobs.length === 0) {
      setSelectedJobId(null);
      return;
    }
    if (!jobs.some((job) => job.id === selectedJobId)) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  const selectedJob = useMemo(() => jobs.find((job) => job.id === selectedJobId) || jobs[0] || null, [jobs, selectedJobId]);

  const aggregatePipeline = useMemo(() => {
    if (selectedJob) return selectedJob.pipeline;
    return buildPipeline(pipelineSnapshot?.stages, applications, statusBreakdown);
  }, [applications, pipelineSnapshot, selectedJob, statusBreakdown]);

  const activeCandidates = selectedJob ? selectedJob.candidates : safeArray(applications);

  const personaActions = useMemo(() => {
    const base = [
      { id: 'job', label: 'New job', onClick: onCreateJob },
      { id: 'candidate', label: 'Add candidate', onClick: onCreateApplication },
      { id: 'interview', label: 'Schedule interview', onClick: onCreateInterview },
      { id: 'favourite', label: 'Save role', onClick: onCreateFavourite },
      { id: 'response', label: 'Log update', onClick: onCreateResponse },
    ];
    return base.filter((action) => typeof action.onClick === 'function');
  }, [onCreateApplication, onCreateFavourite, onCreateInterview, onCreateJob, onCreateResponse]);

  function renderJobList() {
    return (
      <div className="space-y-3">
        {jobs.map((job) => {
          const isActive = job.id === selectedJob?.id;
          return (
            <button
              key={job.id}
              type="button"
              onClick={() => setSelectedJobId(job.id)}
              className={`w-full rounded-2xl border px-4 py-3 text-left shadow-sm transition ${
                isActive
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-900'}`}>{job.title}</p>
                  <div className={`mt-1 flex flex-wrap items-center gap-2 text-xs ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                    {job.company ? <span>{job.company}</span> : null}
                    {job.location ? <span>{job.location}</span> : null}
                    {job.salary ? <span>{job.salary}</span> : null}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wide">
                  <span className="rounded-full border border-current px-3 py-1">
                    {job.openings ? `${job.openings} open` : `${formatNumber(job.candidates.length)} in pipeline`}
                  </span>
                  {job.metrics?.fillRate ? (
                    <span className="rounded-full border border-current px-3 py-1">
                      Fill {formatPercent(job.metrics.fillRate)}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  function renderPipeline() {
    return (
      <div className="space-y-3">
        {aggregatePipeline.map((stage) => (
          <PipelineRow key={stage.id} stage={stage.label} conversion={stage.conversion} count={stage.count} />
        ))}
      </div>
    );
  }

  function renderCompanyBoard() {
    return (
      <div className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Active listings</h3>
          {renderJobList()}
        </section>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pipeline</h3>
          {renderPipeline()}
        </section>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Screening</h3>
          {selectedJob?.screening?.length ? (
            <ul className="space-y-2">
              {selectedJob.screening.map((item) => (
                <ScreeningRow key={item.id} prompt={item.prompt} />
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
              No screening questions configured.
            </div>
          )}
        </section>
      </div>
    );
  }

  function renderHeadhunterBoard() {
    return (
      <div className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Job desk</h3>
          {renderJobList()}
        </section>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pipeline</h3>
          {renderPipeline()}
        </section>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Candidates</h3>
          {activeCandidates.length ? (
            <ul className="space-y-2">
              {activeCandidates.map((candidate) => (
                <CandidateRow key={candidate.id || candidate.candidateName} candidate={candidate} />
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
              No candidates in the pipeline.
            </div>
          )}
        </section>
      </div>
    );
  }

  function renderAgencyBoard() {
    const bench = activeCandidates.flatMap((candidate) =>
      safeArray(candidate.experience)
        .filter((item) => item && item.type && item.type.toString().toLowerCase().includes('freelance'))
        .map((item) => ({
          id: `${candidate.id}-${item.id || item.title}`,
          title: item.title,
          company: item.company,
          candidate: candidate.candidateName,
          highlight: item.highlight,
        })),
    );

    return (
      <div className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Assignments</h3>
          {renderJobList()}
        </section>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pipeline</h3>
          {renderPipeline()}
        </section>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Freelance bench</h3>
          {bench.length ? (
            <ul className="space-y-2">
              {bench.map((item) => (
                <li key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-2 text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">{item.candidate}</span>
                    <span>{item.title}</span>
                    <span className="text-xs text-slate-500">{item.company}</span>
                    {item.highlight ? <span className="text-xs text-slate-500">{item.highlight}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
              No freelance history captured.
            </div>
          )}
        </section>
      </div>
    );
  }

  let personaContent;
  switch (activePersona) {
    case 'headhunter':
      personaContent = renderHeadhunterBoard();
      break;
    case 'agency':
      personaContent = renderAgencyBoard();
      break;
    default:
      personaContent = renderCompanyBoard();
      break;
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="grid gap-3 md:grid-cols-4">{stats.map((item) => (
        <StatCard key={item.id} icon={item.icon} label={item.label} value={`${item.value}`} />
      ))}</div>

      {personaActions.length ? (
        <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm" data-testid="overview-actions">
          {personaActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {PERSONA_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activePersona;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePersona(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {personaContent}
      </div>

      {recommendedActions?.length ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Open tasks</h3>
          <ul className="space-y-2">
            {recommendedActions.map((item) => (
              <li
                key={item.id || item.title}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
              >
                <span>{item.title}</span>
                <DocumentMagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {selectedJob?.metrics ? (
        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(selectedJob.metrics)
            .filter(([, value]) => Number.isFinite(Number(value)))
            .map(([key, value]) => (
              <div key={key} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <ChartBarIcon className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-lg font-semibold text-slate-900">{formatNumber(value)}</p>
                </div>
              </div>
            ))}
        </div>
      ) : null}
    </div>
  );
}

OverviewPanel.propTypes = {
  summary: PropTypes.object,
  statusBreakdown: PropTypes.arrayOf(PropTypes.object),
  recommendedActions: PropTypes.arrayOf(PropTypes.object),
  jobListings: PropTypes.arrayOf(PropTypes.object),
  pipelineSnapshot: PropTypes.object,
  applications: PropTypes.arrayOf(PropTypes.object),
  onCreateJob: PropTypes.func,
  onCreateApplication: PropTypes.func,
  onCreateInterview: PropTypes.func,
  onCreateFavourite: PropTypes.func,
  onCreateResponse: PropTypes.func,
  defaultPersona: PropTypes.oneOf(PERSONA_TABS.map((tab) => tab.id)),
};

OverviewPanel.defaultProps = {
  summary: {},
  statusBreakdown: [],
  recommendedActions: [],
  jobListings: [],
  pipelineSnapshot: null,
  applications: [],
  onCreateJob: null,
  onCreateApplication: null,
  onCreateInterview: null,
  onCreateFavourite: null,
  onCreateResponse: null,
  defaultPersona: 'company',
};
