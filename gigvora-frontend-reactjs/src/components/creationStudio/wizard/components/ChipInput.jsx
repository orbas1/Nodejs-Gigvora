import { useState } from 'react';
import PropTypes from 'prop-types';

export default function ChipInput({ label, values, placeholder, onChange }) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = (value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    if (values.includes(trimmed)) {
      setInputValue('');
      return;
    }
    onChange([...values, trimmed]);
    setInputValue('');
  };

  const handleRemove = (index) => {
    const next = values.filter((_, itemIndex) => itemIndex !== index);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {label ? <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p> : null}
      <div className="flex flex-wrap gap-2">
        {values.map((value, index) => (
          <span
            key={`${value}-${index}`}
            className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-medium text-slate-700"
          >
            {value}
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="rounded-full bg-white px-2 text-[10px] font-bold text-slate-500 hover:bg-slate-100"
              aria-label="Remove"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          placeholder={placeholder}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleAdd(inputValue);
            }
          }}
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <button
          type="button"
          onClick={() => handleAdd(inputValue)}
          className="rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
        >
          Add
        </button>
      </div>
    </div>
  );
}

ChipInput.propTypes = {
  label: PropTypes.string,
  values: PropTypes.arrayOf(PropTypes.string).isRequired,
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};
