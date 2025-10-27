'use strict';

const fs = require('fs');
const path = require('path');
const { QueryTypes } = require('sequelize');

const DATA_FILE = path.resolve(__dirname, '../../../calendar_stub/data/company-calendar.json');
const {
  assertCompanyCalendarEventType,
} = require('../../../shared-contracts/domain/platform/calendar/constants.js');
const SEED_SOURCE = 'company-calendar-stub';
const OWNER_EMAIL = 'mia@gigvora.com';
const FALLBACK_WORKSPACE = {
  id: 101,
  slug: 'acme-talent-hub',
  name: 'Acme Talent Hub',
  timezone: 'UTC',
  defaultCurrency: 'USD',
  membershipRole: 'owner',
};

let fixturesModulePromise;

async function loadFixturesModule() {
  if (!fixturesModulePromise) {
    fixturesModulePromise = import('../../../calendar_stub/fixtures.mjs');
  }
  return fixturesModulePromise;
}

function loadDataset() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Calendar dataset must be a JSON object.');
  }
  return parsed;
}

function toSlug(value) {
  if (!value) {
    return null;
  }
  return `${value}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '') || null;
}

function toDate(value) {
  if (!value) {
    return null;
  }
  const candidate = new Date(value);
  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

function computeDate(now, absolute, offsetHours) {
  const explicit = toDate(absolute);
  if (explicit) {
    return explicit;
  }
  if (typeof offsetHours === 'number' && Number.isFinite(offsetHours)) {
    return new Date(now.getTime() + offsetHours * 60 * 60 * 1000);
  }
  return new Date(now.getTime());
}

function computeEnd(now, blueprint, start) {
  const absolute = toDate(blueprint.endsAt);
  if (absolute) {
    return absolute;
  }
  if (typeof blueprint.endOffsetHours === 'number' && Number.isFinite(blueprint.endOffsetHours)) {
    return new Date(now.getTime() + blueprint.endOffsetHours * 60 * 60 * 1000);
  }
  if (typeof blueprint.durationMinutes === 'number' && Number.isFinite(blueprint.durationMinutes)) {
    return new Date(start.getTime() + Math.max(0, blueprint.durationMinutes) * 60 * 1000);
  }
  if (typeof blueprint.durationHours === 'number' && Number.isFinite(blueprint.durationHours)) {
    return new Date(start.getTime() + Math.max(0, blueprint.durationHours) * 60 * 60 * 1000);
  }
  return null;
}

function normaliseMetadata(metadata = {}, metadataNormalizer = null) {
  let cleaned = metadata && typeof metadata === 'object' ? { ...metadata } : {};
  if (metadataNormalizer) {
    const normalised = metadataNormalizer(metadata ?? {});
    if (normalised && typeof normalised === 'object') {
      cleaned = { ...normalised };
    }
  }
  cleaned.seedSource = SEED_SOURCE;
  return cleaned;
}

function normaliseEvent(blueprint, now, workspaceId, metadataNormalizer) {
  const id = Number.parseInt(`${blueprint.id}`, 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error(`Calendar blueprint id is invalid for "${blueprint.title}".`);
  }
  const title = `${blueprint.title}`.trim();
  if (!title) {
    throw new Error('Calendar blueprint title is required.');
  }
  let eventType;
  try {
    eventType = assertCompanyCalendarEventType(blueprint.eventType);
  } catch (error) {
    throw new Error(`Calendar blueprint eventType is invalid for "${blueprint.title}": ${error.message}`);
  }
  const start = computeDate(now, blueprint.startsAt, blueprint.startOffsetHours ?? blueprint.offsetHours ?? 0);
  const end = computeEnd(now, blueprint, start);

  return {
    id,
    workspaceId,
    title,
    eventType,
    startsAt: start,
    endsAt: end,
    location: blueprint.location ? `${blueprint.location}` : null,
    metadata: normaliseMetadata(blueprint.metadata || {}, metadataNormalizer),
    createdAt: now,
    updatedAt: now,
  };
}

module.exports = {
  async up(queryInterface) {
    const dataset = loadDataset();
    const events = Array.isArray(dataset.events) ? dataset.events : [];
    if (!events.length) {
      return;
    }

    const fixtures = await loadFixturesModule();
    const metadataNormalizer = typeof fixtures.normaliseMetadata === 'function' ? fixtures.normaliseMetadata : null;

    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const [owner] = await queryInterface.sequelize.query(
        'SELECT id FROM users WHERE email = :email LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { email: OWNER_EMAIL },
        },
      );

      if (!owner?.id) {
        throw new Error('Company calendar seed requires the seeded user mia@gigvora.com.');
      }

      const workspaceBlueprints = Array.isArray(dataset.workspaces) && dataset.workspaces.length
        ? dataset.workspaces
        : [FALLBACK_WORKSPACE];

      const workspaceMap = new Map();

      for (const workspaceBlueprint of workspaceBlueprints) {
        const numericId = Number.parseInt(`${workspaceBlueprint.id}`, 10);
        const slug = toSlug(workspaceBlueprint.slug ?? workspaceBlueprint.name) || FALLBACK_WORKSPACE.slug;

        const [workspaceRow] = await queryInterface.sequelize.query(
          'SELECT id FROM provider_workspaces WHERE slug = :slug LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { slug },
          },
        );

        let workspaceId = workspaceRow?.id ?? null;
        if (!workspaceId) {
          await queryInterface.bulkInsert(
            'provider_workspaces',
            [
              {
                ownerId: owner.id,
                name: workspaceBlueprint.name ?? FALLBACK_WORKSPACE.name,
                slug,
                type: 'company',
                timezone: workspaceBlueprint.timezone ?? FALLBACK_WORKSPACE.timezone,
                defaultCurrency: workspaceBlueprint.defaultCurrency ?? FALLBACK_WORKSPACE.defaultCurrency,
                intakeEmail: `${slug}@gigvora.example`,
                isActive: true,
                settings: { seedSource: SEED_SOURCE },
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
          const [insertedWorkspace] = await queryInterface.sequelize.query(
            'SELECT id FROM provider_workspaces WHERE slug = :slug LIMIT 1',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: { slug },
            },
          );
          workspaceId = insertedWorkspace?.id ?? null;
        }

        if (!workspaceId) {
          throw new Error(`Unable to resolve workspace for slug ${slug}`);
        }

        const membershipRole = (workspaceBlueprint.membershipRole ?? 'owner').toLowerCase();
        const allowedRoles = new Set(['owner', 'admin', 'manager', 'staff', 'viewer']);
        const role = allowedRoles.has(membershipRole) ? membershipRole : 'owner';

        const [membershipRow] = await queryInterface.sequelize.query(
          'SELECT id FROM provider_workspace_members WHERE workspaceId = :workspaceId AND userId = :userId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { workspaceId, userId: owner.id },
          },
        );

        if (!membershipRow?.id) {
          await queryInterface.bulkInsert(
            'provider_workspace_members',
            [
              {
                workspaceId,
                userId: owner.id,
                role,
                status: 'active',
                joinedAt: now,
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }

        if (Number.isFinite(numericId) && numericId > 0) {
          workspaceMap.set(numericId, workspaceId);
        }
      }

      const seedEvents = events.reduce((accumulator, blueprint) => {
        const blueprintWorkspaceId = Number.parseInt(`${blueprint.workspaceId}`, 10);
        const resolvedWorkspaceId = workspaceMap.get(blueprintWorkspaceId) ?? workspaceMap.values().next().value;
        if (!resolvedWorkspaceId) {
          return accumulator;
        }
        accumulator.push(normaliseEvent(blueprint, now, resolvedWorkspaceId, metadataNormalizer));
        return accumulator;
      }, []);

      if (!seedEvents.length) {
        return;
      }

      const eventIds = seedEvents.map((event) => event.id);
      await queryInterface.bulkDelete('recruiting_calendar_events', { id: eventIds }, { transaction });
      await queryInterface.bulkInsert('recruiting_calendar_events', seedEvents, { transaction });
    });
  },

  async down(queryInterface) {
    const dataset = loadDataset();
    const eventIds = Array.isArray(dataset.events) ? dataset.events.map((event) => event.id).filter(Boolean) : [];
    if (!eventIds.length) {
      return;
    }

    await queryInterface.bulkDelete('recruiting_calendar_events', { id: eventIds });
  },
};
