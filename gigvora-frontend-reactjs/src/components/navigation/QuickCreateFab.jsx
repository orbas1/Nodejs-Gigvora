import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowUpRightIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  LifebuoyIcon,
  MegaphoneIcon,
  PlusIcon,
  SparklesIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const ACTION_TONES = {
  violet: 'bg-violet-50 text-violet-600 ring-violet-200',
  sky: 'bg-sky-50 text-sky-600 ring-sky-200',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-600 ring-amber-200',
  rose: 'bg-rose-50 text-rose-600 ring-rose-200',
  slate: 'bg-slate-900 text-white ring-slate-200/60',
};

const ICON_LIBRARY = {
  briefcase: BriefcaseIcon,
  gig: BriefcaseIcon,
  megaphone: MegaphoneIcon,
  post: MegaphoneIcon,
  'user-plus': UserPlusIcon,
  invite: UserPlusIcon,
  calendar: CalendarDaysIcon,
  schedule: CalendarDaysIcon,
  lifebuoy: LifebuoyIcon,
  support: LifebuoyIcon,
  sparkles: SparklesIcon,
  lightning: SparklesIcon,
  plus: PlusIcon,
};

const PLACEMENT_CLASSES = {
  'bottom-right': 'bottom-6 right-6 items-end',
  'bottom-left': 'bottom-6 left-6 items-start',
  'top-right': 'top-6 right-6 items-end',
  'top-left': 'top-6 left-6 items-start',
};

const DEFAULT_ACTIONS = [
  {
    id: 'launch-gig',
    label: 'Launch a gig',
    description: 'Craft a premium gig brief with scoped pricing, milestones, and AI suggestions.',
    icon: BriefcaseIcon,
    tone: 'violet',
    href: '/gigs/create',
  },
  {
    id: 'share-update',
    label: 'Share an update',
    description: 'Publish a multimedia post to energise your network and highlight wins.',
    icon: MegaphoneIcon,
    tone: 'sky',
    href: '/feed/new',
  },
  {
    id: 'invite-ally',
    label: 'Invite a collaborator',
    description: 'Send a curated invite or referral to expand your operations pod.',
    icon: UserPlusIcon,
    tone: 'emerald',
    href: '/connections/invite',
  },
  {
    id: 'schedule-session',
    label: 'Schedule a session',
    description: 'Book a strategy session with mentors or partners in seconds.',
    icon: CalendarDaysIcon,
    tone: 'amber',
    href: '/calendar/new',
  },
];

function resolveToneClasses(tone) {
  if (!tone) {
    return ACTION_TONES.violet;
  }
  return ACTION_TONES[tone] ?? tone;
}

function resolveIconComponent(icon) {
  if (typeof icon === 'string') {
    return ICON_LIBRARY[icon] ?? SparklesIcon;
  }
  if (icon) {
    return icon;
  }
  return SparklesIcon;
}

