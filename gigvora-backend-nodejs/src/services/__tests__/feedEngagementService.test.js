import { jest } from '@jest/globals';

describe('feedEngagementService.getFeedInsights', () => {
  const profileFindOne = jest.fn();
  const groupMembershipFindAll = jest.fn();
  const connectionFindAll = jest.fn();
  const groupFindAll = jest.fn();
  const feedPostFindAll = jest.fn();
  const userFindAll = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    profileFindOne.mockResolvedValue({
      userId: 10,
      skills: 'Product Strategy, Automation',
      headline: 'Director of Operations',
      location: 'Berlin, Germany',
      followersCount: 8,
      likesCount: 15,
    });

    groupMembershipFindAll
      .mockResolvedValueOnce([
        {
          groupId: 1,
          status: 'active',
          group: {
            id: 1,
            name: 'Marketplace founders circle',
            metadata: { focus: ['product strategy', 'operations'] },
          },
        },
        {
          groupId: 3,
          status: 'pending',
          group: {
            id: 3,
            name: 'Purpose lab climate alliance',
            metadata: { focus: ['sustainability', 'volunteering'] },
          },
        },
      ])
      .mockResolvedValueOnce([
        {
          groupId: 2,
          group: {
            id: 2,
            name: 'Launchpad alumni guild',
            metadata: { focus: ['experience launchpad', 'mentoring'] },
          },
          member: {
            id: 42,
            firstName: 'Haruto',
            lastName: 'Sato',
            email: 'haruto.company.demo@gigvora.com',
            Profile: {
              headline: 'Head of Product · Signal Eight',
              followersCount: 12,
              likesCount: 21,
              location: 'Tokyo, Japan',
              experienceEntries: [{ company: 'Signal Eight' }],
            },
          },
        },
      ])
      .mockResolvedValue([]);

    connectionFindAll.mockResolvedValue([
      { requesterId: 10, addresseeId: 7, status: 'accepted' },
      { requesterId: 8, addresseeId: 10, status: 'pending' },
    ]);

    groupFindAll.mockResolvedValue([
      {
        id: 2,
        name: 'Launchpad alumni guild',
        description: 'Demo day share-outs.',
        memberPolicy: 'open',
        metadata: { focus: ['experience launchpad', 'mentoring'], location: 'Europe · Remote' },
        memberCount: 860,
      },
      {
        id: 4,
        name: 'Automation builders collective',
        description: 'Automation runbooks and telemetry playbooks.',
        memberPolicy: 'open',
        metadata: { focus: ['automation', 'ai'], location: 'Remote' },
        memberCount: 540,
      },
    ]);

    feedPostFindAll.mockResolvedValue([
      {
        id: 501,
        type: 'project',
        title: 'Release candidate 1.50 ready for staging',
        summary: 'Runtime security enhancements ship this week.',
        createdAt: new Date('2024-05-01T09:15:00Z'),
        User: {
          id: 20,
          firstName: 'Ava',
          lastName: 'Founder',
          Profile: { headline: 'Gigvora Platform Ops' },
        },
      },
      {
        id: 502,
        type: 'volunteering',
        content: 'Purpose Lab opened 12 new slots for mentors.',
        createdAt: new Date('2024-05-01T08:30:00Z'),
        User: {
          id: 21,
          firstName: 'Mia',
          lastName: 'Operations',
          Profile: { headline: 'Director of Operations' },
        },
      },
    ]);

    userFindAll.mockResolvedValue([
      {
        id: 55,
        firstName: 'Nova',
        lastName: 'Chen',
        email: 'nova.chen@gigvora.com',
        Profile: {
          headline: 'Product Marketing Lead',
          followersCount: 18,
          likesCount: 34,
          location: 'Lisbon, Portugal',
          experienceEntries: [{ company: 'Nova Labs' }],
        },
      },
    ]);

    jest.unstable_mockModule('../models/index.js', () => ({
      Profile: { findOne: profileFindOne },
      GroupMembership: { findAll: groupMembershipFindAll },
      Connection: { findAll: connectionFindAll },
      Group: { findAll: groupFindAll },
      FeedPost: { findAll: feedPostFindAll },
      User: { findAll: userFindAll },
    }));
  });

  it('returns structured insights with connections, groups, and live moments', async () => {
    const { getFeedInsights } = await import('../feedEngagementService.js');

    const insights = await getFeedInsights({ viewerId: 10, limit: 6 });

    expect(profileFindOne).toHaveBeenCalledWith({ where: { userId: 10 }, transaction: undefined });
    expect(groupMembershipFindAll).toHaveBeenCalledTimes(2);
    expect(connectionFindAll).toHaveBeenCalledTimes(1);
    expect(groupFindAll).toHaveBeenCalledTimes(1);
    expect(feedPostFindAll).toHaveBeenCalledTimes(1);
    expect(userFindAll).toHaveBeenCalledTimes(1);

    expect(insights.generatedAt).toBeTruthy();
    expect(Array.isArray(insights.interests)).toBe(true);
    expect(insights.interests.length).toBeGreaterThan(0);

    expect(insights.connectionSuggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 42,
          status: 'available',
          sharedGroups: ['Launchpad alumni guild'],
        }),
        expect.objectContaining({
          userId: 55,
          status: 'available',
        }),
      ]),
    );

    expect(insights.groupSuggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          groupId: 2,
          status: 'available',
          focus: expect.arrayContaining(['experience launchpad', 'mentoring']),
        }),
        expect.objectContaining({
          groupId: 4,
          status: 'available',
        }),
      ]),
    );

    const pendingGroup = insights.groupSuggestions.find((group) => group.groupId === 3);
    expect(pendingGroup).toBeUndefined();

    expect(insights.liveMoments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'post:501',
          tag: 'Project',
        }),
      ]),
    );
  });
});
