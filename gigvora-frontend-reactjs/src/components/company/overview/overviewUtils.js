export const WEATHER_ICON_MAP = {
  sun: '☀️',
  'cloud-sun': '⛅️',
  cloud: '☁️',
  rain: '🌧️',
  snow: '❄️',
  storm: '⛈️',
  drizzle: '🌦️',
  fog: '🌫️',
  wind: '🌬️',
  na: 'ℹ️',
};

export function getWeatherIcon(iconKey) {
  if (!iconKey) {
    return WEATHER_ICON_MAP.na;
  }
  return WEATHER_ICON_MAP[iconKey] ?? WEATHER_ICON_MAP.na;
}

export function formatTemperature(weather) {
  if (!weather || weather.temperature == null) {
    return '—';
  }
  const unit = weather.temperatureUnit ?? '°C';
  return `${Math.round(Number(weather.temperature))}${unit}`;
}

export function formatWind(weather) {
  if (!weather || weather.windSpeed == null) {
    return null;
  }
  const unit = weather.windSpeedUnit ?? 'km/h';
  return `${Math.round(Number(weather.windSpeed))}${unit}`;
}

export function formatHumidity(weather) {
  if (!weather || weather.humidity == null) {
    return null;
  }
  return `${Math.round(Number(weather.humidity))}%`;
}

export function deriveGreeting(overview, profile, workspace) {
  const custom = overview?.preferences?.customGreeting?.trim();
  if (custom) {
    return custom;
  }
  const greetingName = overview?.greetingName ?? overview?.displayName;
  if (greetingName) {
    return `Hi ${greetingName}`;
  }
  if (profile?.companyName) {
    return `Hi ${profile.companyName}`;
  }
  const ownerName = [workspace?.owner?.firstName, workspace?.owner?.lastName].filter(Boolean).join(' ');
  if (ownerName) {
    return `Hi ${ownerName}`;
  }
  return 'Hello';
}

export function deriveLocationLabel(overview, profile) {
  if (overview?.location?.displayName) {
    return overview.location.displayName;
  }
  if (overview?.preferences?.locationOverride?.label) {
    return overview.preferences.locationOverride.label;
  }
  if (profile?.locationDetails?.displayName) {
    return profile.locationDetails.displayName;
  }
  return null;
}

export function deriveTimezone(overview) {
  return (
    overview?.preferences?.locationOverride?.timezone ??
    overview?.location?.timezone ??
    overview?.date?.timezone ??
    null
  );
}

export function formatFollowers(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  if (numeric >= 1000) {
    const rounded = numeric / 1000;
    const display = rounded >= 10 ? Math.round(rounded) : rounded.toFixed(1);
    return `${display}K`;
  }
  return numeric.toLocaleString();
}

export function formatTrustScore(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  const numeric = Math.max(0, Math.min(100, Number(value)));
  return numeric % 1 === 0 ? `${numeric}` : numeric.toFixed(1);
}

export function formatRating(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  const numeric = Math.max(0, Math.min(5, Number(value)));
  return `${numeric.toFixed(1)}★`;
}

export function formatLastUpdated(overview) {
  if (!overview?.updatedAt) {
    return 'Not saved yet';
  }
  try {
    const date = new Date(overview.updatedAt);
    return date.toLocaleString();
  } catch (error) {
    return 'Not saved yet';
  }
}

export function formatEditor(overview) {
  if (!overview?.lastEditedBy) {
    return 'System';
  }
  const editor = overview.lastEditedBy;
  const fullName = [editor.firstName, editor.lastName].filter(Boolean).join(' ').trim();
  return fullName || editor.email || 'System';
}

export function buildFormState(overview) {
  const preferences = overview?.preferences ?? {};
  const locationOverride = preferences.locationOverride ?? {};

  return {
    displayName: overview?.displayName ?? '',
    note: overview?.summary ?? '',
    avatarUrl: overview?.avatarUrl ?? '',
    greeting: preferences.customGreeting ?? '',
    followerCount:
      overview?.followerCount != null && !Number.isNaN(Number(overview.followerCount))
        ? `${overview.followerCount}`
        : '',
    trustScore:
      overview?.trustScore != null && !Number.isNaN(Number(overview.trustScore))
        ? `${Number(overview.trustScore)}`
        : '',
    rating:
      overview?.rating != null && !Number.isNaN(Number(overview.rating))
        ? `${Number(overview.rating)}`
        : '',
    locationLabel: locationOverride.label ?? overview?.location?.displayName ?? '',
    timezone: locationOverride.timezone ?? overview?.date?.timezone ?? '',
    latitude:
      locationOverride.coordinates?.latitude != null
        ? `${locationOverride.coordinates.latitude}`
        : '',
    longitude:
      locationOverride.coordinates?.longitude != null
        ? `${locationOverride.coordinates.longitude}`
        : '',
  };
}

function toNumber(value) {
  if (value == null || (typeof value === 'string' && value.trim() === '')) {
    return undefined;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

export function buildPayload(formState, overview, workspace) {
  const workspaceId = overview?.workspaceId ?? workspace?.id;
  if (!workspaceId) {
    throw new Error('Workspace is required.');
  }

  const payload = { workspaceId };

  payload.displayName = formState.displayName?.trim();
  payload.summary = formState.note?.trim();
  payload.avatarUrl = formState.avatarUrl?.trim();

  const followerNumeric = toNumber(formState.followerCount);
  if (followerNumeric !== undefined) {
    payload.followerCount = Math.max(0, Math.round(followerNumeric));
  }

  const trustNumeric = toNumber(formState.trustScore);
  if (trustNumeric !== undefined) {
    payload.trustScore = Math.max(0, Math.min(100, trustNumeric));
  } else {
    payload.trustScore = null;
  }

  const ratingNumeric = toNumber(formState.rating);
  if (ratingNumeric !== undefined) {
    payload.rating = Math.max(0, Math.min(5, ratingNumeric));
  } else {
    payload.rating = null;
  }

  const preferences = {};
  if (formState.greeting?.trim()) {
    preferences.customGreeting = formState.greeting.trim();
  }

  const hasCoordinates = formState.latitude !== '' && formState.longitude !== '';
  const hasLocationMeta =
    formState.locationLabel?.trim() || formState.timezone?.trim() || hasCoordinates;

  if (hasLocationMeta) {
    const locationOverride = {};
    if (formState.locationLabel?.trim()) {
      locationOverride.label = formState.locationLabel.trim();
      locationOverride.location = formState.locationLabel.trim();
    }
    if (formState.timezone?.trim()) {
      locationOverride.timezone = formState.timezone.trim();
    }
    if (hasCoordinates) {
      const latitude = toNumber(formState.latitude);
      const longitude = toNumber(formState.longitude);
      if (latitude !== undefined && longitude !== undefined) {
        locationOverride.coordinates = { latitude, longitude };
        locationOverride.geoLocation = {
          latitude,
          longitude,
          label: locationOverride.label,
          timezone: locationOverride.timezone,
        };
      }
    }
    preferences.locationOverride = locationOverride;
  }

  if (Object.keys(preferences).length > 0) {
    payload.preferences = preferences;
  }

  return payload;
}
