import { Op } from 'sequelize';

import {
  User,
  UserEvent,
  UserEventAgendaItem,
  UserEventAsset,
  UserEventGuest,
  VolunteerAssignment,
  VolunteerProgram,
  VolunteerShift,
  Volunteering,
} from '../models/index.js';
import { UserEventWorkspaceSetting } from '../models/eventManagement.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const UPCOMING_EVENT_STATUSES = ['planned', 'registration_open', 'in_progress'];
const PAST_EVENT_WINDOW_DAYS = 14;
const DEFAULT_EVENT_LIMIT = 40;
const RECOMMENDED_EVENT_LIMIT = 6;
const DEFAULT_VOLUNTEER_LIMIT = 40;
const CACHE_TTL_SECONDS = 45;

function normaliseLimit(value, fallback) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new ValidationError('limit must be a positive integer.');
  }
  return Math.min(numeric, 200);
}

function normaliseIdentifier(value, label = 'id') {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return numeric;
}

function toArray(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
}

function cleanStringArray(values) {
  return toArray(values)
    .map((value) => (typeof value === 'string' ? value.trim() : null))
    .filter(Boolean);
}

function deriveLocationCategory(event, metadata = {}) {
  if (metadata.locationCategory) {
    return metadata.locationCategory;
  }
  const format = (metadata.format || event.format || '').toString().toLowerCase();
  if (format.includes('hybrid')) {
    return 'hybrid';
  }
  if (format.includes('virtual') || format.includes('online')) {
    return 'virtual';
  }
  const label = (event.locationLabel || event.locationAddress || '').toString().toLowerCase();
  if (label.includes('virtual') || label.includes('online')) {
    return 'virtual';
  }
  if (label.includes('hybrid')) {
    return 'hybrid';
  }
  if (!label || label === 'tba') {
    return 'unspecified';
  }
  return 'in_person';
}

function mapAgendaItems(agendaItems = []) {
  return agendaItems
    .map((item) => {
      const plain = item?.toPublicObject?.() ?? item?.get?.({ plain: true }) ?? item;
      if (!plain) {
        return null;
      }
      return {
        id: plain.id,
        title: plain.title,
        description: plain.description ?? null,
        startsAt: plain.startAt ? new Date(plain.startAt) : null,
        endsAt: plain.endAt ? new Date(plain.endAt) : null,
        owner: plain.ownerName ?? plain.ownerEmail ?? null,
      };
    })
    .filter(Boolean);
}

function mapAssets(assets = []) {
  return assets
    .map((asset) => {
      const plain = asset?.toPublicObject?.() ?? asset?.get?.({ plain: true }) ?? asset;
      if (!plain) {
        return null;
      }
      return {
        id: plain.id,
        label: plain.name,
        url: plain.url,
        type: plain.assetType,
        visibility: plain.visibility,
        thumbnailUrl: plain.thumbnailUrl ?? null,
      };
    })
    .filter(Boolean);
}

function countConfirmedGuests(guests = []) {
  return guests.reduce((total, guest) => {
    const plain = guest?.toPublicObject?.() ?? guest?.get?.({ plain: true }) ?? guest;
    if (!plain) {
      return total;
    }
    if (['confirmed', 'checked_in'].includes(plain.status)) {
      return total + (plain.seatsReserved ?? 1);
    }
    return total;
  }, 0);
}

function buildHost(metadata = {}) {
  if (!metadata.host && !metadata.organizer) {
    return null;
  }
  const source = metadata.host ?? metadata.organizer;
  return {
    name: source.name ?? source.fullName ?? null,
    title: source.title ?? null,
    company: source.company ?? metadata.hostCompany ?? null,
    avatarUrl: source.avatarUrl ?? null,
  };
}

