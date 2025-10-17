process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';

import { describe, expect, it, beforeEach } from '@jest/globals';
import './setupTestEnv.js';
import {
  Profile,
  Connection,
  Application,
  ApplicationReview,
  CareerDocument,
  CareerDocumentVersion,
  CareerDocumentCollaborator,
  CareerDocumentAnalytics,
  CareerDocumentExport,
  CareerStoryBlock,
  CareerBrandAsset,
  ExperienceLaunchpad,
  ExperienceLaunchpadApplication,
  GigOrder,
  GigOrderRequirement,
  GigOrderRevision,
  Notification,
  Project,
  ProjectAssignmentEvent,
  Job,
  Gig,
} from '../src/models/index.js';
import userDashboardService from '../src/services/userDashboardService.js';
import { createUser } from './helpers/factories.js';

const now = () => new Date();

describe('userDashboardService', () => {
  let user;
  let reviewer;
  let job;
  let gig;
  let project;
  let launchpad;
  let interviewApplication;
  let baselineCv;
  let variantCv;
  let coverLetter;
  let portfolio;
  let storyBlock;
  let bannerAsset;
  let purchasedGigOrder;

  beforeEach(async () => {
    user = await createUser({ firstName: 'Avery', lastName: 'Stone', userType: 'user' });
    reviewer = await createUser({ firstName: 'Riley', lastName: 'Recruiter', userType: 'company' });
    const connectionPeer = await createUser({ firstName: 'Jordan', lastName: 'Mentor', userType: 'user' });
    const collaborator = await createUser({ firstName: 'Morgan', lastName: 'Mentor', userType: 'user' });
    const approver = await createUser({ firstName: 'Casey', lastName: 'Coach', userType: 'user' });
    const exporter = await createUser({ firstName: 'Taylor', lastName: 'Ops', userType: 'user' });
    const clientUser = await createUser({ firstName: 'Jamie', lastName: 'Client', userType: 'company' });

    await Profile.create({
      userId: user.id,
      headline: 'Product Designer & Job Seeker',
      bio: 'Designs data-informed experiences across product pods and launchpad cohorts.',
      skills: 'Product design,Design systems,UX research,Analytics storytelling',
      experience: 'Seven years of product design across marketplaces and launch programmes.',
      availabilityStatus: 'limited',
      availableHoursPerWeek: 28,
      availabilityUpdatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      launchpadEligibility: { status: 'eligible', score: 89.5, cohorts: ['Emerging Leaders Fellowship'] },
      portfolioLinks: [
        { label: 'Case study – onboarding revamp', url: 'https://portfolio.avery.example.com/onboarding' },
      ],
      missionStatement: 'Ship inclusive hiring journeys with measurable impact.',
    });

    await Connection.create({ requesterId: user.id, addresseeId: connectionPeer.id, status: 'accepted' });

    job = await Job.create({
      title: 'Lead Product Designer',
      description: 'Own candidate experience and cross-functional design rituals.',
      location: 'Remote – UK/EU overlap',
    });

    gig = await Gig.create({
      title: 'Design Sprint Facilitator',
      description: 'Run discovery sprint for marketplace onboarding improvements.',
      budget: '$4,800',
      duration: '4 weeks',
    });

    project = await Project.create({
      title: 'Community Portal Revamp',
      description: 'Refactor the community experience with analytics instrumentation.',
      status: 'Planning',
    });

    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    interviewApplication = await Application.create({
      applicantId: user.id,
      targetType: 'job',
      targetId: job.id,
      status: 'interview',
      submittedAt: fiveDaysAgo,
      updatedAt: yesterday,
      attachments: [
        {
          fileName: 'avery-stone-cv.pdf',
          storageKey: 'applications/avery-stone-cv.pdf',
          mimeType: 'application/pdf',
        },
      ],
      metadata: { interviewScheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
    });

    await ApplicationReview.create({
      applicationId: interviewApplication.id,
      reviewerId: reviewer.id,
      stage: 'interview',
      decision: 'advance',
      decidedAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    });

    await Application.create({
      applicantId: user.id,
      targetType: 'gig',
      targetId: gig.id,
      status: 'submitted',
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      attachments: [],
    });

    launchpad = await ExperienceLaunchpad.create({
      title: 'Emerging Leaders Fellowship',
      description: 'Mentorship-driven programme for multidisciplinary talent.',
      track: 'Product Leadership',
      location: 'Hybrid – London',
      programType: 'cohort',
      status: 'active',
    });

    await ExperienceLaunchpadApplication.create({
      launchpadId: launchpad.id,
      applicantId: user.id,
      applicationId: interviewApplication.id,
      status: 'interview',
      qualificationScore: 88.5,
      interviewScheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });

    await Notification.create({
      userId: user.id,
      category: 'system',
      type: 'application_update',
      title: 'Interview confirmed',
      body: 'Recruiter Riley confirmed the interview slot for Lead Product Designer.',
      status: 'delivered',
      deliveredAt: now(),
      readAt: null,
    });

    await Notification.create({
      userId: user.id,
      category: 'system',
      type: 'digest',
      title: 'Weekly pipeline digest',
      body: 'Review follow-ups for two in-progress opportunities.',
      status: 'read',
      deliveredAt: now(),
      readAt: now(),
    });

    await ProjectAssignmentEvent.create({
      projectId: project.id,
      actorId: user.id,
      eventType: 'auto_assign_queue_generated',
      payload: { queueSize: 3, triggeredBy: 'manual_regeneration' },
      createdAt: yesterday,
      updatedAt: yesterday,
    });

    baselineCv = await CareerDocument.create({
      userId: user.id,
      documentType: 'cv',
      title: 'Baseline Product CV',
      status: 'approved',
      roleTag: 'Product Design',
      geographyTag: 'UK',
      aiAssisted: false,
      tags: ['Product', 'Design'],
      shareUrl: 'https://docs.gigvora.example.com/cv/baseline',
      metadata: { isBaseline: true },
    });

    const baselineVersion = await CareerDocumentVersion.create({
      documentId: baselineCv.id,
      versionNumber: 1,
      title: 'Baseline CV v1',
      summary: 'Core product design accomplishments across marketplaces.',
      metrics: { aiCopyScore: 88, toneScore: 86, annotations: [{ id: 'anno-1' }] },
      diffHighlights: [{ section: 'Summary', change: 'Initial AI generated draft refined.' }],
      approvalStatus: 'approved',
      createdById: user.id,
      approvedById: approver.id,
      approvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    });

    await baselineCv.update({ baselineVersionId: baselineVersion.id, latestVersionId: baselineVersion.id });

    variantCv = await CareerDocument.create({
      userId: user.id,
      documentType: 'cv',
      title: 'Product Ops CV – Marketplace GTM',
      status: 'in_review',
      roleTag: 'Product Operations',
      geographyTag: 'North America',
      aiAssisted: true,
      tags: ['Operations', 'Product'],
      shareUrl: 'https://docs.gigvora.example.com/cv/product-ops',
      metadata: { sourceDocumentId: baselineCv.id },
    });

    await CareerDocumentVersion.create({
      documentId: variantCv.id,
      versionNumber: 1,
      title: 'Product Ops CV v1',
      summary: 'Early draft focused on product enablement.',
      metrics: {
        aiCopyScore: 90,
        toneScore: 84,
        annotations: [{ id: 'annot-1' }],
        recruiterAnnotations: ['Clarify GTM metrics'],
      },
      diffHighlights: [{ section: 'Experience', change: 'Added GTM bullet points.' }],
      approvalStatus: 'pending_review',
      createdById: user.id,
    });

    const variantVersionTwo = await CareerDocumentVersion.create({
      documentId: variantCv.id,
      versionNumber: 2,
      title: 'Product Ops CV v2',
      summary: 'Variant tailored for strategic marketplaces.',
      metrics: {
        aiCopyScore: 94,
        toneScore: 91,
        annotations: [{ id: 'annot-2' }, { id: 'annot-3' }],
        recruiterAnnotations: ['Highlight analytics stack'],
        storyBlocksUsed: ['leadership-win'],
      },
      diffHighlights: [
        { section: 'Summary', change: 'Refined positioning statement.' },
        { section: 'Impact', change: 'Added quantified revenue lifts.' },
      ],
      approvalStatus: 'pending_review',
      createdById: user.id,
    });

    await variantCv.update({ latestVersionId: variantVersionTwo.id });

    await CareerDocumentCollaborator.create({
      documentId: variantCv.id,
      collaboratorId: collaborator.id,
      role: 'mentor',
      permissions: ['comment', 'suggest'],
      lastActiveAt: now(),
    });

    await CareerDocumentExport.create({
      documentId: variantCv.id,
      versionId: variantVersionTwo.id,
      format: 'pdf',
      exportedById: exporter.id,
      exportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      deliveryUrl: 'https://cdn.gigvora.example.com/cv/product-ops.pdf',
      metadata: { channel: 'one_click' },
    });

    await CareerDocumentAnalytics.create({
      documentId: variantCv.id,
      versionId: variantVersionTwo.id,
      viewerId: reviewer.id,
      viewerType: 'recruiter',
      opens: 9,
      downloads: 3,
      shares: 1,
      geographyTag: 'North America',
      seniorityTag: 'Senior',
      outcomes: { interviews: 2, offers: 1 },
      lastOpenedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      lastDownloadedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    });

    await CareerDocumentAnalytics.create({
      documentId: baselineCv.id,
      versionId: baselineVersion.id,
      viewerId: clientUser.id,
      viewerType: 'mentor',
      opens: 2,
      downloads: 1,
      shares: 0,
      geographyTag: 'UK',
      seniorityTag: 'Lead',
      outcomes: { interviews: 1, offers: 0 },
      lastOpenedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    });

    coverLetter = await CareerDocument.create({
      userId: user.id,
      documentType: 'cover_letter',
      title: 'Marketplace GTM Cover Letter',
      status: 'in_review',
      roleTag: 'Product Operations',
      geographyTag: 'North America',
      aiAssisted: true,
      tags: ['Cover Letter'],
      shareUrl: 'https://docs.gigvora.example.com/cover-letters/marketplace',
    });

    const coverLetterVersion = await CareerDocumentVersion.create({
      documentId: coverLetter.id,
      versionNumber: 1,
      title: 'Marketplace GTM Cover Letter v1',
      summary: 'Personalized outreach for marketplace GTM roles.',
      metrics: {
        toneScore: 87,
        qualityScore: 93,
        storyBlocksUsed: ['leadership-win'],
        annotations: ['Tighten closing paragraph'],
      },
      approvalStatus: 'pending_review',
      createdById: user.id,
    });

    await coverLetter.update({ latestVersionId: coverLetterVersion.id });

    await CareerDocumentCollaborator.create({
      documentId: coverLetter.id,
      collaboratorId: collaborator.id,
      role: 'reviewer',
      permissions: ['comment'],
      lastActiveAt: now(),
    });

    await CareerDocumentExport.create({
      documentId: coverLetter.id,
      versionId: coverLetterVersion.id,
      format: 'docx',
      exportedById: user.id,
      exportedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      deliveryUrl: 'https://cdn.gigvora.example.com/cover-letter-marketplace.docx',
      metadata: { channel: 'bulk_export' },
    });

    await CareerDocumentAnalytics.create({
      documentId: coverLetter.id,
      versionId: coverLetterVersion.id,
      viewerId: reviewer.id,
      viewerType: 'recruiter',
      opens: 4,
      downloads: 2,
      shares: 0,
      geographyTag: 'North America',
      seniorityTag: 'Senior',
      outcomes: { interviews: 1, offers: 0 },
      lastOpenedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    });

    portfolio = await CareerDocument.create({
      userId: user.id,
      documentType: 'portfolio',
      title: 'Marketplace Case Study Portfolio',
      status: 'approved',
      roleTag: 'Product Design',
      geographyTag: 'Global',
      aiAssisted: false,
      shareUrl: 'https://docs.gigvora.example.com/portfolio/marketplace',
    });

    const portfolioVersion = await CareerDocumentVersion.create({
      documentId: portfolio.id,
      versionNumber: 1,
      title: 'Marketplace Case Study Portfolio v1',
      summary: 'Increase onboarding conversion by 28%.',
      metrics: { storyBlocksUsed: ['market-expansion'] },
      approvalStatus: 'approved',
      createdById: user.id,
      approvedById: approver.id,
      approvedAt: now(),
    });

    await portfolio.update({ latestVersionId: portfolioVersion.id });

    storyBlock = await CareerStoryBlock.create({
      userId: user.id,
      title: 'Leadership Win – Marketplace Launch',
      tone: 'executive',
      content: 'Grew GMV by 220% by orchestrating cross-functional launch squads.',
      metrics: { reuseCount: 6, toneScore: 92 },
      approvalStatus: 'approved',
      useCount: 6,
      lastUsedAt: now(),
    });

    bannerAsset = await CareerBrandAsset.create({
      userId: user.id,
      assetType: 'banner',
      title: 'Gigvora Personal Brand Banner',
      description: 'High-contrast banner used across public Gigvora profile.',
      mediaUrl: 'https://cdn.gigvora.example.com/banners/avery-stone.png',
      thumbnailUrl: 'https://cdn.gigvora.example.com/banners/avery-stone-thumb.png',
      status: 'published',
      featured: true,
      approvalsStatus: 'approved',
      approvedById: approver.id,
      approvedAt: now(),
      tags: ['Brand', 'Leadership'],
      metrics: { views: 320, clicks: 44 },
      metadata: { placement: 'profile_header' },
    });

    purchasedGigOrder = await GigOrder.create({
      orderNumber: 'ORD-001',
      gigId: gig.id,
      clientId: clientUser.id,
      freelancerId: user.id,
      clientCompanyName: 'Recruiter Riley Ltd',
      clientContactName: 'Jamie Client',
      clientContactEmail: 'jamie.client@example.com',
      clientContactPhone: '+1-555-0101',
      status: 'in_progress',
      currencyCode: 'USD',
      amount: 4800,
      progressPercent: 65,
      submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      kickoffDueAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      metadata: { service: 'Executive CV rewrite' },
    });

    await GigOrderRequirement.create({
      orderId: purchasedGigOrder.id,
      title: 'Upload baseline CV and project metrics',
      status: 'pending',
      priority: 'high',
      requestedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      notes: 'Needed before drafting specialized variants.',
    });

    await GigOrderRequirement.create({
      orderId: purchasedGigOrder.id,
      title: 'Brand assets inspiration',
      status: 'received',
      priority: 'medium',
      requestedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      receivedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    });

    await GigOrderRevision.create({
      orderId: purchasedGigOrder.id,
      roundNumber: 1,
      status: 'requested',
      severity: 'medium',
      summary: 'Refine executive summary with quantified wins.',
      requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });

    await GigOrderRevision.create({
      orderId: purchasedGigOrder.id,
      roundNumber: 2,
      status: 'approved',
      severity: 'low',
      summary: 'Minor layout adjustments completed.',
      requestedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      submittedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    });
  });

  it('aggregates pipeline, documents, launchpad, and task insights for a user', async () => {
    const dashboard = await userDashboardService.getUserDashboard(user.id, { bypassCache: true });

    expect(dashboard.summary.totalApplications).toBe(2);
    expect(dashboard.summary.activeApplications).toBe(2);
    expect(dashboard.summary.interviewsScheduled).toBe(1);
    expect(dashboard.summary.connections).toBe(1);

    expect(dashboard.pipeline.statuses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 'interview', count: 1 }),
        expect.objectContaining({ status: 'submitted', count: 1 }),
      ]),
    );

    expect(dashboard.documents.attachments).toHaveLength(1);
    expect(dashboard.documents.portfolioLinks[0]).toMatchObject({ label: expect.any(String), url: expect.any(String) });
    expect(dashboard.notifications.unreadCount).toBe(1);
    expect(dashboard.notifications.recent.length).toBe(2);
    expect(dashboard.launchpad.applications[0]).toMatchObject({ launchpadId: launchpad.id, status: 'interview' });
    expect(dashboard.projectActivity.recent[0].project.title).toBe('Community Portal Revamp');

    expect(dashboard.tasks.followUps.length).toBeGreaterThan(0);
    expect(dashboard.tasks.automations.length).toBeGreaterThan(0);

    expect(dashboard.interviews[0]).toMatchObject({
      applicationId: interviewApplication.id,
      targetName: 'Lead Product Designer',
      status: 'interview',
    });

    expect(dashboard.documentStudio.summary).toMatchObject({
      totalDocuments: 4,
      cvCount: 2,
      coverLetterCount: 1,
      portfolioCount: 1,
      storyBlockCount: 1,
      brandAssetCount: 1,
    });

    expect(dashboard.documentStudio.cvStudio.baseline.id).toBe(baselineCv.id);
    expect(dashboard.documentStudio.cvStudio.variants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: variantCv.id,
          annotationCount: 2,
          trackedEditCount: 2,
          aiCopyScore: 94,
          toneScore: 91,
          collaborators: expect.arrayContaining([
            expect.objectContaining({ collaborator: expect.objectContaining({ firstName: 'Morgan' }) }),
          ]),
        }),
      ]),
    );

    expect(dashboard.documentStudio.coverLetters.templates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: coverLetter.id, toneScore: 87, collaboratorCount: 1 }),
      ]),
    );
    expect(dashboard.documentStudio.coverLetters.storyBlocks).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: storyBlock.id, title: expect.any(String) })]),
    );

    expect(dashboard.documentStudio.brandHub.featuredBanner.id).toBe(bannerAsset.id);
    expect(dashboard.documentStudio.brandHub.portfolioProjects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: portfolio.id, title: 'Marketplace Case Study Portfolio' }),
      ]),
    );

    expect(dashboard.documentStudio.analytics.totals).toMatchObject({ opens: 15, downloads: 6, interviews: 4, offers: 1 });
    expect(dashboard.documentStudio.analytics.topPerformers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ documentId: variantCv.id }),
        expect.objectContaining({ documentId: baselineCv.id }),
      ]),
    );
    expect(dashboard.documentStudio.analytics.byGeography).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: 'North America', opens: expect.any(Number) })]),
    );

    expect(dashboard.documentStudio.purchasedGigs.stats).toMatchObject({
      total: 1,
      active: 1,
      pendingRequirements: 1,
      pendingRevisions: 1,
      averageProgress: 65,
    });
    expect(dashboard.documentStudio.purchasedGigs.orders[0]).toMatchObject({ id: purchasedGigOrder.id, outstandingRequirements: 1 });
    expect(dashboard.documentStudio.purchasedGigs.upcomingDeliverables[0]).toMatchObject({ orderId: purchasedGigOrder.id });

    expect(dashboard.documentStudio.library.documents).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: portfolio.id }), expect.objectContaining({ id: variantCv.id })]),
    );
    const variantEntry = dashboard.documentStudio.library.documents.find((doc) => doc.id === variantCv.id);
    expect(variantEntry.versions.length).toBe(2);
    expect(variantEntry.latestVersion.versionNumber).toBe(2);
  });
});
