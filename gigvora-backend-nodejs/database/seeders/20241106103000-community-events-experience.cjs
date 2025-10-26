'use strict';

const { QueryTypes, Op } = require('sequelize');

const OWNER_EMAIL = 'mentor@gigvora.com';
const VOLUNTEER_EMAILS = ['leo@gigvora.com', 'ava@gigvora.com', 'riley@gigvora.com'];

const EVENT_BLUEPRINTS = [
  {
    slug: 'atlas-mentor-summit',
    title: 'Atlas Mentor Salon: Designing Resilient Product Communities',
    status: 'registration_open',
    format: 'hybrid',
    visibility: 'public',
    timezone: 'America/New_York',
    locationLabel: 'Gigvora Studio · New York & Livestream',
    startOffsetHours: 120,
    durationMinutes: 120,
    capacity: 220,
    contactEmail: 'community@gigvora.com',
    bannerImageUrl: 'https://assets.gigvora.test/events/mentor-summit.jpg',
    metadata: {
      category: 'mentorship',
      audiences: ['founders', 'product leaders', 'mentors'],
      focusAreas: ['mentorship', 'community orchestration', 'product'],
      tags: ['Mentor salon', 'Atlas community'],
      featured: true,
      recommended: true,
      engagementScore: 0.92,
      subtitle: 'Live case studies, mentor matching, and experience design labs.',
      summary:
        'Flagship gathering for Atlas mentors and founders with live case studies, speed feedback, and playbook co-creation.',
      host: {
        name: 'Ava Founder',
        title: 'Co-founder & CEO',
        company: 'Gigvora',
        avatarUrl: 'https://assets.gigvora.test/avatars/ava-founder.png',
      },
      hostCompany: 'Gigvora',
      heroVideoUrl: 'https://media.gigvora.test/events/atlas-mentor-summit-teaser.mp4',
      livestreamUrl: 'https://gigvora.live/events/mentor-summit',
      volunteer: {
        readiness: {
          score: 0.78,
          volunteerHours: 48,
          crewAssigned: 6,
        },
      },
      speakers: [
        {
          id: 'speaker-ava',
          name: 'Ava Founder',
          title: 'Co-founder & CEO',
          company: 'Gigvora',
          avatarUrl: 'https://assets.gigvora.test/avatars/ava-founder.png',
          bio: 'Operator and coach guiding founders through community-led growth.',
        },
        {
          id: 'speaker-leo',
          name: 'Leo Freelancer',
          title: 'Fractional Staff Engineer',
          company: 'Lumen Analytics',
          avatarUrl: 'https://assets.gigvora.test/avatars/leo-freelancer.png',
          bio: 'Leads the Atlas mentoring guild for technical operators.',
        },
      ],
      recommendedPeers: [
        {
          id: 'mentor-ops',
          name: 'Mia Operations',
          email: 'mia@gigvora.com',
          headline: 'Director of Operations · Gigvora',
        },
        {
          id: 'mentor-product',
          name: 'Riley Recruiter',
          email: 'recruiter@gigvora.com',
          headline: 'Talent Partner · Remote Operators Collective',
        },
      ],
      resources: [
        {
          label: 'Mentor playbook deck',
          url: 'https://assets.gigvora.test/events/atlas-mentor-summit-playbook.pdf',
        },
        {
          label: 'Community outcomes report',
          url: 'https://assets.gigvora.test/events/atlas-community-report.pdf',
        },
      ],
      checklist: [
        { id: 'checklist-speakers', label: 'Confirm lightning talk lineup', owner: 'community@gigvora.com' },
        { id: 'checklist-volunteers', label: 'Brief volunteer concierge crew', owner: 'impact@gigvora.com' },
      ],
      budget: [
        { category: 'Production', amount: 2800, vendor: 'Atlas AV Collective' },
        { category: 'Catering', amount: 1450, vendor: 'Impact Kitchen' },
      ],
      links: [
        { label: 'Program overview', url: 'https://community.gigvora.test/programs/atlas-mentors' },
        { label: 'Mentor portal', url: 'https://app.gigvora.test/mentors' },
      ],
    },
    agenda: [
      {
        title: 'Check-in & community pulse',
        startOffsetMinutes: 0,
        durationMinutes: 20,
        ownerName: 'Volunteer concierge crew',
        description: 'Guided arrivals, mentor match prompts, and warm-up analytics walkthrough.',
      },
      {
        title: 'Live case study: Launching resilient product rituals',
        startOffsetMinutes: 20,
        durationMinutes: 40,
        ownerName: 'Ava Founder',
        description: 'Inside the Atlas case study with playbooks for aligning mentors, founders, and operators.',
      },
      {
        title: 'Mentor design lab breakouts',
        startOffsetMinutes: 70,
        durationMinutes: 35,
        ownerName: 'Leo Freelancer',
        description: 'Small-group working sessions designing upcoming cohort experiences.',
      },
      {
        title: 'Community roadmap briefing & closing ritual',
        startOffsetMinutes: 110,
        durationMinutes: 10,
        ownerName: 'Community strategy team',
        description: 'Roadmap reveals, next-step commitments, and volunteer mission highlights.',
      },
    ],
    assets: [
      {
        name: 'Atlas mentor facilitation kit',
        url: 'https://assets.gigvora.test/events/atlas-mentor-facilitation-kit.zip',
        assetType: 'document',
        visibility: 'shared',
      },
      {
        name: 'Event art direction',
        url: 'https://assets.gigvora.test/events/atlas-mentor-art.jpg',
        thumbnailUrl: 'https://assets.gigvora.test/events/atlas-mentor-art-thumb.jpg',
        assetType: 'image',
        visibility: 'public',
      },
    ],
  },
  {
    slug: 'impact-volunteer-field-day',
    title: 'Impact Field Day: Volunteer Activation Sprint',
    status: 'planned',
    format: 'hybrid',
    visibility: 'invite_only',
    timezone: 'America/Los_Angeles',
    locationLabel: 'Impact Hub · San Francisco & Remote pods',
    startOffsetHours: 240,
    durationMinutes: 180,
    capacity: 120,
    contactEmail: 'impact@gigvora.com',
    bannerImageUrl: 'https://assets.gigvora.test/events/impact-field-day.jpg',
    metadata: {
      category: 'volunteering',
      isVolunteer: true,
      audiences: ['volunteers', 'impact operators', 'community leaders'],
      focusAreas: ['volunteering', 'community', 'operations'],
      tags: ['Volunteer sprint', 'Impact missions'],
      featured: true,
      recommended: true,
      engagementScore: 0.88,
      subtitle: 'Mobilise crews for four community missions with live readiness dashboards.',
      summary:
        'Activation sprint pairing Gigvora volunteers with high-priority missions across mentorship, accessibility, and youth empowerment.',
      host: {
        name: 'Mia Operations',
        title: 'Director of Operations',
        company: 'Gigvora',
        avatarUrl: 'https://assets.gigvora.test/avatars/mia-operations.png',
      },
      volunteer: {
        slots: 48,
        waitlist: 12,
        readiness: {
          score: 0.83,
          volunteerHours: 312,
          missionsLive: 4,
        },
      },
      speakers: [
        {
          id: 'speaker-impact',
          name: 'Impact Missions Council',
          title: 'Program leads',
          company: 'Gigvora Impact Hub',
        },
      ],
      resources: [
        {
          label: 'Mission roster & readiness dashboard',
          url: 'https://assets.gigvora.test/events/impact-field-day-roster.pdf',
        },
        {
          label: 'Volunteer orientation video',
          url: 'https://media.gigvora.test/events/volunteer-orientation.mp4',
        },
      ],
      checklist: [
        { id: 'checklist-briefing', label: 'Send mission briefing packs', owner: 'impact@gigvora.com' },
        { id: 'checklist-livestream', label: 'Confirm livestream captioning', owner: 'operations@gigvora.com' },
      ],
      budget: [
        { category: 'Production', amount: 1900, vendor: 'Volunteer Ops AV' },
        { category: 'Meals', amount: 870, vendor: 'Community Kitchen Collective' },
      ],
      links: [
        { label: 'Volunteer mission hub', url: 'https://app.gigvora.test/volunteering' },
        { label: 'Impact measurement framework', url: 'https://docs.gigvora.test/impact-framework' },
      ],
    },
    agenda: [
      {
        title: 'Mission control orientation',
        startOffsetMinutes: 0,
        durationMinutes: 30,
        ownerName: 'Impact HQ',
        description: 'Orientation for volunteers covering mission priorities, safety, and comms stack.',
      },
      {
        title: 'Squad activation workshops',
        startOffsetMinutes: 30,
        durationMinutes: 90,
        ownerName: 'Volunteer captains',
        description: 'Breakouts for mentorship hotline, accessibility sprint, youth product lab, and community data co-op.',
      },
      {
        title: 'Readiness dashboard live ops',
        startOffsetMinutes: 120,
        durationMinutes: 40,
        ownerName: 'Operations nerve center',
        description: 'Volunteer roster alignment, shift assignments, and readiness scoring.',
      },
      {
        title: 'Impact commitments & celebration',
        startOffsetMinutes: 170,
        durationMinutes: 10,
        ownerName: 'Impact council',
        description: 'Commitments for next 7 days, recognition of spotlight volunteers, and mission broadcast scheduling.',
      },
    ],
    assets: [
      {
        name: 'Volunteer comms templates',
        url: 'https://assets.gigvora.test/events/impact-field-day-comms-kit.zip',
        assetType: 'document',
        visibility: 'internal',
      },
      {
        name: 'Mission showcase reel',
        url: 'https://media.gigvora.test/events/impact-field-day-highlight.mp4',
        assetType: 'video',
        visibility: 'shared',
      },
    ],
  },
];

