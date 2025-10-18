import FormField from '../components/FormField.jsx';
import { ensureArray } from '../defaults.js';
import { createLocalId } from '../utils.js';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
];

export default function BasicsForm({ settings, navigation, onSettingsChange, onNavigationChange, canEdit }) {
  const links = ensureArray(navigation.links);

  const handleLinkChange = (id, key, value) => {
    const nextLinks = links.map((link) => (link.id === id ? { ...link, [key]: value } : link));
    onNavigationChange({ links: nextLinks });
  };

  const handleAddLink = () => {
    const nextLinks = [
      ...links,
      { id: createLocalId('nav'), label: 'Page', url: '#', openInNewTab: false },
    ];
    onNavigationChange({ links: nextLinks });
  };

  const handleRemoveLink = (id) => {
    const nextLinks = links.filter((link) => link.id !== id);
    onNavigationChange({ links: nextLinks });
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Site</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Name">
            <input
              type="text"
              value={settings.siteTitle}
              onChange={(event) => onSettingsChange({ ...settings, siteTitle: event.target.value })}
              disabled={!canEdit}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </FormField>
          <FormField label="Tagline">
            <input
              type="text"
              value={settings.tagline}
              onChange={(event) => onSettingsChange({ ...settings, tagline: event.target.value })}
              disabled={!canEdit}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </FormField>
          <FormField label="Slug" description="Controls your hosted URL.">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-500">gigvora.com/</span>
              <input
                type="text"
                value={settings.siteSlug}
                onChange={(event) => onSettingsChange({ ...settings, siteSlug: event.target.value })}
                disabled={!canEdit}
                className="flex-1 bg-transparent focus:outline-none"
              />
            </div>
          </FormField>
          <FormField label="Language">
            <select
              value={settings.language}
              onChange={(event) => onSettingsChange({ ...settings, language: event.target.value })}
              disabled={!canEdit}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            >
              {LANGUAGES.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Domain" description="Use your own domain once DNS is ready.">
            <input
              type="text"
              value={settings.customDomain}
              onChange={(event) => onSettingsChange({ ...settings, customDomain: event.target.value })}
              disabled={!canEdit}
              placeholder="studio.yourbrand.com"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </FormField>
          <FormField label="Status" description="Publish when you're ready.">
            <button
              type="button"
              onClick={() => onSettingsChange({ ...settings, published: !settings.published })}
              disabled={!canEdit}
              className={`inline-flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm font-medium ${
                settings.published
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              <span>{settings.published ? 'Published' : 'Draft'}</span>
              <span className="text-xs uppercase tracking-widest">Toggle</span>
            </button>
          </FormField>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Menu</h3>
          <button
            type="button"
            onClick={handleAddLink}
            disabled={!canEdit}
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200"
          >
            Add link
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {links.length ? (
            links.map((link) => (
              <div key={link.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Label">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(event) => handleLinkChange(link.id, 'label', event.target.value)}
                      disabled={!canEdit}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </FormField>
                  <FormField label="URL">
                    <input
                      type="text"
                      value={link.url}
                      onChange={(event) => handleLinkChange(link.id, 'url', event.target.value)}
                      disabled={!canEdit}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </FormField>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(link.openInNewTab)}
                      onChange={(event) => handleLinkChange(link.id, 'openInNewTab', event.target.checked)}
                      disabled={!canEdit}
                      className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                    />
                    New tab
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(link.id)}
                    disabled={!canEdit}
                    className="text-rose-500 hover:text-rose-600 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
              Add quick navigation for sections or external links.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
