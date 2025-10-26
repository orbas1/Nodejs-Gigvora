import { jest } from '@jest/globals';

import {
  __setModelStubs,
  sequelize as modelSequelize,
  MentorProfile,
  MentorAvailabilitySlot,
  MentorPackage,
  MentorReview,
  MentorshipOrder,
  User,
} from '../../../tests/stubs/modelsIndexStub.js';

import { listMentors } from '../discoveryService.js';

function buildRow(data) {
  return {
    ...data,
    get: ({ plain } = {}) => (plain ? { ...data } : data),
  };
}

describe('discoveryService.listMentors', () => {
  let mentorProfileStub;
  let mentorAvailabilityStub;
  let mentorPackageStub;
  let mentorReviewStub;
  let mentorshipOrderStub;
  let userStub;

  beforeEach(() => {
    mentorProfileStub = {
      findAndCountAll: jest.fn(),
      findAll: jest.fn(),
      sequelize: modelSequelize,
    };

    mentorAvailabilityStub = { findAll: jest.fn() };
    mentorPackageStub = { findAll: jest.fn() };
    mentorReviewStub = { findAll: jest.fn() };
    mentorshipOrderStub = { findAll: jest.fn() };
    userStub = { findAll: jest.fn() };

    __setModelStubs({
      MentorProfile: mentorProfileStub,
      MentorAvailabilitySlot: mentorAvailabilityStub,
      MentorPackage: mentorPackageStub,
      MentorReview: mentorReviewStub,
      MentorshipOrder: mentorshipOrderStub,
      User: userStub,
    });

    MentorProfile.findAndCountAll = mentorProfileStub.findAndCountAll.bind(mentorProfileStub);
    MentorProfile.findAll = mentorProfileStub.findAll.bind(mentorProfileStub);
    MentorProfile.sequelize = mentorProfileStub.sequelize;
    MentorAvailabilitySlot.findAll = mentorAvailabilityStub.findAll.bind(mentorAvailabilityStub);
    MentorPackage.findAll = mentorPackageStub.findAll.bind(mentorPackageStub);
    MentorReview.findAll = mentorReviewStub.findAll.bind(mentorReviewStub);
    MentorshipOrder.findAll = mentorshipOrderStub.findAll.bind(mentorshipOrderStub);
    User.findAll = userStub.findAll.bind(userStub);
  });

  it('hydrates mentors with availability, packages, metrics, and filters', async () => {
    const mentorProfiles = [
      buildRow({
        id: 1,
        userId: 101,
        slug: 'jordan-patel',
        name: 'Jordan Patel',
        headline: 'Product strategy mentor & former CPO',
        bio: 'Scaled marketplaces from seed to Series C.',
        region: 'London, United Kingdom',
        discipline: 'Product Leadership',
        expertise: ['Roadmapping', 'Storytelling'],
        industries: ['Marketplaces', 'SaaS'],
        languages: ['English', 'French'],
        goalTags: ['Fundraising narrative', 'Executive storytelling'],
        packages: [
          {
            id: 'pkg-profile',
            name: 'Leadership Pod',
            description: 'Weekly 60-minute calls for six weeks.',
            price: 1800,
            currency: 'GBP',
            sessions: 6,
          },
        ],
        testimonials: [
          { quote: 'Transformed our product storytelling.', author: 'COO at Pathlight' },
        ],
        sessionFeeAmount: 280,
        sessionFeeCurrency: 'GBP',
        priceTier: 'tier_growth',
        availabilityStatus: 'open',
        availabilityNotes: 'Prefers Tuesdays and Thursdays.',
        responseTimeHours: 6,
        reviewCount: 48,
        rating: 4.93,
        verificationBadge: 'Verified mentor',
        testimonialHighlight: 'Helped unlock our roadmap narrative.',
        testimonialHighlightAuthor: 'Linh Tran, COO',
        promoted: true,
        rankingScore: 96.5,
        updatedAt: '2024-10-12T10:00:00.000Z',
        createdAt: '2024-04-02T08:00:00.000Z',
      }),
    ];

    mentorProfileStub.findAndCountAll.mockResolvedValue({ rows: mentorProfiles, count: mentorProfiles.length });
    mentorProfileStub.findAll
      .mockResolvedValueOnce([{ discipline: 'Product Leadership', count: '2' }])
      .mockResolvedValueOnce([{ priceTier: 'tier_growth', count: '1' }])
      .mockResolvedValueOnce([{ availabilityStatus: 'open', count: '1' }]);

    userStub.findAll.mockResolvedValue([
      buildRow({
        id: 101,
        firstName: 'Jordan',
        lastName: 'Patel',
        email: 'jordan@gigvora.test',
        title: 'Chief Product Officer',
        Profile: {
          headline: 'Mentor | Former CPO',
          timezone: 'Europe/London',
          availabilityStatus: 'open',
          location: 'London',
          avatarUrl: 'https://cdn.gigvora.test/mentors/jordan.jpg',
        },
      }),
    ]);

    mentorAvailabilityStub.findAll.mockResolvedValue([
      {
        id: 'slot-1',
        mentorId: 101,
        startTime: '2030-03-04T10:00:00.000Z',
        endTime: '2030-03-04T11:00:00.000Z',
        format: '1:1 Session',
        capacity: 1,
      },
    ]);

    mentorPackageStub.findAll.mockResolvedValue([
      {
        mentorId: 101,
        id: 'pkg-db',
        name: 'Executive Storytelling Sprint',
        description: 'Three-session package focused on board narrative.',
        price: 950,
        currency: 'GBP',
        sessions: 3,
      },
    ]);

    mentorReviewStub.findAll.mockResolvedValue([
      { mentorId: 101, total: '48', average: '4.93', positive: '45' },
    ]);

    mentorshipOrderStub.findAll.mockResolvedValue([
      { mentorId: 101, userId: 2001, sessionsPurchased: 6, sessionsRedeemed: 5 },
      { mentorId: 101, userId: 2002, sessionsPurchased: 2, sessionsRedeemed: 2 },
    ]);

    const result = await listMentors({
      page: 1,
      pageSize: 12,
      includeFacets: true,
      filters: JSON.stringify({
        priceTier: ['tier_growth'],
        availability: ['open'],
      }),
    });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);

    const mentor = result.items[0];
    expect(mentor.languages).toEqual(['English', 'French']);
    expect(mentor.industries).toEqual(['Marketplaces', 'SaaS']);
    expect(mentor.goals).toEqual(['Fundraising narrative', 'Executive storytelling']);
    expect(mentor.availabilitySlots).toHaveLength(1);
    expect(mentor.availabilitySlots[0]).toEqual(
      expect.objectContaining({
        mentorId: 101,
        start: '2030-03-04T10:00:00.000Z',
        end: '2030-03-04T11:00:00.000Z',
        label: expect.stringContaining('10'),
      }),
    );

    expect(mentor.sessionTypes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'session-1',
          kind: 'single',
          price: expect.stringMatching(/£\s?280/),
        }),
        expect.objectContaining({
          id: 'pkg-db',
          kind: 'package',
          priceAmount: 950,
        }),
      ]),
    );

    expect(mentor.metrics).toEqual(
      expect.objectContaining({
        reviewCount: 48,
        rating: 4.93,
        sessionsPurchased: 8,
        sessionsRedeemed: 7,
        menteesServed: 2,
        responseTimeHours: 6,
      }),
    );

    expect(result.facets).toEqual({
      discipline: [
        { value: 'Product Leadership', label: 'Product Leadership', count: 2 },
      ],
      priceTier: [
        { value: 'tier_growth', label: '£150-£300/session', count: 1 },
      ],
      availability: [
        { value: 'open', label: 'Open slots', count: 1 },
      ],
    });

    expect(result.meta).toEqual(
      expect.objectContaining({
        total: 1,
        page: 1,
        pageSize: 12,
        totalPages: 1,
        hasMore: false,
      }),
    );

    expect(mentorProfileStub.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 12, offset: 0 }),
    );
    expect(mentorAvailabilityStub.findAll).toHaveBeenCalled();
    expect(mentorPackageStub.findAll).toHaveBeenCalled();
    expect(mentorReviewStub.findAll).toHaveBeenCalled();
    expect(mentorshipOrderStub.findAll).toHaveBeenCalled();
  });
});
