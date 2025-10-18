import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

export default function ProfileHubLinksPanel({ links, onChange, disabled, layout = 'default' }) {
  const fieldClass = clsx(
    'mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none',
    layout === 'modal' ? 'bg-white' : 'bg-white/80',
  );

  const handleLinkChange = (index, key, value) => {
    const next = links.map((link, linkIndex) => (linkIndex === index ? { ...link, [key]: value } : link));
    onChange(next);
  };

  const handleAdd = () => {
    onChange([
      ...links,
      { id: `link-${Date.now()}`, label: '', url: '', description: '' },
    ]);
  };

  const handleRemove = (index) => {
    onChange(links.filter((_, linkIndex) => linkIndex !== index));
  };

  return (
    <div className="flex flex-col gap-4">
      {links.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-center text-sm text-slate-500">
          No links yet. Add sites, profiles, or booking pages.
        </p>
      ) : (
        <div className="grid gap-4">
          {links.map((link, index) => (
            <div key={link.id ?? index} className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-600">
                  Label
                  <input
                    type="text"
                    value={link.label}
                    onChange={(event) => handleLinkChange(index, 'label', event.target.value)}
                    className={fieldClass}
                    placeholder="LinkedIn"
                    disabled={disabled}
                  />
                </label>
                <label className="text-sm font-medium text-slate-600">
                  URL
                  <input
                    type="url"
                    value={link.url}
                    onChange={(event) => handleLinkChange(index, 'url', event.target.value)}
                    className={fieldClass}
                    placeholder="https://"
                    disabled={disabled}
                  />
                </label>
              </div>
              <label className="mt-3 block text-sm font-medium text-slate-600">
                Note
                <textarea
                  rows={2}
                  value={link.description}
                  onChange={(event) => handleLinkChange(index, 'description', event.target.value)}
                  className={clsx(fieldClass, 'resize-none')}
                  placeholder="Optional context"
                  disabled={disabled}
                />
              </label>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  disabled={disabled}
                  className="inline-flex items-center gap-1 rounded-2xl border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <TrashIcon className="h-4 w-4" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={handleAdd}
        disabled={disabled}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-dashed border-accent/60 px-4 py-2 text-sm font-semibold text-accent transition hover:border-accent hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <PlusIcon className="h-4 w-4" /> Add link
      </button>
    </div>
  );
}
