import { withDefaults, ensureArray } from './defaults.js';

export default function WebsitePreferencesPreview({ preferences }) {
  const merged = withDefaults(preferences);
  const heroCta = merged.hero.primaryCtaLabel && merged.hero.primaryCtaLink;
  const secondaryCta = merged.hero.secondaryCtaLabel && merged.hero.secondaryCtaLink;
  const services = ensureArray(merged.services.items).slice(0, 3);

  return (
    <div className="flex h-full flex-col gap-4">
      <div
        className="rounded-3xl border border-slate-200 p-6 text-white shadow-inner"
        style={{
          background: merged.theme.backgroundStyle === 'dark' ? merged.theme.primaryColor : merged.theme.accentColor,
        }}
      >
        <p className="text-xs uppercase tracking-[0.3em] text-white/80">{merged.hero.kicker || 'Hero'}</p>
        <p className="mt-3 text-2xl font-semibold" style={{ fontFamily: merged.theme.fontFamily }}>
          {merged.hero.headline || 'Headline goes here'}
        </p>
        <p className="mt-2 max-w-sm text-sm text-white/90">
          {merged.hero.subheadline || 'Share a crisp promise so visitors understand your value instantly.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {heroCta ? (
            <span className="inline-flex items-center rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-900">
              {merged.hero.primaryCtaLabel}
            </span>
          ) : null}
          {secondaryCta ? (
            <span className="inline-flex items-center rounded-full border border-white/70 px-4 py-2 text-sm font-medium text-white">
              {merged.hero.secondaryCtaLabel}
            </span>
          ) : null}
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Services</p>
        <ul className="mt-3 space-y-2">
          {services.length ? (
            services.map((service) => (
              <li key={service.id} className="flex items-center justify-between text-sm text-slate-700">
                <span>{service.name || 'Service'}</span>
                <span className="text-slate-500">{service.startingPrice || 'Add price'}</span>
              </li>
            ))
          ) : (
            <li className="text-sm text-slate-500">Add services to showcase what you offer.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
