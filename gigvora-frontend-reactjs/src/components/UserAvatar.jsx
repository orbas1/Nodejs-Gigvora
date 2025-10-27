import PropTypes from 'prop-types';

const SIZE_MAP = {
  xs: 'h-8 w-8',
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
};

function buildAvatarUrl(name, seedOverride) {
  const seed = `${seedOverride || name || 'Gigvora member'}`.trim() || 'Gigvora member';
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  const avatarIndex = (Math.abs(hash) % 70) + 1;
  return `https://i.pravatar.cc/256?img=${avatarIndex}`;
}

export default function UserAvatar({
  name,
  imageUrl,
  seed,
  size = 'md',
  className = '',
  showGlow = true,
}) {
  const safeSize = SIZE_MAP[size] ?? SIZE_MAP.md;
  const src = imageUrl || buildAvatarUrl(name, seed);
  const initials = name
    ?.split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-full border border-slate-100 bg-white shadow-sm ${safeSize} ${className}`}
    >
      {showGlow && (
        <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-accent/20 via-transparent to-transparent" aria-hidden="true" />
      )}
      <img
        src={src}
        alt={name ? `${name} avatar` : 'Profile avatar'}
        className="relative h-full w-full object-cover"
        onError={(event) => {
          event.currentTarget.onerror = null; // prevent looping
          event.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='60' fill='%23EEF2FF'/%3E%3Ctext x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='%233256ED' font-family='Inter, sans-serif'%3E${initials || 'GV'}%3C/text%3E%3C/svg%3E`;
        }}
      />
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
};
