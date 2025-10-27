import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import GovernanceSummaryCards from '../GovernanceSummaryCards.jsx';
import GovernancePolicySnapshot from '../GovernancePolicySnapshot.jsx';
import GovernanceActivityTimeline from '../GovernanceActivityTimeline.jsx';

describe('GovernanceSummaryCards', () => {
  it('renders key metrics for content and policies', () => {
    render(
      <GovernanceSummaryCards
        contentSummary={{ total: 7, urgent: 2, awaitingReview: 5, highSeverity: 3 }}
        policyTotals={{ activeDocuments: 4, draftDocuments: 1, totalDocuments: 6, archivedDocuments: 1 }}
        versionTotals={{ inReview: 2, drafts: 1, published: 3, approved: 0, archived: 0 }}
        upcomingCount={3}
        lookbackDays={14}
      />,
    );

    expect(screen.getByText('Items awaiting moderation')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Active policies')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Upcoming effective')).toHaveTextContent('3');
  });
});

describe('GovernancePolicySnapshot', () => {
  it('shows recent publications and upcoming effective dates', () => {
    render(
      <GovernancePolicySnapshot
        recentPublications={[
          {
            documentId: 1,
            documentTitle: 'Privacy Policy',
            versionId: 11,
            version: 4,
            locale: 'en',
            status: 'published',
            publishedAt: new Date('2025-10-10T09:00:00Z').toISOString(),
          },
        ]}
        upcomingEffective={[
          {
            documentId: 2,
            documentTitle: 'Cookie Policy',
            versionId: 21,
            version: 3,
            locale: 'en',
            status: 'approved',
            effectiveAt: new Date('2025-10-15T00:00:00Z').toISOString(),
          },
        ]}
      />,
    );

    expect(screen.getByText(/Privacy Policy · v4/)).toBeInTheDocument();
    expect(screen.getByText(/Cookie Policy · v3/)).toBeInTheDocument();
  });

  it('renders empty states when no data is available', () => {
    render(<GovernancePolicySnapshot recentPublications={[]} upcomingEffective={[]} />);
    expect(
      screen.getByText('No policy publications detected in this window.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No upcoming effective dates. All policies are current.'),
    ).toBeInTheDocument();
  });
});

describe('GovernanceActivityTimeline', () => {
  it('renders activity cards with metadata', () => {
    render(
      <GovernanceActivityTimeline
        events={[
          {
            id: 'content-1',
            type: 'content',
            title: 'Approve high severity flag',
            createdAt: new Date('2025-10-10T10:00:00Z').toISOString(),
            summary: 'Launch announcement cleared after review.',
            metadata: { severity: 'high', priority: 'urgent' },
            reference: { submissionId: 42, title: 'Launch announcement' },
          },
          {
            id: 'policy-2',
            type: 'policy',
            title: 'Version published',
            createdAt: new Date('2025-10-09T11:00:00Z').toISOString(),
            summary: 'Privacy policy refresh is live.',
            reference: { documentTitle: 'Privacy Policy', version: 4, locale: 'en' },
          },
        ]}
      />,
    );

    expect(screen.getByText(/Approve high severity flag/)).toBeInTheDocument();
    expect(screen.getByText(/Privacy Policy · v4/)).toBeInTheDocument();
  });

  it('renders fallback when no events are provided', () => {
    render(<GovernanceActivityTimeline events={[]} />);
    expect(
      screen.getByText('No recent governance activity recorded during this window.'),
    ).toBeInTheDocument();
  });
});
