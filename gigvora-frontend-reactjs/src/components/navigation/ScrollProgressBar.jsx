import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { classNames } from '../../utils/classNames.js';

function clamp(value, min, max) {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

export default function ScrollProgressBar({ className, trackDocument }) {
  const barRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }

    const root = document.documentElement;
    let frame = null;

    const update = () => {
      frame = null;
      const scrollTop = window.scrollY || root.scrollTop || document.body.scrollTop || 0;
      const scrollHeight = Math.max(root.scrollHeight, document.body.scrollHeight);
      const viewportHeight = window.innerHeight || root.clientHeight;
      const maxScroll = Math.max(scrollHeight - viewportHeight, 0);
      const ratio = maxScroll > 0 ? clamp(scrollTop / maxScroll, 0, 1) : 0;
      const progressNode = barRef.current;

      if (progressNode) {
        const formattedRatio = Number.isFinite(ratio) ? ratio : 0;
        progressNode.style.setProperty('--gv-scroll-progress-ratio', formattedRatio.toFixed(4));
        progressNode.style.transform = `scaleX(${formattedRatio})`;
      }

      if (trackDocument) {
        root.dataset.shellScroll = ratio > 0.02 ? 'scrolled' : 'top';
      }
    };

    const handleScroll = () => {
      if (frame !== null) {
        return;
      }
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (trackDocument) {
        root.dataset.shellScroll = 'top';
      }
    };
  }, [trackDocument]);

  return <div ref={barRef} className={classNames('gv-scroll-progress', className)} aria-hidden="true" />;
}

ScrollProgressBar.propTypes = {
  className: PropTypes.string,
  trackDocument: PropTypes.bool,
};

ScrollProgressBar.defaultProps = {
  className: undefined,
  trackDocument: true,
};
