import {
  escrowOverviewQuerySchema,
  escrowAccountCreateSchema,
  escrowFeeTierBodySchema,
} from '../../src/validation/schemas/adminEscrowSchemas.js';
import {
  feeRuleCreateBodySchema,
  payoutScheduleCreateBodySchema,
  treasuryPolicyBodySchema,
} from '../../src/validation/schemas/adminFinanceSchemas.js';
import {
  jobApplicationCreateSchema,
  jobApplicationUpdateSchema,
} from '../../src/validation/schemas/adminJobApplicationSchemas.js';
import {
  adminJobPostCreateSchema,
  adminJobPostListQuerySchema,
} from '../../src/validation/schemas/adminJobPostSchemas.js';
import {
  adminProfileCreateSchema,
  adminProfileReferenceCreateSchema,
} from '../../src/validation/schemas/adminProfileSchemas.js';
import {
  storageLocationCreateSchema,
  storageUploadPresetCreateSchema,
} from '../../src/validation/schemas/adminStorageSchemas.js';
import {
  createTimelineBodySchema,
  timelineEventBodySchema,
} from '../../src/validation/schemas/adminTimelineSchemas.js';
import { programBodySchema, assignmentBodySchema } from '../../src/validation/schemas/adminVolunteeringSchemas.js';
import {
  createTimelinePostBodySchema,
  updateTimelinePostStatusBodySchema,
} from '../../src/validation/schemas/agencyTimelineSchemas.js';

describe('adminEscrowSchemas', () => {
  it('normalises overview filters and validates enumerations', () => {
    const result = escrowOverviewQuerySchema.parse({
      accountStatus: 'ACTIVE',
      accountProvider: 'stripe',
      transactionStatus: 'released',
      transactionType: 'project',
      transactionMinAmount: '10',
      transactionMaxAmount: '100',
    });

    expect(result.accountStatus).toBe('active');
    expect(result.transactionType).toBe('project');
    expect(result.transactionMinAmount).toBe(10);
    expect(() =>
      escrowOverviewQuerySchema.parse({
        transactionMinAmount: 50,
        transactionMaxAmount: 10,
      }),
    ).toThrow('transactionMinAmount must be less than or equal to transactionMaxAmount.');
  });

  it('requires known providers and currency codes on account creation', () => {
    const payload = escrowAccountCreateSchema.parse({ userId: '4', provider: 'stripe' });
    expect(payload.provider).toBe('stripe');
    expect(payload.currencyCode).toBe('USD');

    expect(() => escrowAccountCreateSchema.parse({ userId: '1', provider: 'unknown' })).toThrow(
      'provider must be one of',
    );
  });

  it('enforces fee tier ranges and enumerations', () => {
    const payload = escrowFeeTierBodySchema.parse({
      provider: 'stripe',
      status: 'ACTIVE',
      minimumAmount: 10,
      maximumAmount: 20,
    });

    expect(payload.status).toBe('active');
    expect(() =>
      escrowFeeTierBodySchema.parse({ provider: 'stripe', status: 'active', minimumAmount: 30, maximumAmount: 10 }),
    ).toThrow('minimumAmount must be less than or equal to maximumAmount.');
  });
});

describe('adminFinanceSchemas', () => {
  it('guards treasury policy timelines', () => {
    const parsed = treasuryPolicyBodySchema.parse({
      status: 'active',
      riskAppetite: 'balanced',
      autopayoutDayOfWeek: 'MONDAY',
      effectiveFrom: '2024-01-01',
      effectiveTo: '2024-02-01',
    });

    expect(parsed.autopayoutDayOfWeek).toBe('monday');
    expect(parsed.effectiveFrom).toBe('2024-01-01T00:00:00.000Z');
    expect(() => treasuryPolicyBodySchema.parse({ effectiveFrom: '2024-02-01', effectiveTo: '2024-01-01' })).toThrow(
      'effectiveFrom must be before effectiveTo.',
    );
  });

  it('normalises fee rules and payout schedules', () => {
    const feeRule = feeRuleCreateBodySchema.parse({
      name: 'Platform Fee',
      minimumAmount: '5',
      maximumAmount: '15',
      effectiveFrom: '2024-05-01',
      effectiveTo: '2024-06-01',
    });

    expect(feeRule.minimumAmount).toBe(5);
    expect(feeRule.effectiveFrom).toBe('2024-05-01T00:00:00.000Z');

    expect(() =>
      payoutScheduleCreateBodySchema.parse({
        name: 'Monthly',
        cadence: 'daily',
        dayOfMonth: 10,
      }),
    ).toThrow('dayOfMonth is only applicable for monthly cadences.');
  });
});

describe('adminJobApplicationSchemas', () => {
  it('coerces URLs and ISO datetimes', () => {
    const payload = jobApplicationCreateSchema.parse({
      candidateName: 'Avery',
      candidateEmail: 'avery@example.com',
      jobTitle: 'Designer',
      availabilityDate: '2024-03-10',
      resumeUrl: 'resume.example.com/doc.pdf',
    });

    expect(payload.availabilityDate).toBe('2024-03-10T00:00:00.000Z');
    expect(payload.resumeUrl).toBe('https://resume.example.com/doc.pdf');

    const update = jobApplicationUpdateSchema.parse({ candidateEmail: 'NEW@Email.COM ' });
    expect(update.candidateEmail).toBe('new@email.com');
  });
});

