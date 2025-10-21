import PropTypes from 'prop-types';
import { useState } from 'react';

function normalizeUnique(values = []) {
  const unique = [];
  const seen = new Set();
  values.forEach((value) => {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (!trimmed) {
      return;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    unique.push(trimmed);
  });
  return unique;
}

export default function TagInput({
  label,
  items,
  onChange,
  placeholder = 'Add item…',
  description,
  addButtonLabel = 'Add',
  disabled = false,
}) {
  const [draft, setDraft] = useState('');

  const normalizedItems = Array.isArray(items) ? items : [];

  const handleAdd = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }
    const next = normalizeUnique([...normalizedItems, trimmed]);
    if (next.length === normalizedItems.length) {
      setDraft('');
      return;
    }
    onChange(next);
    setDraft('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (index) => {
    const next = normalizedItems.filter((_, idx) => idx !== index);
    onChange(next);
  };

  return (
    <div>
      {label ? (
        <div className="flex items-baseline justify-between gap-4">
          <label className="text-sm font-semibold text-slate-700">{label}</label>
          {description ? <p className="text-xs text-slate-500">{description}</p> : null}
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        {normalizedItems.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-surfaceMuted/70 px-3 py-1 text-xs text-slate-700"
          >
            {item}
            <button
              type="button"
              className="rounded-full bg-transparent text-[11px] font-semibold text-slate-400 transition hover:text-red-500"
              onClick={() => handleRemove(index)}
              disabled={disabled}
              aria-label={`Remove ${item}`}
            >
              ×
            </button>
          </span>
        ))}
        {normalizedItems.length === 0 ? (
          <span className="rounded-full border border-dashed border-slate-200 px-3 py-1 text-xs text-slate-400">
            No entries yet
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex gap-3">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled || !draft.trim()}
          className="inline-flex items-center justify-center rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {addButtonLabel}
        </button>
      </div>
    </div>
  );
}

TagInput.propTypes = {
  label: PropTypes.node,
  items: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  description: PropTypes.node,
  addButtonLabel: PropTypes.string,
  disabled: PropTypes.bool,
};
