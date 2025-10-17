function toDateInput(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
}

function uniqueStrings(values = []) {
  const result = [];
  const seen = new Set();
  values.forEach((value) => {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (!trimmed) {
      return;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    result.push(trimmed);
  });
  return result;
}

function trimmedOrNull(value) {
  if (value == null) {
    return null;
  }
  const trimmed = `${value}`.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidHttpUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

function isValidEmail(value) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  if (!value) return true;
  return /^[+0-9()\-\s]{6,}$/.test(value);
}

function toIsoDate(value) {
  if (!value) {
    return null;
  }
  const trimmed = `${value}`.trim();
  if (!trimmed) {
    return null;
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

export function buildProfileDraft(profile) {
  if (!profile) {
    return {
      headline: '',
      bio: '',
      missionStatement: '',
      education: '',
      location: '',
      timezone: '',
      avatarSeed: '',
      skills: [],
      areasOfFocus: [],
      preferredEngagements: [],
      statusFlags: [],
      volunteerBadges: [],
      experience: [],
      qualifications: [],
      portfolioLinks: [],
      references: [],
      collaborationRoster: [],
      impactHighlights: [],
      pipelineInsights: [],
    };
  }

  return {
    headline: profile.headline ?? '',
    bio: profile.bio ?? '',
    missionStatement: profile.missionStatement ?? '',
    education: profile.education ?? '',
    location: profile.location ?? '',
    timezone: profile.timezone ?? profile.availability?.timezone ?? '',
    avatarSeed: profile.avatarSeed ?? '',
    skills: Array.isArray(profile.skills) ? [...profile.skills] : [],
    areasOfFocus: Array.isArray(profile.areasOfFocus) ? [...profile.areasOfFocus] : [],
    preferredEngagements: Array.isArray(profile.preferredEngagements) ? [...profile.preferredEngagements] : [],
    statusFlags: Array.isArray(profile.statusFlags) ? [...profile.statusFlags] : [],
    volunteerBadges: Array.isArray(profile.volunteerBadges) ? [...profile.volunteerBadges] : [],
    experience: Array.isArray(profile.experience)
      ? profile.experience.map((entry) => ({
          organization: entry.organization ?? '',
          role: entry.role ?? '',
          startDate: toDateInput(entry.startDate),
          endDate: toDateInput(entry.endDate),
          description: entry.description ?? '',
          highlights: Array.isArray(entry.highlights) ? [...entry.highlights] : [],
        }))
      : [],
    qualifications: Array.isArray(profile.qualifications)
      ? profile.qualifications.map((item) => ({
          title: item.title ?? '',
          authority: item.authority ?? '',
          year: item.year ?? '',
          credentialId: item.credentialId ?? '',
          credentialUrl: item.credentialUrl ?? '',
          description: item.description ?? '',
        }))
      : [],
    portfolioLinks: Array.isArray(profile.portfolioLinks)
      ? profile.portfolioLinks.map((link) => ({
          label: link.label ?? '',
          url: link.url ?? '',
          description: link.description ?? '',
        }))
      : [],
    references: Array.isArray(profile.references)
      ? profile.references.map((reference) => ({
          id: reference.id ?? null,
          name: reference.name ?? '',
          relationship: reference.relationship ?? '',
          company: reference.company ?? '',
          email: reference.email ?? '',
          phone: reference.phone ?? '',
          endorsement: reference.endorsement ?? '',
          isVerified: Boolean(reference.verified),
          weight: reference.weight ?? '',
          lastInteractedAt: toDateInput(reference.lastInteractedAt),
        }))
      : [],
    collaborationRoster: Array.isArray(profile.collaborationRoster)
      ? profile.collaborationRoster.map((collaborator) => ({
          name: collaborator.name ?? '',
          role: collaborator.role ?? '',
          avatarSeed: collaborator.avatarSeed ?? '',
          contact: collaborator.contact ?? '',
        }))
      : [],
    impactHighlights: Array.isArray(profile.impactHighlights)
      ? profile.impactHighlights.map((highlight) => ({
          title: highlight.title ?? '',
          value: highlight.value ?? '',
          description: highlight.description ?? '',
        }))
      : [],
    pipelineInsights: Array.isArray(profile.pipelineInsights)
      ? profile.pipelineInsights.map((insight) => ({
          project: insight.project ?? '',
          payout: insight.payout ?? '',
          status: insight.status ?? '',
          countdown: insight.countdown ?? '',
        }))
      : [],
  };
}

export function normalizeProfileDraft(draft) {
  const errors = [];

  const skills = uniqueStrings(draft.skills);
  const preferredEngagements = uniqueStrings(draft.preferredEngagements);
  const statusFlags = uniqueStrings(draft.statusFlags);
  const volunteerBadges = uniqueStrings(draft.volunteerBadges);
  const areasOfFocus = uniqueStrings(draft.areasOfFocus);

  const experienceEntries = (draft.experience ?? [])
    .map((entry, index) => {
      const organization = trimmedOrNull(entry.organization);
      const role = trimmedOrNull(entry.role);
      const description = trimmedOrNull(entry.description);
      const startDate = entry.startDate ? `${entry.startDate}` : null;
      const endDate = entry.endDate ? `${entry.endDate}` : null;
      const highlights = uniqueStrings(entry.highlights ?? []);

      if (!organization && !role && !description && highlights.length === 0) {
        return null;
      }

      if (startDate && Number.isNaN(new Date(startDate).getTime())) {
        errors.push(`Experience #${index + 1} has an invalid start date.`);
      }
      if (endDate && Number.isNaN(new Date(endDate).getTime())) {
        errors.push(`Experience #${index + 1} has an invalid end date.`);
      }

      return {
        organization,
        role,
        description,
        startDate: startDate || null,
        endDate: endDate || null,
        highlights,
      };
    })
    .filter(Boolean);

  const qualifications = (draft.qualifications ?? [])
    .map((item) => {
      const title = trimmedOrNull(item.title);
      const authority = trimmedOrNull(item.authority);
      const year = trimmedOrNull(item.year);
      const credentialId = trimmedOrNull(item.credentialId);
      const credentialUrl = trimmedOrNull(item.credentialUrl);
      const description = trimmedOrNull(item.description);

      if (!title && !authority && !credentialId && !credentialUrl && !description && !year) {
        return null;
      }

      if (credentialUrl && !isValidHttpUrl(credentialUrl)) {
        errors.push(`Credential link for ${title || authority || 'a qualification'} must be a valid URL.`);
      }

      return { title, authority, year, credentialId, credentialUrl, description };
    })
    .filter(Boolean);

  const portfolioLinks = (draft.portfolioLinks ?? [])
    .map((link, index) => {
      const label = trimmedOrNull(link.label);
      const url = trimmedOrNull(link.url);
      const description = trimmedOrNull(link.description);
      if (!label && !url && !description) {
        return null;
      }
      if (url && !isValidHttpUrl(url)) {
        errors.push(`Portfolio link #${index + 1} must include a valid URL (http or https).`);
      }
      return { label, url, description };
    })
    .filter(Boolean);

  const references = (draft.references ?? [])
    .map((reference, index) => {
      const name = trimmedOrNull(reference.name);
      const relationship = trimmedOrNull(reference.relationship);
      const company = trimmedOrNull(reference.company);
      const email = trimmedOrNull(reference.email);
      const phone = trimmedOrNull(reference.phone);
      const endorsement = trimmedOrNull(reference.endorsement);
      const weight = reference.weight === '' || reference.weight == null ? null : Number(reference.weight);
      const lastInteractedAt = toIsoDate(reference.lastInteractedAt);
      const id = reference.id != null && reference.id !== '' ? Number(reference.id) : null;

      if (!name && !relationship && !company && !email && !phone && !endorsement) {
        return null;
      }
      if (!name) {
        errors.push(`Reference #${index + 1} requires a name.`);
        return null;
      }
      if (email && !isValidEmail(email)) {
        errors.push(`Reference ${name} has an invalid email address.`);
      }
      if (phone && !isValidPhone(phone)) {
        errors.push(`Reference ${name} has an invalid phone number.`);
      }
      if (weight != null && (!Number.isFinite(weight) || weight < 0 || weight > 1)) {
        errors.push(`Reference ${name} must have a weight between 0 and 1.`);
      }
      if (reference.lastInteractedAt && !lastInteractedAt) {
        errors.push(`Reference ${name} has an invalid interaction date.`);
      }

      return {
        id: id && Number.isFinite(id) ? id : undefined,
        name,
        relationship,
        company,
        email,
        phone,
        endorsement,
        isVerified: Boolean(reference.isVerified),
        weight: weight == null ? null : Number(weight.toFixed(2)),
        lastInteractedAt,
      };
    })
    .filter(Boolean);

  const collaborationRoster = (draft.collaborationRoster ?? [])
    .map((member) => {
      const name = trimmedOrNull(member.name);
      const role = trimmedOrNull(member.role);
      const avatarSeed = trimmedOrNull(member.avatarSeed);
      const contact = trimmedOrNull(member.contact);
      if (!name && !role && !avatarSeed && !contact) {
        return null;
      }
      if (!name) {
        errors.push('Collaboration roster entries must include a name.');
        return null;
      }
      return { name, role, avatarSeed, contact };
    })
    .filter(Boolean);

  const impactHighlights = (draft.impactHighlights ?? [])
    .map((highlight) => {
      const title = trimmedOrNull(highlight.title);
      const value = trimmedOrNull(highlight.value);
      const description = trimmedOrNull(highlight.description);
      if (!title && !value && !description) {
        return null;
      }
      if (!title && !value) {
        errors.push('Impact highlights must include a title or a metric value.');
        return null;
      }
      return { title, value, description };
    })
    .filter(Boolean);

  const pipelineInsights = (draft.pipelineInsights ?? [])
    .map((insight) => {
      const project = trimmedOrNull(insight.project);
      const payout = trimmedOrNull(insight.payout);
      const status = trimmedOrNull(insight.status);
      const countdown = trimmedOrNull(insight.countdown);
      if (!project && !payout && !status && !countdown) {
        return null;
      }
      if (!project && !payout) {
        errors.push('Pipeline insights require at least a project or payout value.');
        return null;
      }
      return { project, payout, status, countdown };
    })
    .filter(Boolean);

  const payload = {
    headline: trimmedOrNull(draft.headline),
    bio: trimmedOrNull(draft.bio),
    missionStatement: trimmedOrNull(draft.missionStatement),
    education: trimmedOrNull(draft.education),
    location: trimmedOrNull(draft.location),
    timezone: trimmedOrNull(draft.timezone),
    avatarSeed: trimmedOrNull(draft.avatarSeed),
    skills,
    areasOfFocus,
    preferredEngagements,
    statusFlags,
    volunteerBadges,
    experienceEntries,
    qualifications,
    portfolioLinks,
    references,
    collaborationRoster,
    impactHighlights,
    pipelineInsights,
  };

  return { payload, errors };
}

export function profileDraftToAvailability({ availability } = {}) {
  return {
    status: availability?.status ?? 'limited',
    hoursPerWeek: availability?.hoursPerWeek ?? '',
    openToRemote: availability?.openToRemote ?? true,
    notes: availability?.notes ?? '',
    timezone: availability?.timezone ?? '',
    focusAreas: Array.isArray(availability?.focusAreas) ? [...availability.focusAreas] : [],
  };
}

export function buildIdentityDraft(profile) {
  return {
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
    email: profile?.email ?? '',
    location: profile?.userLocation ?? profile?.location ?? '',
    timezone: profile?.timezone ?? profile?.availability?.timezone ?? '',
  };
}

export function buildAvailabilityDraft(profile) {
  const availability = profile?.availability ?? {};
  return {
    status: availability.status ?? 'limited',
    hoursPerWeek: availability.hoursPerWeek ?? '',
    openToRemote: availability.openToRemote ?? true,
    notes: availability.notes ?? '',
    timezone: availability.timezone ?? profile?.timezone ?? '',
  };
}

export function buildAvailabilityPayload(availabilityDraft, draftPayload) {
  const payload = {};
  if (availabilityDraft.status) {
    payload.availabilityStatus = availabilityDraft.status;
  }
  if (availabilityDraft.hoursPerWeek !== '' && availabilityDraft.hoursPerWeek != null) {
    payload.availableHoursPerWeek = Number(availabilityDraft.hoursPerWeek);
  }
  payload.openToRemote = Boolean(availabilityDraft.openToRemote);
  payload.availabilityNotes = availabilityDraft.notes ?? null;
  if (availabilityDraft.timezone) {
    payload.timezone = availabilityDraft.timezone;
  }
  if (Array.isArray(draftPayload?.areasOfFocus)) {
    payload.areasOfFocus = draftPayload.areasOfFocus;
  }
  if (Array.isArray(draftPayload?.preferredEngagements)) {
    payload.preferredEngagements = draftPayload.preferredEngagements;
  }
  return payload;
}

export function validateIdentityDraft(draft) {
  const errors = [];
  if (!draft.firstName || !draft.firstName.trim()) {
    errors.push('First name is required.');
  }
  if (!draft.lastName || !draft.lastName.trim()) {
    errors.push('Last name is required.');
  }
  if (!draft.email || !draft.email.trim()) {
    errors.push('Email address is required.');
  }
  if (draft.email && !isValidEmail(draft.email)) {
    errors.push('Enter a valid email address.');
  }
  return errors;
}

export default {
  buildProfileDraft,
  normalizeProfileDraft,
  buildAvailabilityDraft,
  buildAvailabilityPayload,
  buildIdentityDraft,
  validateIdentityDraft,
};
