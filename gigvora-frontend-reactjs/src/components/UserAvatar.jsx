import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const SIZE_MAP = {
  compact: 'h-6 w-6',
  xs: 'h-8 w-8',
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
  xl: 'h-24 w-24',
  '2xl': 'h-28 w-28',
  hero: 'h-36 w-36',
};

const SHAPE_CLASS_MAP = {
  circle: 'rounded-full',
  rounded: 'rounded-[var(--gv-radius-sm)]',
  square: 'rounded-[1rem]',
  pill: 'rounded-[999px]',
};

const STATUS_CLASS_MAP = {
  online: 'bg-[var(--gv-color-success)]',
  busy: 'bg-[var(--gv-color-warning)]',
  offline: 'bg-[var(--gv-color-border-strong)]',
};

const fallbackCache = new Map();

function buildAvatarUrl(name, seedOverride) {
  const seed = seedOverride || name || 'Gigvora';
  const encoded = encodeURIComponent(seed.trim() || 'Gigvora');
  return `https://api.dicebear.com/7.x/thumbs/svg?backgroundColor=99C1FF,EEF2FF&seed=${encoded}`;
}

function buildInitials(name) {
  return name
    ?.split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function createFallback(initials, accent) {
  const key = `${initials || 'GV'}-${accent}`;
  if (!fallbackCache.has(key)) {
    const safeInitials = initials || 'GV';
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${accent}" stop-opacity="0.85" />
            <stop offset="100%" stop-color="${accent}" stop-opacity="0.35" />
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="48" fill="url(#g)" />
        <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="48" fill="#ffffff" font-family="Inter, sans-serif" font-weight="600">${safeInitials}</text>
      </svg>`;
    fallbackCache.set(key, `data:image/svg+xml,${encodeURIComponent(svg)}`);
  }
  return fallbackCache.get(key);
}

export default function UserAvatar({
  name,
  imageUrl,
  seed,
  size = 'md',
  className = '',
  showGlow = true,
  shape = 'circle',
  badge,
  status,
  preferInitials = true,
  alt,
}) {
  const safeSize = SIZE_MAP[size] ?? SIZE_MAP.md;
  const shapeClass = SHAPE_CLASS_MAP[shape] ?? SHAPE_CLASS_MAP.circle;
  const initials = useMemo(() => buildInitials(name), [name]);
  const fallbackAccent = status === 'online' ? '#22C55E' : status === 'busy' ? '#F97316' : '#2563EB';
  const fallbackSrc = useMemo(() => createFallback(initials, fallbackAccent), [initials, fallbackAccent]);
  const remoteSrc = useMemo(() => {
    if (imageUrl) {
      return imageUrl;
    }
    if (preferInitials) {
      return null;
    }
    return buildAvatarUrl(name, seed);
  }, [imageUrl, name, preferInitials, seed]);

  const [currentSrc, setCurrentSrc] = useState(remoteSrc ?? fallbackSrc);

  useEffect(() => {
    setCurrentSrc(remoteSrc ?? fallbackSrc);
  }, [remoteSrc, fallbackSrc]);

  const statusClass = status ? STATUS_CLASS_MAP[status] ?? STATUS_CLASS_MAP.offline : null;
  const resolvedAlt = alt || (name ? `${name} avatar` : 'Profile avatar');

  return (
    <div
      className={
        `relative inline-flex items-center justify-center overflow-hidden border border-[var(--gv-color-border)] bg-[var(--gv-color-surface)] shadow-subtle ${shapeClass} ${safeSize} ${className}`
      }
    >
      {showGlow ? (
        <span
          className={`pointer-events-none absolute inset-0 ${shapeClass} bg-[radial-gradient(circle_at_top,var(--gv-color-accent)_0%,transparent_70%)] opacity-60`}
          aria-hidden="true"
        />
      ) : null}
      <img
        src={currentSrc}
        alt={resolvedAlt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="relative h-full w-full object-cover"
        onError={() => {
          setCurrentSrc(fallbackSrc);
        }}
      />
      {badge ? <span className="pointer-events-none absolute -bottom-1 right-1" aria-hidden="true">{badge}</span> : null}
      {statusClass ? (
        <span
          className={
            `absolute -bottom-0.5 -right-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[var(--gv-color-surface)] shadow-soft ${statusClass}`
          }
        />
      ) : null}
    </div>
  );
}

UserAvatar.propTypes = {
  name: PropTypes.string,
  imageUrl: PropTypes.string,
  seed: PropTypes.string,
  size: PropTypes.oneOf(Object.keys(SIZE_MAP)),
  className: PropTypes.string,
  showGlow: PropTypes.bool,
  shape: PropTypes.oneOf(Object.keys(SHAPE_CLASS_MAP)),
  badge: PropTypes.node,
  status: PropTypes.oneOf(['online', 'busy', 'offline']),
  preferInitials: PropTypes.bool,
  alt: PropTypes.string,
};

UserAvatar.defaultProps = {
  name: undefined,
  imageUrl: undefined,
  seed: undefined,
  size: 'md',
  className: '',
  showGlow: true,
  shape: 'circle',
  badge: null,
  status: undefined,
  preferInitials: true,
  alt: undefined,
};
