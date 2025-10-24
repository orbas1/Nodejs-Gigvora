function normaliseSource(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

function extractSegments(source) {
  if (!source) {
    return [];
  }

  const localPart = source.includes('@') ? source.split('@')[0] : source;
  return localPart
    .split(/[\s._-]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function getInitials(name, secondary, fallback = 'GV') {
  const sources = [normaliseSource(name), normaliseSource(secondary)];
  const candidate = sources.find((value) => value.length > 0);
  if (!candidate) {
    return fallback;
  }

  const segments = extractSegments(candidate);
  if (!segments.length) {
    return fallback;
  }

  const initials = segments
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase())
    .filter(Boolean)
    .join('');

  return initials || fallback;
}

export default {
  getInitials,
};
