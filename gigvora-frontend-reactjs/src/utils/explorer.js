function serializeFilters(filters) {
  if (!filters || typeof filters !== 'object') {
    return undefined;
  }

  const entries = Object.entries(filters).reduce((accumulator, [key, value]) => {
    if (Array.isArray(value)) {
      const cleaned = value.filter((item) => typeof item === 'string' && item.trim().length > 0);
      if (cleaned.length) {
        accumulator[key] = cleaned;
      }
      return accumulator;
    }

    if (value === true || value === false) {
      accumulator[key] = value;
      return accumulator;
    }

    if (value != null) {
      const trimmed = `${value}`.trim();
      if (trimmed) {
        accumulator[key] = trimmed;
      }
    }
    return accumulator;
  }, {});

  if (!Object.keys(entries).length) {
    return undefined;
  }

  try {
    return JSON.stringify(entries);
  } catch (error) {
    console.warn('Failed to serialise search filters', error);
    return undefined;
  }
}

export function buildExplorerSearchUrl(search, { basePath = '/search' } = {}) {
  if (!search) {
    return basePath;
  }

  const params = new URLSearchParams();

  if (search.category) {
    params.set('category', `${search.category}`);
  }

  if (search.query) {
    params.set('q', `${search.query}`);
  }

  if (search.sort) {
    params.set('sort', `${search.sort}`);
  }

  if (search.page && Number.isFinite(Number(search.page))) {
    params.set('page', String(search.page));
  }

  const filters = serializeFilters(search.filters);
  if (filters) {
    params.set('filters', filters);
  }

  if (search.mapViewport) {
    try {
      const payload =
        typeof search.mapViewport === 'string'
          ? search.mapViewport
          : JSON.stringify(search.mapViewport);
      if (payload && payload !== '{}') {
        params.set('viewport', payload);
      }
    } catch (error) {
      console.warn('Failed to serialise search viewport', error);
    }
  }

  const queryString = params.toString();
  if (!queryString) {
    return basePath;
  }
  return `${basePath}?${queryString}`;
}

export default {
  buildExplorerSearchUrl,
};
