import FormField from '../components/FormField.jsx';
import { ensureArray } from '../defaults.js';
import { createLocalId } from '../utils.js';

const PLATFORMS = ['LinkedIn', 'Twitter', 'Instagram', 'YouTube', 'GitHub', 'Dribbble'];

export default function SocialForm({ social, onChange, canEdit }) {
  const links = ensureArray(social.links);

  const handleChange = (id, key, value) => {
    const nextLinks = links.map((link) => (link.id === id ? { ...link, [key]: value } : link));
    onChange({ links: nextLinks });
  };

  const handleAdd = () => {
    const nextLinks = [
      ...links,
      {
        id: createLocalId('social'),
        platform: 'LinkedIn',
        handle: '',
        url: '',
      },
    ];
    onChange({ links: nextLinks });
  };

  const handleRemove = (id) => {
    const nextLinks = links.filter((link) => link.id !== id);
    onChange({ links: nextLinks });
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Social</h3>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!canEdit}
          className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200"
        >
          Add profile
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {links.length ? (
          links.map((link) => (
            <div key={link.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <FormField label="Platform">
                  <select
                    value={link.platform || 'LinkedIn'}
                    onChange={(event) => handleChange(link.id, 'platform', event.target.value)}
                    disabled={!canEdit}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  >
                    {PLATFORMS.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Handle">
                  <input
                    type="text"
                    value={link.handle || ''}
                    onChange={(event) => handleChange(link.id, 'handle', event.target.value)}
                    disabled={!canEdit}
                    placeholder="@username"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </FormField>
                <FormField label="URL">
                  <input
                    type="url"
                    value={link.url || ''}
                    onChange={(event) => handleChange(link.id, 'url', event.target.value)}
                    disabled={!canEdit}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </FormField>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleRemove(link.id)}
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
            Link to the channels you actively use.
          </p>
        )}
      </div>
    </div>
  );
}
