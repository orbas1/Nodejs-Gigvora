const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  try {
    return window.matchMedia(REDUCED_MOTION_QUERY).matches;
  } catch (error) {
    return false;
  }
}

export function focusElement(element) {
  if (!element || typeof element.focus !== 'function') {
    return;
  }

  const previousTabIndex = element.getAttribute('tabindex');

  if (element.tabIndex < 0) {
    element.setAttribute('tabindex', '-1');
  }

  element.focus({ preventScroll: true });

  if (previousTabIndex === null) {
    element.removeAttribute('tabindex');
  }
}

export function scrollToElement(element, options = {}) {
  if (!element || typeof element.scrollIntoView !== 'function') {
    return;
  }

  const {
    behavior = 'smooth',
    block = 'start',
    inline = 'nearest',
    focus = false,
  } = options;

  const prefersReduce = prefersReducedMotion();
  const scrollOptions = {
    behavior: prefersReduce ? 'auto' : behavior,
    block,
    inline,
  };

  try {
    element.scrollIntoView(scrollOptions);
  } catch (error) {
    // Some older browsers do not support options. Fallback to simple call.
    element.scrollIntoView();
  }

  if (focus) {
    focusElement(element);
  }
}

export function announcePolite(message) {
  if (typeof document === 'undefined') {
    return;
  }

  let region = document.getElementById('gv-global-live-region');

  if (!region) {
    region = document.createElement('div');
    region.id = 'gv-global-live-region';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    document.body.appendChild(region);
  }

  region.textContent = message;
}

export default {
  prefersReducedMotion,
  scrollToElement,
  focusElement,
  announcePolite,
};
