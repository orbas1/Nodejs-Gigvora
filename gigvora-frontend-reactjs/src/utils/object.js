export function cloneDeep(value) {
  if (value == null) {
    return value;
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to clone value', error);
    return value;
  }
}

export function getNestedValue(source, path, fallback = undefined) {
  if (!Array.isArray(path) || path.length === 0) {
    return source ?? fallback;
  }
  const result = path.reduce((accumulator, key) => {
    if (accumulator == null) {
      return undefined;
    }
    return accumulator[key];
  }, source);
  return result ?? fallback;
}

export function setNestedValue(source, path, value) {
  if (!Array.isArray(path) || path.length === 0) {
    return value;
  }
  const [head, ...rest] = path;
  const current = source && typeof source === 'object' ? source : {};
  const clone = Array.isArray(current) ? [...current] : { ...current };
  clone[head] = rest.length ? setNestedValue(current?.[head], rest, value) : value;
  return clone;
}

export default {
  cloneDeep,
  getNestedValue,
  setNestedValue,
};