function normaliseEventRecord(record, options = {}) {
  if (!record) {
    return null;
  }
  const timezoneFallback = options.timezone ?? record.timezone ?? 'UTC';
  const plain = record.toPublicObject ? record.toPublicObject() : record.get?.({ plain: true }) ?? record;
  const metadata = plain.metadata ?? {};
  const category = metadata.category ?? (metadata.isVolunteer ? 'volunteering' : metadata.thematic ?? 'community');
  const audiences = cleanStringArray(metadata.audiences ?? metadata.targetAudiences);
  const focusAreas = cleanStringArray(metadata.focusAreas ?? metadata.causes);
  const tags = cleanStringArray(metadata.tags);
  const recommendedPeers = Array.isArray(metadata.recommendedPeers) ? metadata.recommendedPeers : [];
  const speakers = Array.isArray(metadata.speakers) ? metadata.speakers : [];
  const resources = Array.isArray(metadata.resources)
    ? metadata.resources.map((resource) => ({
        label: resource.label ?? resource.title ?? 'Resource',
        url: resource.url,
      }))
    : [];
  const recommendedScore = Number.parseFloat(metadata.recommendationScore ?? metadata.engagementScore ?? metadata.score);
  const volunteerInsights = metadata.volunteer ?? {};

  return {
    id: plain.id,
    title: plain.title,
    subtitle: metadata.subtitle ?? metadata.tagline ?? null,
    summary: metadata.summary ?? plain.description ?? '',
    description: plain.description ?? null,
    category,
    tags,
    audiences,
    focusAreas,
    timezone: plain.timezone ?? metadata.timezone ?? timezoneFallback,
    startsAt: plain.startAt ? new Date(plain.startAt) : null,
    endsAt: plain.endAt ? new Date(plain.endAt) : null,
    durationMinutes:
      plain.startAt && plain.endAt ? Math.max(0, (new Date(plain.endAt) - new Date(plain.startAt)) / 60000) : null,
    location: metadata.locationLabel ?? plain.locationLabel ?? plain.locationAddress ?? 'To be announced',
    locationCategory: deriveLocationCategory(plain, metadata),
    format: metadata.format ?? plain.format ?? null,
    capacity: plain.capacity ?? metadata.capacity ?? null,
    attendeesCount:
      metadata.attendeesConfirmed ?? metadata.attendance?.confirmed ?? countConfirmedGuests(record.guests ?? []),
    waitlistCount: metadata.waitlistCount ?? metadata.attendance?.waitlist ?? null,
    isVolunteer: Boolean(metadata.isVolunteer || category === 'volunteering'),
    featured: Boolean(metadata.featured ?? metadata.highlight?.featured ?? metadata.hero?.featured),
    recommended: Boolean(metadata.recommended ?? metadata.highlight?.recommended),
    score: Number.isFinite(recommendedScore) ? recommendedScore : 0,
    volunteerSlots: volunteerInsights.slots ?? metadata.volunteerSlots ?? null,
    volunteerWaitlist: volunteerInsights.waitlist ?? metadata.volunteerWaitlist ?? null,
    volunteerReadiness: volunteerInsights.readiness ?? null,
    coverImageUrl: plain.bannerImageUrl ?? metadata.coverImageUrl ?? null,
    heroVideoUrl: metadata.heroVideoUrl ?? null,
    livestreamUrl: plain.streamingUrl ?? metadata.livestreamUrl ?? null,
    registrationUrl: plain.registrationUrl ?? metadata.registrationUrl ?? null,
    host: buildHost(metadata),
    hostCompany: metadata.hostCompany ?? metadata.organizer?.company ?? null,
    agenda: mapAgendaItems(record.agenda ?? []),
    speakers,
    resources,
    recommendedPeers,
    links: Array.isArray(metadata.links) ? metadata.links : [],
  };
}

