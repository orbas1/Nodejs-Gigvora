function normaliseNumber(value, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, allowEmpty = false } = {}) {
  if (value == null || value === '') {
    return allowEmpty ? null : undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  if (parsed < min || parsed > max) {
    return undefined;
  }
  return parsed;
}

export function validateMetricsDraft(draft) {
  const errors = {};
  const payload = {};

  const followerCount = normaliseNumber(draft.followerCount, { min: 0, max: 10_000_000 });
  if (followerCount === undefined) {
    errors['metrics.followerCount'] = 'Followers must be a whole number between 0 and 10,000,000.';
  } else {
    payload.followerCount = followerCount ?? 0;
  }

  const followerGoal = normaliseNumber(draft.followerGoal, { min: 0, max: 10_000_000, allowEmpty: true });
  if (followerGoal === undefined) {
    errors['metrics.followerGoal'] = 'Follower goal must be a whole number.';
  } else if (followerGoal != null) {
    payload.followerGoal = followerGoal;
  }

  const trustScore = normaliseNumber(draft.trustScore, { min: 0, max: 100, allowEmpty: true });
  if (trustScore === undefined) {
    errors['metrics.trustScore'] = 'Trust score must be between 0 and 100.';
  } else if (trustScore != null) {
    payload.trustScore = trustScore;
  }

  const trustScoreChange = normaliseNumber(draft.trustScoreChange, { min: -100, max: 100, allowEmpty: true });
  if (trustScoreChange === undefined) {
    errors['metrics.trustScoreChange'] = 'Change must be between -100 and 100.';
  } else if (trustScoreChange != null) {
    payload.trustScoreChange = trustScoreChange;
  }

  const rating = normaliseNumber(draft.rating, { min: 0, max: 5, allowEmpty: true });
  if (rating === undefined) {
    errors['metrics.rating'] = 'Rating must be between 0 and 5.';
  } else if (rating != null) {
    payload.rating = rating;
  }

  const ratingCount = normaliseNumber(draft.ratingCount, { min: 0, max: 1_000_000, allowEmpty: true });
  if (ratingCount === undefined) {
    errors['metrics.ratingCount'] = 'Rating count must be a whole number.';
  } else if (ratingCount != null) {
    payload.ratingCount = ratingCount;
  }

  return { errors, payload };
}

export function validateWeatherDraft(draft) {
  const errors = {};
  const payload = {};

  if (draft.locationName?.trim()) {
    payload.locationName = draft.locationName.trim();
  } else {
    errors['weather.locationName'] = 'Location name required.';
  }

  const latitudeInput = draft.latitude?.toString().trim() ?? '';
  const longitudeInput = draft.longitude?.toString().trim() ?? '';
  const hasLatitude = latitudeInput !== '';
  const hasLongitude = longitudeInput !== '';

  if (hasLatitude !== hasLongitude) {
    const message = 'Latitude and longitude must both be provided.';
    errors['weather.latitude'] = message;
    errors['weather.longitude'] = message;
  } else if (hasLatitude && hasLongitude) {
    const latitude = normaliseNumber(latitudeInput, { min: -90, max: 90 });
    if (latitude === undefined) {
      errors['weather.latitude'] = 'Latitude must be between -90 and 90.';
    } else {
      payload.latitude = latitude;
    }

    const longitude = normaliseNumber(longitudeInput, { min: -180, max: 180 });
    if (longitude === undefined) {
      errors['weather.longitude'] = 'Longitude must be between -180 and 180.';
    } else {
      payload.longitude = longitude;
    }
  } else {
    payload.latitude = null;
    payload.longitude = null;
  }

  payload.units = draft.units === 'imperial' ? 'imperial' : 'metric';

  return { errors, payload };
}

export function validateRelationshipDraft(draft) {
  const errors = {};
  const payload = {};

  const retentionScore = normaliseNumber(draft.retentionScore, { min: 0, max: 100, allowEmpty: true });
  if (retentionScore === undefined) {
    errors['relationship.retentionScore'] = 'Retention must be between 0 and 100.';
  } else if (retentionScore != null) {
    payload.retentionScore = retentionScore;
  }

  const advocacyInProgress = normaliseNumber(draft.advocacyInProgress, { min: 0, max: 1000, allowEmpty: true });
  if (advocacyInProgress === undefined) {
    errors['relationship.advocacyInProgress'] = 'Advocacy count must be a whole number.';
  } else if (advocacyInProgress != null) {
    payload.advocacyInProgress = advocacyInProgress;
  }

  if (draft.retentionStatus?.trim()) {
    payload.retentionStatus = draft.retentionStatus.trim();
  }
  if (draft.retentionNotes?.trim()) {
    payload.retentionNotes = draft.retentionNotes.trim();
  }
  if (draft.advocacyNotes?.trim()) {
    payload.advocacyNotes = draft.advocacyNotes.trim();
  }

  return { errors, payload };
}

export function validateHighlightDraft(draft) {
  const errors = {};
  const payload = {
    title: draft.title?.trim() ?? '',
    summary: draft.summary?.trim() ?? '',
    type: draft.type ?? 'update',
    mediaUrl: draft.mediaUrl?.trim() ?? '',
    ctaLabel: draft.ctaLabel?.trim() ?? '',
    ctaUrl: draft.ctaUrl?.trim() ?? '',
    publishedAt: draft.publishedAt ?? null,
  };

  if (!payload.title) {
    errors['highlight.title'] = 'Title is required.';
  }
  if (!payload.summary) {
    errors['highlight.summary'] = 'Summary is required.';
  }

  if (payload.type === 'video' && !payload.mediaUrl) {
    errors['highlight.mediaUrl'] = 'Video highlights require a media URL.';
  }

  if (payload.mediaUrl && !/^https?:\/\//i.test(payload.mediaUrl)) {
    errors['highlight.mediaUrl'] = 'Media URL must be valid.';
  }

  if (payload.ctaUrl && !/^https?:\/\//i.test(payload.ctaUrl)) {
    errors['highlight.ctaUrl'] = 'CTA URL must be valid.';
  }

  if (payload.publishedAt) {
    const parsedDate = new Date(payload.publishedAt);
    if (Number.isNaN(parsedDate.getTime())) {
      errors['highlight.publishedAt'] = 'Publish timestamp must be valid.';
    } else {
      payload.publishedAt = parsedDate.toISOString();
    }
  } else {
    payload.publishedAt = null;
  }

  if (!payload.mediaUrl) {
    payload.mediaUrl = null;
  }

  if (!payload.ctaLabel) {
    payload.ctaLabel = null;
  }

  if (!payload.ctaUrl) {
    payload.ctaUrl = null;
  }

  return { errors, payload };
}

export default {
  validateMetricsDraft,
  validateWeatherDraft,
  validateRelationshipDraft,
  validateHighlightDraft,
};
