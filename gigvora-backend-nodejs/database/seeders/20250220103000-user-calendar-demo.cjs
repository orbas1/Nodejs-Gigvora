'use strict';

const { Op, QueryTypes } = require('sequelize');

const USER_EMAIL = 'mia@gigvora.com';
const SEED_SOURCE = 'user-calendar-demo';

const EVENT_BLUEPRINTS = [
  {
    key: 'hiring-manager-interview',
    title: 'Hiring manager interview',
    eventType: 'job_interview',
    offsetDays: 3,
    startHour: 14,
    startMinute: 0,
    durationMinutes: 60,
    location: 'Zoom',
    description: 'Panel interview with the hiring manager and design lead.',
    reminderMinutes: 15,
    videoConferenceLink: 'https://meet.gigvora.com/hiring-manager',
    relatedEntityType: 'job',
    relatedEntityId: 8451,
    colorHex: '#1D4ED8',
    timezone: 'Europe/London',
    externalProvider: 'google',
    externalEventId: 'evt-google-hiring-manager',
    icsUid: 'uid-hiring-manager-001',
    syncMetadata: { providerEventType: 'interview' },
    syncedRevision: 5,
    lastSyncedMinutesAgo: 90,
    metadata: {
      agenda: ['Portfolio walkthrough', 'Product thinking prompts', 'Q&A'],
    },
  },
  {
    key: 'client-onboarding-workshop',
    title: 'Client onboarding workshop',
    eventType: 'project',
    offsetDays: 7,
    startHour: 16,
    startMinute: 30,
    durationMinutes: 75,
    location: 'Gigvora HQ',
    description: 'Kick-off for the Atlas consulting engagement covering scope, key milestones, and tooling.',
    reminderMinutes: 30,
    relatedEntityType: 'project',
    relatedEntityId: 2142,
    colorHex: '#0EA5E9',
    timezone: 'Europe/London',
    externalProvider: 'gigvora',
    externalEventId: 'evt-gigvora-onboarding',
    icsUid: 'uid-onboarding-002',
    syncMetadata: { orchestrator: true },
    syncedRevision: 3,
    lastSyncedMinutesAgo: 20,
    metadata: {
      hosts: ['Delivery lead', 'Project coordinator'],
      attachments: ['https://cdn.gigvora.com/docs/atlas-brief.pdf'],
    },
  },
  {
    key: 'mentorship-sync',
    title: 'Mentorship sync with Aisha',
    eventType: 'mentorship',
    offsetDays: -2,
    startHour: 18,
    startMinute: 0,
    durationMinutes: 45,
    location: 'Google Meet',
    description: 'Monthly mentorship retro and goal planning for the mentee cohort.',
    reminderMinutes: 10,
    colorHex: '#FB7185',
    timezone: 'Europe/London',
    recurrenceRule: 'FREQ=MONTHLY;COUNT=6',
    recurrenceEndOffsetDays: 180,
    recurrenceCount: 6,
    externalProvider: 'google',
    externalEventId: 'evt-google-mentorship-sync',
    icsUid: 'uid-mentorship-003',
    syncMetadata: { recurrence: 'monthly' },
    syncedRevision: 8,
    lastSyncedMinutesAgo: 45,
    metadata: {
      outcomes: ['Share Q1 wins', 'Review accountability checklist'],
    },
  },
  {
    key: 'wellbeing-reset-block',
    title: 'Wellbeing reset block',
    eventType: 'wellbeing',
    offsetDays: 1,
    startHour: 11,
    startMinute: 30,
    durationMinutes: 30,
    location: 'Workspace meditation room',
    description: 'Guided breathing and reset between interviews.',
    reminderMinutes: 5,
    colorHex: '#22C55E',
    isFocusBlock: true,
    focusMode: 'mindfulness',
    timezone: 'Europe/London',
    recurrenceRule: 'FREQ=WEEKLY;COUNT=8',
    recurrenceEndOffsetDays: 56,
    metadata: {
      facilitator: 'People ops',
    },
  },
];