function mergeVolunteerIdentity(assignment) {
  if (!assignment) {
    return {};
  }
  const volunteer = assignment.get?.('volunteer') ?? assignment.volunteer;
  const metadata = assignment.metadata ?? {};
  const role = assignment.shift?.role;
  const shift = assignment.shift;
  const program = shift?.program ?? role?.program ?? null;

  const userName = volunteer
    ? `${volunteer.firstName ?? ''} ${volunteer.lastName ?? ''}`.trim() || volunteer.email
    : null;
  const fallbackName = assignment.fullName ?? role?.metadata?.primaryContact ?? 'Volunteer';

  const availability = new Set();
  cleanStringArray(metadata.availability ?? role?.metadata?.availability).forEach((slot) => availability.add(slot));
  if (assignment.status === 'confirmed') {
    availability.add('ready_now');
  }
  if (shift?.shiftDate) {
    const date = new Date(shift.shiftDate);
    if (!Number.isNaN(date.getTime())) {
      const day = date.getUTCDay();
      if (day === 0 || day === 6) {
        availability.add('weekend');
      }
    }
  }

  const missions = Array.isArray(metadata.missions)
    ? metadata.missions
    : role?.metadata?.missions
    ? toArray(role.metadata.missions)
    : [];

  const focusAreas = cleanStringArray(metadata.focusAreas ?? role?.tags ?? role?.metadata?.focusAreas);
  const skills = cleanStringArray(metadata.skills ?? role?.skills);
  const languages = cleanStringArray(metadata.languages ?? role?.metadata?.languages);

  const metrics = metadata.metrics ?? {};
  const roleMetrics = role?.metadata?.metrics ?? {};

  const timezone = metadata.timezone ?? volunteer?.timezone ?? shift?.timezone ?? program?.metadata?.timezone ?? 'UTC';

  const hoursContributed = Number.parseFloat(metrics.hoursContributed ?? roleMetrics.hoursContributed ?? 0) || 0;
  const hoursThisMonth = Number.parseFloat(metrics.hoursThisMonth ?? roleMetrics.hoursThisMonth ?? 0) || 0;
  const score = Number.parseFloat(metadata.engagementScore ?? roleMetrics.engagementScore ?? 0) || 0;

  return {
    id:
      assignment.volunteerId ??
      assignment.email ??
      assignment.id ??
      (assignment.fullName ? assignment.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : null),
    userId: assignment.volunteerId ?? null,
    name: userName ?? fallbackName,
    email: volunteer?.email ?? assignment.email ?? null,
    headline: volunteer?.headline ?? metadata.headline ?? role?.summary ?? null,
    avatarUrl: volunteer?.avatarUrl ?? metadata.avatarUrl ?? null,
    location: metadata.location ?? volunteer?.location ?? program?.location ?? null,
    timezone,
    role: role?.title ?? metadata.role ?? 'Contributor',
    status: metadata.status ?? assignment.status ?? 'active',
    availability: Array.from(availability),
    skills,
    focusAreas,
    languages,
    missionsCompleted: Number.parseInt(metrics.missionsCompleted ?? roleMetrics.missionsCompleted ?? 0, 10) || 0,
    hoursContributed,
    hoursThisMonth,
    commitment:
      metadata.commitment ??
      (role?.commitmentHours ? `${Number(role.commitmentHours)}h/week` : role?.metadata?.commitment ?? 'Flexible'),
    preferences: metadata.preferences ?? role?.metadata?.preferences ?? {},
    impactNotes: toArray(metadata.impactNotes ?? role?.metadata?.impactNotes),
    missions: missions.map((mission) => ({
      id: mission.id ?? null,
      title: mission.title ?? mission.name ?? null,
      status: mission.status ?? 'active',
      summary: mission.summary ?? null,
    })),
    lastActiveAt: metadata.lastActiveAt ? new Date(metadata.lastActiveAt) : null,
    nextShiftAt: shift?.shiftDate ? new Date(`${shift.shiftDate}T${shift.startTime ?? '09:00'}Z`) : null,
    score,
    program: program
      ? {
          id: program.id,
          name: program.name,
          summary: program.summary ?? null,
        }
      : null,
  };
}

