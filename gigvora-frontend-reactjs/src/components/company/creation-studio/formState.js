import { CREATION_STUDIO_TYPES } from '../../../constants/creationStudio.js';

export function toInputDateTime(value) {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const iso = date.toISOString();
  return iso.slice(0, 16);
}

export function parseDateInput(value) {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
}

export function parseNumberInput(value, { integer = false } = {}) {
  if (value == null || value === '') {
    return undefined;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return undefined;
  }
  return integer ? Math.round(numeric) : Number(numeric.toFixed(2));
}

export function normaliseTagsInput(tagsText) {
  if (!tagsText) {
    return [];
  }
  return tagsText
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, 12);
}

function baseSettings() {
  return {
    templateStyle: 'modern',
    persona: '',
    portfolioLinks: '',
    tone: 'professional',
    targetRole: '',
    storyHighlights: '',
    callToAction: '',
    employmentType: '',
    seniority: '',
    hiringManager: '',
    deliverables: '',
    mentorLead: '',
    mentorPods: '',
    skills: '',
    sessionFormat: 'virtual',
    meetingUrl: '',
    capacity: '',
    rotationMinutes: '',
    joinPolicy: 'request',
    onboardingQuestion: '',
    slug: '',
    primaryCta: '',
    heroColor: '',
    campaignBudget: '',
    campaignAudience: '',
    campaignDuration: '',
    objective: '',
    seoTitle: '',
    seoDescription: '',
    sessionLengthMinutes: '',
    rate: '',
    deliveryFormat: 'virtual',
    cadence: '',
    mentorshipNotes: '',
  };
}

export function buildInitialState(type) {
  const defaultType = CREATION_STUDIO_TYPES.find((entry) => entry.id === type)?.id ?? CREATION_STUDIO_TYPES[0]?.id ?? 'job';
  const baseState = {
    type: defaultType,
    title: '',
    headline: '',
    summary: '',
    content: '',
    category: '',
    location: '',
    targetAudience: '',
    launchDate: '',
    publishAt: '',
    endDate: '',
    imageUrl: '',
    status: 'draft',
    visibility: 'workspace',
    tagsText: '',
    budgetAmount: '',
    budgetCurrency: 'USD',
    compensationMin: '',
    compensationMax: '',
    compensationCurrency: 'USD',
    durationWeeks: '',
    commitmentHours: '',
    remoteEligible: true,
    settings: baseSettings(),
  };
  const typeDefaults = {
    cv: {
      visibility: 'private',
      settings: { templateStyle: 'modern', tone: 'professional', portfolioLinks: '', persona: '' },
    },
    cover_letter: {
      visibility: 'private',
      settings: { tone: 'enthusiastic', targetRole: '', callToAction: '', storyHighlights: '' },
    },
    mentorship_offering: {
      visibility: 'workspace',
      commitmentHours: '2',
      settings: { deliveryFormat: 'virtual', sessionLengthMinutes: '60', cadence: '', mentorshipNotes: '', rate: '' },
    },
  };

  const overrides = typeDefaults[defaultType] ?? {};
  const mergedSettings = { ...baseState.settings, ...(overrides.settings ?? {}) };
  return {
    ...baseState,
    ...overrides,
    settings: mergedSettings,
  };
}

