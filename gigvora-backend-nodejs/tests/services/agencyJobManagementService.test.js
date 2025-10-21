import { beforeAll, describe, expect, it } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

let listJobs;
let getJob;
let createJob;
let updateJob;
let toggleFavorite;
let removeFavorite;
let listApplications;
let createApplication;
let getApplication;
let updateApplication;
let listInterviews;
let createInterview;
let updateInterview;
let listResponses;
let createResponse;
let getJobManagementSnapshot;
let getJobManagementMetadata;

beforeAll(async () => {
  const service = await import('../../src/services/agencyJobManagementService.js');
  listJobs = service.listJobs;
  getJob = service.getJob;
  createJob = service.createJob;
  updateJob = service.updateJob;
  toggleFavorite = service.toggleFavorite;
  removeFavorite = service.removeFavorite;
  listApplications = service.listApplications;
  createApplication = service.createApplication;
  getApplication = service.getApplication;
  updateApplication = service.updateApplication;
  listInterviews = service.listInterviews;
  createInterview = service.createInterview;
  updateInterview = service.updateInterview;
  listResponses = service.listResponses;
  createResponse = service.createResponse;
  getJobManagementSnapshot = service.getJobManagementSnapshot;
  getJobManagementMetadata = service.getJobManagementMetadata;
});