function aggregateVolunteerAssignments(assignments = []) {
  const volunteerMap = new Map();
  assignments.forEach((assignment) => {
    const volunteer = mergeVolunteerIdentity(assignment);
    if (!volunteer.id) {
      return;
    }

    if (!volunteerMap.has(volunteer.id)) {
      volunteerMap.set(volunteer.id, { ...volunteer });
      return;
    }

    const existing = volunteerMap.get(volunteer.id);
    existing.availability = Array.from(new Set([...existing.availability, ...volunteer.availability]));
    existing.focusAreas = Array.from(new Set([...existing.focusAreas, ...volunteer.focusAreas]));
    existing.skills = Array.from(new Set([...existing.skills, ...volunteer.skills]));
    existing.languages = Array.from(new Set([...existing.languages, ...volunteer.languages]));
    existing.missionsCompleted = Math.max(existing.missionsCompleted, volunteer.missionsCompleted);
    existing.hoursContributed += volunteer.hoursContributed;
    existing.hoursThisMonth += volunteer.hoursThisMonth;
    existing.score = Math.max(existing.score, volunteer.score);
    existing.missions = Array.from(
      new Map(
        [...existing.missions, ...volunteer.missions].map((mission) => {
          const keyCandidate =
            mission.id ??
            mission.title ??
            mission.summary ??
            mission.status ??
            (mission.startsAt ? new Date(mission.startsAt).getTime() : null) ??
            JSON.stringify(mission);
          return [String(keyCandidate), mission];
        }),
      ).values(),
    );
    if (!existing.lastActiveAt || (volunteer.lastActiveAt && volunteer.lastActiveAt > existing.lastActiveAt)) {
      existing.lastActiveAt = volunteer.lastActiveAt;
    }
    if (!existing.nextShiftAt || (volunteer.nextShiftAt && volunteer.nextShiftAt < existing.nextShiftAt)) {
      existing.nextShiftAt = volunteer.nextShiftAt;
    }
  });

  return Array.from(volunteerMap.values()).sort((a, b) => b.score - a.score);
}

function extractFeaturedStories(programs = []) {
  return programs
    .flatMap((program) => {
      const metadata = program.metadata ?? {};
      if (!Array.isArray(metadata.featuredStories)) {
        return [];
      }
      return metadata.featuredStories.map((story) => ({
        id: story.id ?? `${program.id}-${story.title ?? 'story'}`,
        title: story.title ?? program.name,
        description: story.description ?? story.summary ?? program.summary ?? null,
        url: story.url ?? null,
      }));
    })
    .filter((story) => story.title && story.description)
    .slice(0, 6);
}

async function fetchWorkspaceTimezone(ownerId) {
  if (!ownerId) {
    return 'UTC';
  }
  const cacheKey = buildCacheKey('communityEvents:workspaceTimezone', ownerId);
  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, async () => {
    const setting = await UserEventWorkspaceSetting.findOne({ where: { ownerId } });
    return setting?.defaultTimezone ?? 'UTC';
  });
}

export async function listCommunityCalendar({
  limit,
  timezone,
  volunteerOnly = false,
  focus,
  persona,
  location,
  membershipRoles,
  userId,
} = {}) {
  const resolvedLimit = normaliseLimit(limit, DEFAULT_EVENT_LIMIT);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - PAST_EVENT_WINDOW_DAYS);

  const whereClause = {
    status: { [Op.in]: UPCOMING_EVENT_STATUSES },
    startAt: { [Op.gte]: cutoff },
  };

  const cacheKey = buildCacheKey('communityEvents:calendar', {
    limit: resolvedLimit,
    timezone,
    volunteerOnly,
    focus,
    persona,
    location,
    membershipRoles: Array.isArray(membershipRoles) ? membershipRoles.sort() : null,
    userId: userId ?? null,
  });

  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, async () => {
    const events = await UserEvent.findAll({
      where: whereClause,
      include: [
        { model: UserEventAgendaItem, as: 'agenda', separate: true, order: [['orderIndex', 'ASC']] },
        { model: UserEventGuest, as: 'guests', separate: true, attributes: ['status', 'seatsReserved'] },
      ],
      order: [
        ['startAt', 'ASC'],
        ['status', 'ASC'],
        ['id', 'ASC'],
      ],
      limit: resolvedLimit,
    });

    const ownerId = events[0]?.ownerId ?? null;
    const baseTimezone = timezone ?? (await fetchWorkspaceTimezone(ownerId));

    const normalisedEvents = events
      .map((event) => normaliseEventRecord(event, { timezone: baseTimezone }))
      .filter(Boolean)
      .map((event) => {
        if (!event.locationCategory && location) {
          event.locationCategory = location;
        }
        if (focus && !event.focusAreas.includes(focus)) {
          event.focusAreas = [...event.focusAreas, focus];
        }
        return event;
      });

    const volunteerFiltered = volunteerOnly ? normalisedEvents.filter((event) => event.isVolunteer) : normalisedEvents;

    const recommended = volunteerFiltered
      .filter((event) => event.recommended || event.featured)
      .sort((a, b) => b.score - a.score)
      .slice(0, RECOMMENDED_EVENT_LIMIT);

    const filtered = location
      ? volunteerFiltered.filter((event) => event.locationCategory === location)
      : volunteerFiltered;

    const focusFiltered = focus
      ? filtered.filter((event) => event.focusAreas.includes(focus) || event.tags.includes(focus))
      : filtered;

    const personaFiltered = persona
      ? focusFiltered.filter((event) => event.audiences.length === 0 || event.audiences.includes(persona))
      : focusFiltered;

    return {
      events: personaFiltered,
      recommended,
      timezone: baseTimezone,
      generatedAt: new Date().toISOString(),
    };
  });
}