export function buildSettingsPayload(type, state) {
  const settings = state.settings ?? {};
  switch (type) {
    case 'cv':
      return {
        templateStyle: settings.templateStyle || 'modern',
        persona: settings.persona || undefined,
        tone: settings.tone || undefined,
        portfolioLinks: parseMultilineList(settings.portfolioLinks),
      };
    case 'cover_letter':
      return {
        targetRole: settings.targetRole || undefined,
        tone: settings.tone || undefined,
        storyHighlights: parseMultilineList(settings.storyHighlights),
        callToAction: settings.callToAction || undefined,
      };
    case 'job':
      return {
        employmentType: settings.employmentType || undefined,
        seniority: settings.seniority || undefined,
        hiringManager: settings.hiringManager || undefined,
      };
    case 'project':
      return {
        deliverables: settings.deliverables || undefined,
        mentorLead: settings.mentorLead || undefined,
        skills: settings.skills || undefined,
      };
    case 'gig':
      return {
        deliverables: settings.deliverables || undefined,
        serviceTier: settings.seniority || undefined,
      };
    case 'launchpad_job':
      return {
        mentorLead: settings.mentorLead || undefined,
        mentorPods: settings.mentorPods || undefined,
        readinessNotes: settings.skills || undefined,
      };
    case 'launchpad_project':
      return {
        mentorLead: settings.mentorLead || undefined,
        mentorPods: settings.mentorPods || undefined,
        skills: settings.skills || undefined,
      };
    case 'volunteer_opportunity':
      return {
        skills: settings.skills || undefined,
        impactStatement: settings.deliverables || undefined,
      };
    case 'mentorship_offering':
      return {
        deliveryFormat: settings.deliveryFormat || 'virtual',
        sessionLengthMinutes: parseNumberInput(settings.sessionLengthMinutes, { integer: true }),
        rate: parseNumberInput(settings.rate),
        cadence: settings.cadence || undefined,
        mentorshipNotes: settings.mentorshipNotes || undefined,
      };
    case 'networking_session':
      return {
        sessionFormat: settings.sessionFormat || undefined,
        meetingUrl: settings.meetingUrl || undefined,
        capacity: parseNumberInput(settings.capacity, { integer: true }),
        rotationMinutes: parseNumberInput(settings.rotationMinutes, { integer: true }),
      };
    case 'blog_post':
      return {
        seoTitle: settings.seoTitle || undefined,
        seoDescription: settings.seoDescription || undefined,
      };
    case 'group':
      return {
        joinPolicy: settings.joinPolicy || undefined,
        onboardingQuestion: settings.onboardingQuestion || undefined,
      };
    case 'page':
      return {
        slug: settings.slug || undefined,
        primaryCta: settings.primaryCta || undefined,
        heroColor: settings.heroColor || undefined,
      };
    case 'ad':
      return {
        campaignBudget: settings.campaignBudget || undefined,
        campaignAudience: settings.campaignAudience || undefined,
        campaignDuration: settings.campaignDuration || undefined,
        objective: settings.objective || undefined,
      };
    default:
      return {};
  }
}

export function mergeItemToState(item, fallbackType) {
  if (!item) {
    return buildInitialState(fallbackType);
  }
  const state = buildInitialState(item.type ?? fallbackType);
  state.type = item.type ?? fallbackType;
  state.title = item.title ?? '';
  state.headline = item.headline ?? '';
  state.summary = item.summary ?? '';
  state.content = item.content ?? '';
  state.category = item.category ?? '';
  state.location = item.location ?? '';
  state.targetAudience = item.targetAudience ?? '';
  state.launchDate = toInputDateTime(item.launchDate);
  state.publishAt = toInputDateTime(item.publishAt);
  state.endDate = toInputDateTime(item.endDate);
  state.imageUrl = item.imageUrl ?? '';
  state.status = item.status ?? 'draft';
  state.visibility = item.visibility ?? 'workspace';
  state.tagsText = Array.isArray(item.tags) ? item.tags.join(', ') : '';
  state.budgetAmount = item.budgetAmount != null ? String(item.budgetAmount) : '';
  state.budgetCurrency = item.budgetCurrency || 'USD';
  state.compensationMin = item.compensationMin != null ? String(item.compensationMin) : '';
  state.compensationMax = item.compensationMax != null ? String(item.compensationMax) : '';
  state.compensationCurrency = item.compensationCurrency || 'USD';
  state.durationWeeks = item.durationWeeks != null ? String(item.durationWeeks) : '';
  state.commitmentHours = item.commitmentHours != null ? String(item.commitmentHours) : '';
  state.remoteEligible = item.remoteEligible ?? true;
  state.settings = {
    ...state.settings,
    ...(item.settings ?? {}),
  };
  if (Array.isArray(item.settings?.portfolioLinks)) {
    state.settings.portfolioLinks = item.settings.portfolioLinks.join('\n');
  }
  if (Array.isArray(item.settings?.storyHighlights)) {
    state.settings.storyHighlights = item.settings.storyHighlights.join('\n');
  }
  if (item.settings?.sessionLengthMinutes != null) {
    state.settings.sessionLengthMinutes = String(item.settings.sessionLengthMinutes);
  }
  if (item.settings?.rate != null) {
    state.settings.rate = String(item.settings.rate);
  }
  return state;
}

function parseMultilineList(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  return String(value)
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export default {
  buildInitialState,
  mergeItemToState,
  buildSettingsPayload,
  normaliseTagsInput,
  parseNumberInput,
  parseDateInput,
  toInputDateTime,
};
