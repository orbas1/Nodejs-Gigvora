import FormField from '../components/FormField.jsx';
import { ensureArray } from '../defaults.js';
import { createLocalId } from '../utils.js';

export default function OffersForm({ services, onChange, canEdit }) {
  const items = ensureArray(services.items);

  const handleChange = (id, key, value) => {
    const nextItems = items.map((item) => (item.id === id ? { ...item, [key]: value } : item));
    onChange({ items: nextItems });
  };

  const handleAdd = () => {
    const nextItems = [
      ...items,
      {
        id: createLocalId('service'),
        name: 'New service',
        summary: '',
        startingPrice: '',
        deliveryTimeframe: '',
        ctaLabel: 'Book',
        ctaLink: '#contact',
        featured: false,
      },
    ];
    onChange({ items: nextItems });
  };

  const handleRemove = (id) => {
    const nextItems = items.filter((item) => item.id !== id);
    onChange({ items: nextItems });
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Services</h3>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!canEdit}
          className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200"
        >
          Add service
        </button>
      </div>
      <div className="mt-4 space-y-4">
        {items.length ? (
          items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Name">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(event) => handleChange(item.id, 'name', event.target.value)}
                    disabled={!canEdit}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </FormField>
                <FormField label="Tagline">
                  <input
                    type="text"
                    value={item.summary || ''}
                    onChange={(event) => handleChange(item.id, 'summary', event.target.value)}
                    disabled={!canEdit}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </FormField>
                <FormField label="Price">
                  <input
                    type="text"
                    value={item.startingPrice || ''}
                    onChange={(event) => handleChange(item.id, 'startingPrice', event.target.value)}
                    disabled={!canEdit}
                    placeholder="From $2,000"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </FormField>
                <FormField label="Timeline">
                  <input
                    type="text"
                    value={item.deliveryTimeframe || ''}
                    onChange={(event) => handleChange(item.id, 'deliveryTimeframe', event.target.value)}
                    disabled={!canEdit}
                    placeholder="4 weeks"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </FormField>
                <FormField label="Button label">
                  <input
                    type="text"
                    value={item.ctaLabel || ''}
                    onChange={(event) => handleChange(item.id, 'ctaLabel', event.target.value)}
                    disabled={!canEdit}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </FormField>
                <FormField label="Button link">
                  <input
                    type="text"
                    value={item.ctaLink || ''}
                    onChange={(event) => handleChange(item.id, 'ctaLink', event.target.value)}
                    disabled={!canEdit}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </FormField>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(item.featured)}
                    onChange={(event) => handleChange(item.id, 'featured', event.target.checked)}
                    disabled={!canEdit}
                    className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                  />
                  Featured
                </label>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
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
            Add packages or retainers you deliver.
          </p>
        )}
      </div>
    </div>
  );
}
