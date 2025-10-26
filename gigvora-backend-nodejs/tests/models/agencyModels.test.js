process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.ADMIN_MANAGEMENT_MINIMAL_BOOTSTRAP = 'true';

import '../setupTestEnv.js';

import {
  AgencyAiConfiguration,
  AgencyAutoBidTemplate,
} from '../../src/models/agencyAiModels.js';
import {
  AgencyJob,
  AgencyJobApplication,
  AgencyInterview,
  AgencyJobFavorite,
  AgencyApplicationResponse,
  AGENCY_JOB_STATUSES,
  AGENCY_EMPLOYMENT_TYPES,
  AGENCY_JOB_APPLICATION_STATUSES,
  AGENCY_JOB_INTERVIEW_STATUSES,
  AGENCY_INTERVIEW_MODES,
  AGENCY_APPLICATION_RESPONSE_TYPES,
  AGENCY_APPLICATION_RESPONSE_VISIBILITIES,
  buildJobSearchPredicate,
  normaliseJobSearchTerm,
} from '../../src/models/agencyJobModels.js';
import {
  AgencyWorkforceMember,
  AgencyPayDelegation,
  AgencyProjectDelegation,
  AgencyGigDelegation,
  AgencyCapacitySnapshot,
  AgencyAvailabilityEntry,
  AGENCY_MEMBER_STATUSES,
  AGENCY_ASSIGNMENT_STATUSES,
  AGENCY_ASSIGNMENT_TYPES,
  AGENCY_GIG_STATUSES,
  AGENCY_AVAILABILITY_STATUSES,
} from '../../src/models/agencyWorkforceModels.js';

describe('agency AI configuration', () => {
  it('projects safe public objects for workspace automation preferences', async () => {
    const configuration = await AgencyAiConfiguration.create({
      workspaceId: 42,
      provider: 'openai',
      defaultModel: 'gpt-4o-mini',
      autoReplyEnabled: true,
      autoReplyInstructions: 'Respond with warmth and clarity',
      autoReplyChannels: ['inbox', 'leads'],
      autoReplyTemperature: '0.55',
      autoReplyResponseTimeGoal: 15,
      autoBidEnabled: true,
      autoBidStrategy: 'aggressive',
      autoBidMinBudget: 5000,
      autoBidMaxBudget: 25000,
      autoBidMarkup: '12.50',
      autoBidAutoSubmit: true,
      autoBidGuardrails: { review: 'manager' },
      apiKeyCiphertext: 'encrypted-key',
      apiKeyFingerprint: 'fingerprint-1234',
      apiKeyUpdatedAt: new Date('2024-05-10T09:30:00Z'),
      analyticsSnapshot: { winRate: 0.42 },
    });

    const publicObject = configuration.toPublicObject();
    expect(publicObject.autoReplyChannels).toEqual(['inbox', 'leads']);
    expect(publicObject.autoReplyTemperature).toBeCloseTo(0.55, 2);
    expect(publicObject.autoBidMarkup).toBeCloseTo(12.5, 1);
    expect(publicObject.autoBidGuardrails).toEqual({ review: 'manager' });
    expect(publicObject.apiKeyConfigured).toBe(true);
    expect(publicObject.apiKeyFingerprint).toBe('fingerprint-1234');
    expect(publicObject.analyticsSnapshot).toEqual({ winRate: 0.42 });
  });

  it('supports reusable auto bid templates', async () => {
    const template = await AgencyAutoBidTemplate.create({
      workspaceId: 99,
      name: 'Enterprise RFP default',
      description: 'Prioritize enterprise engagements',
      status: 'active',
      responseSlaHours: 6,
      deliveryWindowDays: 14,
      bidCeiling: 75000,
      markupPercent: '9.75',
      targetRoles: ['project manager', 'producer'],
      scopeKeywords: ['enterprise', 'launch'],
      guardrails: { requireHumanReview: true },
      attachments: [{ name: 'Capabilities deck', url: 'https://cdn.gigvora.test/capabilities.pdf' }],
      createdBy: 12,
      updatedBy: 14,
    });

    const publicTemplate = template.toPublicObject();
    expect(publicTemplate.markupPercent).toBeCloseTo(9.75, 2);
    expect(publicTemplate.attachments).toHaveLength(1);
    expect(publicTemplate.guardrails).toEqual({ requireHumanReview: true });
  });
});

