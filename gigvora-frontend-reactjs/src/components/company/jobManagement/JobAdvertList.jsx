import { ArrowTopRightOnSquareIcon, PencilSquareIcon, StarIcon } from '@heroicons/react/24/outline';

function formatNumber(value) {
  if (value == null) {
    return '—';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  return numeric.toLocaleString();
}

export default function JobAdvertList({
  jobs,
  selectedJobId,
  onSelect,
  onEdit,
  onFavorite,
  onCreate,
  summary,
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Adverts</h2>
        {onCreate ? (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            New job
          </button>
        ) : null}
      </div>
      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white/60 p-4 shadow-sm">
        <dl className="grid gap-2 sm:grid-cols-5">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Jobs</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(summary?.totalJobs)}</dd>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Open</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(summary?.openJobs)}</dd>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">People</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(summary?.totalCandidates)}</dd>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Meetings</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(summary?.upcomingInterviews)}</dd>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Starred</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(summary?.favourites)}</dd>
          </div>
        </dl>
        <div className="space-y-3">
          {(jobs ?? []).length ? (
            jobs.map((job) => {
              const advert = job.advert ?? job;
              const isSelected = selectedJobId ? selectedJobId === advert.jobId || selectedJobId === job.job?.id : false;
              const jobId = advert.jobId ?? job.job?.id;
              const totalCandidates = job.applicants?.length ?? 0;
              const favorites = job.favorites?.length ?? advert.favorites?.length ?? 0;
              return (
                <button
                  key={jobId}
                  type="button"
                  onClick={() => onSelect?.(job)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left shadow-sm transition ${
                    isSelected
                      ? 'border-blue-400 bg-blue-50/80 ring-2 ring-blue-200'
                      : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/50'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{job.job?.title ?? advert.job?.title ?? advert.title}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{(advert.status ?? 'draft').replace(/_/g, ' ')}</span>
                        <span aria-hidden="true">•</span>
                        <span>{job.job?.location ?? advert.location ?? 'Remote'}</span>
                        <span aria-hidden="true">•</span>
                        <span>{job.job?.employmentType ?? advert.employmentType ?? 'Flexible'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <span className="rounded-full bg-slate-100 px-3 py-1">{formatNumber(totalCandidates)} ppl</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1">{formatNumber(favorites)} ★</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>Openings {formatNumber(advert.openings ?? 1)}</span>
                    <span aria-hidden="true">•</span>
                    <span>{advert.remoteType ?? 'remote'}</span>
                    {Array.isArray(job.keywordMatches) && job.keywordMatches.length ? (
                      <>
                        <span aria-hidden="true">•</span>
                        <span>{job.keywordMatches[0].candidateName} {(job.keywordMatches[0].score * 100).toFixed(0)}%</span>
                      </>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {onEdit ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onEdit(job);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-600"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                        Edit
                      </button>
                    ) : null}
                    {onFavorite ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onFavorite(job);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-600 hover:border-amber-300 hover:bg-amber-100"
                      >
                        <StarIcon className="h-4 w-4" />
                        Star
                      </button>
                    ) : null}
                    <a
                      href={`/jobs/${jobId ?? ''}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-600"
                    >
                      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      Open
                    </a>
                  </div>
                </button>
              );
            })
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-sm text-slate-500">
              No jobs.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
