export function normaliseStringArray(values, { lower = true } = {}) {
  if (!Array.isArray(values)) {
    return [];
  }
  return values
    .map((value) => {
      if (typeof value !== 'string') {
        return null;
      }
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }
      return lower ? trimmed.toLowerCase() : trimmed;
    })
    .filter(Boolean);
}

export function compactString(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

export default {
  normaliseStringArray,
  compactString,
};
