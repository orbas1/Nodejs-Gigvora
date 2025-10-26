import PropTypes from 'prop-types';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import classNames from '../utils/classNames.js';
import analytics from '../services/analytics.js';
import {
  LANGUAGE_DIRECTIONS,
  SUPPORTED_LANGUAGES,
  getLanguageMeta,
  translations,
} from '../i18n/translations.js';
import { useLanguage } from '../context/LanguageContext.jsx';

const BUTTON_STYLES = {
  header:
    'rounded-full border border-slate-200/70 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-accent/50 hover:text-accent focus-visible:ring-white',
  hero:
    'rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.1)] transition hover:border-accent/40 hover:text-accent focus-visible:ring-white',
  mobile:
    'w-full justify-between rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent',
};

const MENU_POSITION = {
  header: 'right-0 origin-top-right',
  hero: 'right-0 origin-top-right',
  mobile: 'left-0 origin-top-left w-full',
};

const EXPERIENCE_SUMMARIES = Object.freeze({
  en: 'Full platform experience with concierge support and live launch telemetry.',
  fr: 'EU-ready localisation for hiring, finance, and trust centre workflows.',
  es: 'LatAm teams collaborate with fully translated onboarding, jobs, and billing.',
  pt: 'Optimised for Brazilian marketplaces with payments, tax, and launch copy.',
  it: 'Tailored for boutique studios with premium gig storytelling and invoicing.',
  pl: 'Enterprise-grade navigation with labour compliance and export tooling.',
  hi: 'Premium beta with fast-growing community ops, payments, and mentor copy.',
  ar: 'RTL design with curated trust signals and mobile-first collaboration flows.',
  de: 'Financial and compliance modules harmonised for DACH enterprises.',
  ru: 'Cross-border project orchestration with granular payment controls.',
});

function flattenTranslationStrings(source, accumulator = new Set()) {
  if (!source || typeof source !== 'object') {
    return accumulator;
  }
  Object.entries(source).forEach(([key, value]) => {
    if (value && typeof value === 'object') {
      flattenTranslationStrings(value, accumulator);
      return;
    }
    if (typeof value === 'string') {
      accumulator.add(key);
    }
  });
  return accumulator;
}

