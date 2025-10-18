import { Fragment, useState } from 'react';

const PANEL_TABS = [
  { id: 'brand', label: 'Brand' },
  { id: 'hero', label: 'Hero' },
  { id: 'assets', label: 'Assets' },
  { id: 'alert', label: 'Alert' },
  { id: 'seo', label: 'SEO' },
  { id: 'social', label: 'Social' },
  { id: 'footer', label: 'Footer' },
];

function getNested(value, path, fallback = '') {
  return path.reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), value) ?? fallback;
}

function normalizeLinks(links) {
  if (!Array.isArray(links)) {
    return [];
  }
  return links
    .map((link) => {
      if (!link || typeof link !== 'object') {
        return null;
      }
      const label = `${link.label ?? ''}`.trim();
      const url = `${link.url ?? ''}`.trim();
      const description = `${link.description ?? ''}`.trim();
      if (!label && !url) {
        return null;
      }
      return {
        id: link.id ?? `${label || 'link'}-${url}`,
        label,
        url,
        description,
        icon: link.icon ?? '',
        orderIndex: Number.isFinite(link.orderIndex) ? link.orderIndex : 0,
      };
    })
    .filter(Boolean);
}

export default function SiteSettingsForm({
  value,
  loading = false,
  dirty = false,
  saving = false,
  status = '',
  error = '',
  disableInputs = false,
  onChange,
  onSave,
  onReset,
  onRefresh,
}) {
  const [activePanel, setActivePanel] = useState('brand');
  const settings = value ?? {};
  const footerLinks = normalizeLinks(settings.footer?.links);
  const actionsLocked = disableInputs || saving;
  const primaryStatus = loading ? 'Syncing' : dirty ? 'Draft' : 'Saved';

  const handleChange = (path) => (event) => {
    if (typeof onChange !== 'function') {
      return;
    }
    const nextValue = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    onChange(path, nextValue);
  };

  const handleFooterLinkChange = (index, field) => (event) => {
    if (typeof onChange !== 'function') {
      return;
    }
    const links = [...footerLinks];
    if (!links[index]) {
      links[index] = { label: '', url: '', description: '', icon: '', orderIndex: 0 };
    }
    const nextValue = field === 'orderIndex' ? Number(event.target.value ?? 0) : event.target.value;
    links[index] = {
      ...links[index],
      [field]: nextValue,
    };
    onChange(['footer', 'links'], links);
  };

  const handleRemoveFooterLink = (index) => {
    if (typeof onChange !== 'function') {
      return;
    }
    const links = footerLinks.filter((_, linkIndex) => linkIndex !== index);
    onChange(['footer', 'links'], links);
  };

  const handleAddFooterLink = () => {
    if (typeof onChange !== 'function') {
      return;
    }
    const links = [...footerLinks, { label: '', url: '', description: '', icon: '', orderIndex: footerLinks.length }];
    onChange(['footer', 'links'], links);
  };

  const brandPanel = (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm text-slate-700">
          <span className="font-semibold text-slate-800">Site name</span>
          <input
            type="text"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={getNested(settings, ['siteName'], '')}
            onChange={handleChange(['siteName'])}
            placeholder="Gigvora"
            disabled={actionsLocked}
          />
        </label>
        <label className="block text-sm text-slate-700">
          <span className="font-semibold text-slate-800">Tagline</span>
          <input
            type="text"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={getNested(settings, ['tagline'], '')}
            onChange={handleChange(['tagline'])}
            placeholder="Where teams build together"
            disabled={actionsLocked}
          />
        </label>
        <label className="block text-sm text-slate-700">
          <span className="font-semibold text-slate-800">Domain</span>
          <input
            type="text"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={getNested(settings, ['domain'], '')}
            onChange={handleChange(['domain'])}
            placeholder="gigvora.com"
            disabled={actionsLocked}
          />
        </label>
        <label className="block text-sm text-slate-700">
          <span className="font-semibold text-slate-800">Support email</span>
          <input
            type="email"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={getNested(settings, ['supportEmail'], '')}
            onChange={handleChange(['supportEmail'])}
            placeholder="support@gigvora.com"
            disabled={actionsLocked}
          />
        </label>
        <label className="block text-sm text-slate-700">
          <span className="font-semibold text-slate-800">Support phone</span>
          <input
            type="tel"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={getNested(settings, ['supportPhone'], '')}
            onChange={handleChange(['supportPhone'])}
            placeholder="+1 (555) 123-4567"
            disabled={actionsLocked}
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm text-slate-700">
          <span className="font-semibold text-slate-800">Primary color</span>
          <input
            type="color"
            className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-2"
            value={getNested(settings, ['primaryColor'], '#2563eb')}
            onChange={handleChange(['primaryColor'])}
            disabled={actionsLocked}
          />
        </label>
        <label className="block text-sm text-slate-700">
          <span className="font-semibold text-slate-800">Accent color</span>
          <input
            type="color"
            className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-2"
            value={getNested(settings, ['accentColor'], '#f97316')}
            onChange={handleChange(['accentColor'])}
            disabled={actionsLocked}
          />
        </label>
      </div>
    </div>
  );

  const heroPanel = (
    <div className="space-y-4">
      <label className="block text-sm text-slate-700">
        <span className="font-semibold text-slate-800">Headline</span>
        <input
          type="text"
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          value={getNested(settings, ['hero', 'title'], '')}
          onChange={handleChange(['hero', 'title'])}
          placeholder="Launch squads fast"
          disabled={actionsLocked}
        />
      </label>
      <label className="block text-sm text-slate-700">
        <span className="font-semibold text-slate-800">Subheading</span>
        <textarea
          rows={3}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          value={getNested(settings, ['hero', 'subtitle'], '')}
          onChange={handleChange(['hero', 'subtitle'])}
          placeholder="Gigvora orchestrates hiring, payments, and trust so your operators can focus on delivery."
          disabled={actionsLocked}
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm text-slate-700">
          <span className="font-semibold text-slate-800">CTA label</span>
          <input
            type="text"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={getNested(settings, ['hero', 'ctaLabel'], '')}
            onChange={handleChange(['hero', 'ctaLabel'])}
            placeholder="Book a demo"
            disabled={actionsLocked}
          />
        </label>
        <label className="block text-sm text-slate-700">
          <span className="font-semibold text-slate-800">CTA URL</span>
          <input
            type="url"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={getNested(settings, ['hero', 'ctaUrl'], '')}
            onChange={handleChange(['hero', 'ctaUrl'])}
            placeholder="https://gigvora.com/demo"
            disabled={actionsLocked}
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm text-slate-700">
          <span className="font-semibold text-slate-800">Image URL</span>
          <input
            type="url"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={getNested(settings, ['hero', 'backgroundImageUrl'], '')}
            onChange={handleChange(['hero', 'backgroundImageUrl'])}
            placeholder="https://cdn.gigvora.com/hero.jpg"
            disabled={actionsLocked}
          />
        </label>
        <label className="block text-sm text-slate-700">
          <span className="font-semibold text-slate-800">Alt text</span>
          <input
            type="text"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={getNested(settings, ['hero', 'backgroundImageAlt'], '')}
            onChange={handleChange(['hero', 'backgroundImageAlt'])}
            placeholder="Operators collaborating"
            disabled={actionsLocked}
          />
        </label>
      </div>
    </div>
  );

  const assetsPanel = (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="block text-sm text-slate-700">
        <span className="font-semibold text-slate-800">Logo URL</span>
        <input
          type="url"
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          value={getNested(settings, ['assets', 'logoUrl'], '')}
          onChange={handleChange(['assets', 'logoUrl'])}
          placeholder="https://cdn.gigvora.com/logo.png"
          disabled={actionsLocked}
        />
      </label>
      <label className="block text-sm text-slate-700">
        <span className="font-semibold text-slate-800">Favicon URL</span>
        <input
          type="url"
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          value={getNested(settings, ['assets', 'faviconUrl'], '')}
          onChange={handleChange(['assets', 'faviconUrl'])}
          placeholder="https://cdn.gigvora.com/favicon.ico"
          disabled={actionsLocked}
        />
      </label>
      <label className="md:col-span-2 block text-sm text-slate-700">
        <span className="font-semibold text-slate-800">Social share image</span>
        <input
          type="url"
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          value={getNested(settings, ['seo', 'socialImageUrl'], '')}
          onChange={handleChange(['seo', 'socialImageUrl'])}
          placeholder="https://cdn.gigvora.com/social-card.png"
          disabled={actionsLocked}
        />
      </label>
    </div>
  );

  const alertPanel = (
    <div className="space-y-4">
      <label className="flex items-center gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          checked={Boolean(getNested(settings, ['announcement', 'enabled'], false))}
          onChange={handleChange(['announcement', 'enabled'])}
          disabled={actionsLocked}
        />
        <span className="font-semibold text-slate-800">Enable banner</span>
      </label>
      <label className="block text-sm text-slate-700">
        <span className="font-semibold text-slate-800">Message</span>
        <input
          type="text"
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          value={getNested(settings, ['announcement', 'message'], '')}
          onChange={handleChange(['announcement', 'message'])}
          placeholder="Now onboarding new cohorts"
          disabled={actionsLocked}
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm text-slate-700">
          <span className="font-semibold text-slate-800">Link label</span>
          <input
            type="text"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={getNested(settings, ['announcement', 'linkLabel'], '')}
            onChange={handleChange(['announcement', 'linkLabel'])}
            placeholder="View"
            disabled={actionsLocked}
          />
        </label>
        <label className="block text-sm text-slate-700">
          <span className="font-semibold text-slate-800">Link URL</span>
          <input
            type="url"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={getNested(settings, ['announcement', 'linkUrl'], '')}
            onChange={handleChange(['announcement', 'linkUrl'])}
            placeholder="https://gigvora.com/update"
            disabled={actionsLocked}
          />
        </label>
      </div>
    </div>
  );

  const seoPanel = (
    <div className="space-y-4">
      <label className="block text-sm text-slate-700">
        <span className="font-semibold text-slate-800">Meta title</span>
        <input
          type="text"
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          value={getNested(settings, ['seo', 'defaultTitle'], '')}
          onChange={handleChange(['seo', 'defaultTitle'])}
          placeholder="Gigvora — Enterprise talent"
          disabled={actionsLocked}
        />
      </label>
      <label className="block text-sm text-slate-700">
        <span className="font-semibold text-slate-800">Meta description</span>
        <textarea
          rows={3}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          value={getNested(settings, ['seo', 'defaultDescription'], '')}
          onChange={handleChange(['seo', 'defaultDescription'])}
          placeholder="Gigvora connects mission-aligned builders with trusted operators."
          disabled={actionsLocked}
        />
      </label>
    </div>
  );

  const socialPanel = (
    <div className="grid gap-4 md:grid-cols-2">
      {[
        ['twitter', 'Twitter'],
        ['linkedin', 'LinkedIn'],
        ['youtube', 'YouTube'],
        ['instagram', 'Instagram'],
      ].map(([key, label]) => (
        <label key={key} className="block text-sm text-slate-700">
          <span className="font-semibold text-slate-800">{label}</span>
          <input
            type="url"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={getNested(settings, ['social', key], '')}
            onChange={handleChange(['social', key])}
            placeholder={`https://www.${key}.com/gigvora`}
            disabled={actionsLocked}
          />
        </label>
      ))}
    </div>
  );

  const footerPanel = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Links</h3>
        <button
          type="button"
          onClick={handleAddFooterLink}
          className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={actionsLocked}
        >
          Add
        </button>
      </div>
      {footerLinks.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-sm text-slate-500">
          No footer links yet.
        </p>
      ) : (
        <div className="grid gap-4">
          {footerLinks.map((link, index) => (
            <Fragment key={link.id ?? index}>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm text-slate-700">
                    <span className="font-semibold text-slate-800">Label</span>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      value={link.label}
                      onChange={handleFooterLinkChange(index, 'label')}
                      disabled={actionsLocked}
                    />
                  </label>
                  <label className="block text-sm text-slate-700">
                    <span className="font-semibold text-slate-800">URL</span>
                    <input
                      type="url"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      value={link.url}
                      onChange={handleFooterLinkChange(index, 'url')}
                      disabled={actionsLocked}
                    />
                  </label>
                </div>
                <div className="mt-3 grid gap-4 md:grid-cols-3">
                  <label className="block text-sm text-slate-700">
                    <span className="font-semibold text-slate-800">Description</span>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      value={link.description ?? ''}
                      onChange={handleFooterLinkChange(index, 'description')}
                      disabled={actionsLocked}
                    />
                  </label>
                  <label className="block text-sm text-slate-700">
                    <span className="font-semibold text-slate-800">Icon</span>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      value={link.icon ?? ''}
                      onChange={handleFooterLinkChange(index, 'icon')}
                      disabled={actionsLocked}
                    />
                  </label>
                  <label className="block text-sm text-slate-700">
                    <span className="font-semibold text-slate-800">Order</span>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      value={link.orderIndex ?? index}
                      onChange={handleFooterLinkChange(index, 'orderIndex')}
                      disabled={actionsLocked}
                    />
                  </label>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveFooterLink(index)}
                    className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={actionsLocked}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      )}
      <label className="block text-sm text-slate-700">
        <span className="font-semibold text-slate-800">Copyright</span>
        <input
          type="text"
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          value={getNested(settings, ['footer', 'copyright'], '')}
          onChange={handleChange(['footer', 'copyright'])}
          placeholder="© {year} Gigvora"
          disabled={actionsLocked}
        />
      </label>
    </div>
  );

  const panelLookup = {
    brand: brandPanel,
    hero: heroPanel,
    assets: assetsPanel,
    alert: alertPanel,
    seo: seoPanel,
    social: socialPanel,
    footer: footerPanel,
  };

  const activeContent = panelLookup[activePanel] ?? panelLookup.brand;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900">Settings</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 ${
                dirty
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              {primaryStatus}
            </span>
            {status ? (
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                {status}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving || !dirty}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            disabled={saving || !dirty}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-2">
        {PANEL_TABS.map((panel) => {
          const isActive = activePanel === panel.id;
          return (
            <button
              key={panel.id}
              type="button"
              onClick={() => setActivePanel(panel.id)}
              className={`min-w-[88px] rounded-xl px-4 py-2 text-sm font-semibold transition ${
                isActive ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {panel.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-4">{activeContent}</div>
    </section>
  );
}
