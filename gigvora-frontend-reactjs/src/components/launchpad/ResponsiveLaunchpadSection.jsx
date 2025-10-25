import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

import LaunchpadSectionHeader from './LaunchpadSectionHeader.jsx';

function resolveInitialState(defaultOpen) {
  if (defaultOpen === 'auto') {
    if (typeof window === 'undefined') {
      return true;
    }
    return window.matchMedia('(min-width: 1024px)').matches;
  }
  return Boolean(defaultOpen);
}

export default function ResponsiveLaunchpadSection({
  id,
  title,
  description,
  icon,
  children,
  defaultOpen,
  className,
  bodyClassName,
}) {
  const [isOpen, setIsOpen] = useState(() => resolveInitialState(defaultOpen));

  useEffect(() => {
    if (defaultOpen !== 'auto' || typeof window === 'undefined') {
      return undefined;
    }

    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsOpen(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [defaultOpen]);

  const contentId = useMemo(() => `${id || 'launchpad-section'}-content`, [id]);

  return (
    <section id={id} className={clsx('space-y-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <LaunchpadSectionHeader title={title} description={description} icon={icon} />
        <button
          type="button"
          onClick={() => setIsOpen((previous) => !previous)}
          className={clsx(
            'inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600',
            'transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
          )}
          aria-expanded={isOpen}
          aria-controls={contentId}
        >
          <span>{isOpen ? 'Hide section' : 'Show section'}</span>
          <ChevronDownIcon
            className={clsx('h-4 w-4 transition-transform', isOpen ? 'rotate-180' : 'rotate-0')}
            aria-hidden="true"
          />
        </button>
      </div>
      <div
        id={contentId}
        className={clsx(isOpen ? 'space-y-4' : 'hidden', bodyClassName)}
      >
        {children}
      </div>
    </section>
  );
}

ResponsiveLaunchpadSection.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  icon: PropTypes.elementType,
  children: PropTypes.node.isRequired,
  defaultOpen: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.oneOf(['auto']),
  ]),
  className: PropTypes.string,
  bodyClassName: PropTypes.string,
};

ResponsiveLaunchpadSection.defaultProps = {
  description: undefined,
  icon: undefined,
  defaultOpen: 'auto',
  className: undefined,
  bodyClassName: undefined,
};