export async function getCommunityEvent(eventId, { timezone } = {}) {
  const normalizedId = normaliseIdentifier(eventId, 'eventId');

  const cacheKey = buildCacheKey('communityEvents:event', { eventId: normalizedId, timezone });
  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, async () => {
    const event = await UserEvent.findByPk(normalizedId, {
      include: [
        { model: UserEventAgendaItem, as: 'agenda', separate: true, order: [['orderIndex', 'ASC']] },
        { model: UserEventAsset, as: 'assets', separate: true, order: [['assetType', 'ASC'], ['name', 'ASC']] },
        { model: UserEventGuest, as: 'guests', separate: true, attributes: ['status', 'seatsReserved'] },
      ],
    });

    if (!event) {
      throw new NotFoundError('The requested community event could not be found.');
    }

    const base = normaliseEventRecord(event, { timezone });
    if (!base) {
      throw new NotFoundError('The requested community event could not be normalised.');
    }

    const assets = mapAssets(event.assets ?? []);
    const metadata = event.metadata ?? {};

    const detail = {
      ...base,
      assets,
      checklist: Array.isArray(metadata.checklist) ? metadata.checklist : [],
      budget: Array.isArray(metadata.budget) ? metadata.budget : [],
      volunteerInsights: metadata.volunteer ?? null,
      personas: Array.isArray(metadata.personas) ? metadata.personas : [],
      generatedAt: new Date().toISOString(),
    };

    return detail;
  });
}

export async function getVolunteerRoster({ limit, focus, status, availability } = {}) {
  const resolvedLimit = normaliseLimit(limit, DEFAULT_VOLUNTEER_LIMIT);

  const cacheKey = buildCacheKey('communityEvents:volunteerRoster', {
    limit: resolvedLimit,
    focus,
    status,
    availability,
  });

  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, async () => {
    const assignments = await VolunteerAssignment.findAll({
      include: [
        {
          model: VolunteerShift,
          as: 'shift',
          include: [
            { model: Volunteering, as: 'role', attributes: { exclude: ['description'] }, include: [{ model: VolunteerProgram, as: 'program' }] },
            { model: VolunteerProgram, as: 'program' },
          ],
        },
        {
          model: User,
          as: 'volunteer',
          attributes: ['id', 'email', 'firstName', 'lastName', 'avatarUrl', 'location', 'timezone', 'headline'],
        },
      ],
      where: {
        status: { [Op.notIn]: ['declined', 'no_show'] },
      },
      order: [
        ['status', 'ASC'],
        ['updatedAt', 'DESC'],
      ],
      limit: resolvedLimit * 2,
    });

    const volunteers = aggregateVolunteerAssignments(assignments);

    const filtered = volunteers.filter((volunteer) => {
      if (focus && !volunteer.focusAreas.includes(focus)) {
        return false;
      }
      if (status && status !== 'all' && volunteer.status !== status) {
        return false;
      }
      if (availability && availability !== 'all' && !volunteer.availability.includes(availability)) {
        return false;
      }
      return true;
    });

    const programs = await VolunteerProgram.findAll({
      where: { status: { [Op.notIn]: ['archived', 'paused'] } },
      order: [['updatedAt', 'DESC']],
      limit: 4,
    });

    return {
      volunteers: filtered.slice(0, resolvedLimit),
      featuredStories: extractFeaturedStories(programs),
      generatedAt: new Date().toISOString(),
    };
  });
}

export default {
  listCommunityCalendar,
  getCommunityEvent,
  getVolunteerRoster,
};