export default function QuickCreateFab({
  actions,
  defaultActionId,
  onAction,
  onOpenChange,
  onNavigate,
  placement,
  className,
  label,
  initialOpen,
}) {
  const [isOpen, setIsOpen] = useState(Boolean(initialOpen));
  const actionsRef = useRef(null);
  const firstActionRef = useRef(null);

  const resolvedActions = useMemo(() => {
    if (Array.isArray(actions) && actions.length) {
      return actions;
    }
    return DEFAULT_ACTIONS;
  }, [actions]);

  const recommendedId = defaultActionId ?? resolvedActions[0]?.id;

  const resolvedPlacement = PLACEMENT_CLASSES[placement] ?? PLACEMENT_CLASSES['bottom-right'];

  useEffect(() => {
    if (typeof onOpenChange === 'function') {
      onOpenChange(isOpen);
    }
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const handler = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && firstActionRef.current) {
      firstActionRef.current.focus();
    }
  }, [isOpen]);

  const navigate = useCallback(
    (targetHref, action) => {
      if (!targetHref) {
        return;
      }
      if (typeof onNavigate === 'function') {
        onNavigate(targetHref, action);
        return;
      }
      if (typeof window !== 'undefined') {
        window.location.assign(targetHref);
      }
    },
    [onNavigate],
  );

  const handleActionSelect = useCallback(
    async (action) => {
      if (!action || action.disabled) {
        return;
      }
      if (typeof action.onSelect === 'function') {
        await action.onSelect(action);
      } else if (action.href) {
        navigate(action.href, action);
      }
      if (typeof onAction === 'function') {
        onAction(action);
      }
      setIsOpen(false);
    },
    [navigate, onAction],
  );

  const toggleOpen = useCallback(() => {
    setIsOpen((previous) => !previous);
  }, []);

  const handleBlur = useCallback((event) => {
    if (!actionsRef.current) {
      return;
    }
    if (actionsRef.current.contains(event.relatedTarget)) {
      return;
    }
    setIsOpen(false);
  }, []);

  return (
    <div className={classNames('pointer-events-none fixed z-40 flex flex-col', resolvedPlacement, className)}>
      {isOpen ? (
        <button
          type="button"
          aria-hidden="true"
          className="pointer-events-auto fixed inset-0 z-30 bg-slate-900/10 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      ) : null}
      <div className="pointer-events-auto z-40 flex flex-col items-end gap-4" ref={actionsRef} onBlur={handleBlur}>
        {isOpen ? (
          <div className="w-80 max-w-[calc(100vw-3rem)] rounded-[32px] border border-slate-200/80 bg-white/95 p-4 shadow-2xl shadow-slate-900/15 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quick create</p>
                <h2 className="mt-1 flex items-center gap-2 text-base font-semibold text-slate-900">
                  <SparklesIcon className="h-4 w-4 text-violet-500" aria-hidden="true" />
                  Launch something remarkable
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                aria-label="Close quick create menu"
              >
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <ul className="mt-4 space-y-3">
              {resolvedActions.map((action, index) => {
                const Icon = resolveIconComponent(action.icon);
                const toneClasses = resolveToneClasses(action.tone);
                const recommended = action.recommended === true || action.id === recommendedId;
                return (
                  <li key={action.id}>
                    <button
                      type="button"
                      onClick={() => handleActionSelect(action)}
                      disabled={action.disabled}
                      ref={index === 0 ? firstActionRef : undefined}
                      className={classNames(
                        'group relative flex w-full items-start gap-3 rounded-3xl border border-slate-200/80 bg-white px-3 py-3 text-left shadow-sm shadow-slate-900/10 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60',
                      )}
                    >
                      <span
                        className={classNames(
                          'mt-1 inline-flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold shadow-inner shadow-white/40 ring-2 ring-inset',
                          toneClasses,
                        )}
                        aria-hidden="true"
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                          {recommended ? (
                            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                              Recommended
                            </span>
                          ) : null}
                          {action.badge ? (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                              {action.badge}
                            </span>
                          ) : null}
                        </div>
                        {action.description ? (
                          <p className="mt-1 text-xs text-slate-500">{action.description}</p>
                        ) : null}
                      </div>
                      <ArrowUpRightIcon className="mt-1 h-4 w-4 text-slate-400 transition group-hover:text-slate-600" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
        <div className="flex items-center gap-3">
          {label ? (
            <span className="hidden text-sm font-medium text-slate-600 sm:inline">{label}</span>
          ) : null}
          <button
            type="button"
            onClick={toggleOpen}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            aria-label={label ?? 'Quick create'}
            className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl shadow-slate-900/30 transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            {isOpen ? <XMarkIcon className="h-6 w-6" aria-hidden="true" /> : <PlusIcon className="h-7 w-7" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>
  );
}

QuickCreateFab.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      icon: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
      tone: PropTypes.string,
      href: PropTypes.string,
      onSelect: PropTypes.func,
      badge: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
      disabled: PropTypes.bool,
    }),
  ),
  defaultActionId: PropTypes.string,
  onAction: PropTypes.func,
  onOpenChange: PropTypes.func,
  onNavigate: PropTypes.func,
  placement: PropTypes.oneOf(['bottom-right', 'bottom-left', 'top-right', 'top-left']),
  className: PropTypes.string,
  label: PropTypes.string,
  initialOpen: PropTypes.bool,
};

QuickCreateFab.defaultProps = {
  actions: null,
  defaultActionId: null,
  onAction: null,
  onOpenChange: null,
  onNavigate: null,
  placement: 'bottom-right',
  className: undefined,
  label: 'Quick create',
  initialOpen: false,
};
