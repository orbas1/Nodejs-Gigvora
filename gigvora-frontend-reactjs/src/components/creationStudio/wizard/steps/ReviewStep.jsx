import PropTypes from 'prop-types';
import { CREATION_TYPES } from '../../config.js';
import { extractPackages, extractFaqs } from '../../config.js';

export default function ReviewStep({ draft }) {
  const type = CREATION_TYPES.find((entry) => entry.id === draft.type);
  const packages = draft.packages ?? extractPackages(draft.metadata);
  const faqs = draft.faqs ?? extractFaqs(draft.metadata);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-900">{draft.title || 'Untitled'}</h3>
        <p className="text-sm text-slate-500">{type?.name}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
          <p className="text-base font-semibold text-slate-900">{draft.status}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Visibility</p>
          <p className="text-base font-semibold text-slate-900">{draft.visibility}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Packages</p>
          <p className="text-base font-semibold text-slate-900">{packages?.length ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assets</p>
          <p className="text-base font-semibold text-slate-900">{draft.assets?.length ?? 0}</p>
        </div>
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
};
