function createHighlight() {
  return {
    id: `homepage-highlight-${Math.random().toString(36).slice(2, 8)}`,
    title: '',
    description: '',
    icon: '',
    ctaLabel: '',
    ctaHref: '',
    mediaUrl: '',
    mediaAlt: '',
  };
}

export default function HomepageHighlightsForm({ value, onChange, disabled }) {
  const highlights = Array.isArray(value) ? value : [];

  const updateHighlights = (nextHighlights) => {
    if (typeof onChange !== 'function') return;
    onChange(nextHighlights);
  };

  const handleFieldChange = (index, field) => (event) => {
    const nextHighlights = highlights.map((highlight, highlightIndex) => {
      if (highlightIndex !== index) return highlight;
      return {
        ...highlight,
        [field]: event.target.value,
      };
    });
    updateHighlights(nextHighlights);
  };

  const handleRemove = (index) => () => {
    updateHighlights(highlights.filter((_, highlightIndex) => highlightIndex !== index));
  };

  const handleAdd = () => {
    updateHighlights([...highlights, createHighlight()]);
  };

  return (
    <section id="admin-homepage-highlights" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Highlights & value props</h2>
          <p className="mt-1 text-sm text-slate-600">
            Showcase the key reasons organisations choose Gigvora. Each card supports a short description, optional icon, and CTA.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled || highlights.length >= 6}
          className="inline-flex items-center rounded-full border border-accent bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-accent transition hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
        >
          Add highlight
        </button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {highlights.map((highlight, index) => (
          <div key={highlight.id ?? index} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 shadow-inner">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Highlight {index + 1}</p>
                <p className="text-sm text-slate-600">Keep titles short and outcome-oriented.</p>
              </div>
              <button
                type="button"
                onClick={handleRemove(index)}
                disabled={disabled}
                className="text-xs font-semibold uppercase tracking-wide text-red-500 transition hover:text-red-600 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Remove
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Title</label>
                <input
                  type="text"
                  value={highlight.title ?? ''}
                  onChange={handleFieldChange(index, 'title')}
                  disabled={disabled}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Description</label>
                <textarea
                  rows={2}
                  value={highlight.description ?? ''}
                  onChange={handleFieldChange(index, 'description')}
                  disabled={disabled}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Icon name</label>
                  <input
                    type="text"
                    value={highlight.icon ?? ''}
                    onChange={handleFieldChange(index, 'icon')}
                    disabled={disabled}
                    placeholder="ShieldCheckIcon"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">CTA label</label>
                  <input
                    type="text"
                    value={highlight.ctaLabel ?? ''}
                    onChange={handleFieldChange(index, 'ctaLabel')}
                    disabled={disabled}
                    placeholder="Review trust center"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">CTA link</label>
                  <input
                    type="text"
                    value={highlight.ctaHref ?? ''}
                    onChange={handleFieldChange(index, 'ctaHref')}
                    disabled={disabled}
                    placeholder="/trust-center"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Media URL</label>
                  <input
                    type="text"
                    value={highlight.mediaUrl ?? ''}
                    onChange={handleFieldChange(index, 'mediaUrl')}
                    disabled={disabled}
                    placeholder="https://cdn.gigvora.com/assets/highlights/compliance.png"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Media alt text</label>
                <input
                  type="text"
                  value={highlight.mediaAlt ?? ''}
                  onChange={handleFieldChange(index, 'mediaAlt')}
                  disabled={disabled}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>
        ))}
        {!highlights.length ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
            Add up to six highlights to communicate outcomes, compliance, or monetisation advantages.
          </div>
        ) : null}
      </div>
    </section>
  );
}
