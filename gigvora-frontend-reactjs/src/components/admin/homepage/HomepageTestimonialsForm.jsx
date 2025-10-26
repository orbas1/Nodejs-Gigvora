function createHeroStat() {
  return {
    id: `homepage-testimonial-stat-${Math.random().toString(36).slice(2, 8)}`,
    value: '',
    label: '',
    helper: '',
  };
}

function createTestimonial() {
  return {
    id: `homepage-testimonial-${Math.random().toString(36).slice(2, 8)}`,
    quote: '',
    authorName: '',
    authorRole: '',
    authorCompany: '',
    avatarUrl: '',
    avatarAlt: '',
    highlight: '',
    badge: '',
  };
}

const MAX_TESTIMONIALS = 6;
const MAX_HERO_STATS = 6;

export default function HomepageTestimonialsForm({ value, onChange, disabled }) {
  const valueIsArray = Array.isArray(value);
  const valueIsObject = value && typeof value === 'object' && !valueIsArray;

  const heroSource = valueIsObject && value.hero && typeof value.hero === 'object' ? value.hero : {};
  const testimonialsSource = valueIsArray
    ? value
    : Array.isArray(value?.items)
    ? value.items
    : Array.isArray(value?.testimonials)
    ? value.testimonials
    : [];

  const hero = {
    eyebrow: heroSource.eyebrow ?? '',
    heading: heroSource.heading ?? '',
    description: heroSource.description ?? '',
    stats: Array.isArray(heroSource.stats) ? heroSource.stats : [],
    logos: Array.isArray(heroSource.logos) ? heroSource.logos : [],
  };

  const testimonials = Array.isArray(testimonialsSource) ? testimonialsSource : [];

  const buildPayload = (nextHero, nextTestimonials) => {
    if (!valueIsObject) {
      return {
        hero: nextHero,
        items: nextTestimonials,
      };
    }

    const preservedEntries = Object.entries(value).filter(
      ([key]) => !['hero', 'items', 'testimonials'].includes(key),
    );

    return {
      ...Object.fromEntries(preservedEntries),
      hero: nextHero,
      items: nextTestimonials,
    };
  };

  const updateForm = (nextHero, nextTestimonials) => {
    if (typeof onChange !== 'function') return;
    onChange(buildPayload(nextHero, nextTestimonials));
  };

  const handleHeroFieldChange = (field) => (event) => {
    updateForm({ ...hero, [field]: event.target.value }, testimonials);
  };

  const heroStats = Array.isArray(hero.stats) ? hero.stats : [];

  const handleHeroStatChange = (index, field) => (event) => {
    const nextStats = heroStats.map((stat, statIndex) => {
      if (statIndex !== index) return stat;
      return {
        ...stat,
        [field]: event.target.value,
      };
    });
    updateForm({ ...hero, stats: nextStats }, testimonials);
  };

  const handleAddHeroStat = () => {
    if (heroStats.length >= MAX_HERO_STATS) return;
    updateForm({ ...hero, stats: [...heroStats, createHeroStat()] }, testimonials);
  };

  const handleRemoveHeroStat = (index) => () => {
    const nextStats = heroStats.filter((_, statIndex) => statIndex !== index);
    updateForm({ ...hero, stats: nextStats }, testimonials);
  };

  const handleLogosChange = (event) => {
    const entries = event.target.value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
    updateForm({ ...hero, logos: entries }, testimonials);
  };

  const handleTestimonialFieldChange = (index, field) => (event) => {
    const nextTestimonials = testimonials.map((testimonial, testimonialIndex) => {
      if (testimonialIndex !== index) return testimonial;
      return {
        ...testimonial,
        [field]: event.target.value,
      };
    });
    updateForm(hero, nextTestimonials);
  };

  const handleAddTestimonial = () => {
    if (testimonials.length >= MAX_TESTIMONIALS) return;
    updateForm(hero, [...testimonials, createTestimonial()]);
  };

  const handleRemoveTestimonial = (index) => () => {
    const nextTestimonials = testimonials.filter((_, testimonialIndex) => testimonialIndex !== index);
    updateForm(hero, nextTestimonials);
  };

  return (
    <section id="admin-homepage-testimonials" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Testimonials</h2>
          <p className="mt-1 text-sm text-slate-600">
            Craft a hero with stats and brand logos, then curate quotes that mirror the proof points promised on the public site.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddTestimonial}
          disabled={disabled || testimonials.length >= MAX_TESTIMONIALS}
          className="inline-flex items-center rounded-full border border-accent bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-accent transition hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
        >
          Add testimonial
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="homepage-testimonials-hero-eyebrow" className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Hero eyebrow
            </label>
            <input
              id="homepage-testimonials-hero-eyebrow"
              type="text"
              value={hero.eyebrow}
              onChange={handleHeroFieldChange('eyebrow')}
              disabled={disabled}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="homepage-testimonials-hero-heading" className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Hero heading
            </label>
            <textarea
              id="homepage-testimonials-hero-heading"
              rows={2}
              value={hero.heading}
              onChange={handleHeroFieldChange('heading')}
              disabled={disabled}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="homepage-testimonials-hero-description" className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Hero description
            </label>
            <textarea
              id="homepage-testimonials-hero-description"
              rows={3}
              value={hero.description}
              onChange={handleHeroFieldChange('description')}
              disabled={disabled}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hero stats</p>
                <p className="text-[11px] text-slate-500">Surface up to six metrics that prove retention, trust, or growth.</p>
              </div>
              <button
                type="button"
                onClick={handleAddHeroStat}
                disabled={disabled || heroStats.length >= MAX_HERO_STATS}
                className="text-[11px] font-semibold uppercase tracking-wide text-accent transition hover:text-accent/80 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                Add stat
              </button>
            </div>

            <div className="space-y-3">
              {heroStats.map((stat, index) => (
                <div key={stat.id ?? `stat-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stat {index + 1}</p>
                    <button
                      type="button"
                      onClick={handleRemoveHeroStat(index)}
                      disabled={disabled}
                      className="text-[11px] font-semibold uppercase tracking-wide text-red-500 transition hover:text-red-600 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Value</label>
                      <input
                        type="text"
                        value={stat.value ?? ''}
                        onChange={handleHeroStatChange(index, 'value')}
                        disabled={disabled}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Label</label>
                      <input
                        type="text"
                        value={stat.label ?? ''}
                        onChange={handleHeroStatChange(index, 'label')}
                        disabled={disabled}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Helper</label>
                      <input
                        type="text"
                        value={stat.helper ?? ''}
                        onChange={handleHeroStatChange(index, 'helper')}
                        disabled={disabled}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {!heroStats.length ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-sm text-slate-500">
                  Add stats to showcase NPS, retention, and volume benchmarks beside the carousel.
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="homepage-testimonials-logos" className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Brand logos (one per line)
            </label>
            <textarea
              id="homepage-testimonials-logos"
              rows={hero.logos.length > 4 ? 4 : 3}
              value={hero.logos.join('\n')}
              onChange={handleLogosChange}
              disabled={disabled}
              placeholder={'Northwind Digital\nForma Studio\nAtlas Labs'}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>
        </div>

        <div className="space-y-5">
          {testimonials.map((testimonial, index) => (
            <div key={testimonial.id ?? index} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Testimonial {index + 1}</p>
                  <p className="text-sm text-slate-600">Quotes should be under 140 characters for best readability.</p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveTestimonial(index)}
                  disabled={disabled}
                  className="text-xs font-semibold uppercase tracking-wide text-red-500 transition hover:text-red-600 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  Remove
                </button>
              </div>
              <div className="mt-3 space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Quote</label>
                  <textarea
                    rows={2}
                    value={testimonial.quote ?? ''}
                    onChange={handleTestimonialFieldChange(index, 'quote')}
                    disabled={disabled}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Author name</label>
                    <input
                      type="text"
                      value={testimonial.authorName ?? ''}
                      onChange={handleTestimonialFieldChange(index, 'authorName')}
                      disabled={disabled}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Author role</label>
                    <input
                      type="text"
                      value={testimonial.authorRole ?? ''}
                      onChange={handleTestimonialFieldChange(index, 'authorRole')}
                      disabled={disabled}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Author company</label>
                    <input
                      type="text"
                      value={testimonial.authorCompany ?? ''}
                      onChange={handleTestimonialFieldChange(index, 'authorCompany')}
                      disabled={disabled}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Badge</label>
                    <input
                      type="text"
                      value={testimonial.badge ?? ''}
                      onChange={handleTestimonialFieldChange(index, 'badge')}
                      disabled={disabled}
                      placeholder="Enterprise rollout"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Avatar URL</label>
                  <input
                    type="text"
                    value={testimonial.avatarUrl ?? ''}
                    onChange={handleTestimonialFieldChange(index, 'avatarUrl')}
                    disabled={disabled}
                    placeholder="https://cdn.gigvora.com/assets/avatars/jamie.png"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Avatar alt text</label>
                  <input
                    type="text"
                    value={testimonial.avatarAlt ?? ''}
                    onChange={handleTestimonialFieldChange(index, 'avatarAlt')}
                    disabled={disabled}
                    placeholder="Portrait of Jamie Rivera smiling"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Highlight</label>
                  <textarea
                    rows={2}
                    value={testimonial.highlight ?? ''}
                    onChange={handleTestimonialFieldChange(index, 'highlight')}
                    disabled={disabled}
                    placeholder="Summarise the outcome or metric this quote unlocks"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
              </div>
            </div>
          ))}
          {!testimonials.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
              Add testimonials to reinforce trust and surface compliance-ready deployments.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