const FOCUS_SESSION_BLUEPRINTS = [
  {
    key: 'portfolio-polish',
    focusType: 'deep_work',
    offsetDays: -1,
    startHour: 20,
    startMinute: 30,
    durationMinutes: 90,
    completed: true,
    notes: 'Polished case studies and updated hero metrics for the hiring manager panel.',
    metadata: {
      objective: 'Interview readiness',
    },
  },
  {
    key: 'outreach-batch',
    focusType: 'networking',
    offsetDays: 0,
    startHour: 17,
    startMinute: 0,
    durationMinutes: 60,
    completed: false,
    notes: 'Warm outreach to three alumni intros sourced from the networking pod.',
    metadata: {
      targets: 3,
    },
  },
];

const INTEGRATION_BLUEPRINTS = [
  {
    key: 'google-calendar',
    provider: 'google',
    externalAccount: 'mia@gigvora.com',
    status: 'connected',
    lastSyncedHoursAgo: 2,
    metadata: {
      primary: true,
      scope: ['events.read', 'events.write'],
    },
  },
  {
    key: 'gigvora-orchestrator',
    provider: 'gigvora',
    externalAccount: 'workspace-orchestrator',
    status: 'syncing',
    lastSyncedHoursAgo: 0,
    syncError: null,
    metadata: {
      automation: ['focus_blocks', 'availability'],
    },
  },
];

const SETTINGS_BLUEPRINT = {
  timezone: 'Europe/London',
  weekStart: 1,
  workStartMinutes: 8 * 60,
  workEndMinutes: 17 * 60 + 30,
  defaultView: 'week',
  defaultReminderMinutes: 15,
  autoFocusBlocks: true,
  shareAvailability: true,
  colorHex: '#1E3A8A',
  metadata: {
    automation: {
      focus: 'deep_work',
      lastAudit: null,
    },
  },
};

function ensureDate(baseUtc, offsetDays = 0, hour = 9, minute = 0) {
  const anchor = new Date(baseUtc.getTime());
  anchor.setUTCDate(anchor.getUTCDate() + offsetDays);
  anchor.setUTCHours(hour, minute, 0, 0);
  return anchor;
}

function ensureDurationEnd(start, durationMinutes) {
  if (!Number.isFinite(durationMinutes)) {
    return null;
  }
  const clamped = Math.max(0, Number(durationMinutes));
  return new Date(start.getTime() + clamped * 60 * 1000);
}

function normaliseMetadata(input = {}) {
  const value = typeof input === 'object' && input !== null ? { ...input } : {};
  value.seedSource = SEED_SOURCE;
  return value;
}

async function resolveUserId(queryInterface, transaction) {
  const [user] = await queryInterface.sequelize.query(
    'SELECT id FROM users WHERE email = :email LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { email: USER_EMAIL },
    },
  );
  if (!user?.id) {
    throw new Error('User calendar seed requires the seeded user mia@gigvora.com.');
  }
  return user.id;
}

function parseMetadata(columnValue) {
  if (!columnValue) {
    return {};
  }
  if (typeof columnValue === 'string') {
    try {
      return JSON.parse(columnValue);
    } catch (error) {
      return {};
    }
  }
  if (typeof columnValue === 'object') {
    return columnValue;
  }
  return {};
}

