export function normalizeLocationString(value, { maxLength = 255 } = {}) {
  if (value == null) {
    return null;
  }
  const text = `${value}`.trim();
  if (!text) {
    return null;
  }
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

export function normalizeGeoLocation(value, {
  maxLabelLength = 255,
  maxCityLength = 120,
  maxRegionLength = 120,
  maxCountryLength = 120,
  maxPostalLength = 40,
} = {}) {
  if (value == null) {
    return null;
  }

  if (typeof value === 'string') {
    const label = normalizeLocationString(value, { maxLength: maxLabelLength });
    return label ? { label } : null;
  }

  if (typeof value !== 'object') {
    return null;
  }

  const result = {};

  const label = normalizeLocationString(value.label ?? value.name ?? value.place ?? value.formattedAddress, {
    maxLength: maxLabelLength,
  });
  if (label) {
    result.label = label;
  }

  const city = normalizeLocationString(value.city, { maxLength: maxCityLength });
  if (city) {
    result.city = city;
  }

  const region = normalizeLocationString(value.region ?? value.state ?? value.province, {
    maxLength: maxRegionLength,
  });
  if (region) {
    result.region = region;
  }

  const country = normalizeLocationString(value.country ?? value.countryCode, {
    maxLength: maxCountryLength,
  });
  if (country) {
    result.country = country;
  }

  const postalCode = normalizeLocationString(value.postalCode ?? value.postcode ?? value.zip, {
    maxLength: maxPostalLength,
  });
  if (postalCode) {
    result.postalCode = postalCode;
  }

  if (value.timezone) {
    const timezone = normalizeLocationString(value.timezone, { maxLength: 120 });
    if (timezone) {
      result.timezone = timezone;
    }
  }

  if (value.placeId) {
    const placeId = normalizeLocationString(value.placeId, { maxLength: 255 });
    if (placeId) {
      result.placeId = placeId;
    }
  }

  const latitude = Number(value.latitude ?? value.lat);
  if (Number.isFinite(latitude)) {
    result.latitude = latitude;
  }

  const longitude = Number(value.longitude ?? value.lng ?? value.lon);
  if (Number.isFinite(longitude)) {
    result.longitude = longitude;
  }

  if (value.boundingBox && typeof value.boundingBox === 'object') {
    result.boundingBox = value.boundingBox;
  }

  if (value.raw && typeof value.raw === 'object') {
    result.raw = value.raw;
  }

  return Object.keys(result).length ? result : null;
}

export function normalizeLocationPayload(input = {}) {
  if (input == null || typeof input !== 'object') {
    return {
      location: normalizeLocationString(input),
      geoLocation: null,
    };
  }

  const location = normalizeLocationString(
    input.location ?? input.label ?? input.name ?? input.display ?? input.text ?? null,
  );
  const geoLocation = normalizeGeoLocation(input.geoLocation ?? input.geo ?? input.coordinates ?? null);

  if (!location && geoLocation?.label) {
    return { location: normalizeLocationString(geoLocation.label), geoLocation };
  }

  return { location, geoLocation };
}

export function areGeoLocationsEqual(a, b) {
  const normalize = (value) => {
    const normalized = normalizeGeoLocation(value);
    if (!normalized) {
      return null;
    }
    const sortable = { ...normalized };
    if (sortable.raw && typeof sortable.raw === 'object') {
      sortable.raw = JSON.stringify(sortable.raw);
    }
    if (sortable.boundingBox && typeof sortable.boundingBox === 'object') {
      sortable.boundingBox = JSON.stringify(sortable.boundingBox);
    }
    return JSON.stringify(sortable);
  };

  return normalize(a) === normalize(b);
}

export function buildLocationDetails(locationInput, geoLocationInput) {
  const location = normalizeLocationString(locationInput);
  const geoLocation = normalizeGeoLocation(geoLocationInput);

  if (!location && !geoLocation) {
    return null;
  }

  const displayName = geoLocation?.label ?? location ?? null;
  const shortName =
    geoLocation?.city ?? geoLocation?.region ?? geoLocation?.country ?? displayName ?? null;
  const hasLatitude = Number.isFinite(geoLocation?.latitude);
  const hasLongitude = Number.isFinite(geoLocation?.longitude);
  const coordinates = hasLatitude && hasLongitude
    ? { latitude: geoLocation.latitude, longitude: geoLocation.longitude }
    : null;

  return {
    location: location ?? null,
    geoLocation: geoLocation ?? null,
    displayName,
    shortName,
    timezone: geoLocation?.timezone ?? null,
    city: geoLocation?.city ?? null,
    region: geoLocation?.region ?? null,
    country: geoLocation?.country ?? null,
    postalCode: geoLocation?.postalCode ?? null,
    coordinates,
  };
}
