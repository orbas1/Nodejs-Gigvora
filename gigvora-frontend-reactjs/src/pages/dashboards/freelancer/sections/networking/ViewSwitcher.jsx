const BUTTON_STYLE =
  'flex-1 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 disabled:opacity-60';

export default function ViewSwitcher({ options, activeId, onChange }) {
  const safeOptions = Array.isArray(options) ? options : [];
  const handleChange = (optionId, isActive) => {
    if (isActive || typeof onChange !== 'function') {
      return;
    }
    onChange(optionId);
  };
  return (
    <div className="flex items-center gap-2 rounded-full bg-slate-100 p-1">
      {safeOptions.map((option) => {
        const isActive = option.id === activeId;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => handleChange(option.id, isActive)}
            aria-pressed={isActive}
            disabled={typeof onChange !== 'function'}
            className={`${BUTTON_STYLE} ${
              isActive
                ? 'bg-white text-slate-900 shadow-sm'
                : 'bg-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
