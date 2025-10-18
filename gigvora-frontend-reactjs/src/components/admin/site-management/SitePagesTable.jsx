import { formatDistanceToNow } from 'date-fns';

const STATUS_COLORS = {
  draft: 'bg-slate-200 text-slate-700',
  review: 'bg-amber-200 text-amber-800',
  published: 'bg-emerald-200 text-emerald-800',
  archived: 'bg-slate-300 text-slate-700',
};

function humanizeStatus(status) {
  if (!status) return 'Unknown';
  return status
    .toString()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDate(value) {
  if (!value) {
    return '—';
  }
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch (error) {
    return '—';
  }
}

export default function SitePagesTable({ pages = [], stats, onCreateClick, onEdit, onDelete, onPreview }) {
  const publishedCount = stats?.published ?? pages.filter((page) => page.status === 'published').length;
  const draftCount = stats?.draft ?? pages.filter((page) => page.status !== 'published').length;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900">Pages</h2>
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
              Live {publishedCount}
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
              Draft {draftCount}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onCreateClick}
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          New page
        </button>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {pages.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                  No pages yet. Create one to publish it on the site.
                </td>
              </tr>
            ) : (
              pages.map((page) => {
                const statusClass = STATUS_COLORS[page.status] ?? STATUS_COLORS.draft;
                return (
                  <tr key={page.id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">{page.title}</div>
                      {page.summary ? (
                        <p className="mt-1 text-xs text-slate-500">{page.summary}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-slate-600">/{page.slug}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
                        {humanizeStatus(page.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      <div>{formatDate(page.updatedAt || page.createdAt)}</div>
                      {page.publishedAt ? (
                        <div className="text-xs text-slate-400">Published {formatDate(page.publishedAt)}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit?.(page)}
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete?.(page)}
                          className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => onPreview?.(page)}
                          className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                        >
                          Preview
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
