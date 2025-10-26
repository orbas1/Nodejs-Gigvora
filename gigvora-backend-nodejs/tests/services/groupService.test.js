import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';

const serviceModulePath = '../../src/services/groupService.js';
const modelsModulePath = new URL('../../src/models/index.js', import.meta.url).pathname;

describe('groupService blueprint hydration helpers', () => {
  let __testing;

  beforeEach(async () => {
    jest.resetModules();
    ({ __testing } = await import(serviceModulePath));
  });

  it('merges blueprint and metadata into discussion board and resource library payloads', () => {
    const { mapGroupRecord, GROUP_BLUEPRINTS } = __testing;

    const blueprint = GROUP_BLUEPRINTS[0];
    const now = new Date().toISOString();

    const metadataBoard = {
      ...blueprint.discussionBoard,
      tags: [...(blueprint.discussionBoard?.tags ?? []), 'Meta'],
      threads: [
        ...(blueprint.discussionBoard?.threads ?? []),
        {
          id: 'meta-thread',
          title: 'Metadata deep dive',
          excerpt: 'Synthesising new feedback loops from the pilot cohort.',
          category: 'Operations',
          replies: 3,
          participants: 4,
          tags: ['Meta'],
          lastActivityAt: now,
        },
      ],
    };

    const metadataLibrary = {
      ...blueprint.resourceLibrary,
      items: [
        ...(blueprint.resourceLibrary?.items ?? []),
        {
          id: 'meta-resource',
          title: 'Metadata Activation Guide',
          format: 'Guide',
          tags: ['Meta'],
          url: 'https://resources.gigvora.com/meta-guide',
          metrics: { saves: 9, downloads24h: 3 },
        },
      ],
    };

    const group = {
      id: 902,
      name: blueprint.name,
      description: blueprint.summary,
      memberPolicy: 'request',
      avatarColor: '#2563eb',
      settings: {},
      metadata: {
        summary: 'Custom collective summary.',
        focusAreas: ['Experimental Growth'],
        metrics: { weeklyActiveMembers: 512, opportunitiesSharedThisWeek: 42 },
        insights: { signalStrength: 'surging', trendingTopics: ['AI copilots', 'Community monetisation'] },
        discussionBoard: metadataBoard,
        resourceLibrary: metadataLibrary,
        resources: [
          ...(blueprint.resources ?? []),
          {
            id: 'meta-resource',
            title: 'Metadata Activation Guide',
            type: 'Guide',
            url: 'https://resources.gigvora.com/meta-guide',
          },
        ],
      },
    };

    const record = mapGroupRecord(group, {
      memberCount: 128,
      membership: {
        status: 'active',
        role: 'member',
        joinedAt: now,
        metadata: { notifications: { digest: false, newThread: true, upcomingEvent: false } },
      },
      blueprint,
    });

    expect(record.discussionBoard.threads).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'meta-thread', tags: expect.arrayContaining(['Meta']) })]),
    );
    expect(record.discussionBoard.tags).toEqual(
      expect.arrayContaining([...blueprint.discussionBoard.tags, 'Meta']),
    );
    expect(record.resourceLibrary.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'meta-resource', metrics: expect.objectContaining({ saves: 9 }) })]),
    );
    expect(record.resourceLibrary.stats.totalItems).toBeGreaterThan(blueprint.resourceLibrary.items.length);
    expect(record.resources).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'meta-resource', type: 'Guide', url: 'https://resources.gigvora.com/meta-guide' })]),
    );
  });

  it('builds membership state preserving notification preferences', () => {
    const { buildMembershipState } = __testing;
    const membership = {
      status: 'active',
      role: 'moderator',
      joinedAt: new Date().toISOString(),
      metadata: { notifications: { digest: false, newThread: true, upcomingEvent: false } },
    };

    const state = buildMembershipState({ membership, joinPolicy: 'moderated' });

    expect(state.status).toBe('member');
    expect(state.role).toBe('moderator');
    expect(state.preferences.notifications).toEqual({ digest: false, newThread: true, upcomingEvent: false });
  });

  it('computes engagement score using live metrics', () => {
    const { computeEngagementScore } = __testing;

    const engagement = computeEngagementScore({
      memberCount: 200,
      metrics: { weeklyActiveMembers: 180, conversationVelocity: 0.62 },
    });

    expect(engagement).toBeGreaterThan(0.62);
    expect(engagement).toBeLessThanOrEqual(1);
  });
});

