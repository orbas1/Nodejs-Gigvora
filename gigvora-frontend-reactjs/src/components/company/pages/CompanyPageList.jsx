import { formatDistanceToNow } from 'date-fns';

const STATUS_LABELS = {
  draft: 'Draft',
  in_review: 'In review',
  scheduled: 'Scheduled',
  published: 'Published',
  archived: 'Archived',
};

const VISIBILITY_LABELS = {
  private: 'Private',
  internal: 'Internal',
  public: 'Public',
};

function formatRelative(value) {
  if (!value) return '—';
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch (error) {
    return '—';
  }
}

export default function CompanyPageList({
  pages,
  loading,
  onSelect,
  onPublish,
  onArchive,
  onDelete,
}) {
  if (!pages?.length && !loading) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center text-sm text-slate-600">
        <p className="font-semibold">No pages yet.</p>
        <p className="mt-1">Use the creation form to launch your first destination.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50/80">
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Page</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Visibility</th>
            <th className="px-4 py-3">Conversion</th>
            <th className="px-4 py-3">Updated</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
          {pages?.map((page) => {
            const statusLabel = STATUS_LABELS[page.status] ?? page.status;
            const visibilityLabel = VISIBILITY_LABELS[page.visibility] ?? page.visibility;
            const conversion = page.analytics?.conversionRate;
            const conversionLabel = conversion != null && conversion !== '' ? `${Number(conversion).toFixed(2)}%` : '—';
            return (
              <tr key={page.id} className="transition hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onSelect?.(page)}
                    className="text-left text-slate-900 transition hover:text-accent"
                  >
                    <p className="font-semibold">{page.title}</p>
                    <p className="mt-1 text-xs text-slate-500">/{page.slug}</p>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    <span className="h-2 w-2 rounded-full bg-accent" />
                    {statusLabel}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{visibilityLabel}</td>
                <td className="px-4 py-3 text-slate-600">{conversionLabel}</td>
                <td className="px-4 py-3 text-slate-600">{formatRelative(page.updatedAt ?? page.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => onSelect?.(page)}
                      className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                    >
                      Edit
                    </button>
                    {page.status !== 'published' ? (
                      <button
                        type="button"
                        onClick={() => onPublish?.(page)}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 transition hover:border-emerald-400"
                      >
                        Publish
                      </button>
                    ) : null}
                    {page.status !== 'archived' ? (
                      <button
                        type="button"
                        onClick={() => onArchive?.(page)}
                        className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-500 transition hover:border-rose-300 hover:text-rose-500"
                      >
                        Archive
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onDelete?.(page)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 font-semibold text-rose-600 transition hover:border-rose-400"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {loading ? (
        <div className="border-t border-slate-200 bg-white/80 p-3 text-center text-xs text-slate-500">Refreshing…</div>
      ) : null}
    </div>
  );
}