describe('agency job marketplace models', () => {
  it('creates rich job postings with relational applications, interviews, and responses', async () => {
    const job = await AgencyJob.create({
      workspaceId: 'workspace-1',
      title: 'Lead Product Designer',
      clientName: 'Acme Labs',
      location: 'Remote',
      employmentType: AGENCY_EMPLOYMENT_TYPES[0],
      seniority: 'lead',
      remoteAvailable: true,
      compensationMin: '95000.00',
      compensationMax: '130000.00',
      compensationCurrency: 'USD',
      status: AGENCY_JOB_STATUSES.includes('open') ? 'open' : 'draft',
      summary: 'Own the design system evolution',
      responsibilities: 'Lead cross-functional initiatives',
      requirements: '7+ years design experience',
      benefits: 'Wellness stipend',
      tags: ['design', 'leadership'],
      metadata: { distribution: 'global' },
    });

    const application = await AgencyJobApplication.create({
      workspaceId: 'workspace-1',
      jobId: job.id,
      candidateName: 'Avery Rivera',
      candidateEmail: 'avery@gigvora.test',
      candidatePhone: '+123456789',
      source: 'referral',
      resumeUrl: 'https://cdn.gigvora.test/resumes/avery.pdf',
      status: AGENCY_JOB_APPLICATION_STATUSES.includes('screening') ? 'screening' : 'new',
      stage: 'portfolio review',
      rating: '4.75',
      ownerId: 55,
      tags: ['portfolio'],
      metadata: { timezone: 'UTC+1' },
    });

    const interview = await AgencyInterview.create({
      workspaceId: 'workspace-1',
      applicationId: application.id,
      scheduledAt: new Date('2024-06-01T16:00:00Z'),
      durationMinutes: 45,
      mode: AGENCY_INTERVIEW_MODES[0],
      stage: 'final',
      status: AGENCY_JOB_INTERVIEW_STATUSES.includes('planned') ? 'planned' : 'completed',
      interviewerName: 'Jordan Blake',
      interviewerEmail: 'jordan@gigvora.test',
      meetingUrl: 'https://meet.gigvora.test/session',
      agenda: 'Portfolio walkthrough',
      metadata: { panelSize: 3 },
    });

    await AgencyJobFavorite.create({
      workspaceId: 'workspace-1',
      jobId: job.id,
      memberId: 77,
      pinnedNote: 'High priority fill',
      createdBy: 70,
    });

    await AgencyApplicationResponse.create({
      workspaceId: 'workspace-1',
      applicationId: application.id,
      authorId: 70,
      responseType: AGENCY_APPLICATION_RESPONSE_TYPES.includes('note') ? 'note' : 'email',
      visibility: AGENCY_APPLICATION_RESPONSE_VISIBILITIES.includes('internal') ? 'internal' : 'shared_with_client',
      subject: 'Phone screen feedback',
      body: 'Candidate shows strong systems thinking.',
      attachments: [{ name: 'Scorecard', url: 'https://cdn.gigvora.test/scorecards/avery.pdf' }],
    });

    const hydrated = await AgencyJob.findByPk(job.id, {
      include: [
        { model: AgencyJobApplication, as: 'applications', include: [
          { model: AgencyInterview, as: 'interviews' },
          { model: AgencyApplicationResponse, as: 'responses' },
        ] },
        { model: AgencyJobFavorite, as: 'favorites' },
      ],
    });

    expect(hydrated.applications[0].interviews[0].meetingUrl).toContain('meet.gigvora.test');
    expect(Number.parseFloat(hydrated.applications[0].rating)).toBeCloseTo(4.75, 2);
    expect(hydrated.favorites[0].memberId).toBe(77);

    const predicate = buildJobSearchPredicate('Designer');
    expect(predicate).toBeTruthy();
    const results = await AgencyJob.findAll({ where: predicate });
    expect(results.map((result) => result.title)).toContain('Lead Product Designer');
  });

  it('normalises search terms and skips empty queries', () => {
    expect(normaliseJobSearchTerm('  Strategic Lead  ')).toBe('Strategic Lead');
    expect(normaliseJobSearchTerm('')).toBeNull();
    expect(buildJobSearchPredicate('   ')).toBeNull();
  });

  it('normalises premium analytics metadata, slugs, and engagement counters', async () => {
    const job = await AgencyJob.create({
      workspaceId: 'workspace-analytics',
      title: 'VP of Engineering Growth',
      status: 'draft',
      tags: [' Design ', 'design', 'LEADERSHIP', ''],
      hiringManagerEmail: '  Talent@ACME.io ',
      metadata: { existing: true },
    });

    await job.reload();

    expect(job.slug).toMatch(/^vp-of-engineering-growth-[a-z0-9]+$/);
    expect(job.publishedAt).toBeNull();
    expect(job.hiringManagerEmail).toBe('talent@acme.io');
    expect(job.tags).toEqual(['design', 'leadership']);
    expect(job.metadata.existing).toBe(true);
    expect(job.metadata.metrics).toEqual({
      applicationCount: 0,
      favoriteCount: 0,
      lastInteractionAt: null,
    });

    await job.update({ status: AGENCY_JOB_STATUSES.includes('open') ? 'open' : 'paused' });
    await job.reload();
    expect(job.publishedAt).toBeInstanceOf(Date);
    expect(job.metadata.metrics.applicationCount).toBe(0);
    expect(job.metadata.metrics.favoriteCount).toBe(0);

    const application = await AgencyJobApplication.create({
      workspaceId: 'workspace-analytics',
      jobId: job.id,
      candidateName: 'Casey Voss',
      candidateEmail: 'CASEY@Gigvora.test',
      status: 'new',
    });

    expect(application.candidateEmail).toBe('casey@gigvora.test');

    await job.reload();
    expect(job.metadata.metrics.applicationCount).toBe(1);
    expect(job.metadata.metrics.lastInteractionAt).not.toBeNull();

    const favorite = await AgencyJobFavorite.create({
      workspaceId: 'workspace-analytics',
      jobId: job.id,
      memberId: 200,
    });

    await job.reload();
    expect(job.metadata.metrics.favoriteCount).toBe(1);

    await AgencyApplicationResponse.create({
      workspaceId: 'workspace-analytics',
      applicationId: application.id,
      authorId: 88,
      responseType: 'note',
      visibility: 'internal',
      body: 'Strong leadership alignment.',
    });

    await job.reload();
    expect(job.metadata.metrics.lastInteractionAt).not.toBeNull();
    const lastInteractionAt = new Date(job.metadata.metrics.lastInteractionAt);
    expect(Number.isNaN(lastInteractionAt.getTime())).toBe(false);

    await favorite.destroy();
    await job.reload();
    expect(job.metadata.metrics.favoriteCount).toBe(0);

    await application.destroy();
    await job.reload();
    expect(job.metadata.metrics.applicationCount).toBe(0);
  });
});

