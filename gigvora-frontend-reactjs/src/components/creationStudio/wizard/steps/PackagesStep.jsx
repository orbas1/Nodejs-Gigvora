import PropTypes from 'prop-types';
import PackageTierForm from '../components/PackageTierForm.jsx';
import FaqList from '../components/FaqList.jsx';

export default function PackagesStep({ draft, onChange }) {
  const isGig = draft.type === 'gig';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">{isGig ? 'Packages' : 'Options'}</p>
        <p className="text-sm text-slate-500">
          {isGig
            ? 'Map your Basic, Standard, and Premium tiers similar to leading marketplaces with pricing, delivery, and feature bullets.'
            : 'Add clear package-style options so buyers know what they receive.'}
        </p>
      </div>

      <PackageTierForm
        packages={draft.packages ?? []}
        onChange={(packages) => onChange({ packages })}
      />

      <FaqList faqs={draft.faqs ?? []} onChange={(faqs) => onChange({ faqs })} />
    </div>
  );
}

PackagesStep.propTypes = {
  draft: PropTypes.shape({
    type: PropTypes.string.isRequired,
    packages: PropTypes.array,
    faqs: PropTypes.array,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};
