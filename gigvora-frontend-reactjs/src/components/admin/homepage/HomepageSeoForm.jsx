export default function HomepageSeoForm({ value, onChange, disabled }) {
  const seo = value ?? {};
  const keywords = Array.isArray(seo.keywords) ? seo.keywords.join(', ') : seo.keywords ?? '';

  const handleFieldChange = (field) => (event) => {
    if (typeof onChange !== 'function') return;
    const nextValue = event.target.value;
    if (field === 'keywords') {
      const parsed = nextValue
        .split(',')
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length > 0);
      onChange({
        ...seo,
        keywords: parsed,
      });
      return;
    }

    onChange({
      ...seo,
      [field]: nextValue,
    });
  };

  return (
    <section id="admin-homepage-seo" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">SEO & social metadata</h2>
          <p className="mt-1 text-sm text-slate-600">
            Optimise how the homepage is indexed and rendered on social platforms.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="seo-title" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Title tag
          </label>
          <input
            id="seo-title"
            type="text"
            value={seo.title ?? ''}
            onChange={handleFieldChange('title')}
            disabled={disabled}
            placeholder="Gigvora | Product-ready teams on demand"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="seo-og-image" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Open graph image URL
          </label>
          <input
            id="seo-og-image"
            type="text"
            value={seo.ogImageUrl ?? ''}
            onChange={handleFieldChange('ogImageUrl')}
            disabled={disabled}
            placeholder="https://cdn.gigvora.com/assets/og/homepage.png"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="seo-description" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Meta description
          </label>
          <textarea
            id="seo-description"
            rows={3}
            value={seo.description ?? ''}
            onChange={handleFieldChange('description')}
            disabled={disabled}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="seo-keywords" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Keywords
          </label>
          <input
            id="seo-keywords"
            type="text"
            value={keywords}
            onChange={handleFieldChange('keywords')}
            disabled={disabled}
            placeholder="gigvora, product talent, marketplace"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
          <p className="text-xs text-slate-500">Separate keywords with commas.</p>
        </div>
      </div>
    </section>
  );
}