describe('adminJobPostSchemas', () => {
  it('normalises enum fields and validates ranges', () => {
    const jobPost = adminJobPostCreateSchema.parse({
      title: 'Lead Engineer',
      description: 'Build amazing products.',
      status: 'PUBLISHED',
      compensationType: 'salary',
      workplaceType: 'remote',
      salaryMin: '50000',
      salaryMax: '80000',
      applicationUrl: 'jobs.example.com/apply',
    });

    expect(jobPost.status).toBe('published');
    expect(jobPost.applicationUrl).toBe('https://jobs.example.com/apply');
    expect(() =>
      adminJobPostCreateSchema.parse({
        title: 'Engineer',
        description: 'Detailed role description',
        salaryMin: 100,
        salaryMax: 50,
      }),
    ).toThrow('salaryMin must be less than or equal to salaryMax.');
  });

  it('trims list query filters', () => {
    const query = adminJobPostListQuerySchema.parse({ status: 'ARCHIVED', page: '2' });
    expect(query.status).toBe('archived');
    expect(query.page).toBe(2);
  });
});

describe('adminProfileSchemas', () => {
  it('validates social link objects and optional ISO fields', () => {
    const payload = adminProfileCreateSchema.parse({
      user: {
        firstName: 'Dana',
        lastName: 'Jones',
        email: 'dana@example.com',
        password: 'supersecretpw',
      },
      profile: {
        socialLinks: [{ label: 'LinkedIn', url: 'linkedin.com/in/dana' }],
        availabilityUpdatedAt: '2024-04-05',
      },
    });

    expect(payload.profile.socialLinks[0].url).toBe('https://linkedin.com/in/dana');
    expect(payload.profile.availabilityUpdatedAt).toBe('2024-04-05T00:00:00.000Z');

    expect(() =>
      adminProfileReferenceCreateSchema.parse({ referenceName: 'Alex', email: 'invalid-email' }),
    ).toThrow('must be a valid email address.');
  });
});

describe('adminStorageSchemas', () => {
  it('enforces provider enumerations and encryption values', () => {
    const preset = storageUploadPresetCreateSchema.parse({
      locationId: 1,
      name: 'Media Uploads',
      encryption: 'AES256',
    });

    expect(preset.encryption).toBe('aes256');

    expect(() =>
      storageLocationCreateSchema.parse({
        locationKey: 'primary',
        name: 'Primary',
        provider: 'invalid',
        bucket: 'bucket',
      }),
    ).toThrow('provider must be one of');
  });
});

describe('adminTimelineSchemas', () => {
  it('converts dates to ISO strings and normalises URLs', () => {
    const timeline = createTimelineBodySchema.parse({
      name: 'Launch Timeline',
      status: 'ACTIVE',
      visibility: 'public',
      events: [
        {
          title: 'Kickoff',
          status: 'planned',
          eventType: 'milestone',
          startDate: '2024-01-01',
          attachments: [{ url: 'files.example.com/brief.pdf' }],
        },
      ],
    });

    expect(timeline.events[0].startDate).toBe('2024-01-01T00:00:00.000Z');
    expect(timeline.events[0].attachments[0].url).toBe('https://files.example.com/brief.pdf');

    expect(() =>
      timelineEventBodySchema.parse({
        title: 'Invalid',
        status: 'scheduled',
        eventType: 'milestone',
        startDate: 'not-a-date',
      }),
    ).toThrow('startDate must be a valid ISO-8601 date/time.');
  });
});

describe('adminVolunteeringSchemas', () => {
  it('normalises program and assignment timestamps', () => {
    const program = programBodySchema.parse({
      name: 'Community Build',
      status: 'active',
      startsAt: '2024-06-01T10:00:00Z',
    });

    expect(program.startsAt).toBe('2024-06-01T10:00:00.000Z');

    const assignment = assignmentBodySchema.parse({ status: 'confirmed', checkInAt: '2024-06-10' });
    expect(assignment.checkInAt).toBe('2024-06-10T00:00:00.000Z');
  });
});

describe('agencyTimelineSchemas', () => {
  it('coerces post scheduling values to ISO strings', () => {
    const post = createTimelinePostBodySchema.parse({
      title: 'Agency Update',
      status: 'draft',
      scheduledAt: '2024-07-01',
      attachments: [{ url: 'cdn.example.com/file.pdf' }],
    });

    expect(post.scheduledAt).toBe('2024-07-01T00:00:00.000Z');
    expect(post.attachments[0].url).toBe('https://cdn.example.com/file.pdf');

    expect(() => updateTimelinePostStatusBodySchema.parse({ status: 'draft', publishedAt: 'bad-date' })).toThrow(
      'must be a valid ISO-8601 date/time.',
    );
  });
});