async function purgeSeedRows(queryInterface, transaction, tableName, userId) {
  const rows = await queryInterface.sequelize.query(
    `SELECT id, metadata FROM ${tableName} WHERE "userId" = :userId`,
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { userId },
    },
  );
  const identifiers = rows
    .filter((row) => parseMetadata(row.metadata)?.seedSource === SEED_SOURCE)
    .map((row) => row.id);
  if (identifiers.length) {
    await queryInterface.bulkDelete(
      tableName,
      { id: { [Op.in]: identifiers } },
      { transaction },
    );
  }
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const userId = await resolveUserId(queryInterface, transaction);
      const now = new Date();
      const baseUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 8, 0, 0, 0));

      await purgeSeedRows(queryInterface, transaction, 'candidate_calendar_events', userId);
      await purgeSeedRows(queryInterface, transaction, 'focus_sessions', userId);
      await purgeSeedRows(queryInterface, transaction, 'calendar_integrations', userId);
      await purgeSeedRows(queryInterface, transaction, 'calendar_availability_snapshots', userId);

      const events = EVENT_BLUEPRINTS.map((blueprint) => {
        const startsAt = ensureDate(baseUtc, blueprint.offsetDays ?? 0, blueprint.startHour ?? 9, blueprint.startMinute ?? 0);
        const endsAt = ensureDurationEnd(startsAt, blueprint.durationMinutes);
        const recurrenceEndsAt = Number.isFinite(blueprint.recurrenceEndOffsetDays)
          ? ensureDate(baseUtc, blueprint.recurrenceEndOffsetDays, blueprint.startHour ?? 9, blueprint.startMinute ?? 0)
          : null;
        const lastSyncedAt = Number.isFinite(blueprint.lastSyncedMinutesAgo)
          ? new Date(now.getTime() - blueprint.lastSyncedMinutesAgo * 60 * 1000)
          : now;
        const source = blueprint.externalProvider ? blueprint.externalProvider : 'manual';
        const syncStatus = blueprint.syncStatus ?? 'synced';
        return {
          userId,
          title: blueprint.title,
          eventType: blueprint.eventType,
          source,
          startsAt,
          endsAt,
          location: blueprint.location ?? null,
          description: blueprint.description ?? null,
          videoConferenceLink: blueprint.videoConferenceLink ?? null,
          isAllDay: Boolean(blueprint.isAllDay),
          reminderMinutes: blueprint.reminderMinutes ?? 15,
          visibility: blueprint.visibility ?? 'private',
          relatedEntityType: blueprint.relatedEntityType ?? null,
          relatedEntityId: blueprint.relatedEntityId ?? null,
          colorHex: blueprint.colorHex ?? null,
          isFocusBlock: Boolean(blueprint.isFocusBlock),
          focusMode: blueprint.focusMode ?? null,
          timezone: blueprint.timezone ?? SETTINGS_BLUEPRINT.timezone ?? 'UTC',
          recurrenceRule: blueprint.recurrenceRule ?? null,
          recurrenceEndsAt,
          recurrenceCount: blueprint.recurrenceCount ?? null,
          recurrenceParentId: null,
          icsUid: blueprint.icsUid ?? null,
          externalProvider: blueprint.externalProvider ?? null,
          externalEventId: blueprint.externalEventId ?? null,
          syncStatus,
          syncMetadata: normaliseMetadata({
            ...(blueprint.syncMetadata ?? {}),
            seedKey: `${blueprint.key}-sync`,
          }),
          syncedRevision: blueprint.syncedRevision ?? (blueprint.externalProvider ? 1 : 0),
          lastSyncedAt,
          metadata: normaliseMetadata({ ...(blueprint.metadata ?? {}), seedKey: blueprint.key }),
          createdAt: now,
          updatedAt: now,
        };
      });

      if (events.length) {
        await queryInterface.bulkInsert('candidate_calendar_events', events, { transaction });
      }

      const availabilitySnapshots = [
        {
          userId,
          provider: 'google',
          syncedAt: new Date(now.getTime() - 30 * 60 * 1000),
          availability: {
            timezone: SETTINGS_BLUEPRINT.timezone,
            slots: [
              { start: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), durationMinutes: 30 },
              { start: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(), durationMinutes: 45 },
            ],
          },
          metadata: normaliseMetadata({ seedKey: 'availability-google', provider: 'google' }),
          createdAt: now,
          updatedAt: now,
        },
        {
          userId,
          provider: 'gigvora',
          syncedAt: new Date(now.getTime() - 10 * 60 * 1000),
          availability: {
            timezone: SETTINGS_BLUEPRINT.timezone,
            slots: [
              { start: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), durationMinutes: 60 },
            ],
          },
          metadata: normaliseMetadata({ seedKey: 'availability-gigvora', provider: 'gigvora', automation: true }),
          createdAt: now,
          updatedAt: now,
        },
      ];

      await queryInterface.bulkInsert('calendar_availability_snapshots', availabilitySnapshots, { transaction });

      const focusSessions = FOCUS_SESSION_BLUEPRINTS.map((blueprint) => {
        const startedAt = ensureDate(baseUtc, blueprint.offsetDays ?? 0, blueprint.startHour ?? 9, blueprint.startMinute ?? 0);
        const endedAt = ensureDurationEnd(startedAt, blueprint.durationMinutes);
        return {
          userId,
          focusType: blueprint.focusType,
          startedAt,
          endedAt,
          durationMinutes: blueprint.durationMinutes ?? null,
          completed: Boolean(blueprint.completed ?? Boolean(endedAt)),
          notes: blueprint.notes ?? null,
          metadata: normaliseMetadata({ ...(blueprint.metadata ?? {}), seedKey: blueprint.key }),
          createdAt: now,
          updatedAt: now,
        };
      });

      if (focusSessions.length) {
        await queryInterface.bulkInsert('focus_sessions', focusSessions, { transaction });
      }

      const integrations = INTEGRATION_BLUEPRINTS.map((blueprint) => {
        const hoursAgo = Number.isFinite(blueprint.lastSyncedHoursAgo) ? blueprint.lastSyncedHoursAgo : null;
        return {
          userId,
          provider: blueprint.provider,
          externalAccount: blueprint.externalAccount ?? null,
          status: blueprint.status ?? 'connected',
          lastSyncedAt: hoursAgo == null ? now : new Date(now.getTime() - hoursAgo * 60 * 60 * 1000),
          syncError: blueprint.syncError ?? null,
          metadata: normaliseMetadata({ ...(blueprint.metadata ?? {}), seedKey: blueprint.key }),
          createdAt: now,
          updatedAt: now,
        };
      });

      if (integrations.length) {
        await queryInterface.bulkInsert('calendar_integrations', integrations, { transaction });
      }

      const [existingSetting] = await queryInterface.sequelize.query(
        'SELECT * FROM user_calendar_settings WHERE "userId" = :userId LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { userId },
        },
      );

      const desiredMetadata = normaliseMetadata({ ...(SETTINGS_BLUEPRINT.metadata ?? {}), seedKey: 'calendar-settings' });

      if (existingSetting?.id) {
        const previousMetadata = parseMetadata(existingSetting.metadata);
        const snapshot = {
          timezone: existingSetting.timezone,
          weekStart: existingSetting.weekStart,
          workStartMinutes: existingSetting.workStartMinutes,
          workEndMinutes: existingSetting.workEndMinutes,
          defaultView: existingSetting.defaultView,
          defaultReminderMinutes: existingSetting.defaultReminderMinutes,
          autoFocusBlocks: existingSetting.autoFocusBlocks,
          shareAvailability: existingSetting.shareAvailability,
          colorHex: existingSetting.colorHex,
          metadata: previousMetadata,
        };

        await queryInterface.bulkUpdate(
          'user_calendar_settings',
          {
            timezone: SETTINGS_BLUEPRINT.timezone,
            weekStart: SETTINGS_BLUEPRINT.weekStart,
            workStartMinutes: SETTINGS_BLUEPRINT.workStartMinutes,
            workEndMinutes: SETTINGS_BLUEPRINT.workEndMinutes,
            defaultView: SETTINGS_BLUEPRINT.defaultView,
            defaultReminderMinutes: SETTINGS_BLUEPRINT.defaultReminderMinutes,
            autoFocusBlocks: SETTINGS_BLUEPRINT.autoFocusBlocks,
            shareAvailability: SETTINGS_BLUEPRINT.shareAvailability,
            colorHex: SETTINGS_BLUEPRINT.colorHex,
            metadata: { ...desiredMetadata, previousSnapshot: snapshot },
            updatedAt: now,
          },
          { id: existingSetting.id },
          { transaction },
        );
      } else {
        await queryInterface.bulkInsert(
          'user_calendar_settings',
          [
            {
              userId,
              timezone: SETTINGS_BLUEPRINT.timezone,
              weekStart: SETTINGS_BLUEPRINT.weekStart,
              workStartMinutes: SETTINGS_BLUEPRINT.workStartMinutes,
              workEndMinutes: SETTINGS_BLUEPRINT.workEndMinutes,
              defaultView: SETTINGS_BLUEPRINT.defaultView,
              defaultReminderMinutes: SETTINGS_BLUEPRINT.defaultReminderMinutes,
              autoFocusBlocks: SETTINGS_BLUEPRINT.autoFocusBlocks,
              shareAvailability: SETTINGS_BLUEPRINT.shareAvailability,
              colorHex: SETTINGS_BLUEPRINT.colorHex,
              metadata: { ...desiredMetadata, previousSnapshot: null },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const userId = await resolveUserId(queryInterface, transaction);

      const rowsToClean = async (tableName) => {
        const rows = await queryInterface.sequelize.query(
          `SELECT id, metadata FROM ${tableName} WHERE "userId" = :userId`,
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId },
          },
        );
        return rows
          .filter((row) => parseMetadata(row.metadata)?.seedSource === SEED_SOURCE)
          .map((row) => row.id);
      };

      const eventIds = await rowsToClean('candidate_calendar_events');
      if (eventIds.length) {
        await queryInterface.bulkDelete(
          'candidate_calendar_events',
          { id: { [Op.in]: eventIds } },
          { transaction },
        );
      }

      const focusSessionIds = await rowsToClean('focus_sessions');
      if (focusSessionIds.length) {
        await queryInterface.bulkDelete(
          'focus_sessions',
          { id: { [Op.in]: focusSessionIds } },
          { transaction },
        );
      }

      const integrationIds = await rowsToClean('calendar_integrations');
      if (integrationIds.length) {
        await queryInterface.bulkDelete(
          'calendar_integrations',
          { id: { [Op.in]: integrationIds } },
          { transaction },
        );
      }

      const availabilityIds = await rowsToClean('calendar_availability_snapshots');
      if (availabilityIds.length) {
        await queryInterface.bulkDelete(
          'calendar_availability_snapshots',
          { id: { [Op.in]: availabilityIds } },
          { transaction },
        );
      }

      const [setting] = await queryInterface.sequelize.query(
        'SELECT id, metadata FROM user_calendar_settings WHERE "userId" = :userId LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { userId },
        },
      );

      if (setting?.id) {
        const metadata = parseMetadata(setting.metadata);
        if (metadata.seedSource === SEED_SOURCE) {
          const previousSnapshot = metadata.previousSnapshot ?? null;
          if (previousSnapshot) {
            const restoredMetadata = previousSnapshot.metadata ?? {};
            await queryInterface.bulkUpdate(
              'user_calendar_settings',
              {
                timezone: previousSnapshot.timezone ?? 'UTC',
                weekStart: previousSnapshot.weekStart ?? 1,
                workStartMinutes: previousSnapshot.workStartMinutes ?? 480,
                workEndMinutes: previousSnapshot.workEndMinutes ?? 1020,
                defaultView: previousSnapshot.defaultView ?? 'agenda',
                defaultReminderMinutes: previousSnapshot.defaultReminderMinutes ?? 30,
                autoFocusBlocks: Boolean(previousSnapshot.autoFocusBlocks),
                shareAvailability: Boolean(previousSnapshot.shareAvailability),
                colorHex: previousSnapshot.colorHex ?? null,
                metadata: restoredMetadata,
                updatedAt: new Date(),
              },
              { id: setting.id },
              { transaction },
            );
          } else {
            await queryInterface.bulkDelete('user_calendar_settings', { id: setting.id }, { transaction });
          }
        }
      }
    });
  },
};
