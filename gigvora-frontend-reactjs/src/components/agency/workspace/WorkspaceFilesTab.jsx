import { useState } from 'react';

const SUBMISSION_STATUSES = ['pending', 'in_review', 'approved', 'changes_requested'];

export default function WorkspaceFilesTab({
  documents = [],
  submissions = [],
  onCreateDocument,
  onUpdateDocument,
  onDeleteDocument,
  onCreateSubmission,
  onUpdateSubmission,
  onDeleteSubmission,
}) {
  const [documentForm, setDocumentForm] = useState(null);
  const [submissionForm, setSubmissionForm] = useState(null);

  return (
    <div className="space-y-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">File manager</h2>
          <button
            type="button"
            onClick={() => setDocumentForm({ visibility: 'team', category: 'general' })}
            className="inline-flex items-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark"
          >
            {documentForm?.id ? 'Editing file…' : 'Add file'}
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {documents.map((document) => (
            <div key={document.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200/70 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{document.name}</p>
                <p className="text-xs text-slate-500">
                  {document.category} · {document.visibility} · {document.ownerName || 'Unassigned'}
                </p>
                {document.storageUrl ? (
                  <a
                    href={document.storageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center text-xs font-semibold text-accent hover:text-accentDark"
                  >
                    View file
                  </a>
                ) : null}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setDocumentForm({
                      id: document.id,
                      name: document.name ?? '',
                      category: document.category ?? 'general',
                      storageUrl: document.storageUrl ?? '',
                      thumbnailUrl: document.thumbnailUrl ?? '',
                      visibility: document.visibility ?? 'team',
                      ownerName: document.ownerName ?? '',
                      version: document.version ?? '',
                      notes: document.notes ?? '',
                      sizeBytes: document.sizeBytes ?? '',
                    })
                  }
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteDocument?.(document.id)}
                  className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {documents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
              No project files yet.
            </div>
          ) : null}
        </div>

        {documentForm !== null ? (
          <form
            className="mt-6 grid gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!documentForm.name || !documentForm.storageUrl) {
                return;
              }
              const payload = {
                name: documentForm.name,
                category: documentForm.category,
                storageUrl: documentForm.storageUrl,
                thumbnailUrl: documentForm.thumbnailUrl,
                visibility: documentForm.visibility,
                ownerName: documentForm.ownerName,
                version: documentForm.version,
                notes: documentForm.notes,
                sizeBytes: documentForm.sizeBytes,
              };
              if (documentForm.id) {
                onUpdateDocument?.(documentForm.id, payload);
              } else {
                onCreateDocument?.(payload);
              }
              setDocumentForm(null);
            }}
          >
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Name
              <input
                type="text"
                value={documentForm.name ?? ''}
                onChange={(event) => setDocumentForm((state) => ({ ...(state ?? {}), name: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Category
              <input
                type="text"
                value={documentForm.category ?? 'general'}
                onChange={(event) => setDocumentForm((state) => ({ ...(state ?? {}), category: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Storage URL
              <input
                type="url"
                value={documentForm.storageUrl ?? ''}
                onChange={(event) => setDocumentForm((state) => ({ ...(state ?? {}), storageUrl: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Thumbnail URL
              <input
                type="url"
                value={documentForm.thumbnailUrl ?? ''}
                onChange={(event) => setDocumentForm((state) => ({ ...(state ?? {}), thumbnailUrl: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Visibility
              <input
                type="text"
                value={documentForm.visibility ?? 'team'}
                onChange={(event) => setDocumentForm((state) => ({ ...(state ?? {}), visibility: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Owner name
              <input
                type="text"
                value={documentForm.ownerName ?? ''}
                onChange={(event) => setDocumentForm((state) => ({ ...(state ?? {}), ownerName: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Version
              <input
                type="text"
                value={documentForm.version ?? ''}
                onChange={(event) => setDocumentForm((state) => ({ ...(state ?? {}), version: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Size (bytes)
              <input
                type="number"
                min="0"
                value={documentForm.sizeBytes ?? ''}
                onChange={(event) => setDocumentForm((state) => ({ ...(state ?? {}), sizeBytes: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="md:col-span-2 space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Notes
              <textarea
                value={documentForm.notes ?? ''}
                onChange={(event) => setDocumentForm((state) => ({ ...(state ?? {}), notes: event.target.value }))}
                rows={2}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <div className="md:col-span-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setDocumentForm(null)}
                className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                {documentForm.id ? 'Save file' : 'Add file'}
              </button>
            </div>
          </form>
        ) : null}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Submissions</h2>
          <button
            type="button"
            onClick={() => setSubmissionForm({ status: 'pending', submissionType: 'deliverable' })}
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            {submissionForm?.id ? 'Editing submission…' : 'Add submission'}
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {submissions.map((submission) => (
            <div key={submission.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200/70 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{submission.title}</p>
                <p className="text-xs text-slate-500">
                  {submission.submissionType?.replace(/_/g, ' ') ?? 'deliverable'} · {submission.status?.replace(/_/g, ' ') ?? 'pending'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSubmissionForm({
                      id: submission.id,
                      title: submission.title ?? '',
                      submissionType: submission.submissionType ?? 'deliverable',
                      status: submission.status ?? 'pending',
                      dueAt: submission.dueAt ? submission.dueAt.slice(0, 16) : '',
                      submittedAt: submission.submittedAt ? submission.submittedAt.slice(0, 16) : '',
                      submittedByName: submission.submittedByName ?? '',
                      submittedByEmail: submission.submittedByEmail ?? '',
                      assetUrl: submission.assetUrl ?? '',
                      notes: submission.notes ?? '',
                    })
                  }
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteSubmission?.(submission.id)}
                  className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {submissions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
              No submissions logged.
            </div>
          ) : null}
        </div>

        {submissionForm !== null ? (
          <form
            className="mt-6 grid gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!submissionForm.title) {
                return;
              }
              const payload = {
                title: submissionForm.title,
                submissionType: submissionForm.submissionType,
                status: submissionForm.status,
                dueAt: submissionForm.dueAt,
                submittedAt: submissionForm.submittedAt,
                submittedByName: submissionForm.submittedByName,
                submittedByEmail: submissionForm.submittedByEmail,
                assetUrl: submissionForm.assetUrl,
                notes: submissionForm.notes,
              };
              if (submissionForm.id) {
                onUpdateSubmission?.(submissionForm.id, payload);
              } else {
                onCreateSubmission?.(payload);
              }
              setSubmissionForm(null);
            }}
          >
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Title
              <input
                type="text"
                value={submissionForm.title ?? ''}
                onChange={(event) => setSubmissionForm((state) => ({ ...(state ?? {}), title: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Type
              <input
                type="text"
                value={submissionForm.submissionType ?? 'deliverable'}
                onChange={(event) => setSubmissionForm((state) => ({ ...(state ?? {}), submissionType: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
              <select
                value={submissionForm.status ?? 'pending'}
                onChange={(event) => setSubmissionForm((state) => ({ ...(state ?? {}), status: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {SUBMISSION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Due date
              <input
                type="datetime-local"
                value={submissionForm.dueAt ?? ''}
                onChange={(event) => setSubmissionForm((state) => ({ ...(state ?? {}), dueAt: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Submitted at
              <input
                type="datetime-local"
                value={submissionForm.submittedAt ?? ''}
                onChange={(event) => setSubmissionForm((state) => ({ ...(state ?? {}), submittedAt: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Submitted by (name)
              <input
                type="text"
                value={submissionForm.submittedByName ?? ''}
                onChange={(event) => setSubmissionForm((state) => ({ ...(state ?? {}), submittedByName: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Submitted by (email)
              <input
                type="email"
                value={submissionForm.submittedByEmail ?? ''}
                onChange={(event) => setSubmissionForm((state) => ({ ...(state ?? {}), submittedByEmail: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Asset URL
              <input
                type="url"
                value={submissionForm.assetUrl ?? ''}
                onChange={(event) => setSubmissionForm((state) => ({ ...(state ?? {}), assetUrl: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="md:col-span-2 space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Notes
              <textarea
                value={submissionForm.notes ?? ''}
                onChange={(event) => setSubmissionForm((state) => ({ ...(state ?? {}), notes: event.target.value }))}
                rows={2}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <div className="md:col-span-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSubmissionForm(null)}
                className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                {submissionForm.id ? 'Save submission' : 'Add submission'}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
