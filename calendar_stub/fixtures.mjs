import { randomUUID } from 'node:crypto';

const DEFAULT_EVENT_BLUEPRINTS = [
  {
    id: 'evt-project-revenue-kickoff',
    workspaceId: 101,
    title: 'Revenue ops project kickoff',
    eventType: 'project',
    status: 'scheduled',
    startOffsetHours: 1,
    endOffsetHours: 2,
    location: 'Hybrid · HQ Level 4',
    metadata: {
      relatedEntityName: 'Revenue intelligence rollout',
      relatedEntityType: 'project',
      ownerName: 'Alex Morgan',
      ownerEmail: 'alex.morgan@example.com',
      participants: [
        { name: 'Alex Morgan', email: 'alex.morgan@example.com', role: 'project lead' },
        { name: 'Jordan Li', email: 'jordan.li@example.com', role: 'operations' },
      ],
      notes: 'Share pre-read before the working session.',
    },
  },
  {
    id: 'evt-staff-engineer-panel',
    workspaceId: 101,
    title: 'Staff engineer panel interview',
    eventType: 'interview',
    status: 'scheduled',
    startOffsetHours: 4,
    endOffsetHours: 5,
    location: 'Zoom',
    metadata: {
      relatedEntityName: 'Staff Engineer - Platform',
      relatedEntityType: 'job',
      ownerName: 'Recruiting squad',
      participants: [
        { name: 'Priya Patel', email: 'priya.patel@example.com', role: 'interviewer' },
        { name: 'Jamie Lee', email: 'jamie.lee@example.com', role: 'interviewer' },
      ],
      notes: 'Panel: systems design, leadership, architecture deep dive.',
    },
  },
  {
    id: 'evt-gig-onboarding-briefing',
    workspaceId: 101,
    title: 'Growth marketing gig onboarding',
    eventType: 'gig',
    status: 'scheduled',
    startOffsetHours: 24,
    endOffsetHours: 25,
    location: 'Async briefing',
    metadata: {
      relatedEntityName: 'Creator partnership sprint',
      relatedEntityType: 'gig',
      ownerName: 'Gig programs',
      notes: 'Share campaign brief and analytics dashboard logins.',
    },
  },
  {
    id: 'evt-mentorship-intro-session',
    workspaceId: 101,
    title: 'Mentorship intro: product leadership',
    eventType: 'mentorship',
    status: 'scheduled',
    startOffsetHours: 48,
    endOffsetHours: 49,
    location: 'Google Meet',
    metadata: {
      relatedEntityName: 'Growth mentorship',
      relatedEntityType: 'program',
      ownerName: 'Mentor success',
      notes: 'Share growth plan template.',
    },
  },
  {
    id: 'evt-volunteering-community-brief',
    workspaceId: 101,
    title: 'Volunteer community briefing',
    eventType: 'volunteering',
    status: 'scheduled',
    startOffsetHours: 72,
    endOffsetHours: 72.5,
    location: 'Community center',
    metadata: {
      relatedEntityName: 'STEM Futures',
      relatedEntityType: 'volunteering',
      ownerName: 'Community success',
      notes: 'Confirm background checks and travel logistics.',
    },
  },
];

function cloneMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }
  return structuredClone(metadata);
}

function computeDate(now, offsetHours) {
  if (typeof offsetHours !== 'number') {
    return null;
  }
  return new Date(now + offsetHours * 60 * 60 * 1000).toISOString();
}

export function createDefaultEvents(now = Date.now()) {
  const timestamp = new Date(now).toISOString();
  return DEFAULT_EVENT_BLUEPRINTS.map((blueprint) => ({
    id: blueprint.id || randomUUID(),
    workspaceId: blueprint.workspaceId,
    title: blueprint.title,
    eventType: blueprint.eventType,
    status: blueprint.status,
    startsAt: computeDate(now, blueprint.startOffsetHours) || timestamp,
    endsAt: computeDate(now, blueprint.endOffsetHours),
    location: blueprint.location || null,
    metadata: cloneMetadata(blueprint.metadata),
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

export function normaliseEventFixtures(events, { now = Date.now(), allowEmpty = false } = {}) {
  if (!Array.isArray(events) || (!events.length && !allowEmpty)) {
    return createDefaultEvents(now);
  }

  if (Array.isArray(events) && events.length === 0 && allowEmpty) {
    return [];
  }

  return events.map((event) => {
    const startsAt = event.startsAt || computeDate(now, event.startOffsetHours ?? event.offsetHours);
    const endsAt =
      event.endsAt !== undefined
        ? event.endsAt
        : computeDate(now, event.endOffsetHours ?? event.durationHours !== undefined
            ? (event.startOffsetHours ?? event.offsetHours ?? 0) + event.durationHours
            : undefined);

    return {
      id: event.id || randomUUID(),
      workspaceId: Number.parseInt(`${event.workspaceId}`, 10),
      title: `${event.title}`.trim(),
      eventType: `${event.eventType}`.toLowerCase(),
      status: event.status ? `${event.status}` : 'scheduled',
      startsAt: startsAt || new Date(now).toISOString(),
      endsAt: endsAt || null,
      location: event.location ?? null,
      metadata: cloneMetadata(event.metadata),
      createdAt: event.createdAt || new Date(now).toISOString(),
      updatedAt: event.updatedAt || new Date(now).toISOString(),
    };
  });
}

export const DEFAULT_WORKSPACES = [
  { id: 101, name: 'Acme Talent Hub', timezone: 'UTC' },
  { id: 202, name: 'Global Mentorship Guild', timezone: 'America/New_York' },
];
