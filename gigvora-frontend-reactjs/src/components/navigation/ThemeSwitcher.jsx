import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Menu, Transition } from '@headlessui/react';
import { BoltIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import classNames from '../../utils/classNames.js';
import { useTheme } from '../../context/ThemeContext.jsx';

const ICON_MAP = {
  light: SunIcon,
  dark: MoonIcon,
  contrast: BoltIcon,
};

function ThemeOption({ option, isActive, onSelect }) {
  const Icon = ICON_MAP[option.id] ?? SunIcon;
  return (
    <Menu.Item>
      {({ active }) => (
        <button
          type="button"
          onClick={() => onSelect(option.id)}
          className={classNames(
            'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition',
            isActive || active
              ? 'bg-[var(--gv-color-primary-soft)] text-[var(--gv-color-primary)]'
              : 'text-[var(--gv-color-text-muted)] hover:bg-[color-mix(in_srgb,var(--gv-color-surface-muted)_85%,transparent)]',
          )}
        >
          <span className="flex flex-col text-sm">
            <span className="flex items-center gap-2 font-semibold">
              <Icon className="h-4 w-4" aria-hidden="true" />
              {option.label}
            </span>
            <span className="text-xs text-[var(--gv-color-text-muted)]/80">{option.description}</span>
          </span>
          {isActive ? <span className="text-xs font-semibold uppercase tracking-[0.25em]">Active</span> : null}
        </button>
      )}
    </Menu.Item>
  );
}

ThemeOption.propTypes = {
  option: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
  }).isRequired,
  isActive: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};

ThemeOption.defaultProps = {
  isActive: false,
};

export default function ThemeSwitcher({ className, variant = 'header' }) {
  const { theme, availableThemes, setTheme, cycleTheme } = useTheme();
  const activeTheme = availableThemes.find((option) => option.id === theme) ?? availableThemes[0];
  const Icon = ICON_MAP[activeTheme?.id] ?? SunIcon;

  const buttonStyles =
    variant === 'header'
      ? 'rounded-full border border-[var(--gv-color-border)] bg-[var(--gv-color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--gv-color-text-muted)] shadow-subtle transition hover:border-[var(--gv-color-border-strong)] hover:text-[var(--gv-color-text)] focus-visible:ring-[var(--gv-color-primary)] focus-visible:ring-offset-2'
      : 'w-full justify-between rounded-2xl border border-[var(--gv-color-border)] bg-[var(--gv-color-surface)] px-4 py-2 text-sm font-semibold text-[var(--gv-color-text-muted)] transition hover:border-[var(--gv-color-border-strong)] hover:text-[var(--gv-color-text)] focus-visible:ring-[var(--gv-color-primary)] focus-visible:ring-offset-2';

  return (
    <Menu as="div" className={classNames('relative', variant === 'mobile' ? 'w-full' : '', className)}>
      <Menu.Button
        className={classNames('inline-flex items-center gap-2 focus:outline-none', buttonStyles)}
        aria-label="Change theme"
        onDoubleClick={cycleTheme}
      >
        <Icon className={variant === 'mobile' ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden="true" />
        <span className="flex items-center gap-1">
          <span>{activeTheme?.label ?? 'Theme'}</span>
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
            'absolute z-50 mt-2 w-72 origin-top-right rounded-2xl border border-[var(--gv-color-border)] bg-[var(--gv-color-surface)] p-3 text-sm shadow-[var(--gv-shadow-elevated)] focus:outline-none',
            variant === 'mobile' ? 'left-0 origin-top-left w-full' : 'right-0',
          )}
        >
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gv-color-text-muted)]">
            Display theme
          </p>
          <div className="space-y-2">
            {availableThemes.map((option) => (
              <ThemeOption key={option.id} option={option} isActive={option.id === theme} onSelect={setTheme} />
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

ThemeSwitcher.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(['header', 'mobile']),
};

ThemeSwitcher.defaultProps = {
  className: undefined,
  variant: 'header',
};
