import { describe, beforeEach, it, expect } from '@jest/globals';
import './setupTestEnv.js';
import {
  ExperienceLaunchpad,
  ExperienceLaunchpadApplication,
  ExperienceLaunchpadOpportunityLink,
  Job,
  Project,
} from '../src/models/index.js';
import {
  applyToLaunchpad,
  updateLaunchpadApplicationStatus,
  submitEmployerRequest,
  recordLaunchpadPlacement,
  getLaunchpadDashboard,
} from '../src/services/launchpadService.js';
import { ValidationError, ConflictError } from '../src/utils/errors.js';
import { createUser } from './helpers/factories.js';

async function createLaunchpad(overrides = {}) {
  return ExperienceLaunchpad.create({
    title: 'Product Leadership Sprint',
    description: 'Six-week studio pairing fellows with operating companies.',
    track: 'Leadership',
    programType: 'cohort',
    status: 'recruiting',
    location: 'Remote',
    eligibilityCriteria: {
      minimumExperience: 2,
      requiredSkills: ['Product strategy', 'Analytics storytelling'],
      requiresPortfolio: true,
      autoAdvanceScore: 70,
      autoAcceptScore: 85,
    },
    employerSponsorship: {
      headlineSponsor: 'Gigvora Studios',
      stipendCurrency: 'GBP',
      stipendAmount: 1000,
    },
    ...overrides,
  });
}

describe('launchpadService', () => {
  let launchpad;
  let applicant;

  beforeEach(async () => {
    launchpad = await createLaunchpad();
    applicant = await createUser({ userType: 'freelancer' });
    await Job.create({
      title: 'Analytics Lead',
      description: 'Own analytics instrumentation for cross-functional squads.',
      employmentType: 'Full-time',
    });
    await Project.create({
      title: 'Mentorship Accelerator',
      description: 'Structured mentorship pods driving portfolio-ready outcomes.',
      status: 'Planning',
    });
  });

  it('creates launchpad applications with evaluation scoring', async () => {
    const result = await applyToLaunchpad({
      launchpadId: launchpad.id,
      applicantId: applicant.id,
      yearsExperience: 5,
      skills: ['Product strategy', 'Analytics storytelling', 'Leadership'],
      portfolioUrl: 'https://portfolio.example.com',
      motivations: 'Ready to mentor upcoming fellows while scaling analytics practices.',
    });

    expect(result.status).toBe('accepted');
    expect(result.qualificationScore).toBeGreaterThanOrEqual(80);

    const stored = await ExperienceLaunchpadApplication.findByPk(result.id);
    expect(stored.status).toBe('accepted');
    expect(Array.isArray(stored.skills)).toBe(true);
    expect(stored.eligibilitySnapshot.evaluation.missingSkills).toHaveLength(0);
  });

  it('prevents duplicate active applications for the same launchpad', async () => {
    await applyToLaunchpad({
      launchpadId: launchpad.id,
      applicantId: applicant.id,
      yearsExperience: 3,
      skills: ['Product strategy'],
      portfolioUrl: 'https://portfolio.example.com',
      motivations: 'Excited to grow leadership capability.',
    });

    await expect(
      applyToLaunchpad({
        launchpadId: launchpad.id,
        applicantId: applicant.id,
        yearsExperience: 4,
        skills: ['Product strategy'],
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('enforces valid status transitions when updating an application', async () => {
    const application = await applyToLaunchpad({
      launchpadId: launchpad.id,
      applicantId: applicant.id,
      yearsExperience: 4,
      skills: ['Product strategy', 'Analytics storytelling'],
      portfolioUrl: 'https://portfolio.example.com',
    });

    const updated = await updateLaunchpadApplicationStatus(application.id, {
      status: 'accepted',
      assignedMentor: 'Ava Founder',
      interviewScheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(updated.status).toBe('accepted');
    expect(updated.assignedMentor).toBe('Ava Founder');

    await expect(
      updateLaunchpadApplicationStatus(application.id, { status: 'screening' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('records employer requests and placements with linked analytics', async () => {
    const application = await applyToLaunchpad({
      launchpadId: launchpad.id,
      applicantId: applicant.id,
      yearsExperience: 6,
      skills: ['Product strategy', 'Analytics storytelling'],
      portfolioUrl: 'https://portfolio.example.com',
    });

    const employerRequest = await submitEmployerRequest(
      {
        launchpadId: launchpad.id,
        organizationName: 'Northwind Labs',
        contactName: 'Jules Carter',
        contactEmail: 'talent@northwindlabs.io',
        engagementTypes: ['fractional', 'contract-to-hire'],
        targetStartDate: new Date().toISOString(),
        slaCommitmentDays: 5,
      },
      { actorId: applicant.id },
    );

    expect(employerRequest.status).toBe('new');
    expect(employerRequest.engagementTypes).toContain('fractional');

    const placement = await recordLaunchpadPlacement(
      {
        launchpadId: launchpad.id,
        candidateId: application.id,
        employerRequestId: employerRequest.id,
        targetType: 'project',
        targetId: 1,
        status: 'scheduled',
        placementDate: new Date().toISOString(),
      },
      { actorId: applicant.id },
    );

    expect(placement.status).toBe('scheduled');
    const refreshedApplication = await ExperienceLaunchpadApplication.findByPk(application.id);
    expect(refreshedApplication.status).toBe('accepted');

    const opportunityLinks = await ExperienceLaunchpadOpportunityLink.findAll({ where: { launchpadId: launchpad.id } });
    expect(opportunityLinks).toHaveLength(1);
    expect(opportunityLinks[0].source).toBe('placement');
  });

  it('returns aggregated dashboard insights for launchpad teams', async () => {
    const firstApplication = await applyToLaunchpad({
      launchpadId: launchpad.id,
      applicantId: applicant.id,
      yearsExperience: 6,
      skills: ['Product strategy', 'Analytics storytelling'],
      portfolioUrl: 'https://portfolio.example.com',
    });
    await updateLaunchpadApplicationStatus(firstApplication.id, { status: 'accepted' });

    const secondApplicant = await createUser({ userType: 'freelancer' });
    await applyToLaunchpad({
      launchpadId: launchpad.id,
      applicantId: secondApplicant.id,
      yearsExperience: 1,
      skills: ['Community management'],
      motivations: 'Eager to pivot into product strategy.',
    });

    await recordLaunchpadPlacement({
      launchpadId: launchpad.id,
      candidateId: firstApplication.id,
      targetType: 'project',
      targetId: 1,
      status: 'completed',
      placementDate: new Date().toISOString(),
      feedbackScore: 4.2,
    });

    const dashboard = await getLaunchpadDashboard(launchpad.id);
    expect(dashboard.totals.applications).toBeGreaterThanOrEqual(2);
    expect(dashboard.placements.completed).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(dashboard.upcomingInterviews)).toBe(true);
    expect(dashboard.pipeline).toHaveProperty('accepted');
  });

  it('validates required identifiers when missing', async () => {
    await expect(applyToLaunchpad({})).rejects.toBeInstanceOf(ValidationError);
  });
});
