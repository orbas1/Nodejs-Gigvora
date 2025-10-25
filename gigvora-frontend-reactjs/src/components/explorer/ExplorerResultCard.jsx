import { forwardRef, memo, useId } from 'react';
import { formatRelativeTime } from '../../utils/date.js';

function resolveMetaTokens(metaTokens, variant) {
  return (metaTokens ?? [])
    .filter(Boolean)
    .map((token, index) => {
      const value = `${token}`.trim();
      const emphasised =
        index === 0 ||
        /remote/i.test(value) ||
        /featured|verified|priority/i.test(value) ||
        (variant === 'compact' && /updated/i.test(value));

      return { value, accent: emphasised };
    });
}

const ExplorerResultCard = forwardRef(function ExplorerResultCard(
  {
    item,
    categoryLabel,
    metaTokens = [],
    onPreview,
    onOpen,
    previewLabel = 'Quick preview',
    openLabel = 'Open profile →',
    variant = 'grid',
  },
  ref,
) {
  const headingId = useId();
  const descriptionId = useId();
  const isCompact = variant === 'compact';
  const containerClassName = isCompact
    ? 'rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-accent'
    : 'flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-accent hover:shadow-soft';

  const headingClassName = isCompact
    ? 'mt-2 text-base font-semibold text-slate-900'
    : 'mt-3 text-lg font-semibold text-slate-900';

  const descriptionClassName = isCompact
    ? 'mt-1 line-clamp-3 text-xs text-slate-500'
    : 'mt-2 flex-1 text-sm text-slate-600';

  const metaClassName = isCompact
    ? 'mt-3 flex flex-wrap gap-2 text-[0.65rem] text-slate-500'
    : 'mt-3 flex flex-wrap gap-2 text-xs text-slate-500';

  const footerClassName = isCompact
    ? 'mt-4 flex items-center justify-between text-[0.6rem] text-slate-400'
    : 'mt-4 flex items-center justify-between text-xs text-slate-400';

  const previewButtonClassName = isCompact
    ? 'text-slate-400 underline-offset-2 transition hover:text-accent hover:underline'
    : 'inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent';

  const openButtonClassName = isCompact
    ? 'text-accent hover:text-accentDark'
    : 'inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark';

  const description = item?.description ?? item?.summary ?? item?.body ?? '';

  const updatedAt = item?.updatedAt ?? item?.modifiedAt ?? item?.publishedAt ?? item?.createdAt ?? null;

  const metaList = resolveMetaTokens(metaTokens, variant);

  const updatedLabel = updatedAt ? formatRelativeTime(updatedAt) : 'Recently updated';

  return (
    <article
      ref={ref}
      className={containerClassName}
      data-view-variant={variant}
      data-explorer-card="true"
      data-explorer-card-id={item?.id ?? undefined}
      role="group"
      tabIndex={0}
      aria-labelledby={headingId}
      aria-describedby={description ? descriptionId : undefined}
      onKeyDown={(event) => {
        if (event.defaultPrevented) {
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (onPreview) {
            onPreview(item);
          } else if (onOpen) {
            onOpen(item);
          }
        }
      }}
    >
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-accentDark">
        {categoryLabel}
      </span>
      <h2 id={headingId} className={headingClassName}>
        {item?.title ?? 'Untitled record'}
      </h2>
      {description ? (
        <p id={descriptionId} className={descriptionClassName}>
          {description}
        </p>
      ) : null}
      {metaList.length ? (
        <div className={metaClassName}>
          {metaList.map(({ value, accent }, index) => (
            <span
              key={`${value}-${index}`}
              data-accent={accent ? 'true' : undefined}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-500 transition data-[accent=true]:border-accent/40 data-[accent=true]:bg-accent/10 data-[accent=true]:text-accent"
            >
              {value}
            </span>
          ))}
        </div>
      ) : null}
      <div className={footerClassName}>
        <span>Updated {updatedLabel}</span>
        <div className="flex gap-2">
          {onPreview ? (
            <button
              type="button"
              onClick={() => onPreview(item)}
              className={previewButtonClassName}
              aria-label={`${previewLabel} for ${item?.title ?? 'record'}`}
            >
              {previewLabel}
            </button>
          ) : null}
          {onOpen ? (
            <button
              type="button"
              onClick={() => onOpen(item)}
              className={openButtonClassName}
              aria-label={`${openLabel} for ${item?.title ?? 'record'}`}
            >
              {openLabel}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
});

export default memo(ExplorerResultCard);
