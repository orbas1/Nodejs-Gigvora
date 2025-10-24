export function getInitials(name, fallback = 'GV') {
  const source = name?.trim();
  if (!source) {
    return fallback;
  }

  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2);

  return initials || fallback;
}

export default { getInitials };
