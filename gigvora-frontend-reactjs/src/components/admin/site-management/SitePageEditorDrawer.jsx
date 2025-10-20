import { useEffect, useMemo, useState } from 'react';

const PAGE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'In review' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const LAYOUT_OPTIONS = [
  { value: 'standard', label: 'Standard marketing' },
  { value: 'hero-split', label: 'Split hero' },
  { value: 'feature-grid', label: 'Feature grid' },
  { value: 'storytelling', label: 'Narrative flow' },
];

function toFeatureString(features) {
  if (!Array.isArray(features) || features.length === 0) {
    return '';
  }
  return features.join('\n');
}

function fromFeatureString(value) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function rolesToString(roles) {
  if (!Array.isArray(roles) || roles.length === 0) {
    return '';
  }
  return roles.join(', ');
}

function parseRoles(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

const DEFAULT_PAGE = {
  title: '',
  slug: '',
  status: 'draft',
  summary: '',
  heroTitle: '',
  heroSubtitle: '',
  heroEyebrow: '',
  heroMeta: '',
  heroImageUrl: '',
  heroImageAlt: '',
  ctaLabel: '',
  ctaUrl: '',
  layout: 'standard',
  body: '',
  featureHighlights: [],
  seoTitle: '',
  seoDescription: '',
  seoKeywords: [],
  thumbnailUrl: '',
  allowedRoles: [],
  contactEmail: '',
  contactPhone: '',
  jurisdiction: '',
  version: '',
  lastReviewedAt: '',
};

export default function SitePageEditorDrawer({
  open,
  mode = 'create',
  page,
  saving = false,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(DEFAULT_PAGE);
  const [featureDraft, setFeatureDraft] = useState('');
  const [rolesDraft, setRolesDraft] = useState('');

  useEffect(() => {
    if (!open) {
      setForm(DEFAULT_PAGE);
      setFeatureDraft('');
      setRolesDraft('');
      return;
    }
    const source = page ? { ...DEFAULT_PAGE, ...page } : { ...DEFAULT_PAGE };
    const normalised = { ...source };
    if (source.lastReviewedAt) {
      const date = new Date(source.lastReviewedAt);
      if (!Number.isNaN(date.getTime())) {
        normalised.lastReviewedAt = date.toISOString().slice(0, 10);
      }
    }
    setForm(normalised);
    setFeatureDraft(toFeatureString(source.featureHighlights));
    setRolesDraft(rolesToString(source.allowedRoles));
  }, [open, page]);

  const heading = useMemo(() => (mode === 'edit' ? 'Edit landing page' : 'Create landing page'), [mode]);

  const handleFieldChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      featureHighlights: fromFeatureString(featureDraft),
      allowedRoles: parseRoles(rolesDraft),
    };
    onSave?.(payload);
  };

  return (
    <div
      className={`fixed inset-0 z-50 transform transition-opacity duration-200 ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-3xl overflow-y-auto bg-white shadow-2xl transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <div className="border-b border-slate-200 px-8 py-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">{heading}</h2>
                <p className="mt-1 text-sm text-slate-600">Edit layout, copy, and SEO before publishing.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                Close
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-8 py-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Page title</span>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.title}
                  onChange={handleFieldChange('title')}
                  placeholder="Operations network"
                  required
                />
              </label>
              <label className="text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Slug</span>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.slug}
                  onChange={handleFieldChange('slug')}
                  placeholder="operations-network"
                  required
                />
              </label>
              <label className="text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Status</span>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.status}
                  onChange={handleFieldChange('status')}
                >
                  {PAGE_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Layout</span>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.layout}
                  onChange={handleFieldChange('layout')}
                >
                  {LAYOUT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Version</span>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.version}
                  onChange={handleFieldChange('version')}
                  placeholder="2.1.0"
                />
              </label>
              <label className="text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Jurisdiction</span>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.jurisdiction}
                  onChange={handleFieldChange('jurisdiction')}
                  placeholder="United Kingdom"
                />
              </label>
            </div>

            <label className="block text-sm text-slate-700">
              <span className="font-semibold text-slate-800">Summary</span>
              <textarea
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={form.summary}
                onChange={handleFieldChange('summary')}
                placeholder="Concise positioning statement used in previews and share cards."
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Hero eyebrow</span>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.heroEyebrow}
                  onChange={handleFieldChange('heroEyebrow')}
                  placeholder="Legal"
                />
              </label>
              <label className="text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Hero title</span>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.heroTitle}
                  onChange={handleFieldChange('heroTitle')}
                  placeholder="Launch high-trust squads in days"
                />
              </label>
              <label className="text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Hero subtitle</span>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.heroSubtitle}
                  onChange={handleFieldChange('heroSubtitle')}
                  placeholder="Cross-functional operators ready for impact."
                />
              </label>
              <label className="text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Hero image URL</span>
                <input
                  type="url"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.heroImageUrl}
                  onChange={handleFieldChange('heroImageUrl')}
                  placeholder="https://cdn.gigvora.com/pages/ops/hero.jpg"
                />
              </label>
              <label className="text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Hero alt text</span>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.heroImageAlt}
                  onChange={handleFieldChange('heroImageAlt')}
                  placeholder="Operators collaborating on product roadmap"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Primary CTA label</span>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.ctaLabel}
                  onChange={handleFieldChange('ctaLabel')}
                  placeholder="Join the waitlist"
                />
              </label>
              <label className="text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Primary CTA URL</span>
                <input
                  type="url"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.ctaUrl}
                  onChange={handleFieldChange('ctaUrl')}
                  placeholder="https://gigvora.com/request-access"
                />
              </label>
            </div>

            <label className="block text-sm text-slate-700">
              <span className="font-semibold text-slate-800">Hero meta tagline</span>
              <input
                type="text"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={form.heroMeta}
                onChange={handleFieldChange('heroMeta')}
                placeholder="Registered office, company number, or contextual tagline"
              />
            </label>

            <label className="block text-sm text-slate-700">
              <span className="font-semibold text-slate-800">Feature highlights</span>
              <textarea
                rows={4}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={featureDraft}
                onChange={(event) => setFeatureDraft(event.target.value)}
                placeholder={'Fractional C-suite pods\nSeamless escrow + compliance\nRealtime member analytics'}
              />
              <p className="mt-1 text-xs text-slate-500">One highlight per line.</p>
            </label>

            <label className="block text-sm text-slate-700">
              <span className="font-semibold text-slate-800">Page body</span>
              <textarea
                rows={8}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={form.body}
                onChange={handleFieldChange('body')}
                placeholder="Long-form narrative, testimonials, and module JSON."
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-700">
                <span className="font-semibold text-slate-800">SEO title</span>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.seoTitle}
                  onChange={handleFieldChange('seoTitle')}
                  placeholder="Gigvora Operators Network"
                />
              </label>
              <label className="text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Social thumbnail</span>
                <input
                  type="url"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.thumbnailUrl}
                  onChange={handleFieldChange('thumbnailUrl')}
                  placeholder="https://cdn.gigvora.com/pages/ops/share.jpg"
                />
              </label>
            </div>

            <label className="block text-sm text-slate-700">
              <span className="font-semibold text-slate-800">SEO description</span>
              <textarea
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={form.seoDescription}
                onChange={handleFieldChange('seoDescription')}
                placeholder="A few sentences optimised for search and social discovery."
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Contact email</span>
                <input
                  type="email"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.contactEmail}
                  onChange={handleFieldChange('contactEmail')}
                  placeholder="legal@gigvora.com"
                />
              </label>
              <label className="text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Contact phone</span>
                <input
                  type="tel"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.contactPhone}
                  onChange={handleFieldChange('contactPhone')}
                  placeholder="+44 20 1234 5678"
                />
              </label>
              <label className="text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Last reviewed</span>
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.lastReviewedAt || ''}
                  onChange={handleFieldChange('lastReviewedAt')}
                />
              </label>
            </div>

            <label className="block text-sm text-slate-700">
              <span className="font-semibold text-slate-800">Allowed roles</span>
              <input
                type="text"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={rolesDraft}
                onChange={(event) => setRolesDraft(event.target.value)}
                placeholder="admin, mentor"
              />
              <p className="mt-1 text-xs text-slate-500">Leave blank to show for all visitors.</p>
            </label>
          </div>

          <div className="border-t border-slate-200 px-8 py-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {form.status === 'published'
                  ? 'Published pages update instantly across the marketing site.'
                  : 'Draft pages remain hidden until published.'}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                  disabled={saving}
                >
                  {saving ? 'Saving…' : mode === 'edit' ? 'Save page' : 'Create page'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
