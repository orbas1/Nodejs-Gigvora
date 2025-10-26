import { SparklesIcon } from '@heroicons/react/24/outline';
import FormField from '../components/FormField.jsx';
import ThemeSwitcher from '../personalization/ThemeSwitcher.jsx';

export default function BrandForm({ theme, onChange, canEdit }) {
  const handleThemeChange = (next) => {
    onChange({ ...theme, ...next });
  };

  return (
    <div className="space-y-8">
      <ThemeSwitcher theme={theme} onChange={handleThemeChange} canEdit={canEdit} />

      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Brand assets</h3>
            <p className="text-sm text-slate-500">
              Upload your signature marks and preview how they adapt across light and dark canvases.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <SparklesIcon className="h-4 w-4" />
            Adaptive scaling
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Logo URL">
              <input
                type="url"
                value={theme.logoUrl}
                onChange={(event) => handleThemeChange({ logoUrl: event.target.value })}
                disabled={!canEdit}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
            </FormField>
            <FormField label="Favicon URL">
              <input
                type="url"
                value={theme.faviconUrl}
                onChange={(event) => handleThemeChange({ faviconUrl: event.target.value })}
                disabled={!canEdit}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
            </FormField>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <span className="text-sm font-semibold text-slate-600">Light mode</span>
                {theme.logoUrl ? (
                  <img src={theme.logoUrl} alt="Logo preview light" className="h-8" />
                ) : (
                  <span className="text-xs text-slate-400">Add logo URL</span>
                )}
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-900 bg-slate-900/95 p-3 shadow-lg">
                <span className="text-sm font-semibold text-white/70">Dark mode</span>
                {theme.logoUrl ? (
                  <img src={theme.logoUrl} alt="Logo preview dark" className="h-8 invert" />
                ) : (
                  <span className="text-xs text-white/50">Add logo URL</span>
                )}
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500 shadow-sm">
                <span>Favicon</span>
                {theme.faviconUrl ? (
                  <img src={theme.faviconUrl} alt="Favicon preview" className="h-6 w-6" />
                ) : (
                  <span className="text-xs text-slate-400">Add favicon URL</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
