import { useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function TagInput({
  label,
  values = [],
  onChange,
  placeholder,
  helperText,
  disabled = false,
  addLabel = 'Add',
}) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      return;
    }
    const nextValues = Array.from(new Set([...(Array.isArray(values) ? values : []), trimmed]));
    onChange?.(nextValues);
    setInputValue('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (tag) => {
    const nextValues = (Array.isArray(values) ? values : []).filter((value) => value !== tag);
    onChange?.(nextValues);
  };

  return (
    <div className="space-y-2">
      {label ? (
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
      ) : null}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled}
          className="inline-flex items-center gap-1 rounded-2xl border border-accent bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500"
        >
          <PlusIcon className="h-4 w-4" />
          {addLabel}
        </button>
      </div>
      {helperText ? <p className="text-xs text-slate-500">{helperText}</p> : null}
      <div className="flex flex-wrap gap-2">
        {(Array.isArray(values) ? values : []).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
          >
            {tag}
            <button
              type="button"
              onClick={() => handleRemove(tag)}
              disabled={disabled}
              className="rounded-full p-1 text-slate-400 transition hover:text-slate-600 disabled:cursor-not-allowed"
              aria-label={`Remove ${tag}`}
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
