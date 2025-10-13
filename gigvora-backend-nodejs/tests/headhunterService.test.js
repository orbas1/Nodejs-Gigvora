import { describe, it, expect } from '@jest/globals';
import { getDashboardSnapshot } from '../src/services/headhunterService.js';
import {
  ProviderWorkspace,
  ProviderWorkspaceMember,
  ProviderContactNote,
  Project,
  Application,
  ApplicationReview,
  MessageThread,
  Message,
  Profile,
} from '../src/models/index.js';
import { createUser } from './helpers/factories.js';

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe('headhunterService', () => {
  it('aggregates pipeline, outreach, and relationship data for a headhunter workspace', async () => {
    const owner = await createUser({ email: 'owner@headhunter.test', userType: 'user', firstName: 'Skyline', lastName: 'Lead' });
    const workspace = await ProviderWorkspace.create({
      ownerId: owner.id,
      name: 'Skyline Search',
      slug: 'skyline-search',
      type: 'recruiter',
      timezone: 'America/New_York',
      defaultCurrency: 'USD',
      intakeEmail: 'briefs@headhunter.test',
      isActive: true,
    });
    await ProviderWorkspaceMember.create({
      workspaceId: workspace.id,
      userId: owner.id,
      role: 'owner',
      status: 'active',
      joinedAt: new Date(),
    });

    const activeCandidate = await createUser({
      email: 'candidate@talent.test',
      firstName: 'Jordan',
      lastName: 'Lee',
    });
    await Profile.create({
      userId: activeCandidate.id,
      headline: 'VP Engineering',
      location: 'Remote — US',
      availabilityStatus: 'available',
      trustScore: 82.4,
    });

    const passCandidate = await createUser({
      email: 'passon@talent.test',
      firstName: 'Morgan',
      lastName: 'Chen',
    });
    await Profile.create({
      userId: passCandidate.id,
      availabilityStatus: 'limited',
      trustScore: 70.1,
    });

    const project = await Project.create({
      title: 'VP Engineering Search',
      description: 'Retained executive search for a growth-stage SaaS startup.',
      status: 'active',
      location: 'Hybrid — NYC',
      budgetAmount: 275000,
      budgetCurrency: 'USD',
    });

    const submittedAt = daysAgo(20);
    const decisionAt = daysAgo(8);

    const activeApplication = await Application.create({
      applicantId: activeCandidate.id,
      targetType: 'project',
      targetId: project.id,
      status: 'interview',
      submittedAt,
      decisionAt,
      rateExpectation: 260000,
      currencyCode: 'USD',
      metadata: {
        headhunterWorkspaceId: workspace.id,
        notes: ['Strong cultural fit', 'Needs relocation support'],
        lastTouchpointAt: daysAgo(9),
      },
    });

    await ApplicationReview.create({
      applicationId: activeApplication.id,
      reviewerId: owner.id,
      stage: 'interview',
      decision: 'advance',
      score: 4,
      decidedAt: daysAgo(9),
    });

    await Application.create({
      applicantId: passCandidate.id,
      targetType: 'project',
      targetId: project.id,
      status: 'rejected',
      submittedAt: daysAgo(45),
      decisionAt: daysAgo(40),
      metadata: {
        headhunterWorkspaceId: workspace.id,
        passOnTargets: { company: 'Acme Health', workspace: 'acme-search' },
        revenueShareAmount: 12500,
        sharedAt: daysAgo(39),
      },
    });

    const thread = await MessageThread.create({
      subject: 'VP Engineering outreach',
      channelType: 'project',
      state: 'active',
      createdBy: owner.id,
      metadata: { headhunterWorkspaceId: workspace.id, sequenceStatus: 'active' },
      createdAt: daysAgo(6),
    });

    await Message.create({
      threadId: thread.id,
      senderId: owner.id,
      messageType: 'text',
      body: 'Thanks for connecting – open to a VP Eng role?',
      metadata: { direction: 'outbound', channel: 'email' },
      createdAt: daysAgo(6),
    });

    await Message.create({
      threadId: thread.id,
      senderId: null,
      messageType: 'text',
      body: 'Yes, let us discuss.',
      metadata: { direction: 'inbound', channel: 'email' },
      createdAt: daysAgo(5.5),
    });

    const clientContact = await createUser({
      email: 'client@company.test',
      firstName: 'Avery',
      lastName: 'Kim',
    });

    await ProviderContactNote.create({
      workspaceId: workspace.id,
      subjectUserId: clientContact.id,
      authorId: owner.id,
      note: 'Client approved shortlist; awaiting board scheduling update.',
      visibility: 'shared',
      createdAt: daysAgo(7),
    });

    const snapshot = await getDashboardSnapshot({ workspaceId: workspace.id, lookbackDays: 60 });

    expect(snapshot.workspaceSummary).toMatchObject({
      id: workspace.id,
      name: 'Skyline Search',
    });
    expect(snapshot.pipelineSummary.totals.applications).toBe(2);
    expect(snapshot.pipelineSummary.stageBreakdown.find((stage) => stage.key === 'interviewing')?.count).toBe(1);
    expect(snapshot.candidateSpotlight[0]).toMatchObject({
      userId: activeCandidate.id,
      activeApplication: expect.objectContaining({ stage: 'interviewing' }),
    });
    expect(snapshot.passOnNetwork.totalCandidates).toBe(1);
    expect(snapshot.outreachPerformance).toMatchObject({ campaignCount: 1, totalMessages: 2 });
    expect(snapshot.clientPartnerships.totalClients).toBe(1);
    expect(snapshot.meta.hasWorkspaceScopedData).toBe(true);
  });

  it('falls back to global data when workspace-specific records are missing', async () => {
    const owner = await createUser({ email: 'owner2@headhunter.test' });
    const workspace = await ProviderWorkspace.create({
      ownerId: owner.id,
      name: 'Fallback Search',
      slug: 'fallback-search',
      type: 'recruiter',
      timezone: 'UTC',
      defaultCurrency: 'USD',
      isActive: true,
    });
    await ProviderWorkspaceMember.create({ workspaceId: workspace.id, userId: owner.id, role: 'owner', status: 'active' });

    const candidate = await createUser({ email: 'global@talent.test' });
    await Profile.create({ userId: candidate.id, availabilityStatus: 'available' });

    await Application.create({
      applicantId: candidate.id,
      targetType: 'project',
      targetId: 999,
      status: 'submitted',
      submittedAt: daysAgo(15),
      metadata: { headhunterWorkspaceId: null },
    });

    const snapshot = await getDashboardSnapshot({ workspaceId: workspace.id, lookbackDays: 30 });

    expect(snapshot.meta.hasWorkspaceScopedData).toBe(false);
    expect(snapshot.pipelineSummary.totals.applications).toBeGreaterThanOrEqual(1);
    expect(snapshot.meta.fallbackReason).toMatch(/network-wide/i);
  });
});
