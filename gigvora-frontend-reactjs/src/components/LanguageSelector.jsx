import PropTypes from 'prop-types';
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import classNames from '../utils/classNames.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { formatRelativeTime } from '../utils/date.js';
import { DEFAULT_LANGUAGE } from '../i18n/translations.js';

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

const STATUS_BADGES = {
  ga: { label: 'General availability', tone: 'bg-emerald-100 text-emerald-700' },
  beta: { label: 'Beta', tone: 'bg-sky-100 text-sky-700' },
  preview: { label: 'Preview', tone: 'bg-amber-100 text-amber-700' },
};

function getCoverageTone(value) {
  if (value >= 95) return 'bg-emerald-500';
  if (value >= 85) return 'bg-sky-500';
  return 'bg-amber-500';
}

function describeUpdate(value, locale) {
  if (!value) return null;
  const relative = formatRelativeTime(value, { locale, numeric: 'auto' });
  if (!relative) return null;
  return `Updated ${relative}`;
}

const FALLBACK_LANGUAGE = {
  code: DEFAULT_LANGUAGE,
  nativeLabel: 'English',
  label: 'English',
  flag: '🌐',
  region: 'Global',
  coverage: 100,
  status: 'ga',
  supportLead: 'Localization team',
  summary: '',
};

export default function LanguageSelector({ variant = 'header', className }) {
  const { availableLanguages, language, setLanguage, t } = useLanguage();
  const languages = Array.isArray(availableLanguages) && availableLanguages.length ? availableLanguages : [FALLBACK_LANGUAGE];
  const activeLanguage = languages.find((entry) => entry.code === language) ?? languages[0] ?? FALLBACK_LANGUAGE;
  const buttonStyles = BUTTON_STYLES[variant] ?? BUTTON_STYLES.header;
  const menuPosition = MENU_POSITION[variant] ?? MENU_POSITION.header;
  const activeBadge = STATUS_BADGES[activeLanguage.status] ?? { label: 'In localisation', tone: 'bg-slate-200 text-slate-600' };
  const activeUpdate = describeUpdate(activeLanguage.lastUpdated, language);

  const handleChange = (code) => {
    if (code !== language) {
      setLanguage(code);
    }
  };

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
            'absolute z-50 mt-2 max-h-72 w-64 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-2 text-sm shadow-2xl focus:outline-none',
            menuPosition,
          )}
        >
          <div className="space-y-2 rounded-2xl bg-slate-50/80 p-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400">
              {t('language.menuTitle', 'Choose your language')}
            </p>
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-1 items-start gap-3">
                <span className="text-lg" aria-hidden="true">
                  {activeLanguage.flag ?? '🌐'}
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{activeLanguage.nativeLabel}</p>
                  <p className="text-xs text-slate-500">
                    {activeLanguage.region ?? 'Global'}
                    {activeLanguage.coverage ? ` • ${activeLanguage.coverage}% coverage` : ''}
                  </p>
                  {activeLanguage.summary ? (
                    <p className="text-xs text-slate-500/90">{activeLanguage.summary}</p>
                  ) : null}
                  {activeUpdate ? <p className="text-[0.65rem] text-slate-400">{activeUpdate}</p> : null}
                </div>
              </div>
              <span
                className={classNames(
                  'inline-flex items-center rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.35em]',
                  activeBadge.tone,
                )}
              >
                {activeBadge.label}
              </span>
            </div>
          </div>
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
            Localisation coverage
          </p>
          <div className="max-h-60 overflow-y-auto">
            {availableLanguages.map((option) => (
              <Menu.Item key={option.code}>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={() => handleChange(option.code)}
                    className={classNames(
                      'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition',
                      active || option.code === language
                        ? 'bg-accentSoft/60 text-accent'
                        : 'text-slate-600 hover:bg-slate-100',
                    )}
                  >
                    <div className="flex flex-1 items-start gap-3">
                      <span className="mt-1 text-base" aria-hidden="true">
                        {option.flag ?? '🌐'}
                      </span>
                      <span className="flex flex-col text-sm">
                        <span className="font-semibold text-slate-900">{option.nativeLabel}</span>
                        <span className="text-xs text-slate-400">{option.label}</span>
                        <span className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400/80">
                          {option.region ?? 'Global'}
                        </span>
                        {option.supportLead ? (
                          <span className="text-[0.65rem] text-slate-400">{option.supportLead}</span>
                        ) : null}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                            <div
                              className={classNames('h-1.5 rounded-full', getCoverageTone(option.coverage ?? 0))}
                              style={{ width: `${Math.min(Math.max(option.coverage ?? 0, 0), 100)}%` }}
                            />
                          </div>
                          <span className="text-[0.65rem] font-semibold text-slate-400">
                            {typeof option.coverage === 'number' ? `${Math.round(option.coverage)}%` : '—'}
                          </span>
                        </div>
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={classNames(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.3em]',
                          STATUS_BADGES[option.status]?.tone ?? 'bg-slate-100 text-slate-500',
                        )}
                      >
                        {STATUS_BADGES[option.status]?.label ?? 'In review'}
                      </span>
                      {option.code === language ? (
                        <CheckIcon className="h-4 w-4 text-accent" aria-hidden="true" />
                      ) : (
                        <span className="text-xs font-semibold uppercase text-slate-400">{option.code}</span>
                      )}
                    </div>
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
          <div className="mt-2 rounded-2xl border border-slate-200/80 bg-white/60 p-3 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Need another locale?</p>
            <p className="mt-1 leading-relaxed">
              Submit a localisation request so we can prioritise copy, QA, and support enablement for your market.
            </p>
            <Link
              to="/support/localization"
              className="mt-2 inline-flex items-center gap-2 rounded-full border border-accent/60 px-3 py-1.5 font-semibold text-accent transition hover:border-accent hover:text-accentDark"
            >
              Raise a request
            </Link>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

LanguageSelector.propTypes = {
  variant: PropTypes.oneOf(['header', 'hero', 'mobile']),
  className: PropTypes.string,
};
