import PropTypes from 'prop-types';

const typeShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  tagline: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  accent: PropTypes.string,
});

function TypeCard({ type, isActive, onSelect }) {
  const Icon = type.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(type.id)}
      className={`group relative flex flex-col gap-3 rounded-2xl border p-5 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        isActive
          ? 'border-blue-500 bg-blue-50 focus:ring-blue-500'
          : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-md focus:ring-blue-400'
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg font-semibold shadow ${type.accent}`}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-base font-semibold text-slate-900">{type.name}</p>
          <p className="text-sm text-slate-500">{type.tagline}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
        <span>Create</span>
        <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span>
      </div>
    </button>
  );
}

TypeCard.propTypes = {
  type: typeShape.isRequired,
  isActive: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};

export default function TypeGallery({ types, activeTypeId, onSelectType }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Start</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {types.map((type) => (
          <TypeCard key={type.id} type={type} isActive={type.id === activeTypeId} onSelect={onSelectType} />
        ))}
      </div>
    </div>
  );
}

TypeGallery.propTypes = {
  types: PropTypes.arrayOf(typeShape).isRequired,
  activeTypeId: PropTypes.string,
  onSelectType: PropTypes.func.isRequired,
};