export default function LanguageSelector({ variant = 'header', className }) {
  const { availableLanguages, language, setLanguage, t } = useLanguage();
  const activeLanguage = getLanguageMeta(language);
  const buttonStyles = BUTTON_STYLES[variant] ?? BUTTON_STYLES.header;
  const menuPosition = MENU_POSITION[variant] ?? MENU_POSITION.header;
  const [announcement, setAnnouncement] = useState('');
  const liveRegionRef = useRef(null);

  const browserMatch = useMemo(() => {
    if (typeof navigator === 'undefined') {
      return null;
    }
    const primary = navigator.languages?.[0] ?? navigator.language;
    if (!primary) {
      return null;
    }
    return primary.split('-')[0]?.toLowerCase() ?? null;
  }, []);

  const { recommended, others } = useMemo(() => {
    const defaultKeys = flattenTranslationStrings(translations.en);
    const defaultKeyCount = defaultKeys.size || 1;

    const expanded = (availableLanguages.length ? availableLanguages : SUPPORTED_LANGUAGES).map((option) => {
      const translatedStrings = flattenTranslationStrings(translations[option.code] ?? {});
      const translatedCount = translatedStrings.size;
      const coverage = Math.min(100, Math.round((translatedCount / defaultKeyCount) * 100));
      const isPreview = coverage < 95;
      const isCurrent = option.code === language;
      const direction = LANGUAGE_DIRECTIONS[option.code] ?? 'ltr';
      const statusLabel = isPreview ? (coverage >= 75 ? 'In review' : 'Preview') : 'Fully localised';
      const statusTone = isPreview
        ? coverage >= 75
          ? 'bg-amber-100 text-amber-800'
          : 'bg-sky-100 text-sky-700'
        : 'bg-emerald-100 text-emerald-700';
      const supportBadge = direction === 'rtl' ? 'RTL ready' : 'LTR';
      const personaSummary = EXPERIENCE_SUMMARIES[option.code] ??
        'Global workspace translation optimised for premium networking and delivery teams.';
      const isRecommended = !isCurrent && browserMatch && browserMatch === option.code;

      return {
        ...option,
        isCurrent,
        direction,
        coverage,
        statusLabel,
        statusTone,
        supportBadge,
        personaSummary,
        isRecommended,
      };
    });

    const recommendedLocales = expanded.filter((item) => item.isRecommended);
    const remaining = expanded.filter((item) => !item.isRecommended);

    return {
      recommended: recommendedLocales,
      others: remaining,
    };
  }, [availableLanguages, browserMatch, language]);

  const handleChange = (code) => {
    if (code !== language) {
      const meta = getLanguageMeta(code);
      setLanguage(code);
      analytics.track('navigation.locale.changed', {
        locale: code,
        previousLocale: language,
        direction: LANGUAGE_DIRECTIONS[code] ?? 'ltr',
        context: { surface: variant },
      });
      setAnnouncement(`${meta.nativeLabel} ${t('language.label', 'Language')} activated`);
    }
  };

  useEffect(() => {
    if (!announcement || !liveRegionRef.current) {
      return;
    }
    const region = liveRegionRef.current;
    region.textContent = announcement;
    const timeout = window.setTimeout(() => {
      region.textContent = '';
      setAnnouncement('');
    }, 2000);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [announcement]);

  return (
    <Menu as="div" className={classNames('relative', variant === 'mobile' ? 'w-full' : '', className)}>
      <Menu.Button
        className={classNames(
          'inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
          buttonStyles,
        )}
        aria-label={t('language.ariaLabel', 'Change language')}
      >
        <GlobeAltIcon className={variant === 'mobile' ? 'h-5 w-5 text-accent' : 'h-4 w-4 text-accent'} aria-hidden="true" />
        <span className="flex items-center gap-1">
          <span>{activeLanguage.nativeLabel}</span>
          {variant === 'mobile' ? <ChevronUpDownIcon className="h-4 w-4 text-slate-400" aria-hidden="true" /> : null}
        </span>
      </Menu.Button>
      <span ref={liveRegionRef} aria-live="polite" className="sr-only" />
      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-100"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={classNames(
            'absolute z-50 mt-2 w-[22rem] max-w-[calc(100vw-1rem)] space-y-3 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-3 text-sm shadow-2xl backdrop-blur focus:outline-none',
            menuPosition,
          )}
        >
          <div className="rounded-2xl bg-slate-900/90 px-4 py-3 text-white shadow-inner">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
              {t('language.menuTitle', 'Choose your language')}
            </p>
            <p className="mt-2 text-sm leading-5 text-slate-100">
              {EXPERIENCE_SUMMARIES[activeLanguage.code] ??
                'Switch locale to keep navigation, insights, and support aligned to your workspace persona.'}
            </p>
          </div>
          {recommended.length ? (
            <div className="space-y-2">
              <p className="px-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                Recommended for you
              </p>
              <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {recommended.map((option) => (
                  <LanguageMenuItem
                    key={option.code}
                    option={option}
                    isActive={option.code === language}
                    onSelect={handleChange}
                  />
                ))}
              </div>
            </div>
          ) : null}
          <div className="space-y-2">
            <p className="px-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">All languages</p>
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {others.map((option) => (
                <LanguageMenuItem
                  key={option.code}
                  option={option}
                  isActive={option.code === language}
                  onSelect={handleChange}
                />
              ))}
            </div>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

function LanguageMenuItem({ option, onSelect, isActive }) {
  const { code, nativeLabel, label, statusLabel, statusTone, coverage, supportBadge, personaSummary } = option;

  return (
    <Menu.Item>
      {({ active }) => (
        <button
          type="button"
          onClick={() => onSelect(code)}
          className={classNames(
            'flex w-full flex-col gap-2 rounded-2xl border px-3 py-3 text-left transition',
            isActive
              ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
              : active
                ? 'border-slate-200 bg-slate-100 text-slate-900'
                : 'border-slate-200/70 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold leading-5">
                {nativeLabel}
                <span className="ml-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{code}</span>
              </p>
              <p className={classNames('text-xs', isActive ? 'text-slate-200' : 'text-slate-400')}>{label}</p>
            </div>
            {isActive ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" /> Active
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={classNames(
                'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em]',
                statusTone,
                isActive && 'bg-white/20 text-white',
              )}
            >
              {statusLabel}
            </span>
            <span
              className={classNames(
                'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em]',
                isActive ? 'border-white/40 text-white' : 'border-slate-300 text-slate-500',
              )}
            >
              {supportBadge}
            </span>
            <span
              className={classNames(
                'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em]',
                isActive ? 'border-white/40 text-white' : 'border-slate-300 text-slate-500',
              )}
            >
              {coverage}% coverage
            </span>
          </div>
          <p className={classNames('text-xs leading-5', isActive ? 'text-slate-100' : 'text-slate-500')}>{personaSummary}</p>
        </button>
      )}
    </Menu.Item>
  );
}

LanguageMenuItem.propTypes = {
  option: PropTypes.shape({
    code: PropTypes.string.isRequired,
    nativeLabel: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    statusLabel: PropTypes.string.isRequired,
    statusTone: PropTypes.string.isRequired,
    coverage: PropTypes.number.isRequired,
    supportBadge: PropTypes.string.isRequired,
    personaSummary: PropTypes.string.isRequired,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
  isActive: PropTypes.bool.isRequired,
};

LanguageSelector.propTypes = {
  variant: PropTypes.oneOf(['header', 'hero', 'mobile']),
  className: PropTypes.string,
};
