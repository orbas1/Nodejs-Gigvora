process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.ADMIN_MANAGEMENT_MINIMAL_BOOTSTRAP = 'true';

import '../setupTestEnv.js';

import { AdminTreasuryPolicy, AdminFeeRule, AdminPayoutSchedule, AdminEscrowAdjustment } from '../../src/models/adminFinanceModels.js';
import {
  AdminTimeline,
  AdminTimelineEvent,
  ADMIN_TIMELINE_EVENT_STATUSES,
  ADMIN_TIMELINE_EVENT_TYPES,
  ADMIN_TIMELINE_STATUSES,
  ADMIN_TIMELINE_VISIBILITIES,
  registerAdminTimelineAssociations,
} from '../../src/models/adminTimelineModels.js';
import { User, Profile, AgencyProfile, CompanyProfile } from '../../src/models/adminManagementModels.js';

function getEnumValues(enumArray) {
  return Array.from(enumArray);
}

describe('admin finance models', () => {
  it('normalizes monetary values and structured fields in toPublicObject representations', async () => {
    const policy = await AdminTreasuryPolicy.create({
      policyName: 'Operational treasury baseline',
      defaultCurrency: 'EUR',
      reserveTarget: '12500.789',
      minimumBalanceThreshold: '3000.333',
      autopayoutEnabled: true,
      autopayoutWindowDays: 5,
      autopayoutDayOfWeek: 'friday',
      autopayoutTimeOfDay: '09:00',
      invoiceGracePeriodDays: 10,
      riskAppetite: 'moderate',
      notes: 'Reviewed quarterly',
      operationalContacts: 'ops@gigvora.test',
    });

    const publicPolicy = policy.toPublicObject();
    expect(publicPolicy.reserveTarget).toBeCloseTo(12500.79, 2);
    expect(publicPolicy.minimumBalanceThreshold).toBeCloseTo(3000.33, 2);
    expect(publicPolicy.autopayoutEnabled).toBe(true);
    expect(publicPolicy.autopayoutWindowDays).toBe(5);
    expect(publicPolicy.invoiceGracePeriodDays).toBe(10);

    const feeRule = await AdminFeeRule.create({
      name: 'Expedited invoice processing',
      appliesTo: 'invoices',
      percentageRate: '7.125',
      flatAmount: '42.499',
      currency: 'USD',
      minimumAmount: '15.222',
      maximumAmount: '500.777',
      tags: 'finance,priority , treasury',
      priority: 4,
      isActive: true,
      effectiveFrom: new Date('2024-05-01T12:00:00Z'),
      effectiveTo: new Date('2024-12-31T12:00:00Z'),
      createdBy: 33,
      updatedBy: 34,
    });

    const publicFeeRule = feeRule.toPublicObject();
    expect(publicFeeRule.percentageRate).toBeCloseTo(7.125, 3);
    expect(publicFeeRule.flatAmount).toBeCloseTo(42.5, 1);
    expect(publicFeeRule.minimumAmount).toBeCloseTo(15.22, 2);
    expect(publicFeeRule.maximumAmount).toBeCloseTo(500.78, 2);
    expect(publicFeeRule.tags).toEqual(['finance', 'priority', 'treasury']);
    expect(publicFeeRule.isActive).toBe(true);
    expect(publicFeeRule.createdBy).toBe(33);

    const schedule = await AdminPayoutSchedule.create({
      name: 'Weekly vendor run',
      scheduleType: 'weekly',
      cadence: 'weekly',
      dayOfWeek: 'monday',
      leadTimeDays: 2,
      payoutWindow: '08:00-12:00',
      status: 'active',
      nextRunOn: new Date('2024-06-03T08:30:00Z'),
      autoApprove: true,
      fundingSource: 'escrow-primary',
    });

    const publicSchedule = schedule.toPublicObject();
    expect(publicSchedule.dayOfWeek).toBe('monday');
    expect(publicSchedule.autoApprove).toBe(true);
    expect(publicSchedule.nextRunOn).toBe('2024-06-03T08:30:00.000Z');

    const adjustment = await AdminEscrowAdjustment.create({
      reference: 'ESC-2024-0001',
      adjustmentType: 'credit',
      amount: '2500.499',
      currency: 'EUR',
      reason: 'Manual reconciliation',
      accountReference: 'escrow-balancing',
      status: 'pending',
      requestedBy: 44,
      approvedBy: null,
      supportingDocumentUrl: 'https://cdn.gigvora.test/escrow/adjustment.pdf',
      notes: 'Awaiting compliance sign-off',
      effectiveOn: new Date('2024-05-15T00:00:00Z'),
      postedAt: new Date('2024-05-16T00:00:00Z'),
    });

    const publicAdjustment = adjustment.toPublicObject();
    expect(publicAdjustment.amount).toBeCloseTo(2500.5, 1);
    expect(publicAdjustment.supportingDocumentUrl).toMatch(/^https:\/\//);
    expect(publicAdjustment.effectiveOn).toBe('2024-05-15T00:00:00.000Z');
    expect(publicAdjustment.postedAt).toBe('2024-05-16T00:00:00.000Z');
  });
});

describe('admin management models', () => {
  it('supports one-to-one profiles across user, agency, and company representations', async () => {
    const user = await User.create({
      email: 'ops-lead@gigvora.test',
      password: 'hashed-password',
      firstName: 'Operations',
      lastName: 'Lead',
      phoneNumber: '+1234567890',
      status: 'active',
      userType: 'admin',
      memberships: { admin: true, finance: true },
      primaryDashboard: 'admin',
    });

    await Profile.create({
      userId: user.id,
      headline: 'Driving operational excellence',
      missionStatement: 'Keep services reliable',
      location: 'Remote',
      timezone: 'UTC',
    });

    await AgencyProfile.create({
      userId: user.id,
      agencyName: 'Gigvora Studios',
      focusArea: 'Product Launches',
      website: 'https://agencies.gigvora.test',
      location: 'New York',
      tagline: 'Launch better together',
      services: ['go-to-market', 'brand strategy'],
      industries: ['SaaS', 'AI'],
      clients: ['Acme Inc'],
      awards: ['Growth agency of the year'],
      workforceAvailable: 18,
    });

    await CompanyProfile.create({
      userId: user.id,
      companyName: 'Gigvora',
      description: 'Intelligent talent marketplace',
      website: 'https://gigvora.com',
      location: 'Global',
      tagline: 'Where teams find momentum',
      socialLinks: { linkedin: 'https://linkedin.com/company/gigvora' },
    });

    const hydrated = await User.findByPk(user.id, {
      include: [
        { model: Profile, as: 'Profile' },
        { model: AgencyProfile, as: 'AgencyProfile' },
        { model: CompanyProfile, as: 'CompanyProfile' },
      ],
    });

    expect(hydrated.Profile?.headline).toBe('Driving operational excellence');
    expect(hydrated.AgencyProfile?.agencyName).toBe('Gigvora Studios');
    expect(hydrated.CompanyProfile?.companyName).toBe('Gigvora');
    expect(hydrated.memberships).toEqual({ admin: true, finance: true });
  });
});

describe('admin timeline models', () => {
  beforeAll(() => {
    registerAdminTimelineAssociations({ User });
  });

  it('serializes creator, updater, and event metadata into a public object', async () => {
    const creator = await User.create({
      email: 'creator@gigvora.test',
      password: 'hash',
      firstName: 'Crea',
      lastName: 'Tor',
    });

    const updater = await User.create({
      email: 'updater@gigvora.test',
      password: 'hash',
      firstName: 'Up',
      lastName: 'Dater',
    });

    const timeline = await AdminTimeline.create(
      {
        name: 'Q4 Platform Launch',
        slug: 'q4-platform-launch',
        summary: 'Rollout for the Q4 release train',
        description: 'Coordinated delivery for platform features',
        timelineType: 'launch',
        status: ADMIN_TIMELINE_STATUSES.includes('active') ? 'active' : 'draft',
        visibility: ADMIN_TIMELINE_VISIBILITIES.includes('partners') ? 'partners' : 'internal',
        startDate: new Date('2024-10-01T00:00:00Z'),
        endDate: new Date('2024-12-31T00:00:00Z'),
        heroImageUrl: 'https://cdn.gigvora.test/timelines/q4/hero.png',
        thumbnailUrl: 'https://cdn.gigvora.test/timelines/q4/thumb.png',
        tags: ['launch', 'platform'],
        settings: { color: '#0052ff', distribution: 'global' },
        createdBy: creator.id,
        updatedBy: updater.id,
        events: [
          {
            title: 'Executive kickoff',
            summary: 'Align leadership stakeholders',
            description: 'Confirm scope and readiness',
            eventType: ADMIN_TIMELINE_EVENT_TYPES[0],
            status: ADMIN_TIMELINE_EVENT_STATUSES[0],
            startDate: new Date('2024-10-03T16:00:00Z'),
            dueDate: new Date('2024-10-04T16:00:00Z'),
            ownerName: 'Program Management',
            ownerEmail: 'pm@gigvora.test',
            location: 'Hybrid',
            ctaLabel: 'Review briefing',
            ctaUrl: 'https://gigvora.test/briefing',
            tags: ['kickoff'],
            attachments: [{ url: 'https://cdn.gigvora.test/docs/briefing.pdf' }],
            orderIndex: 0,
            metadata: { stage: 'init' },
          },
        ],
      },
      {
        include: [{ model: AdminTimelineEvent, as: 'events' }],
      },
    );

    const record = await AdminTimeline.findByPk(timeline.id, {
      include: [
        { model: AdminTimelineEvent, as: 'events' },
        { model: User, as: 'creator' },
        { model: User, as: 'updater' },
      ],
    });

    const publicObject = record.toPublicObject();
    expect(publicObject.creator).toEqual({
      id: creator.id,
      firstName: 'Crea',
      lastName: 'Tor',
      email: 'creator@gigvora.test',
    });
    expect(publicObject.updater?.email).toBe('updater@gigvora.test');
    expect(publicObject.events).toHaveLength(1);
    expect(publicObject.events[0]).toMatchObject({
      title: 'Executive kickoff',
      orderIndex: 0,
      tags: ['kickoff'],
      metadata: { stage: 'init' },
    });
    expect(publicObject.tags).toEqual(['launch', 'platform']);
    expect(publicObject.settings).toEqual({ color: '#0052ff', distribution: 'global' });
  });

  it('exposes enumeration guards so administrative tooling can validate inputs', () => {
    expect(getEnumValues(ADMIN_TIMELINE_STATUSES)).toContain('draft');
    expect(getEnumValues(ADMIN_TIMELINE_VISIBILITIES)).toContain('internal');
    expect(getEnumValues(ADMIN_TIMELINE_EVENT_TYPES)).toContain('milestone');
    expect(getEnumValues(ADMIN_TIMELINE_EVENT_STATUSES)).toContain('planned');
  });
});
