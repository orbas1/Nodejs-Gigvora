import { useCallback, useMemo, useState } from 'react';

function defaultFormatToken(value) {
  return value;
}

export default function TokenInput({
  label,
  tokens = [],
  onTokensChange,
  placeholder = 'Press Enter to add',
  description,
  disabled = false,
  formatToken = defaultFormatToken,
  maxTokens,
}) {
  const [inputValue, setInputValue] = useState('');

  const normalizedTokens = useMemo(() => (Array.isArray(tokens) ? tokens : []), [tokens]);

  const addToken = useCallback(
    (rawValue) => {
      if (disabled) return;
      const formatted = formatToken(rawValue ?? '');
      if (!formatted) {
        return;
      }
      const trimmed = formatted.trim();
      if (!trimmed) {
        return;
      }
      const existing = new Set(normalizedTokens.map((token) => token.trim()));
      if (existing.has(trimmed)) {
        setInputValue('');
        return;
      }
      if (typeof maxTokens === 'number' && normalizedTokens.length >= maxTokens) {
        return;
      }
      const nextTokens = [...normalizedTokens, trimmed];
      onTokensChange?.(nextTokens);
      setInputValue('');
    },
    [disabled, formatToken, maxTokens, normalizedTokens, onTokensChange],
  );

  const removeToken = useCallback(
    (token) => {
      if (disabled) return;
      const nextTokens = normalizedTokens.filter((item) => item !== token);
      onTokensChange?.(nextTokens);
    },
    [disabled, normalizedTokens, onTokensChange],
  );

  const handleInputKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.key === ',') {
        event.preventDefault();
        addToken(inputValue);
      } else if (event.key === 'Backspace' && !inputValue && normalizedTokens.length) {
        event.preventDefault();
        removeToken(normalizedTokens[normalizedTokens.length - 1]);
      }
    },
    [addToken, inputValue, normalizedTokens, removeToken],
  );

  const handleInputBlur = useCallback(() => {
    if (inputValue) {
      addToken(inputValue);
    }
  }, [addToken, inputValue]);

  return (
    <div>
      {label ? (
        <label className="text-sm font-semibold text-slate-800">
          <span>{label}</span>
        </label>
      ) : null}
      <div
        className={`mt-2 flex min-h-[3rem] flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm transition focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 ${
          disabled ? 'opacity-60' : ''
        }`}
      >
        {normalizedTokens.map((token) => (
          <span
            key={token}
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600"
          >
            {token}
            {!disabled ? (
              <button
                type="button"
                onClick={() => removeToken(token)}
                className="rounded-full bg-slate-200/60 p-1 text-slate-500 transition hover:bg-slate-300 hover:text-slate-700"
                aria-label={`Remove ${token}`}
              >
                ×
              </button>
            ) : null}
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          disabled={disabled}
          placeholder={normalizedTokens.length ? placeholder : 'Add value'}
          className="flex-1 min-w-[120px] border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
      {description ? <p className="mt-2 text-xs text-slate-500">{description}</p> : null}
    </div>
  );
}
