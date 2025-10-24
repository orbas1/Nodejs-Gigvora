export function resolveInitials(name = '', fallback = 'GV') {
  const source = `${name ?? ''}`.trim();
  if (!source) {
    return fallback;
  }

  return source
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2) || fallback;
}

export default resolveInitials;
