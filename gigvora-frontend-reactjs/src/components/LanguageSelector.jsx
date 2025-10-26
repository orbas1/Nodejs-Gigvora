import PropTypes from 'prop-types';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import classNames from '../utils/classNames.js';
import { getLanguageMeta } from '../i18n/translations.js';
import { useLanguage } from '../context/LanguageContext.jsx';

const BUTTON_STYLES = {
  header:
    'rounded-full border border-[var(--gv-color-border)] bg-[var(--gv-color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--gv-color-text-muted)] shadow-subtle transition hover:border-[var(--gv-color-border-strong)] hover:text-[var(--gv-color-text)] focus-visible:ring-[var(--gv-color-primary)] focus-visible:ring-offset-2',
  hero:
    'rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.1)] transition hover:border-accent/40 hover:text-accent focus-visible:ring-white',
  mobile:
    'w-full justify-between rounded-2xl border border-[var(--gv-color-border)] bg-[var(--gv-color-surface)] px-4 py-2 text-sm font-semibold text-[var(--gv-color-text-muted)] transition hover:border-[var(--gv-color-border-strong)] hover:text-[var(--gv-color-text)] focus-visible:ring-[var(--gv-color-primary)] focus-visible:ring-offset-2',
};

const MENU_POSITION = {
  header: 'right-0 origin-top-right',
  hero: 'right-0 origin-top-right',
  mobile: 'left-0 origin-top-left w-full',
};

export default function LanguageSelector({ variant = 'header', className }) {
  const { availableLanguages, language, setLanguage, t } = useLanguage();
  const activeLanguage = getLanguageMeta(language);
  const buttonStyles = BUTTON_STYLES[variant] ?? BUTTON_STYLES.header;
  const menuPosition = MENU_POSITION[variant] ?? MENU_POSITION.header;

  const handleChange = (code) => {
    if (code !== language) {
      setLanguage(code);
    }
  };

  return (
    <Menu as="div" className={classNames('relative', variant === 'mobile' ? 'w-full' : '', className)}>
      <Menu.Button
        className={classNames('inline-flex items-center gap-2 focus:outline-none', buttonStyles)}
        aria-label={t('language.ariaLabel', 'Change language')}
      >
        <GlobeAltIcon
          className={variant === 'mobile' ? 'h-5 w-5 text-[var(--gv-color-accent)]' : 'h-4 w-4 text-[var(--gv-color-accent)]'}
          aria-hidden="true"
        />
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
            'absolute z-50 mt-2 max-h-72 w-64 overflow-hidden rounded-2xl border border-[var(--gv-color-border)] bg-[var(--gv-color-surface)] p-2 text-sm shadow-[var(--gv-shadow-elevated)] focus:outline-none',
            menuPosition,
          )}
        >
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gv-color-text-muted)]">
            {t('language.menuTitle', 'Choose your language')}
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
                        ? 'bg-[var(--gv-color-primary-soft)] text-[var(--gv-color-primary)]'
                        : 'text-[var(--gv-color-text-muted)] hover:bg-[color-mix(in_srgb,var(--gv-color-surface-muted)_80%,transparent)]',
                    )}
                  >
                    <span className="flex flex-col text-sm">
                      <span className="font-semibold">{option.nativeLabel}</span>
                      <span className="text-xs text-[var(--gv-color-text-muted)]/80">{option.label}</span>
                    </span>
                    {option.code === language ? (
                      <CheckIcon className="h-4 w-4 text-[var(--gv-color-primary)]" aria-hidden="true" />
                    ) : (
                      <span className="text-xs font-semibold uppercase text-[var(--gv-color-text-muted)]">{option.code}</span>
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
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
