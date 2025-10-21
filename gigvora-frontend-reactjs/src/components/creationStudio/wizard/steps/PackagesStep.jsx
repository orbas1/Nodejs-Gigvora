import PropTypes from 'prop-types';
import PackageTierForm from '../components/PackageTierForm.jsx';
import FaqList from '../components/FaqList.jsx';
import ChipInput from '../components/ChipInput.jsx';
import DocumentOutlineEditor from '../components/DocumentOutlineEditor.jsx';

function mergeMetadata(current, patch) {
  return { ...(current ?? {}), ...patch };
}

export default function PackagesStep({ draft, onChange, typeConfig }) {
  const features = typeConfig?.features ?? {};
  const metadata = draft.metadata ?? {};

  const handleMetadataChange = (patch) => {
    onChange({ metadata: mergeMetadata(metadata, patch) });
  };

  const attachmentsLabel = features.attachmentsLabel ?? 'Asset gallery';

  if (features.packages === false) {
    if (features.documentOutline) {
      return (
        <div className="space-y-6">
          <div className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Document outline</p>
            <p className="text-sm text-slate-500">
              Shape the narrative structure, highlights, and supporting links before publishing.
            </p>
          </div>

          <DocumentOutlineEditor
            sections={Array.isArray(metadata.sections) ? metadata.sections : []}
            onChange={(sections) => handleMetadataChange({ sections })}
          />

          <ChipInput
            label="Supporting links"
            values={Array.isArray(metadata.supportingLinks) ? metadata.supportingLinks : []}
            placeholder="Portfolio, LinkedIn, case study"
            onChange={(values) => handleMetadataChange({ supportingLinks: values })}
          />

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{attachmentsLabel}</p>
            <p className="mt-2 text-sm text-slate-500">
              Attach reference assets or templates in the media step. You can still add FAQs below for reviewers.
            </p>
          </div>

          {features.faqs !== false ? (
            <FaqList faqs={draft.faqs ?? []} onChange={(faqs) => onChange({ faqs })} />
          ) : null}
        </div>
      );
    }

    return (
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Packages are disabled for this template. Configure pricing in the details step and use FAQs for clarifications.
      </div>
    );
  }

  const isGig = draft.type === 'gig';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">{isGig ? 'Packages' : 'Options'}</p>
        <p className="text-sm text-slate-500">
          {isGig
            ? 'Map your Basic, Standard, and Premium tiers just like Fiverr with pricing, delivery, and feature bullets.'
            : 'Add clear package-style options so buyers know what they receive.'}
        </p>
      </div>

      <PackageTierForm packages={draft.packages ?? []} onChange={(packages) => onChange({ packages })} />

      {features.faqs !== false ? <FaqList faqs={draft.faqs ?? []} onChange={(faqs) => onChange({ faqs })} /> : null}
    </div>
  );
}

PackagesStep.propTypes = {
  draft: PropTypes.shape({
    type: PropTypes.string.isRequired,
    packages: PropTypes.array,
    faqs: PropTypes.array,
    metadata: PropTypes.object,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  typeConfig: PropTypes.shape({
    features: PropTypes.object,
  }),
};

PackagesStep.defaultProps = {
  typeConfig: null,
};
