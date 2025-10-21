import PropTypes from 'prop-types';
import { CREATION_TYPES, extractPackages, extractFaqs } from '../../config.js';

function SummaryTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}

SummaryTile.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default function ReviewStep({ draft, typeConfig }) {
  const type = typeConfig ?? CREATION_TYPES.find((entry) => entry.id === draft.type);
  const features = type?.features ?? {};
  const packages = features.packages === false ? [] : draft.packages ?? extractPackages(draft.metadata);
  const faqs = features.faqs === false ? [] : draft.faqs ?? extractFaqs(draft.metadata);
  const metadata = draft.metadata ?? {};
  const documentSections = features.documentOutline
    ? (metadata.sections ?? []).filter((section) => section.heading || section.summary)
    : [];
  const keywords = Array.isArray(metadata.keywords) ? metadata.keywords : [];
  const storyHighlights = Array.isArray(metadata.storyHighlights) ? metadata.storyHighlights : [];
  const targetRoles = Array.isArray(metadata.targetRoles) ? metadata.targetRoles : [];

  const summaryTiles = [
    { key: 'status', label: 'Status', value: draft.status },
    { key: 'visibility', label: 'Visibility', value: draft.visibility },
  ];

  if (features.packages !== false) {
    summaryTiles.push({ key: 'packages', label: 'Packages', value: packages?.length ?? 0 });
  }

  if (features.gallery !== false) {
    summaryTiles.push({ key: 'assets', label: 'Assets', value: draft.assets?.length ?? 0 });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-900">{draft.title || 'Untitled'}</h3>
        <p className="text-sm text-slate-500">{type?.name}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryTiles.map((tile) => (
          <SummaryTile key={tile.key} label={tile.label} value={tile.value ?? '—'} />
        ))}
      </div>

      {draft.summary ? (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</p>
          <p className="text-sm text-slate-700">{draft.summary}</p>
        </div>
      ) : null}

      {draft.description ? (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Details</p>
          <p className="whitespace-pre-line text-sm text-slate-700">{draft.description}</p>
        </div>
      ) : null}

      {documentSections.length ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Document outline</p>
          <div className="space-y-3">
            {documentSections.map((section) => (
              <div key={section.id ?? section.heading} className="space-y-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">{section.heading || 'Section'}</p>
                {section.summary ? <p className="text-sm text-slate-600 whitespace-pre-line">{section.summary}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {features.documentKeywords && keywords.length ? (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Keywords</p>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-700">
            {keywords.map((keyword) => (
              <span key={keyword} className="rounded-full bg-slate-100 px-3 py-1">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {targetRoles.length ? (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Target roles</p>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-700">
            {targetRoles.map((role) => (
              <span key={role} className="rounded-full bg-slate-100 px-3 py-1">
                {role}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {storyHighlights.length ? (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Highlights</p>
          <ul className="space-y-1 text-sm text-slate-600">
            {storyHighlights.map((highlight) => (
              <li key={highlight}>• {highlight}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {packages?.length ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Packages</p>
          <div className="grid gap-3 md:grid-cols-3">
            {packages.map((pkg) => (
              <div key={pkg.id} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">{pkg.name}</p>
                {pkg.price ? <p className="text-lg font-bold text-slate-900">{pkg.price}</p> : null}
                {pkg.deliveryTime ? <p className="text-xs text-slate-500">{pkg.deliveryTime}</p> : null}
                {pkg.features?.length ? (
                  <ul className="space-y-1 text-xs text-slate-600">
                    {pkg.features.map((feature) => (
                      <li key={feature}>• {feature}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {faqs?.length ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">FAQs</p>
          <dl className="space-y-2">
            {faqs.map((faq) => (
              <div key={faq.id} className="space-y-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <dt className="text-sm font-semibold text-slate-900">{faq.question}</dt>
                <dd className="text-sm text-slate-600">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </div>
  );
}

ReviewStep.propTypes = {
  draft: PropTypes.shape({
    type: PropTypes.string.isRequired,
    title: PropTypes.string,
    summary: PropTypes.string,
    description: PropTypes.string,
    status: PropTypes.string,
    visibility: PropTypes.string,
    packages: PropTypes.array,
    metadata: PropTypes.object,
    assets: PropTypes.array,
    faqs: PropTypes.array,
  }).isRequired,
  typeConfig: PropTypes.shape({
    features: PropTypes.object,
    name: PropTypes.string,
  }),
};

ReviewStep.defaultProps = {
  typeConfig: null,
};