const PROGRAM_BLUEPRINT = {
  name: 'Atlas Community Missions',
  summary: 'Cross-functional volunteer crews powering mentorship salons, accessibility sprints, and youth labs.',
  status: 'active',
  location: 'Global · Hybrid',
  tags: ['community', 'volunteering', 'mentorship'],
  metadata: {
    timezone: 'America/Los_Angeles',
    featuredStories: [
      {
        id: 'story-mentor-crew',
        title: 'Mentor crew scaled 4x guidance slots in 8 weeks',
        description: 'Volunteer mentors expanded the Atlas hotline to serve founders across three timezones.',
        url: 'https://stories.gigvora.test/mentor-crew-scale',
      },
      {
        id: 'story-accessibility-squad',
        title: 'Accessibility squad shipped inclusive onboarding in 5 days',
        description: 'Designers and engineers paired with community partners to ship accessible flows ahead of schedule.',
        url: 'https://stories.gigvora.test/accessibility-sprint',
      },
    ],
  },
};

const ROLE_BLUEPRINTS = [
  {
    title: 'Impact Concierge Lead',
    organization: 'Gigvora Impact Hub',
    status: 'open',
    remoteType: 'hybrid',
    commitmentHours: 6,
    skills: ['Facilitation', 'Community operations', 'Experience design'],
    tags: ['mentorship', 'community'],
    applicationUrl: 'https://app.gigvora.test/volunteering/impact-concierge',
    metadata: {
      focusAreas: ['mentorship', 'community design'],
      availability: ['weekday_evening', 'event_days'],
      metrics: { engagementScore: 0.86, hoursContributed: 260, missionsCompleted: 8 },
      impactNotes: ['Hosts mentor salons and community warm-ups.', 'Drives concierge experience for flagship events.'],
      missions: [
        { id: 'mission-mentor-salon', title: 'Mentor salon concierge', status: 'active' },
        { id: 'mission-founders-day', title: 'Founders day activation', status: 'completed' },
      ],
      languages: ['English', 'Spanish'],
    },
  },
  {
    title: 'Accessibility Sprint Producer',
    organization: 'Gigvora Accessibility Guild',
    status: 'open',
    remoteType: 'remote',
    commitmentHours: 5,
    skills: ['Accessibility', 'Product operations', 'QA'],
    tags: ['volunteering', 'product'],
    metadata: {
      focusAreas: ['accessibility', 'product operations'],
      availability: ['weekend', 'ready_now'],
      metrics: { engagementScore: 0.81, hoursContributed: 210, missionsCompleted: 6 },
      impactNotes: ['Leads inclusive QA squads for volunteer missions.'],
      missions: [
        { id: 'mission-accessibility', title: 'Accessibility audit sprint', status: 'active' },
      ],
      languages: ['English'],
    },
  },
];

