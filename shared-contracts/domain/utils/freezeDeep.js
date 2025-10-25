function freeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (seen.has(value)) {
    return value;
  }
  seen.add(value);

  Object.getOwnPropertyNames(value).forEach((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || typeof descriptor.value === 'undefined') {
      return;
    }
    freeze(descriptor.value, seen);
  });

  return Object.freeze(value);
}

export function freezeDeep(value) {
  return freeze(value);
}

export default freezeDeep;
