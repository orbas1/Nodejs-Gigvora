import { XMarkIcon } from '@heroicons/react/24/outline';

function formatDate(value) {
  if (!value) {
    return '—';
  }
  try {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch (error) {
    return '—';
  }
}

export default function TemplatePreviewDrawer({ template, onClose }) {
  if (!template) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="hidden flex-1 bg-slate-900/40 backdrop-blur-sm lg:block" onClick={onClose} aria-hidden="true" />
      <div className="ml-auto flex h-full w-full max-w-5xl flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{template.name}</h3>
            <p className="text-sm text-slate-500">Updated {formatDate(template.updatedAt)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            aria-label="Close preview"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-0 pb-8">
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="bg-slate-50/60 p-6">
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="max-h-[70vh] overflow-y-auto px-8 py-10" dangerouslySetInnerHTML={{ __html: template.htmlBody }} />
              </div>
            </div>
            <div className="space-y-4 px-6 pt-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</p>
                <p className="mt-1 text-slate-900">{template.subject}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preheader</p>
                <p className="mt-1 text-slate-900">{template.preheader || '—'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Text version</p>
                <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-700">{template.textBody || '—'}</pre>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Variables</p>
                <ul className="mt-2 space-y-1 text-xs text-slate-700">
                  {Array.isArray(template.variables) && template.variables.length ? (
                    template.variables.map((variable) => (
                      <li key={variable.key} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2">
                        <span className="font-semibold">{variable.key}</span>
                        <span className="text-slate-500">{variable.sampleValue || '—'}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-500">None</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