const SHIFT_BLUEPRINTS = [
  {
    roleIndex: 0,
    title: 'Mentor salon concierge shift',
    dayOffset: 5,
    startTime: '16:30',
    endTime: '20:00',
    timezone: 'America/New_York',
    location: 'Gigvora Studio · New York',
    capacity: 12,
    status: 'open',
    requirements: ['On-site presence', 'Experience hosting community events'],
  },
  {
    roleIndex: 1,
    title: 'Accessibility sprint remote pod',
    dayOffset: 6,
    startTime: '18:00',
    endTime: '21:00',
    timezone: 'America/Los_Angeles',
    location: 'Remote',
    capacity: 16,
    status: 'open',
    requirements: ['Laptop with screen reader tooling', 'Comfort with async coordination'],
  },
];

const ASSIGNMENT_BLUEPRINTS = [
  {
    email: 'leo@gigvora.com',
    roleIndex: 0,
    shiftIndex: 0,
    status: 'confirmed',
    availability: ['ready_now', 'weekday_evening'],
    focusAreas: ['mentorship', 'community'],
    skills: ['Facilitation', 'Storytelling'],
    languages: ['English'],
    metrics: { hoursContributed: 120, hoursThisMonth: 14, missionsCompleted: 5, engagementScore: 0.9 },
    impactNotes: ['Led concierge experience for the last three salons.'],
  },
  {
    email: 'ava@gigvora.com',
    roleIndex: 0,
    shiftIndex: 0,
    status: 'checked_in',
    availability: ['weekday_evening'],
    focusAreas: ['mentorship'],
    skills: ['Strategy', 'Mentorship'],
    languages: ['English'],
    metrics: { hoursContributed: 88, hoursThisMonth: 10, missionsCompleted: 3, engagementScore: 0.82 },
    impactNotes: ['Runs live case study debriefs for founder cohorts.'],
  },
  {
    email: 'riley@gigvora.com',
    roleIndex: 1,
    shiftIndex: 1,
    status: 'confirmed',
    availability: ['weekend', 'ready_now'],
    focusAreas: ['accessibility', 'product'],
    skills: ['QA', 'Operations'],
    languages: ['English'],
    metrics: { hoursContributed: 76, hoursThisMonth: 12, missionsCompleted: 4, engagementScore: 0.79 },
    impactNotes: ['Pairing volunteers with accessibility partners weekly.'],
  },
];

