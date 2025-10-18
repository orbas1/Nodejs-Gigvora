function generateStat() {
  return {
    id: `hero-stat-${Math.random().toString(36).slice(2, 8)}`,
    label: '',
    value: '',
    suffix: '',
  };
}

export default function HomepageHeroForm({ value, onChange, disabled }) {
  const hero = value ?? {};
  const stats = Array.isArray(hero.stats) ? hero.stats : [];

  const updateHero = (changes) => {
    if (typeof onChange !== 'function') return;
    onChange({
      ...hero,
      ...changes,
    });
  };

  const handleFieldChange = (field) => (event) => {
    const nextValue = event.target.type === 'number' ? Number(event.target.value) : event.target.value;
    updateHero({ [field]: nextValue });
  };

  const handleOverlayChange = (event) => {
    const numeric = Number(event.target.value);
    updateHero({ overlayOpacity: Number.isNaN(numeric) ? hero.overlayOpacity ?? 0.5 : numeric });
  };

  const handleStatChange = (index, field) => (event) => {
    if (!Array.isArray(stats)) {
      updateHero({ stats: [] });
      return;
    }
    const nextStats = stats.map((stat, statIndex) => {
      if (statIndex !== index) return stat;
      const nextValue = field === 'value' ? Number(event.target.value) : event.target.value;
      return {
        ...stat,
        [field]: field === 'value' && Number.isNaN(nextValue) ? stat.value ?? 0 : nextValue,
      };
    });
    updateHero({ stats: nextStats });
  };

  const handleAddStat = () => {
    const nextStats = [...stats, generateStat()];
    updateHero({ stats: nextStats });
  };

  const handleRemoveStat = (index) => () => {
    const nextStats = stats.filter((_, statIndex) => statIndex !== index);
    updateHero({ stats: nextStats });
  };

  return (
    <section id="admin-homepage-hero" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Hero headline</h2>
          <p className="mt-1 text-sm text-slate-600">
            Control the primary hero content, CTAs, media, and proof points that greet visitors on the homepage.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overlay</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={hero.overlayOpacity ?? 0.55}
            onChange={handleOverlayChange}
            disabled={disabled}
            className="h-1 w-32 cursor-pointer appearance-none rounded-full bg-slate-200 accent-accent"
          />
          <span className="text-sm font-semibold text-slate-700">{Math.round((hero.overlayOpacity ?? 0.55) * 100)}%</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="hero-title" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Title
          </label>
          <input
            id="hero-title"
            type="text"
            value={hero.title ?? ''}
            onChange={handleFieldChange('title')}
            disabled={disabled}
            placeholder="Build resilient product squads without the guesswork"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="hero-subtitle" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Subtitle
          </label>
          <textarea
            id="hero-subtitle"
            rows={2}
            value={hero.subtitle ?? ''}
            onChange={handleFieldChange('subtitle')}
            disabled={disabled}
            placeholder="Spin up verified teams with treasury, compliance, and delivery guardrails baked in."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="hero-primary-label" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Primary CTA label
          </label>
          <input
            id="hero-primary-label"
            type="text"
            value={hero.primaryCtaLabel ?? ''}
            onChange={handleFieldChange('primaryCtaLabel')}
            disabled={disabled}
            placeholder="Book enterprise demo"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="hero-primary-href" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Primary CTA link
          </label>
          <input
            id="hero-primary-href"
            type="text"
            value={hero.primaryCtaHref ?? ''}
            onChange={handleFieldChange('primaryCtaHref')}
            disabled={disabled}
            placeholder="/contact/sales"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="hero-secondary-label" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Secondary CTA label
          </label>
          <input
            id="hero-secondary-label"
            type="text"
            value={hero.secondaryCtaLabel ?? ''}
            onChange={handleFieldChange('secondaryCtaLabel')}
            disabled={disabled}
            placeholder="Explore marketplace"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="hero-secondary-href" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Secondary CTA link
          </label>
          <input
            id="hero-secondary-href"
            type="text"
            value={hero.secondaryCtaHref ?? ''}
            onChange={handleFieldChange('secondaryCtaHref')}
            disabled={disabled}
            placeholder="/gigs"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="hero-background-url" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Background image URL
          </label>
          <input
            id="hero-background-url"
            type="text"
            value={hero.backgroundImageUrl ?? ''}
            onChange={handleFieldChange('backgroundImageUrl')}
            disabled={disabled}
            placeholder="https://cdn.gigvora.com/assets/hero/command-center.jpg"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="hero-background-alt" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Background alt text
          </label>
          <input
            id="hero-background-alt"
            type="text"
            value={hero.backgroundImageAlt ?? ''}
            onChange={handleFieldChange('backgroundImageAlt')}
            disabled={disabled}
            placeholder="Gigvora admin control tower dashboard"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Hero stats</h3>
          <button
            type="button"
            onClick={handleAddStat}
            disabled={disabled || stats.length >= 4}
            className="inline-flex items-center rounded-full border border-accent bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-accent transition hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
          >
            Add stat
          </button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {stats.map((stat, index) => (
            <div key={stat.id ?? index} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stat {index + 1}</p>
                <button
                  type="button"
                  onClick={handleRemoveStat(index)}
                  disabled={disabled}
                  className="text-xs font-semibold uppercase tracking-wide text-red-500 transition hover:text-red-600 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  Remove
                </button>
              </div>
              <div className="mt-3 space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Label</label>
                  <input
                    type="text"
                    value={stat.label ?? ''}
                    onChange={handleStatChange(index, 'label')}
                    disabled={disabled}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Value</label>
                    <input
                      type="number"
                      value={stat.value ?? ''}
                      onChange={handleStatChange(index, 'value')}
                      disabled={disabled}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Suffix</label>
                    <input
                      type="text"
                      value={stat.suffix ?? ''}
                      onChange={handleStatChange(index, 'suffix')}
                      disabled={disabled}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!stats.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-500">
              No stats yet. Add up to four proof points to reinforce credibility.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