describe('agencyJobManagementService', () => {
  it('creates jobs, manages favorites, and aggregates listings with application metrics', async () => {
    const workspaceId = 'ws-agency-jobs';

    const openJob = await createJob(
      {
        workspaceId,
        title: 'Lead Product Designer',
        status: 'open',
        employmentType: 'contract',
        seniority: 'lead',
        summary: 'Shape design direction for flagship accounts.',
      },
      { workspaceId, actorId: 901 },
    );

    expect(openJob.id).toBeTruthy();
    expect(openJob.status).toBe('open');
    expect(new Date(openJob.publishedAt).getTime()).toBeGreaterThan(0);
    expect(openJob.favorites).toHaveLength(0);
    expect(openJob.applications).toHaveLength(0);

    const draftJob = await createJob(
      {
        workspaceId,
        title: 'Growth Marketing Specialist',
        status: 'draft',
        employmentType: 'full_time',
      },
      { workspaceId },
    );

    expect(draftJob.status).toBe('draft');

    const favorite = await toggleFavorite(openJob.id, {
      workspaceId,
      memberId: 44,
      pinnedNote: 'Top of pipeline',
      actorId: 501,
    });
    expect(favorite.memberId).toBe(44);
    expect(favorite.pinnedNote).toBe('Top of pipeline');

    const updatedFavorite = await toggleFavorite(openJob.id, {
      workspaceId,
      memberId: 44,
      pinnedNote: 'Schedule intro call',
      actorId: 777,
    });
    expect(updatedFavorite.pinnedNote).toBe('Schedule intro call');

    const secondaryFavorite = await toggleFavorite(openJob.id, {
      workspaceId,
      memberId: 87,
    });
    expect(secondaryFavorite.memberId).toBe(87);

    const removalResult = await removeFavorite(openJob.id, { workspaceId, memberId: 87 });
    expect(removalResult).toEqual({ jobId: openJob.id, memberId: 87 });

    const applicationOne = await createApplication(
      openJob.id,
      {
        candidateName: 'Alex Morgan',
        status: 'new',
        source: 'Talent Pool',
      },
      { workspaceId, actorId: 21 },
    );
    expect(applicationOne.status).toBe('new');

    const applicationTwo = await createApplication(
      openJob.id,
      {
        candidateName: 'Riley Summers',
        status: 'interview',
        candidateEmail: 'riley@example.com',
      },
      { workspaceId },
    );
    expect(applicationTwo.status).toBe('interview');

    await createApplication(
      draftJob.id,
      {
        candidateName: 'Jordan Parker',
        status: 'new',
      },
      { workspaceId },
    );

    const listings = await listJobs({ workspaceId });
    expect(listings.pagination.totalItems).toBe(2);
    expect(listings.metrics.totalJobs).toBe(2);
    expect(listings.metrics.openJobs).toBe(1);
    expect(listings.metrics.favoriteJobs).toBe(1);
    expect(listings.metrics.totalApplications).toBe(3);

    const hydratedOpenJob = listings.data.find((job) => job.id === openJob.id);
    expect(hydratedOpenJob.favoriteMemberIds).toEqual([44]);
    expect(hydratedOpenJob.applicationSummary.total).toBe(2);
    expect(hydratedOpenJob.applicationSummary.byStatus.new).toBe(1);
    expect(hydratedOpenJob.applicationSummary.byStatus.interview).toBe(1);

    const fetchedJob = await getJob(openJob.id, { workspaceId });
    expect(fetchedJob.favorites).toHaveLength(1);
    expect(fetchedJob.favorites[0].memberId).toBe(44);
    expect(fetchedJob.applications).toHaveLength(2);
  });

  it('orchestrates applications, interviews, responses, and provides snapshots with metadata', async () => {
    const workspaceId = 'ws-agency-pipelines';

    const baseJob = await createJob(
      {
        workspaceId,
        title: 'Principal Backend Engineer',
        status: 'draft',
        employmentType: 'full_time',
      },
      { workspaceId, actorId: 305 },
    );

    const openedJob = await updateJob(
      baseJob.id,
      { status: 'open', seniority: 'senior', compensationMin: 120000, compensationMax: 160000 },
      { workspaceId, actorId: 305 },
    );

    expect(openedJob.status).toBe('open');
    expect(openedJob.seniority).toBe('senior');
    expect(new Date(openedJob.publishedAt).getTime()).toBeGreaterThan(0);

    const application = await createApplication(
      baseJob.id,
      {
        candidateName: 'Morgan Patel',
        status: 'screening',
        resumeUrl: 'https://cdn.example.com/resumes/morgan.pdf',
      },
      { workspaceId, actorId: 305 },
    );

    const fetchedApplication = await getApplication(application.id, { workspaceId });
    expect(fetchedApplication.job.id).toBe(baseJob.id);
    expect(fetchedApplication.status).toBe('screening');

    const updatedApplication = await updateApplication(
      application.id,
      { status: 'interview', rating: 4.5, stage: 'Panel' },
      { workspaceId, actorId: 912 },
    );
    expect(updatedApplication.status).toBe('interview');
    expect(updatedApplication.rating).toBe(4.5);
    expect(updatedApplication.stage).toBe('Panel');

    const interviewTime = new Date(Date.now() + 60 * 60 * 1000);
    const interview = await createInterview(
      application.id,
      {
        scheduledAt: interviewTime,
        mode: 'virtual',
        status: 'planned',
        interviewerName: 'Jamie Rivera',
        agenda: 'Discuss system design experience',
      },
      { workspaceId, actorId: 812 },
    );
    expect(interview.status).toBe('planned');

    const updatedInterview = await updateInterview(
      interview.id,
      { status: 'completed', feedback: 'Impressive technical depth' },
      { workspaceId, actorId: 960 },
    );
    expect(updatedInterview.status).toBe('completed');
    expect(updatedInterview.feedback).toBe('Impressive technical depth');

    const interviews = await listInterviews(application.id, { workspaceId });
    expect(interviews).toHaveLength(1);
    expect(interviews[0].status).toBe('completed');

    const response = await createResponse(
      application.id,
      {
        body: 'Sent follow-up materials and scheduling link.',
        responseType: 'note',
        visibility: 'internal',
      },
      { workspaceId, actorId: 812 },
    );
    expect(response.authorId).toBe(812);

    const responses = await listResponses(application.id, { workspaceId });
    expect(responses).toHaveLength(1);
    expect(responses[0].body).toContain('follow-up materials');

    await createJob(
      {
        workspaceId,
        title: 'Engagement Manager',
        status: 'paused',
      },
      { workspaceId },
    );

    const snapshot = await getJobManagementSnapshot({ workspaceId });
    expect(snapshot.jobStatusCounts.open).toBe(1);
    expect(snapshot.jobStatusCounts.paused).toBe(1);
    expect(snapshot.interviewStatusCounts.completed).toBe(1);

    const metadata = getJobManagementMetadata();
    expect(metadata.jobStatuses).toContain('open');
    expect(metadata.applicationStatuses).toContain('interview');
    expect(metadata.interviewStatuses).toContain('completed');
    expect(metadata.responseTypes).toContain('note');
  });
});
