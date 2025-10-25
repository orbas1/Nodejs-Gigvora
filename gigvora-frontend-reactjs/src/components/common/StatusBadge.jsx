import { useContext } from 'react';
import PropTypes from 'prop-types';
import LanguageContext from '../../context/LanguageContext.jsx';
import { DEFAULT_LANGUAGE } from '../../i18n/translations.js';
import { classNames } from '../../utils/classNames.js';
import { formatStatusLabel, normaliseStatusKey, resolveStatusLabel } from '../../utils/format.js';
import {
  describeStatus,
  getStatusNamespace,
  resolveStatusAppearance,
  STATUS_APPEARANCES,
} from '../../utils/statusRegistry.js';

const SIZE_CLASS_MAP = {
  xs: 'px-2.5 py-0.5 text-[0.65rem]',
  sm: 'px-3 py-1 text-xs',
};

const VARIANT_TONE_CLASS_MAP = {
  outline: {
    slate: 'border border-slate-200 bg-slate-50 text-slate-600',
    blue: 'border border-blue-200 bg-blue-50 text-blue-700',
    emerald: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border border-rose-200 bg-rose-50 text-rose-700',
    indigo: 'border border-indigo-200 bg-indigo-50 text-indigo-700',
    accent: 'border border-accent/40 bg-accentSoft text-accent',
  },
  tint: {
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-100 text-blue-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    accent: 'bg-accentSoft text-accent',
  },
  solid: {
    slate: 'bg-slate-900 text-white',
    blue: 'bg-blue-600 text-white',
    emerald: 'bg-emerald-500 text-white',
    amber: 'bg-amber-500 text-white',
    rose: 'bg-rose-500 text-white',
    indigo: 'bg-indigo-600 text-white',
    accent: 'bg-accent text-white',
  },
};

export const DEFAULT_STATUS_APPEARANCE = STATUS_APPEARANCES.generic;

export default function StatusBadge({
  status,
  label,
  tone,
  variant,
  size,
  uppercase,
  icon: Icon,
  className,
  statusToneMap,
  translationKey,
  language: languageOverride,
  category,
}) {
  const languageContext = useContext(LanguageContext);
  const languageCode = languageOverride ?? languageContext?.language ?? DEFAULT_LANGUAGE;
  const translator = languageContext?.t;

  const statusKey = normaliseStatusKey(status);
  const namespace = translationKey ? null : getStatusNamespace(category);
  const registryAppearance = resolveStatusAppearance(category, statusKey);
  const overrideAppearance = statusToneMap?.[statusKey] ?? statusToneMap?.[status] ?? registryAppearance;
  const resolvedVariant = variant ?? overrideAppearance.variant ?? 'outline';
  const resolvedTone = tone ?? overrideAppearance.tone ?? 'slate';
  const sizeClasses = SIZE_CLASS_MAP[size] ?? SIZE_CLASS_MAP.sm;
  const variantClasses =
    VARIANT_TONE_CLASS_MAP[resolvedVariant]?.[resolvedTone] ??
    VARIANT_TONE_CLASS_MAP[resolvedVariant]?.slate ??
    VARIANT_TONE_CLASS_MAP.outline.slate;

  const descriptor = describeStatus(category, status ?? statusKey);
  const fallbackLabel = label ?? descriptor.label ?? formatStatusLabel(status ?? 'unknown');
  const translatedLabel =
    label ??
    (translationKey
      ? translator?.(translationKey, fallbackLabel) ?? resolveStatusLabel(languageCode, status, fallbackLabel, namespace)
      : resolveStatusLabel(languageCode, status, fallbackLabel, namespace));

  const content = translatedLabel || fallbackLabel;

  return (
    <span
      className={classNames(
        'inline-flex items-center gap-2 rounded-full font-semibold',
        sizeClasses,
        uppercase ? 'uppercase tracking-wide' : '',
        variantClasses,
        className,
      )}
    >
      {Icon ? <Icon aria-hidden="true" className={size === 'xs' ? 'h-3.5 w-3.5' : 'h-4 w-4'} /> : null}
      <span>{content}</span>
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string,
  tone: PropTypes.oneOf(Object.keys(VARIANT_TONE_CLASS_MAP.outline)),
  variant: PropTypes.oneOf(Object.keys(VARIANT_TONE_CLASS_MAP)),
  size: PropTypes.oneOf(Object.keys(SIZE_CLASS_MAP)),
  uppercase: PropTypes.bool,
  icon: PropTypes.elementType,
  className: PropTypes.string,
  statusToneMap: PropTypes.objectOf(
    PropTypes.shape({
      tone: PropTypes.string,
      variant: PropTypes.string,
    }),
  ),
  translationKey: PropTypes.string,
  language: PropTypes.string,
  category: PropTypes.string,
};

StatusBadge.defaultProps = {
  status: undefined,
  label: undefined,
  tone: undefined,
  variant: undefined,
  size: 'sm',
  uppercase: true,
  icon: undefined,
  className: '',
  statusToneMap: undefined,
  translationKey: undefined,
  language: undefined,
  category: 'generic',
};
