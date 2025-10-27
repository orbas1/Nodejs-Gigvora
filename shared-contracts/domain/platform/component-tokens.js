import { freezeDeep } from '../utils/freezeDeep.js';

export const COMPONENT_TOKEN_VERSION = '2025.04';

export const DEFAULT_COMPONENT_TOKENS = freezeDeep({
  buttonSuite: {
    base: 'relative isolate inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-70',
    variants: {
      primary: {
        class: 'bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-500 text-white shadow-soft hover:shadow-[0_28px_65px_-35px_rgba(37,99,235,0.7)] hover:brightness-[1.02]',
        analyticsKey: 'primary',
      },
      secondary: {
        class: 'bg-white/95 text-slate-900 shadow-subtle border border-slate-200 hover:border-slate-300 hover:shadow-soft',
        analyticsKey: 'secondary',
      },
      outline: {
        class: 'bg-white/70 text-slate-900 border border-slate-300 hover:border-blue-300 hover:text-blue-700 hover:bg-white/90 shadow-subtle',
        analyticsKey: 'outline',
      },
      ghost: {
        class: 'bg-transparent text-slate-600 hover:text-blue-700 hover:bg-blue-50/70 border border-transparent',
        analyticsKey: 'ghost',
      },
      elevated: {
        class: 'bg-gradient-to-br from-white via-blue-50/80 to-blue-100/70 text-blue-900 shadow-soft hover:-translate-y-[1px] hover:shadow-[0_32px_70px_-40px_rgba(15,23,42,0.6)]',
        analyticsKey: 'elevated',
      },
      danger: {
        class: 'bg-gradient-to-tr from-rose-600 via-rose-500 to-fuchsia-500 text-white shadow-soft hover:shadow-[0_28px_65px_-35px_rgba(244,63,94,0.6)]',
        analyticsKey: 'danger',
      },
      frosted: {
        class: 'border border-white/20 bg-white/12 text-white shadow-[0_28px_70px_-38px_rgba(15,23,42,0.6)] backdrop-blur hover:border-white/35 hover:bg-white/16 hover:text-white focus-visible:ring-white/70',
        analyticsKey: 'frosted',
      },
    },
    sizes: {
      xs: { padding: 'px-3 py-1.5', text: 'text-xs', gap: 'gap-2' },
      sm: { padding: 'px-4 py-2', text: 'text-sm', gap: 'gap-2' },
      md: { padding: 'px-5 py-2.5', text: 'text-sm', gap: 'gap-2.5' },
      lg: { padding: 'px-6 py-3', text: 'text-base', gap: 'gap-3' },
    },
    iconOnlyPadding: {
      xs: 'p-1.5',
      sm: 'p-2',
      md: 'p-2.5',
      lg: 'p-3',
    },
    iconSizes: {
      xs: 'h-4 w-4',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    },
    spinnerSizes: {
      xs: 'h-4 w-4',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-5 w-5',
    },
    states: {
      subtle: 'opacity-90 hover:opacity-100',
      pressed: 'ring-2 ring-offset-2 ring-blue-200',
      fullWidth: 'w-full',
    },
    analytics: {
      datasetKey: 'data-variant',
      pressedKey: 'data-pressed',
    },
  },
  inputFieldSet: {
    container: 'grid gap-2',
    description: 'text-sm text-slate-500',
    optionalLabel: 'text-xs font-normal uppercase tracking-wide text-slate-400',
    labelBase: 'flex items-baseline justify-between text-sm font-medium',
    shell: 'group relative flex items-stretch gap-2 rounded-3xl border bg-white/90 px-4 shadow-subtle transition-all duration-200 focus-within:shadow-soft backdrop-blur',
    input: 'w-full bg-transparent py-2 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none',
    statuses: {
      default: {
        shell: 'border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-200/60',
        label: 'text-slate-900',
        helper: 'text-slate-500',
      },
      success: {
        shell: 'border-emerald-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-200/70',
        label: 'text-emerald-700',
        helper: 'text-emerald-600',
      },
      warning: {
        shell: 'border-amber-200 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-200/60',
        label: 'text-amber-700',
        helper: 'text-amber-600',
      },
      error: {
        shell: 'border-rose-200 focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-200/70',
        label: 'text-rose-700',
        helper: 'text-rose-600',
      },
      disabled: {
        shell: 'bg-slate-100 text-slate-400',
        helper: 'text-slate-400',
      },
    },
    density: {
      comfortable: { shell: 'py-1.5', input: 'leading-relaxed text-base' },
      compact: { shell: 'py-1', input: 'text-sm leading-tight' },
    },
    counter: 'flex justify-end text-xs text-slate-400',
    helperText: 'text-sm',
    successText: 'text-sm',
    errorText: 'text-sm',
    prefix: 'flex items-center text-sm font-medium text-slate-500',
    suffix: 'flex items-center text-sm font-medium text-slate-500',
    visual: 'flex items-center text-slate-400',
  },
  cardScaffold: {
    base: 'group relative flex overflow-hidden rounded-[2.75rem] backdrop-blur transition-transform duration-200',
    variants: {
      default: 'border border-slate-200/70 bg-white/90 text-slate-900 shadow-subtle hover:shadow-soft',
      minimal: 'border border-slate-200/40 bg-white/60 text-slate-900 shadow-none hover:shadow-subtle',
      elevated: 'border border-transparent bg-gradient-to-br from-white/95 via-blue-50/70 to-sky-100/60 text-slate-900 shadow-soft hover:-translate-y-[2px] hover:shadow-[0_32px_75px_-42px_rgba(15,23,42,0.55)]',
      dark: 'border border-slate-800/70 bg-slate-950/80 text-slate-100 shadow-[0_32px_60px_-35px_rgba(15,23,42,0.8)] hover:shadow-[0_40px_80px_-45px_rgba(15,23,42,0.9)]',
    },
    padding: {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
    orientation: {
      vertical: 'flex-col',
      horizontal: 'flex-col gap-6 md:flex-row md:items-stretch',
    },
    highlight: {
      primary: 'from-blue-500 via-indigo-500 to-sky-400',
      success: 'from-emerald-400 via-teal-400 to-cyan-400',
      warning: 'from-amber-400 via-orange-400 to-yellow-300',
      danger: 'from-rose-500 via-fuchsia-500 to-pink-400',
    },
    metaTone: {
      default: 'text-slate-500',
      dark: 'text-slate-300',
    },
    media: {
      base: 'overflow-hidden rounded-3xl border border-slate-200/40 bg-slate-50',
      horizontal: 'md:w-56',
      vertical: 'w-full',
    },
    header: {
      wrapper: 'space-y-3',
      eyebrow: 'text-xs font-semibold uppercase tracking-[0.18em] text-slate-400',
      title: 'text-xl font-semibold tracking-tight',
      subtitle: 'text-sm font-medium text-slate-500',
      description: 'text-sm text-slate-600',
      meta: 'text-sm text-right',
    },
    body: 'space-y-3 text-sm text-slate-600',
    footer: 'mt-auto flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500',
    interactive: 'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-300 hover:-translate-y-[2px]',
    analytics: {
      datasetVariant: 'data-variant',
      datasetOrientation: 'data-orientation',
      datasetInteractive: 'data-interactive',
    },
  },
  brandBadge: {
    base: 'inline-flex items-center gap-2 rounded-full border px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-200 backdrop-blur',
    icon: 'flex h-5 w-5 items-center justify-center rounded-full text-[0.6rem] font-bold',
    text: 'tracking-[0.35em]',
    tones: {
      accent: {
        shell: 'border-white/20 bg-white/10 text-accent shadow-[0_18px_45px_-32px_rgba(56,189,248,0.7)]',
        icon: 'bg-accent/90 text-slate-950',
      },
      neutral: {
        shell: 'border-slate-200/70 bg-white/95 text-slate-600 shadow-subtle',
        icon: 'bg-slate-200 text-slate-700',
      },
      emerald: {
        shell: 'border-emerald-300/70 bg-emerald-500/10 text-emerald-200 shadow-[0_20px_45px_-35px_rgba(16,185,129,0.75)]',
        icon: 'bg-emerald-400/90 text-emerald-950',
      },
    },
    analytics: {
      datasetTone: 'data-tone',
    },
  },
  personaChip: {
    base: 'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all duration-200 shadow-[0_18px_55px_-35px_rgba(15,23,42,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-200 backdrop-blur-sm',
    label: 'text-current',
    indicator: 'inline-flex h-2 w-2 flex-none rounded-full',
    icon: 'flex h-4 w-4 items-center justify-center text-[0.65rem]',
    sizes: {
      sm: 'px-3 py-1 text-[11px] gap-1.5',
      md: 'px-4 py-2 text-xs gap-2',
      lg: 'px-5 py-2.5 text-sm gap-2.5',
    },
    states: {
      interactive: 'hover:-translate-y-0.5 hover:shadow-[0_24px_65px_-40px_rgba(15,23,42,0.55)]',
      selected: 'ring-2 ring-offset-2 ring-blue-300',
    },
    tones: {
      accent: {
        shell: 'border-white/15 bg-white/10 text-white/90',
        indicator: 'bg-accent',
      },
      frost: {
        shell: 'border-white/30 bg-white/18 text-white/85',
        indicator: 'bg-white/80',
      },
      neutral: {
        shell: 'border-slate-200/70 bg-white/90 text-slate-700 shadow-subtle',
        indicator: 'bg-slate-400/90',
      },
      emerald: {
        shell: 'border-emerald-400/50 bg-emerald-400/15 text-emerald-100',
        indicator: 'bg-emerald-300',
      },
    },
    analytics: {
      datasetTone: 'data-tone',
      datasetSize: 'data-size',
    },
  },
  statBlock: {
    base: 'rounded-2xl border px-5 py-4 shadow-[0_22px_60px_-32px_rgba(15,23,42,0.55)] backdrop-blur transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-200',
    layout: 'space-y-2 text-left',
    label: 'text-[11px] font-semibold uppercase tracking-[0.32em]',
    value: 'text-lg font-semibold',
    helper: 'text-xs leading-snug',
    tones: {
      accent: {
        shell: 'border-white/15 bg-white/10 text-white',
        label: 'text-accent/90',
        value: 'text-white',
        helper: 'text-white/70',
      },
      neutral: {
        shell: 'border-slate-200/70 bg-white/95 text-slate-800 shadow-subtle',
        label: 'text-slate-500',
        value: 'text-slate-900',
        helper: 'text-slate-500',
      },
      emerald: {
        shell: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-50',
        label: 'text-emerald-200',
        value: 'text-white',
        helper: 'text-emerald-100/80',
      },
    },
    analytics: {
      datasetTone: 'data-tone',
    },
  },
});

export function mergeComponentTokens(overrides = {}) {
  function deepMerge(defaultValue, overrideValue) {
    if (overrideValue == null) {
      return defaultValue;
    }
    if (Array.isArray(defaultValue) || Array.isArray(overrideValue)) {
      return overrideValue ?? defaultValue;
    }
    if (typeof defaultValue === 'object' && typeof overrideValue === 'object') {
      const result = { ...defaultValue };
      for (const [key, value] of Object.entries(overrideValue)) {
        if (value === undefined || value === null) {
          continue;
        }
        result[key] = deepMerge(defaultValue?.[key], value);
      }
      return result;
    }
    return overrideValue;
  }

  return freezeDeep({
    buttonSuite: deepMerge(DEFAULT_COMPONENT_TOKENS.buttonSuite, overrides.buttonSuite),
    inputFieldSet: deepMerge(DEFAULT_COMPONENT_TOKENS.inputFieldSet, overrides.inputFieldSet),
    cardScaffold: deepMerge(DEFAULT_COMPONENT_TOKENS.cardScaffold, overrides.cardScaffold),
    brandBadge: deepMerge(DEFAULT_COMPONENT_TOKENS.brandBadge, overrides.brandBadge),
    personaChip: deepMerge(DEFAULT_COMPONENT_TOKENS.personaChip, overrides.personaChip),
    statBlock: deepMerge(DEFAULT_COMPONENT_TOKENS.statBlock, overrides.statBlock),
  });
}

export default {
  COMPONENT_TOKEN_VERSION,
  DEFAULT_COMPONENT_TOKENS,
  mergeComponentTokens,
};
