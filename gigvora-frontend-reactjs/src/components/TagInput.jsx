import PropTypes from 'prop-types';
import { useId, useMemo, useRef, useState } from 'react';

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
  const componentId = useId();
  const chipRefs = useRef([]);

  const normalizedItems = Array.isArray(items) ? items : [];
  const orderedItems = useMemo(() => normalizedItems, [normalizedItems]);
  chipRefs.current = chipRefs.current.slice(0, orderedItems.length);

  const focusChipAtIndex = (index) => {
    const node = chipRefs.current[index];
    if (node && typeof node.focus === 'function') {
      node.focus();
    }
  };

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
    if (event.key === 'ArrowLeft' && !draft.trim() && orderedItems.length > 0) {
      event.preventDefault();
      focusChipAtIndex(orderedItems.length - 1);
      return;
    }

    if (event.key === 'Backspace' && !draft.trim() && orderedItems.length > 0) {
      event.preventDefault();
      const next = orderedItems.slice(0, -1);
      onChange(next);
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (index) => {
    const next = normalizedItems.filter((_, idx) => idx !== index);
    onChange(next);
  };

  const handleChipKeyDown = (event, index) => {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      handleRemove(index);
      const nextIndex = Math.min(index, orderedItems.length - 2);
      if (nextIndex >= 0) {
        requestAnimationFrame(() => focusChipAtIndex(nextIndex));
      } else {
        requestAnimationFrame(() => {
          const inputNode = document.getElementById(`${componentId}-input`);
          inputNode?.focus();
        });
      }
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const previousIndex = Math.max(0, index - 1);
      focusChipAtIndex(previousIndex);
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (index + 1 < orderedItems.length) {
        focusChipAtIndex(index + 1);
      } else {
        const inputNode = document.getElementById(`${componentId}-input`);
        inputNode?.focus();
      }
    }
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
        {orderedItems.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="gv-chip inline-flex items-center gap-2 rounded-full bg-[var(--gv-color-surface)]/70 px-3 py-1 text-xs text-[var(--gv-color-text)] shadow-subtle/40 transition"
          >
            {item}
            <button
              type="button"
              ref={(node) => {
                chipRefs.current[index] = node;
              }}
              id={`${componentId}-chip-${index}`}
              className="rounded-full bg-transparent px-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--gv-color-text-muted)] transition hover:text-[var(--gv-color-danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gv-color-primary)]"
              onClick={() => handleRemove(index)}
              onKeyDown={(event) => handleChipKeyDown(event, index)}
              disabled={disabled}
              aria-label={`Remove ${item}`}
            >
              ×
            </button>
          </span>
        ))}
        {normalizedItems.length === 0 ? (
          <span className="rounded-full border border-dashed border-[var(--gv-color-border)] px-3 py-1 text-xs text-[var(--gv-color-text-muted)]">
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
          id={`${componentId}-input`}
          className="flex-1 rounded-2xl border border-[var(--gv-color-border)] bg-[var(--gv-color-surface)] px-3 py-2 text-sm text-[var(--gv-color-text)] shadow-inner transition focus:border-[var(--gv-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gv-color-primary-soft)]"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled || !draft.trim()}
          className="inline-flex items-center justify-center rounded-2xl bg-[var(--gv-color-accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gv-color-accent)]/30 disabled:cursor-not-allowed disabled:bg-[var(--gv-color-border)] disabled:text-[var(--gv-color-text-muted)]"
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
