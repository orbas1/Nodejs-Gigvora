import {
  ArchiveBoxIcon,
  DocumentDuplicateIcon,
  PencilSquareIcon,
  RocketLaunchIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import formatDateTime from '../../../utils/formatDateTime.js';
import { STATUS_LABELS, STATUS_BADGES, PROMOTION_FLAGS } from './jobPostFormUtils.js';

const PROMOTION_LABELS = PROMOTION_FLAGS.reduce((acc, item) => {
  acc[item.key] = item.label;
  return acc;
}, {});

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function InfoRow({ label, value }) {
  if (!value) {
    return null;
  }
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white/60 p-3">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-sm text-slate-900">{value}</span>
    </div>
  );
}

function ListBlock({ title, items }) {
  if (!items?.length) {
    return null;
  }
  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-white/80 p-4">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function PromotionPills({ promotionFlags }) {
  if (!promotionFlags) {
    return null;
  }
  const entries = Object.entries(promotionFlags).filter(([, enabled]) => Boolean(enabled));
  if (!entries.length) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([key]) => (
        <span
          key={key}
          className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700"
        >
          {PROMOTION_LABELS[key] ?? key}
        </span>
      ))}
    </div>
  );
}

export default function JobPostDetailDrawer({
  job,
  open,
  onClose,
  onEdit,
  onDuplicate,
  onPublish,
  onArchive,
  onDelete,
}) {
  if (!open || !job) {
    return null;
  }
  const detail = job.detail ?? {};
  const status = detail.status ?? 'draft';
  const badgeClass = STATUS_BADGES[status] ?? 'border-slate-200 bg-slate-100 text-slate-700';
  const requirements = Array.isArray(detail.requirements) ? detail.requirements : [];
  const responsibilities = Array.isArray(detail.responsibilities) ? detail.responsibilities : [];
  const benefits = Array.isArray(detail.benefits) ? detail.benefits : [];
  const attachments = Array.isArray(detail.attachments) ? detail.attachments : [];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="hidden flex-1 bg-slate-900/30 backdrop-blur lg:block" aria-hidden="true" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-4xl flex-col overflow-y-auto bg-slate-50 shadow-2xl lg:rounded-l-3xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-5 backdrop-blur">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-900">{job.title}</h2>
              <span
                className={classNames(
                  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                  badgeClass,
                )}
              >
                {STATUS_LABELS[status] ?? status}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Updated {formatDateTime(detail.updatedAt ?? job.updatedAt)} · Created {formatDateTime(job.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDuplicate}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-sm transition hover:border-indigo-500 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <DocumentDuplicateIcon className="h-4 w-4" aria-hidden="true" />
              Clone
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
              Edit
            </button>
            <button
              type="button"
              onClick={onClose}
              className="hidden rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:flex"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className="flex-1 space-y-6 px-6 py-6">
          <section className="grid gap-4 md:grid-cols-2">
            <InfoRow label="Location" value={job.location} />
            <InfoRow label="Employment" value={job.employmentType} />
            <InfoRow label="Visibility" value={detail.visibility} />
            <InfoRow label="Workflow" value={detail.workflowStage} />
            <InfoRow label="Approval" value={detail.approvalStatus} />
            <InfoRow label="Compensation" value={[detail.compensationType, detail.currency].filter(Boolean).join(' · ')} />
            <InfoRow label="Workplace" value={detail.workplaceType} />
            <InfoRow
              label="Salary"
              value={
                detail.salaryMin || detail.salaryMax
                  ? `${detail.salaryMin ?? '—'} – ${detail.salaryMax ?? '—'}`
                  : null
              }
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700">Description</h3>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">{job.description}</p>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <InfoRow label="Manager" value={detail.hiringManagerName} />
            <InfoRow label="Manager Email" value={detail.hiringManagerEmail} />
            <InfoRow label="Recruiter" value={detail.recruiterName} />
            <InfoRow label="Recruiter Email" value={detail.recruiterEmail} />
            <InfoRow label="Apply URL" value={detail.applicationUrl} />
            <InfoRow label="Apply Email" value={detail.applicationEmail} />
            <InfoRow label="Apply Notes" value={detail.applicationInstructions} />
            <InfoRow label="External Ref" value={detail.externalReference} />
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <ListBlock title="Requirements" items={requirements} />
            <ListBlock title="Responsibilities" items={responsibilities} />
            <ListBlock title="Benefits" items={benefits} />
          </section>

          {attachments.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">Files</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {attachments.map((attachment, index) => (
                  <a
                    key={`${attachment.url ?? 'attachment'}-${index}`}
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-indigo-600 shadow-sm transition hover:border-indigo-500 hover:text-indigo-500"
                  >
                    <span className="block text-xs uppercase tracking-wide text-slate-400">{attachment.type || 'File'}</span>
                    <span className="block truncate text-sm font-medium">{attachment.label || attachment.url}</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Promotion</h3>
              <PromotionPills promotionFlags={detail.promotionFlags} />
            </div>
            {detail.tags?.length ? (
              <div className="flex flex-wrap gap-2">
                {detail.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No tags applied.</p>
            )}
          </section>

          {detail.metadata && Object.keys(detail.metadata).length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-slate-900 text-slate-100 shadow-sm">
              <header className="flex items-center justify-between border-b border-slate-700 px-5 py-3">
                <h3 className="text-sm font-semibold">Metadata</h3>
              </header>
              <pre className="overflow-x-auto px-5 py-4 text-xs leading-relaxed">{JSON.stringify(detail.metadata, null, 2)}</pre>
            </section>
          )}
        </main>

        <footer className="sticky bottom-0 border-t border-slate-200 bg-white/80 px-6 py-4 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              {detail.publishedAt && <span>Published {formatDateTime(detail.publishedAt)}</span>}
              {detail.expiresAt && <span>Expires {formatDateTime(detail.expiresAt)}</span>}
              {detail.archiveReason && <span>Archive note: {detail.archiveReason}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onPublish}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <RocketLaunchIcon className="h-4 w-4" aria-hidden="true" />
                Publish
              </button>
              <button
                type="button"
                onClick={onArchive}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-sm transition hover:border-rose-400 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <ArchiveBoxIcon className="h-4 w-4" aria-hidden="true" />
                Archive
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-rose-600 shadow-sm transition hover:border-rose-300 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <TrashIcon className="h-4 w-4" aria-hidden="true" />
                Delete
              </button>
            </div>
          </div>
        </footer>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:hidden"
        >
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
