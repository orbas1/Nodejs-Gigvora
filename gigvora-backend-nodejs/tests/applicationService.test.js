import { describe, it, expect } from '@jest/globals';
import {
  createApplication,
  updateApplicationStatus,
  recordApplicationReview,
  listApplications,
} from '../src/services/applicationService.js';
import { createUser } from './helpers/factories.js';
import { ConflictError } from '../src/utils/errors.js';

describe('applicationService', () => {
  it('creates applications with sanitised metadata and prevents duplicates', async () => {
    const applicant = await createUser({ userType: 'freelancer' });

    const application = await createApplication(
      {
        applicantId: applicant.id,
        targetType: 'job',
        targetId: 101,
        coverLetter: 'Excited to contribute to Gigvora.',
        attachments: [
          {
            fileName: 'resume.pdf',
            storageKey: 'uploads/resume.pdf',
            mimeType: 'application/pdf',
            fileSize: 1024,
          },
        ],
        metadata: {
          portfolioUrl: 'https://portfolio.example.com',
          _internalNote: 'Do not expose',
        },
      },
      { actorId: applicant.id },
    );

    expect(application).toMatchObject({
      applicantId: applicant.id,
      targetType: 'job',
      attachments: [
        expect.objectContaining({
          fileName: 'resume.pdf',
          storageKey: 'uploads/resume.pdf',
          mimeType: 'application/pdf',
        }),
      ],
    });
    expect(application.metadata).toEqual(
      expect.objectContaining({
        portfolioUrl: 'https://portfolio.example.com',
        createdBy: applicant.id,
      }),
    );
    expect(application.metadata).not.toHaveProperty('_internalNote');

    await expect(
      createApplication(
        {
          applicantId: applicant.id,
          targetType: 'job',
          targetId: 101,
        },
        { actorId: applicant.id },
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('supports staged status transitions and review capture', async () => {
    const applicant = await createUser({ userType: 'freelancer' });
    const reviewer = await createUser({
      userType: 'admin',
      email: 'reviewer@gigvora.test',
      firstName: 'Review',
      lastName: 'Lead',
    });

    const created = await createApplication(
      {
        applicantId: applicant.id,
        targetType: 'project',
        targetId: 88,
        metadata: { submissionChannel: 'portfolio_drop' },
      },
      { actorId: applicant.id },
    );

    const screened = await updateApplicationStatus(created.id, 'under_review', {
      actorId: reviewer.id,
      reason: 'Initial screening complete',
    });
    expect(screened.status).toBe('under_review');
    expect(screened.metadata).toEqual(
      expect.objectContaining({ lastStatusReason: 'Initial screening complete', lastUpdatedBy: reviewer.id }),
    );

    await updateApplicationStatus(created.id, 'shortlisted', { actorId: reviewer.id });
    await updateApplicationStatus(created.id, 'interview', { actorId: reviewer.id });
    await updateApplicationStatus(created.id, 'offered', { actorId: reviewer.id });
    const hired = await updateApplicationStatus(created.id, 'hired', {
      actorId: reviewer.id,
      reason: 'Candidate accepted the offer',
    });

    expect(hired.status).toBe('hired');
    expect(hired.decisionAt).toBeInstanceOf(Date);
    expect(hired.metadata).toEqual(
      expect.objectContaining({ lastStatusReason: 'Candidate accepted the offer', lastUpdatedBy: reviewer.id }),
    );

    const review = await recordApplicationReview(
      created.id,
      {
        stage: 'final',
        decision: 'advance',
        score: 92,
        notes: 'Strong communication skills and portfolio depth.',
      },
      reviewer.id,
    );

    expect(review).toMatchObject({
      stage: 'final',
      decision: 'advance',
      reviewer: expect.objectContaining({ id: reviewer.id, firstName: 'Review' }),
    });

    const listing = await listApplications({ applicantId: applicant.id }, { pageSize: 10 });
    expect(listing.data).toHaveLength(1);
    expect(listing.pagination).toMatchObject({ total: 1, page: 1, totalPages: 1 });
    expect(listing.data[0].reviews).toHaveLength(1);
  });
});
