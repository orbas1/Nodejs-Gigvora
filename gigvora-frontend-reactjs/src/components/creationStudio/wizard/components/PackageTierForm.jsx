import PropTypes from 'prop-types';

export default function PackageTierForm({ packages, onChange }) {
  const handleFieldChange = (index, field, value) => {
    const next = packages.map((pkg, pkgIndex) =>
      pkgIndex === index
        ? {
            ...pkg,
            [field]: value,
          }
        : pkg,
    );
    onChange(next);
  };

  const handleFeatureAdd = (index, feature) => {
    if (!feature.trim()) {
      return;
    }
    const next = packages.map((pkg, pkgIndex) =>
      pkgIndex === index
        ? {
            ...pkg,
            features: [...(pkg.features ?? []), feature.trim()],
          }
        : pkg,
    );
    onChange(next);
  };

  const handleFeatureRemove = (index, featureIndex) => {
    const next = packages.map((pkg, pkgIndex) => {
      if (pkgIndex !== index) {
        return pkg;
      }
      const features = pkg.features ?? [];
      return {
        ...pkg,
        features: features.filter((_, currentIndex) => currentIndex !== featureIndex),
      };
    });
    onChange(next);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {packages.map((pkg, index) => (
        <div key={pkg.id ?? index} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={`pkg-name-${pkg.id}`}>
                Name
              </label>
              <input
                id={`pkg-name-${pkg.id}`}
                type="text"
                value={pkg.name}
                onChange={(event) => handleFieldChange(index, 'name', event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={`pkg-price-${pkg.id}`}>
                Price
              </label>
              <input
                id={`pkg-price-${pkg.id}`}
                type="text"
                value={pkg.price}
                onChange={(event) => handleFieldChange(index, 'price', event.target.value)}
                placeholder="$499"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={`pkg-delivery-${pkg.id}`}>
                Delivery time
              </label>
              <input
                id={`pkg-delivery-${pkg.id}`}
                type="text"
                value={pkg.deliveryTime}
                onChange={(event) => handleFieldChange(index, 'deliveryTime', event.target.value)}
                placeholder="7 days"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-1 flex-col">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Features</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(pkg.features ?? []).map((feature, featureIndex) => (
                <span
                  key={`${pkg.id}-feature-${featureIndex}`}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                >
                  {feature}
                  <button
                    type="button"
                    onClick={() => handleFeatureRemove(index, featureIndex)}
                    className="rounded-full bg-blue-100 px-2 text-[10px] font-bold text-blue-700 hover:bg-blue-200"
                    aria-label="Remove feature"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                placeholder="Add feature"
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleFeatureAdd(index, event.currentTarget.value);
                    event.currentTarget.value = '';
                  }
                }}
              />
              <button
                type="button"
                onClick={(event) => {
                  const input = event.currentTarget.previousElementSibling;
                  if (input && input.value) {
                    handleFeatureAdd(index, input.value);
                    input.value = '';
                  }
                }}
                className="rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

PackageTierForm.propTypes = {
  packages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      deliveryTime: PropTypes.string,
      features: PropTypes.arrayOf(PropTypes.string),
    }),
  ).isRequired,
  onChange: PropTypes.func.isRequired,
};