function computeDate(baseDate, offsetHours) {
  const start = new Date(baseDate);
  start.setHours(start.getHours() + offsetHours);
  return start;
}

function computeAgendaTimestamp(eventStart, minutes) {
  const base = new Date(eventStart);
  base.setMinutes(base.getMinutes() + minutes);
  return base;
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [owner] = await queryInterface.sequelize.query(
        'SELECT id FROM users WHERE email = :email LIMIT 1',
        {
          type: QueryTypes.SELECT,
          replacements: { email: OWNER_EMAIL },
          transaction,
        },
      );

      if (!owner?.id) {
        throw new Error('Community events seed requires the seeded mentor@gigvora.com user.');
      }

      const volunteerRows = await queryInterface.sequelize.query(
        'SELECT id, email FROM users WHERE email IN (:emails)',
        {
          type: QueryTypes.SELECT,
          replacements: { emails: VOLUNTEER_EMAILS },
          transaction,
        },
      );

      const volunteerMap = new Map(volunteerRows.map((row) => [row.email, row.id]));

      const ownerId = owner.id;
      const now = new Date();

      const [existingSettings] = await queryInterface.sequelize.query(
        'SELECT id FROM user_event_workspace_settings WHERE ownerId = :ownerId LIMIT 1',
        {
          type: QueryTypes.SELECT,
          replacements: { ownerId },
          transaction,
        },
      );

      if (!existingSettings?.id) {
        await queryInterface.bulkInsert(
          'user_event_workspace_settings',
          [
            {
              ownerId,
              includeArchivedByDefault: false,
              autoArchiveAfterDays: 90,
              defaultFormat: 'virtual',
              defaultVisibility: 'invite_only',
              defaultTimezone: 'America/New_York',
              requireCheckInNotes: false,
              allowedRoles: JSON.stringify(['mentor', 'volunteer', 'admin']),
              metadata: JSON.stringify({ seedSource: 'community-events-experience' }),
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const eventSlugs = EVENT_BLUEPRINTS.map((blueprint) => blueprint.slug);

      const existingEvents = await queryInterface.sequelize.query(
        'SELECT id FROM user_events WHERE slug IN (:slugs)',
        {
          type: QueryTypes.SELECT,
          replacements: { slugs: eventSlugs },
          transaction,
        },
      );

      const existingEventIds = existingEvents.map((row) => row.id);

      if (existingEventIds.length) {
        await queryInterface.bulkDelete(
          'user_event_agenda_items',
          { eventId: { [Op.in]: existingEventIds } },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'user_event_assets',
          { eventId: { [Op.in]: existingEventIds } },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'user_events',
          { id: { [Op.in]: existingEventIds } },
          { transaction },
        );
      }

      const eventRecords = EVENT_BLUEPRINTS.map((blueprint) => {
        const start = computeDate(now, blueprint.startOffsetHours ?? 72);
        const end = computeDate(start, (blueprint.durationMinutes ?? 90) / 60);
        return {
          ownerId,
          title: blueprint.title,
          slug: blueprint.slug,
          status: blueprint.status,
          format: blueprint.format,
          visibility: blueprint.visibility,
          timezone: blueprint.timezone,
          locationLabel: blueprint.locationLabel,
          locationAddress: blueprint.locationAddress ?? null,
          startAt: start,
          endAt: end,
          capacity: blueprint.capacity ?? null,
          registrationUrl: blueprint.registrationUrl ?? null,
          streamingUrl: blueprint.metadata?.livestreamUrl ?? blueprint.streamingUrl ?? null,
          bannerImageUrl: blueprint.bannerImageUrl ?? null,
          contactEmail: blueprint.contactEmail ?? 'community@gigvora.com',
          targetAudience: Array.isArray(blueprint.metadata?.audiences)
            ? blueprint.metadata.audiences.join(', ')
            : blueprint.targetAudience ?? null,
          description:
            blueprint.metadata?.summary ??
            blueprint.description ??
            'Community experience curated by the Gigvora network.',
          goals: blueprint.metadata?.goals ?? null,
          metadata: JSON.stringify({ ...blueprint.metadata, generatedAt: now.toISOString() }),
          createdAt: now,
          updatedAt: now,
        };
      });

      await queryInterface.bulkInsert('user_events', eventRecords, { transaction });

      const insertedEvents = await queryInterface.sequelize.query(
        'SELECT id, slug, startAt FROM user_events WHERE slug IN (:slugs)',
        {
          type: QueryTypes.SELECT,
          replacements: { slugs: eventSlugs },
          transaction,
        },
      );

      const eventIdMap = new Map(insertedEvents.map((row) => [row.slug, row]));

      const agendaRecords = [];
      const assetRecords = [];

      EVENT_BLUEPRINTS.forEach((blueprint, blueprintIndex) => {
        const eventRow = eventIdMap.get(blueprint.slug);
        if (!eventRow?.id) {
          return;
        }
        const eventStart = new Date(eventRow.startAt);

        (blueprint.agenda ?? []).forEach((item, index) => {
          const start = item.startOffsetMinutes != null
            ? computeAgendaTimestamp(eventStart, item.startOffsetMinutes)
            : eventStart;
          const end = item.durationMinutes
            ? computeAgendaTimestamp(start, item.durationMinutes)
            : computeAgendaTimestamp(start, 30);
          agendaRecords.push({
            eventId: eventRow.id,
            title: item.title,
            description: item.description ?? null,
            startAt: start,
            endAt: end,
            ownerName: item.ownerName ?? null,
            ownerEmail: item.ownerEmail ?? null,
            location: item.location ?? blueprint.locationLabel ?? null,
            orderIndex: index,
            metadata: JSON.stringify({ blueprintIndex, seedSource: 'community-events-experience' }),
            createdAt: now,
            updatedAt: now,
          });
        });

        (blueprint.assets ?? []).forEach((asset) => {
          assetRecords.push({
            eventId: eventRow.id,
            name: asset.name,
            assetType: asset.assetType ?? 'document',
            url: asset.url,
            thumbnailUrl: asset.thumbnailUrl ?? null,
            visibility: asset.visibility ?? 'internal',
            metadata: JSON.stringify({ seedSource: 'community-events-experience' }),
            createdAt: now,
            updatedAt: now,
          });
        });
      });

      if (agendaRecords.length) {
        await queryInterface.bulkInsert('user_event_agenda_items', agendaRecords, { transaction });
      }

      if (assetRecords.length) {
        await queryInterface.bulkInsert('user_event_assets', assetRecords, { transaction });
      }

      const [existingProgram] = await queryInterface.sequelize.query(
        'SELECT id FROM volunteer_programs WHERE name = :name LIMIT 1',
        {
          type: QueryTypes.SELECT,
          replacements: { name: PROGRAM_BLUEPRINT.name },
          transaction,
        },
      );

      let programId = existingProgram?.id ?? null;

      if (programId) {
        const existingRoleRows = await queryInterface.sequelize.query(
          'SELECT id FROM volunteering_roles WHERE programId = :programId',
          {
            type: QueryTypes.SELECT,
            replacements: { programId },
            transaction,
          },
        );
        const roleIds = existingRoleRows.map((row) => row.id);
        if (roleIds.length) {
          const shiftRows = await queryInterface.sequelize.query(
            'SELECT id FROM volunteer_shifts WHERE roleId IN (:roleIds)',
            {
              type: QueryTypes.SELECT,
              replacements: { roleIds },
              transaction,
            },
          );
          const shiftIds = shiftRows.map((row) => row.id);
          if (shiftIds.length) {
            await queryInterface.bulkDelete(
              'volunteer_assignments',
              { shiftId: { [Op.in]: shiftIds } },
              { transaction },
            );
          }
          await queryInterface.bulkDelete(
            'volunteer_shifts',
            { roleId: { [Op.in]: roleIds } },
            { transaction },
          );
        }
        await queryInterface.bulkDelete(
          'volunteering_roles',
          { programId },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'volunteer_programs',
          { id: programId },
          { transaction },
        );
        programId = null;
      }

      await queryInterface.bulkInsert(
        'volunteer_programs',
        [
          {
            name: PROGRAM_BLUEPRINT.name,
            summary: PROGRAM_BLUEPRINT.summary,
            status: PROGRAM_BLUEPRINT.status,
            contactEmail: 'impact@gigvora.com',
            location: PROGRAM_BLUEPRINT.location,
            tags: JSON.stringify(PROGRAM_BLUEPRINT.tags),
            startsAt: now,
            metadata: JSON.stringify({ ...PROGRAM_BLUEPRINT.metadata, seedSource: 'community-events-experience' }),
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      const [insertedProgram] = await queryInterface.sequelize.query(
        'SELECT id FROM volunteer_programs WHERE name = :name LIMIT 1',
        {
          type: QueryTypes.SELECT,
          replacements: { name: PROGRAM_BLUEPRINT.name },
          transaction,
        },
      );

      if (!insertedProgram?.id) {
        throw new Error('Failed to seed volunteer program for community experience.');
      }

      programId = insertedProgram.id;

      const roleRecords = ROLE_BLUEPRINTS.map((role, index) => ({
        programId,
        title: role.title,
        organization: role.organization,
        summary: role.summary ?? role.title,
        description:
          role.description ??
          `${role.title} supporting Gigvora community missions with high-signal volunteer engagement.`,
        status: role.status,
        remoteType: role.remoteType ?? 'hybrid',
        commitmentHours: role.commitmentHours ?? null,
        applicationUrl: role.applicationUrl ?? null,
        skills: JSON.stringify(role.skills ?? []),
        requirements: JSON.stringify(role.requirements ?? []),
        tags: JSON.stringify(role.tags ?? []),
        metadata: JSON.stringify({ ...role.metadata, blueprintIndex: index, seedSource: 'community-events-experience' }),
        createdAt: now,
        updatedAt: now,
      }));

      await queryInterface.bulkInsert('volunteering_roles', roleRecords, { transaction });

      const roleRows = await queryInterface.sequelize.query(
        'SELECT id FROM volunteering_roles WHERE programId = :programId ORDER BY id ASC',
        {
          type: QueryTypes.SELECT,
          replacements: { programId },
          transaction,
        },
      );

      const roleIdList = roleRows.map((row) => row.id);
      const shiftRecords = SHIFT_BLUEPRINTS.map((shift, index) => {
        const roleId = roleIdList[shift.roleIndex];
        const shiftDate = new Date(now);
        shiftDate.setDate(shiftDate.getDate() + shift.dayOffset);
        return {
          programId,
          roleId,
          title: shift.title,
          shiftDate,
          startTime: shift.startTime,
          endTime: shift.endTime,
          timezone: shift.timezone,
          location: shift.location,
          requirements: JSON.stringify(shift.requirements ?? []),
          capacity: shift.capacity ?? null,
          reserved: shift.reserved ?? null,
          status: shift.status,
          notes: `Seeded shift blueprint ${index + 1}`,
          createdAt: now,
          updatedAt: now,
        };
      });

      await queryInterface.bulkInsert('volunteer_shifts', shiftRecords, { transaction });

      const shiftRows = await queryInterface.sequelize.query(
        'SELECT id, roleId, title FROM volunteer_shifts WHERE roleId IN (:roleIds)',
        {
          type: QueryTypes.SELECT,
          replacements: { roleIds: roleIdList },
          transaction,
        },
      );

      const assignmentRecords = ASSIGNMENT_BLUEPRINTS.map((assignment) => {
        const roleId = roleIdList[assignment.roleIndex];
        const shiftBlueprint = SHIFT_BLUEPRINTS[assignment.shiftIndex];
        const shiftRow = shiftRows.find(
          (row) => row.roleId === roleId && row.title === shiftBlueprint.title,
        );
        const shiftId = shiftRow?.id ?? null;
        const volunteerId = volunteerMap.get(assignment.email) ?? null;
        const missionMeta = ROLE_BLUEPRINTS[assignment.roleIndex].metadata?.missions ?? [];

        return {
          shiftId,
          volunteerId,
          fullName: volunteerId ? null : assignment.email,
          email: assignment.email,
          status: assignment.status,
          notes: 'Seeded volunteer assignment for community events experience.',
          metadata: JSON.stringify({
            availability: assignment.availability,
            focusAreas: assignment.focusAreas,
            skills: assignment.skills,
            languages: assignment.languages,
            metrics: assignment.metrics,
            impactNotes: assignment.impactNotes,
            missions: missionMeta,
            engagementScore: assignment.metrics?.engagementScore ?? null,
            seedSource: 'community-events-experience',
          }),
          createdAt: now,
          updatedAt: now,
        };
      });

      await queryInterface.bulkInsert('volunteer_assignments', assignmentRecords, { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const eventSlugs = EVENT_BLUEPRINTS.map((blueprint) => blueprint.slug);

      const existingEvents = await queryInterface.sequelize.query(
        'SELECT id FROM user_events WHERE slug IN (:slugs)',
        {
          type: QueryTypes.SELECT,
          replacements: { slugs: eventSlugs },
          transaction,
        },
      );

      const eventIds = existingEvents.map((row) => row.id);

      if (eventIds.length) {
        await queryInterface.bulkDelete('user_event_agenda_items', { eventId: { [Op.in]: eventIds } }, { transaction });
        await queryInterface.bulkDelete('user_event_assets', { eventId: { [Op.in]: eventIds } }, { transaction });
        await queryInterface.bulkDelete('user_events', { id: { [Op.in]: eventIds } }, { transaction });
      }

      const [program] = await queryInterface.sequelize.query(
        'SELECT id FROM volunteer_programs WHERE name = :name LIMIT 1',
        {
          type: QueryTypes.SELECT,
          replacements: { name: PROGRAM_BLUEPRINT.name },
          transaction,
        },
      );

      if (program?.id) {
        const roleRows = await queryInterface.sequelize.query(
          'SELECT id FROM volunteering_roles WHERE programId = :programId',
          {
            type: QueryTypes.SELECT,
            replacements: { programId: program.id },
            transaction,
          },
        );
        const roleIds = roleRows.map((row) => row.id);
        if (roleIds.length) {
          const shiftRows = await queryInterface.sequelize.query(
            'SELECT id FROM volunteer_shifts WHERE roleId IN (:roleIds)',
            {
              type: QueryTypes.SELECT,
              replacements: { roleIds },
              transaction,
            },
          );
          const shiftIds = shiftRows.map((row) => row.id);
          if (shiftIds.length) {
            await queryInterface.bulkDelete('volunteer_assignments', { shiftId: { [Op.in]: shiftIds } }, { transaction });
          }
          await queryInterface.bulkDelete('volunteer_shifts', { roleId: { [Op.in]: roleIds } }, { transaction });
        }
        await queryInterface.bulkDelete('volunteering_roles', { programId: program.id }, { transaction });
        await queryInterface.bulkDelete('volunteer_programs', { id: program.id }, { transaction });
      }
    });
  },
};
