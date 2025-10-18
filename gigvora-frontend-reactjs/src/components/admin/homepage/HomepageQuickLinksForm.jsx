function createLink() {
  return {
    id: `homepage-link-${Math.random().toString(36).slice(2, 8)}`,
    label: '',
    href: '',
    target: '_self',
  };
}

export default function HomepageQuickLinksForm({ value, onChange, disabled }) {
  const links = Array.isArray(value) ? value : [];

  const updateLinks = (nextLinks) => {
    if (typeof onChange !== 'function') return;
    onChange(nextLinks);
  };

  const handleFieldChange = (index, field) => (event) => {
    const nextLinks = links.map((link, linkIndex) => {
      if (linkIndex !== index) return link;
      const nextValue = field === 'target' ? event.target.value : event.target.value;
      return {
        ...link,
        [field]: nextValue,
      };
    });
    updateLinks(nextLinks);
  };

  const handleAdd = () => {
    updateLinks([...links, createLink()]);
  };

  const handleRemove = (index) => () => {
    updateLinks(links.filter((_, linkIndex) => linkIndex !== index));
  };

  return (
    <section id="admin-homepage-quick-links" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Quick links</h2>
          <p className="mt-1 text-sm text-slate-600">Curate navigation shortcuts to demos, login, pricing, or support.</p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled || links.length >= 6}
          className="inline-flex items-center rounded-full border border-accent bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-accent transition hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
        >
          Add link
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {links.map((link, index) => (
          <div key={link.id ?? index} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Link {index + 1}</p>
              <button
                type="button"
                onClick={handleRemove(index)}
                disabled={disabled}
                className="text-xs font-semibold uppercase tracking-wide text-red-500 transition hover:text-red-600 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Remove
              </button>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Label</label>
                <input
                  type="text"
                  value={link.label ?? ''}
                  onChange={handleFieldChange(index, 'label')}
                  disabled={disabled}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Href</label>
                <input
                  type="text"
                  value={link.href ?? ''}
                  onChange={handleFieldChange(index, 'href')}
                  disabled={disabled}
                  placeholder="/contact/sales"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Target</label>
                <select
                  value={link.target ?? '_self'}
                  onChange={handleFieldChange(index, 'target')}
                  disabled={disabled}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="_self">Same tab</option>
                  <option value="_blank">New tab</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        {!links.length ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
            Quick links can direct admins to demos, documentation, or support escalation paths.
          </div>
        ) : null}
      </div>
    </section>
  );
}