describe('groupService integration with hydrated collaboration data', () => {
  let groupService;
  let __testing;
  let blueprint;

  let groupsById;
  let groupsByName;
  let memberships;
  let posts;
  let basePosts;
  let users;
  let nextGroupId;
  let nextMembershipId;

  let createMembershipRecord;

  const actorId = 42;

  const clone = (value) => {
    if (typeof globalThis.structuredClone === 'function') {
      return globalThis.structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
  };

  const createBasePosts = () => {
    const now = new Date();
    const pinnedAt = new Date(now.getTime() - 20 * 60 * 1000);
    const recent = new Date(now.getTime() - 10 * 60 * 1000);

    return [
      {
        id: 'db-pinned',
        title: 'Pinned: Velocity playbook drop',
        summary: 'Fresh playbook from leadership circle.',
        content: 'Detailed breakdown on the latest playbook drop.',
        slug: 'db-pinned',
        status: 'published',
        metadata: {
          pinned: true,
          tags: ['Announcements', 'Playbooks'],
          replyCount: 6,
          participantIds: [7, 91, 92],
          lastActivityAt: recent.toISOString(),
          medianReplyMinutes: 45,
          isAnswered: true,
        },
        createdAt: pinnedAt,
        updatedAt: recent,
        publishedAt: pinnedAt,
        createdById: 91,
        createdBy: { id: 91, firstName: 'Dana', lastName: 'Program', email: 'dana@gigvora.test', userType: 'user' },
      },
      {
        id: 'db-thread',
        title: 'Looking for automation partners',
        summary: 'Who has implemented async stand-ups at scale?',
        content: 'We need experiences with async ceremonies when scaling operations.',
        slug: 'db-thread',
        status: 'published',
        metadata: {
          tags: ['Operations'],
          replyCount: 3,
          participantIds: [7, actorId],
          appreciations: 12,
          lastActivityAt: now.toISOString(),
          lastReplyAt: now.toISOString(),
          isUnresolved: true,
        },
        createdAt: new Date(now.getTime() - 30 * 60 * 1000),
        updatedAt: now,
        publishedAt: new Date(now.getTime() - 30 * 60 * 1000),
        createdById: 92,
        createdBy: { id: 92, firstName: 'Miguel', lastName: 'Ops', email: 'miguel@gigvora.test', userType: 'mentor' },
      },
    ];
  };

  const slugifyName = (value) =>
    value
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);

  const extractLookupValue = (candidate) => {
    if (!candidate) {
      return null;
    }
    if (typeof candidate === 'string') {
      return candidate;
    }
    const keys = Object.keys(candidate);
    for (const key of keys) {
      const value = candidate[key];
      if (typeof value === 'string') {
        return value;
      }
    }
    const symbols = Object.getOwnPropertySymbols(candidate);
    for (const symbol of symbols) {
      const value = candidate[symbol];
      if (typeof value === 'string') {
        return value;
      }
    }
    return null;
  };

  beforeEach(async () => {
    jest.resetModules();

    groupsById = new Map();
    groupsByName = new Map();
    memberships = [];
    posts = [];
    basePosts = createBasePosts();
    users = new Map([
      [
        actorId,
        {
          id: actorId,
          firstName: 'Casey',
          lastName: 'Builder',
          email: 'casey@gigvora.test',
          userType: 'user',
        },
      ],
      [
        7,
        {
          id: 7,
          firstName: 'Ava',
          lastName: 'Chen',
          email: 'ava@gigvora.test',
          userType: 'user',
        },
      ],
      [
        91,
        {
          id: 91,
          firstName: 'Dana',
          lastName: 'Program',
          email: 'dana@gigvora.test',
          userType: 'user',
        },
      ],
      [
        92,
        {
          id: 92,
          firstName: 'Miguel',
          lastName: 'Ops',
          email: 'miguel@gigvora.test',
          userType: 'mentor',
        },
      ],
    ]);

    nextGroupId = 1;
    nextMembershipId = 1;

    const modelsModule = await import(modelsModulePath);

    const createGroupRecord = (payload = {}) => {
      const snapshot = clone(payload);
      const record = {
        id: snapshot.id ?? nextGroupId++,
        name: snapshot.name,
        slug: snapshot.slug ?? slugifyName(snapshot.name ?? `group-${nextGroupId}`),
        description: snapshot.description ?? null,
        avatarColor: snapshot.avatarColor ?? '#2563eb',
        memberPolicy: snapshot.memberPolicy ?? 'request',
        visibility: snapshot.visibility ?? 'public',
        settings: clone(snapshot.settings ?? {}),
        metadata: clone(snapshot.metadata ?? {}),
        createdAt: snapshot.createdAt ?? new Date().toISOString(),
        updatedAt: snapshot.updatedAt ?? new Date().toISOString(),
        async save() {
          this.updatedAt = new Date().toISOString();
          groupsById.set(this.id, this);
          groupsByName.set(this.name, this);
          return this;
        },
      };

      groupsById.set(record.id, record);
      groupsByName.set(record.name, record);
      return record;
    };

    const ensureBaselineMembership = (group) => {
      const existing = memberships.find((membership) => membership.groupId === group.id && membership.userId === 7);
      if (!existing) {
        createMembershipRecord({
          groupId: group.id,
          userId: 7,
          role: 'member',
          status: 'active',
          joinedAt: new Date().toISOString(),
          metadata: { notifications: { digest: true, newThread: true, upcomingEvent: true } },
        });
      }
    };

    const seedGroupPosts = (group) => {
      posts = basePosts.map((post) => ({
        ...clone(post),
        groupId: group.id,
      }));
    };

    const augmentGroup = (group) => {
      if (group.name !== 'Future of Work Collective') {
        return;
      }

      const metadata = clone(group.metadata ?? {});

      const existingThreads = Array.isArray(metadata.discussionBoard?.threads)
        ? [...metadata.discussionBoard.threads]
        : [];
      const existingPinned = Array.isArray(metadata.discussionBoard?.pinned)
        ? [...metadata.discussionBoard.pinned]
        : [];

      metadata.discussionBoard = {
        ...metadata.discussionBoard,
        threads: existingThreads.concat([
          {
            id: 'meta-thread',
            title: 'Metadata activation clinics',
            excerpt: 'Summaries from this week’s metadata activation office hours.',
            category: 'Operations',
            author: { name: 'System Curator' },
            replies: 6,
            participants: 5,
            upvotes: 14,
            tags: ['Meta'],
            lastActivityAt: new Date().toISOString(),
            isAnswered: true,
            url: 'https://community.gigvora.com/future-of-work-collective/meta',
          },
        ]),
        pinned: existingPinned,
      };
      metadata.discussionBoard.tags = Array.from(
        new Set([...(metadata.discussionBoard?.tags ?? []), 'Meta']),
      );

      const existingLibraryItems = Array.isArray(metadata.resourceLibrary?.items)
        ? [...metadata.resourceLibrary.items]
        : [];
      metadata.resourceLibrary = {
        ...metadata.resourceLibrary,
        items: existingLibraryItems.concat([
          {
            id: 'meta-resource',
            title: 'Metadata Activation Guide',
            summary: 'Implementation playbook for blueprint-driven collaboration hubs.',
            format: 'Guide',
            tags: ['Meta'],
            url: 'https://resources.gigvora.com/meta-guide',
            metrics: { saves: 27, downloads24h: 8 },
          },
        ]),
      };

      const legacyResources = Array.isArray(metadata.resources) ? [...metadata.resources] : [];
      metadata.resources = legacyResources.concat([
        {
          id: 'meta-resource',
          title: 'Metadata Activation Guide',
          type: 'Guide',
          url: 'https://resources.gigvora.com/meta-guide',
        },
      ]);

      group.metadata = metadata;

      ensureBaselineMembership(group);
      seedGroupPosts(group);
    };

    const matchesWhere = (record, where = {}) =>
      Object.entries(where).every(([field, value]) => {
        if (value == null) {
          return true;
        }
        const candidate = record[field];
        if (Array.isArray(value)) {
          return value.some((entry) => entry === candidate || Number(entry) === Number(candidate));
        }
        return value === candidate || Number(value) === Number(candidate);
      });

    const createAggregateRow = (field, value, count) => ({
      get: (key) => {
        if (key === field) {
          return value;
        }
        if (key === 'count') {
          return count;
        }
        return undefined;
      },
    });

    createMembershipRecord = (payload = {}) => {
      const record = {
        id: payload.id ?? nextMembershipId++,
        groupId: Number(payload.groupId),
        userId: Number(payload.userId),
        role: payload.role ?? 'member',
        status: payload.status ?? 'pending',
        joinedAt: payload.joinedAt ?? null,
        invitedById: payload.invitedById ?? null,
        notes: payload.notes ?? null,
        metadata: clone(payload.metadata ?? {}),
        createdAt: payload.createdAt ?? new Date().toISOString(),
        updatedAt: payload.updatedAt ?? new Date().toISOString(),
        async save() {
          this.updatedAt = new Date().toISOString();
          return this;
        },
        async reload() {
          return this;
        },
        async destroy() {
          memberships = memberships.filter((membership) => membership !== this);
        },
        get: ({ plain } = {}) => {
          const snapshot = {
            id: record.id,
            groupId: record.groupId,
            userId: record.userId,
            role: record.role,
            status: record.status,
            joinedAt: record.joinedAt,
            invitedById: record.invitedById,
            notes: record.notes,
            metadata: clone(record.metadata),
          };
          return plain ? snapshot : snapshot;
        },
      };

      memberships.push(record);
      return record;
    };

    const findExistingMembership = (where = {}) =>
      memberships.find((membership) => matchesWhere(membership, where)) ?? null;

    const GroupMock = {
      findOrCreate: jest.fn(async ({ where, defaults }) => {
        const name = where?.name;
        let record = name ? groupsByName.get(name) : null;
        let created = false;

        if (!record) {
          const payload = {
            ...clone(defaults ?? {}),
            name,
          };
          record = createGroupRecord(payload);
          created = true;
        }

        augmentGroup(record);

        return [record, created];
      }),
      findByPk: jest.fn(async (id) => groupsById.get(Number(id)) ?? null),
      findOne: jest.fn(async ({ where } = {}) => {
        if (!where) {
          return null;
        }
        if (where.name) {
          const candidate = extractLookupValue(where.name);
          if (candidate) {
            return groupsByName.get(candidate) ?? null;
          }
        }
        if (where.slug) {
          const candidate = extractLookupValue(where.slug);
          if (candidate) {
            const slug = candidate.toLowerCase();
            for (const record of groupsById.values()) {
              if ((record.slug ?? '').toLowerCase() === slug) {
                return record;
              }
            }
          }
        }
        return null;
      }),
      create: jest.fn(async (payload) => createGroupRecord(payload)),
      findAll: jest.fn(async () => Array.from(groupsById.values())),
    };

    const GroupMembershipMock = {
      findOrCreate: jest.fn(async ({ where, defaults }) => {
        const record = findExistingMembership(where);
        if (record) {
          return [record, false];
        }
        const created = createMembershipRecord({
          ...clone(defaults ?? {}),
          groupId: where?.groupId,
          userId: where?.userId,
        });
        return [created, true];
      }),
      findAll: jest.fn(async ({ where, group } = {}) => {
        const filtered = memberships.filter((membership) => matchesWhere(membership, where ?? {}));
        if (Array.isArray(group) && group.length === 1) {
          const field = group[0];
          const aggregate = new Map();
          filtered.forEach((membership) => {
            const key = membership[field];
            aggregate.set(key, (aggregate.get(key) ?? 0) + 1);
          });
          return Array.from(aggregate.entries()).map(([value, count]) => createAggregateRow(field, value, count));
        }
        return filtered;
      }),
      findOne: jest.fn(async ({ where } = {}) => findExistingMembership(where)),
      destroy: jest.fn(async ({ where } = {}) => {
        const before = memberships.length;
        memberships = memberships.filter((membership) => !matchesWhere(membership, where ?? {}));
        return before - memberships.length;
      }),
      findByPk: jest.fn(async (id) => memberships.find((membership) => membership.id === Number(id)) ?? null),
      findAndCountAll: jest.fn(async () => ({ count: memberships.length, rows: memberships })),
    };

    const GroupPostMock = {
      findAll: jest.fn(async ({ where, limit } = {}) => {
        const filtered = posts
          .filter((post) => {
            if (where?.groupId && Number(post.groupId) !== Number(where.groupId)) {
              return false;
            }
            if (where?.status && post.status !== where.status) {
              return false;
            }
            return true;
          })
          .sort((a, b) => {
            const aTime = new Date(a.publishedAt ?? a.createdAt).getTime();
            const bTime = new Date(b.publishedAt ?? b.createdAt).getTime();
            return bTime - aTime;
          })
          .slice(0, limit ?? posts.length)
          .map((post) => ({
            ...clone(post),
            get: ({ plain } = {}) => {
              const snapshot = clone(post);
              return plain ? snapshot : snapshot;
            },
          }));

        return filtered;
      }),
    };

    const UserMock = {
      findByPk: jest.fn(async (id) => users.get(Number(id)) ?? null),
    };

    modelsModule.__setModelStubs({
      Group: GroupMock,
      GroupMembership: GroupMembershipMock,
      GroupPost: GroupPostMock,
      User: UserMock,
    });

    modelsModule.sequelize.transaction = jest.fn(async (handler) => handler({}));

    const serviceModule = await import(serviceModulePath);
    groupService = serviceModule.default;
    __testing = serviceModule.__testing;
    blueprint = __testing.GROUP_BLUEPRINTS.find((item) => item.key === 'future-of-work-collective');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('composes group profile with merged discussion board threads and resources', async () => {
    const profile = await groupService.getGroupProfile('future-of-work-collective', { actorId });

    expect(profile.slug).toBe('future-of-work-collective');
    expect(profile.discussionBoard.pinned.map((thread) => thread.id)).toEqual(
      expect.arrayContaining(['fowc-manifesto', 'fowc-trend-report', 'db-pinned']),
    );
    expect(profile.discussionBoard.threads.map((thread) => thread.id)).toEqual(
      expect.arrayContaining(['fowc-ai-sprints', 'meta-thread', 'db-thread']),
    );
    expect(profile.discussionBoard.tags).toEqual(expect.arrayContaining(['Announcements', 'Meta', 'Operations']));
    expect(profile.discussionBoard.health.responseTime).toBe('45m');
    expect(profile.discussionBoard.stats.activeContributors).toBeGreaterThanOrEqual(3);

    expect(profile.resourceLibrary.items.some((item) => item.id === 'meta-resource')).toBe(true);
    expect(profile.resourceLibrary.stats.totalItems).toBeGreaterThan(blueprint.resourceLibrary.items.length);
    expect(profile.resources).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'meta-resource', url: 'https://resources.gigvora.com/meta-guide' })]),
    );
    expect(profile.membership.status).toBe('not_member');
    expect(profile.membershipBreakdown).toEqual(
      expect.arrayContaining([expect.objectContaining({ role: 'member', count: expect.any(Number) })]),
    );
  });

  it('promotes pending membership to active when joining a moderated group', async () => {
    const initialProfile = await groupService.getGroupProfile('future-of-work-collective', { actorId });

    const pendingMembership = createMembershipRecord({
      groupId: initialProfile.id,
      userId: actorId,
      role: 'member',
      status: 'pending',
      metadata: {},
    });

    const updatedProfile = await groupService.joinGroup('future-of-work-collective', { actorId });

    expect(updatedProfile.membership.status).toBe('member');
    expect(updatedProfile.membership.role).toBe('member');
    expect(updatedProfile.membership.preferences.notifications).toEqual({
      digest: true,
      newThread: true,
      upcomingEvent: true,
    });

    expect(pendingMembership.status).toBe('active');
    expect(pendingMembership.joinedAt).not.toBeNull();
    expect(pendingMembership.metadata.notifications).toEqual({
      digest: true,
      newThread: true,
      upcomingEvent: true,
    });
  });

  it('removes membership records when leaving a group', async () => {
    await groupService.joinGroup('future-of-work-collective', { actorId });

    const departureProfile = await groupService.leaveGroup('future-of-work-collective', { actorId });

    expect(departureProfile.membership.status).toBe('not_member');
    expect(memberships.find((membership) => membership.userId === actorId)).toBeUndefined();
  });
});
