import PropTypes from 'prop-types';
import { ensureArray, withDefaults } from './defaults.js';
import { formatDateTime } from './utils.js';
import websitePreferencesShape, { WEBSITE_SECTION_IDS } from './propTypes.js';

const SUMMARY_ORDER = ['basics', 'brand', 'hero', 'offers', 'proof', 'contact', 'seo', 'social', 'subscriptions'];

function SummaryCard({ id, label, value, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white/80 p-4 text-left shadow-sm transition hover:border-accent hover:shadow-md"
    >
      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{label}</span>
      <span className="mt-3 line-clamp-2 text-base font-medium text-slate-900 group-hover:text-accent">{value}</span>
    </button>
  );
}

SummaryCard.propTypes = {
  id: PropTypes.oneOf(WEBSITE_SECTION_IDS).isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default function WebsitePreferencesSummary({ preferences, updatedAt, onSelectSection }) {
  const merged = withDefaults(preferences);
  const accessibilityLabel = merged.theme.accessibilityPreset
    ? merged.theme.accessibilityPreset.replace(/-/g, ' ')
    : 'standard';
  const cards = {
    basics: {
      label: 'Site',
      value: merged.settings.customDomain || `${merged.settings.siteSlug}.gigvora.com`,
    },
    brand: {
      label: 'Brand',
      value: `${merged.theme.primaryColor} • ${merged.theme.fontFamily} • ${accessibilityLabel}`,
    },
    hero: {
      label: 'Hero',
      value: merged.hero.headline || 'Add a headline that introduces you.',
    },
    offers: {
      label: 'Offers',
      value: `${ensureArray(merged.services.items).length} active services`,
    },
    proof: {
      label: 'Proof',
      value: `${ensureArray(merged.testimonials.items).length} quotes • ${ensureArray(merged.gallery.items).length} visuals`,
    },
    contact: {
      label: 'Contact',
      value: merged.contact.email || merged.contact.bookingLink || 'Add your contact channel',
    },
    seo: {
      label: 'SEO',
      value: merged.seo.metaTitle || 'Set your page title',
    },
    social: {
      label: 'Social',
      value: `${ensureArray(merged.social.links).length} profiles linked`,
    },
    subscriptions: {
      label: 'Subscriptions',
      value: `${ensureArray(merged.subscriptions?.modules).filter((module) => module.enabled !== false).length} feeds live`,
    },
  };

  const lastUpdatedLabel = formatDateTime(updatedAt);

  return (
    <div className="space-y-4">
      {lastUpdatedLabel ? (
        <p className="text-xs text-slate-500">Last saved {lastUpdatedLabel}</p>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {SUMMARY_ORDER.map((key) => (
          <SummaryCard key={key} id={key} label={cards[key].label} value={cards[key].value} onSelect={onSelectSection} />
        ))}
      </div>
    </div>
  );
}

WebsitePreferencesSummary.propTypes = {
  preferences: websitePreferencesShape,
  updatedAt: PropTypes.string,
  onSelectSection: PropTypes.func.isRequired,
};

WebsitePreferencesSummary.defaultProps = {
  preferences: null,
  updatedAt: null,
};
