import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ContentApprovalQueue from '../ContentApprovalQueue.jsx';
import PolicyEditor from '../PolicyEditor.jsx';

const mockQueueResponse = {
  items: [
    {
      id: 1,
      title: 'Flagged launch announcement',
      summary: 'Verify design assets and disclosure copy before publishing.',
      referenceType: 'community_post',
      referenceId: 'post-48291',
      priority: 'urgent',
      severity: 'high',
      status: 'pending',
      region: 'us',
      riskScore: 82.5,
      submittedAt: new Date('2024-10-10T09:00:00Z').toISOString(),
      lastActivityAt: new Date('2024-10-10T10:00:00Z').toISOString(),
      assignedTeam: 'Integrity Squad',
    },
    {
      id: 2,
      title: 'Profile update pending review',
      summary: 'Benefits statement requires verification.',
      referenceType: 'company_profile_update',
      referenceId: 'profile-932',
      priority: 'high',
      severity: 'medium',
      status: 'in_review',
      region: 'eu',
      riskScore: 61.2,
      submittedAt: new Date('2024-10-09T14:00:00Z').toISOString(),
      lastActivityAt: new Date('2024-10-10T08:00:00Z').toISOString(),
      assignedTeam: 'Policy Desk',
    },
  ],
  summary: {
    total: 2,
    awaitingReview: 2,
    highSeverity: 1,
    urgent: 1,
  },
  pagination: { page: 1, pageSize: 12, totalItems: 2, totalPages: 1 },
};

const mockHistory = {
  actions: [
    {
      id: 10,
      submissionId: 1,
      action: 'assign',
      severity: 'high',
      riskScore: 82.5,
      reason: 'Assigned to integrity squad',
      createdAt: new Date('2024-10-10T10:05:00Z').toISOString(),
    },
  ],
};

const mockPolicyList = {
  documents: [
    {
      id: 11,
      slug: 'community-guidelines',
      title: 'Community Guidelines',
      category: 'terms',
      summary: 'Rules for community interactions and content moderation.',
      status: 'active',
      defaultLocale: 'en',
      activeVersionId: 27,
    },
  ],
};

const mockPolicyDetail = {
  id: 11,
  slug: 'community-guidelines',
  title: 'Community Guidelines',
  category: 'terms',
  status: 'active',
  defaultLocale: 'en',
  summary: 'Rules for community interactions and content moderation.',
  activeVersionId: 27,
  versions: [
    {
      id: 27,
      version: 4,
      locale: 'en',
      status: 'draft',
      summary: 'Draft update',
      changeSummary: 'Strengthened escalation language.',
      content: 'Existing policy text',
      createdAt: new Date('2024-10-05T08:00:00Z').toISOString(),
    },
  ],
  auditEvents: [
    {
      id: 90,
      action: 'version.created',
      createdAt: new Date('2024-10-05T08:00:00Z').toISOString(),
    },
  ],
};

vi.mock('../../../../services/contentGovernance.js', () => ({
  fetchApprovalQueue: vi.fn(async () => mockQueueResponse),
  assignSubmission: vi.fn(async () => ({ success: true })),
  createModerationAction: vi.fn(async () => ({ success: true })),
  fetchModerationActions: vi.fn(async () => mockHistory),
}));

vi.mock('../../../../services/legalPolicies.js', () => ({
  fetchAdminLegalPolicies: vi.fn(async () => mockPolicyList),
  fetchAdminLegalPolicy: vi.fn(async () => mockPolicyDetail),
  updateAdminLegalPolicyVersion: vi.fn(async () => ({ success: true })),
  createAdminLegalPolicyVersion: vi.fn(async () => ({ id: 30, version: 5, locale: 'en', status: 'draft' })),
  publishAdminLegalPolicyVersion: vi.fn(async () => ({ success: true })),
  activateAdminLegalPolicyVersion: vi.fn(async () => ({ success: true })),
}));

const contentGovernance = await import('../../../../services/contentGovernance.js');
const legalPolicies = await import('../../../../services/legalPolicies.js');

describe('ContentApprovalQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders queue metrics and selected submission details', async () => {
    render(<ContentApprovalQueue currentUserId={42} />);

    await waitFor(() => {
      expect(contentGovernance.fetchApprovalQueue).toHaveBeenCalled();
    });

    const metricLabel = await screen.findByText('In Queue');
    const queueMetric = metricLabel.closest('div');
    expect(queueMetric).toHaveTextContent('2');

    const firstRow = await screen.findByRole('button', { name: /Flagged launch announcement/i });
    expect(firstRow).toBeInTheDocument();
    expect(firstRow).toHaveTextContent(/Verify design assets/i);
    expect(await screen.findByRole('button', { name: /Claim review/i })).toBeInTheDocument();
  });

  it('allows claiming the submission and refreshes the queue', async () => {
    render(<ContentApprovalQueue currentUserId={101} />);

    await waitFor(() => {
      expect(contentGovernance.fetchApprovalQueue).toHaveBeenCalledTimes(1);
    });

    const claimButton = await screen.findByRole('button', { name: /Claim review/i });
    await userEvent.click(claimButton);

    await waitFor(() => {
      expect(contentGovernance.assignSubmission).toHaveBeenCalledWith(1, { reviewerId: 101 });
      expect(contentGovernance.fetchApprovalQueue).toHaveBeenCalledTimes(2);
    });
  });

  it('submits a moderation action and appends to history', async () => {
    render(<ContentApprovalQueue currentUserId={101} />);

    await waitFor(() => {
      expect(contentGovernance.fetchModerationActions).toHaveBeenCalledWith(1);
    });

    const reasonField = screen.getByLabelText(/Reason \//i);
    await userEvent.type(reasonField, 'Confirmed partner rights, ready to publish.');

    const actionSelect = screen.getByLabelText('Action');
    await userEvent.selectOptions(actionSelect, 'approve');

    const submitButton = screen.getByRole('button', { name: /Apply action/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(contentGovernance.createModerationAction).toHaveBeenCalledWith(1, expect.objectContaining({
        action: 'approve',
        status: 'pending',
      }));
      expect(contentGovernance.fetchModerationActions).toHaveBeenCalledTimes(2);
    });
  });
});

describe('PolicyEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads policy detail and saves a draft update', async () => {
    render(<PolicyEditor locale="en" />);

    await waitFor(() => {
      expect(legalPolicies.fetchAdminLegalPolicies).toHaveBeenCalled();
    });

    const policyButton = screen.getByRole('button', { name: /Community Guidelines/i });
    await userEvent.click(policyButton);

    await waitFor(() => {
      expect(legalPolicies.fetchAdminLegalPolicy).toHaveBeenCalledWith('community-guidelines', expect.any(Object));
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Draft content/i)).toBeInTheDocument();
    });

    const summaryField = screen.getByLabelText(/Change summary/i);
    await userEvent.clear(summaryField);
    await userEvent.type(summaryField, 'Clarified escalation timings.');

    const editor = screen.getByLabelText(/Draft content/i);
    await userEvent.clear(editor);
    await userEvent.type(editor, 'Updated policy language for clarity.');

    const saveButton = screen.getByRole('button', { name: /Save draft/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(legalPolicies.updateAdminLegalPolicyVersion).toHaveBeenCalledWith(
        11,
        27,
        expect.objectContaining({ content: 'Updated policy language for clarity.' }),
      );
    });
  });
});
