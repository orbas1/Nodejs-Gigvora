import AgencyBlogPostForm from './AgencyBlogPostForm.jsx';

export default function AgencyBlogPostDrawer({
  open,
  formState,
  onChange,
  onClose,
  onSubmit,
  saving,
  categories,
  workspaceName,
  onDelete,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="ml-auto flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{formState?.id ? 'Edit post' : 'New post'}</h2>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              {workspaceName || 'Workspace'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
              >
                Delete
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              Close
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <AgencyBlogPostForm
            formState={formState}
            onChange={onChange}
            onSubmit={onSubmit}
            onReset={onClose}
            saving={saving}
            categories={categories}
            workspaceName={workspaceName}
            mode="wizard"
            submitLabel={formState?.id ? 'Save' : 'Publish'}
          />
        </div>
      </div>
    </div>
  );
}