describe('agency workforce models', () => {
  it('captures workforce capacity, payroll, and availability with relationships', async () => {
    const member = await AgencyWorkforceMember.create({
      workspaceId: 7,
      fullName: 'Morgan Lee',
      title: 'Senior Producer',
      email: 'morgan@gigvora.test',
      location: 'Austin, TX',
      employmentType: 'contract',
      status: AGENCY_MEMBER_STATUSES.includes('active') ? 'active' : 'on_leave',
      startDate: new Date('2023-01-09T00:00:00Z'),
      hourlyRate: '125.50',
      billableRate: '165.00',
      costCenter: 'Production',
      capacityHoursPerWeek: '32.0',
      allocationPercent: '60.0',
      benchAllocationPercent: '10.0',
      skills: ['production', 'client leadership'],
      metadata: { certifications: ['PMP'] },
    });

    await AgencyPayDelegation.create({
      workspaceId: 7,
      memberId: member.id,
      frequency: 'monthly',
      amount: '9800.00',
      currency: 'USD',
      status: 'scheduled',
      nextPayDate: new Date('2024-06-05T00:00:00Z'),
      payoutMethod: 'ach',
      metadata: { priority: 'high' },
    });

    await AgencyProjectDelegation.create({
      workspaceId: 7,
      memberId: member.id,
      projectId: 501,
      projectName: 'Launch readiness program',
      clientName: 'Acme Labs',
      assignmentType: AGENCY_ASSIGNMENT_TYPES.includes('project') ? 'project' : 'internal',
      status: AGENCY_ASSIGNMENT_STATUSES.includes('active') ? 'active' : 'planned',
      startDate: new Date('2024-05-01T00:00:00Z'),
      endDate: new Date('2024-07-30T00:00:00Z'),
      allocationPercent: '75.0',
      billableRate: '185.00',
      metadata: { sprint: '5' },
    });

    await AgencyGigDelegation.create({
      workspaceId: 7,
      memberId: member.id,
      gigId: 8001,
      gigName: 'Product demo series',
      status: AGENCY_GIG_STATUSES.includes('in_delivery') ? 'in_delivery' : 'briefing',
      deliverables: 5,
      startDate: new Date('2024-05-10T00:00:00Z'),
      dueDate: new Date('2024-06-15T00:00:00Z'),
      allocationPercent: '40.0',
      metadata: { stream: 'north-america' },
    });

    await AgencyCapacitySnapshot.create({
      workspaceId: 7,
      recordedFor: '2024-05-20',
      totalHeadcount: 18,
      activeAssignments: 14,
      availableHours: '120.0',
      allocatedHours: '95.0',
      benchHours: '12.0',
      utilizationPercent: '78.5',
      notes: 'Healthy bench capacity for summer programs',
    });

    await AgencyAvailabilityEntry.create({
      workspaceId: 7,
      memberId: member.id,
      date: '2024-05-27',
      status: AGENCY_AVAILABILITY_STATUSES.includes('partial') ? 'partial' : 'available',
      availableHours: '3.5',
      reason: 'Client workshops',
    });

    const hydrated = await AgencyWorkforceMember.findByPk(member.id, {
      include: [
        { model: AgencyPayDelegation, as: 'payDelegations' },
        { model: AgencyProjectDelegation, as: 'projectDelegations' },
        { model: AgencyGigDelegation, as: 'gigDelegations' },
        { model: AgencyAvailabilityEntry, as: 'availabilityEntries' },
      ],
    });

    expect(Number.parseFloat(hydrated.payDelegations[0].amount)).toBeCloseTo(9800, 2);
    expect(hydrated.projectDelegations[0].projectName).toBe('Launch readiness program');
    expect(hydrated.gigDelegations[0].gigName).toBe('Product demo series');
    expect(hydrated.availabilityEntries[0].status).toBe('partial');
  });
});
