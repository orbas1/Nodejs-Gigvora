import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const creationSnapshotMock = vi.hoisted(() => vi.fn(() => <div data-testid="creation-studio-snapshot" />));
const orderPipelineMock = vi.hoisted(() => vi.fn());
const catalogInsightsMock = vi.hoisted(() => vi.fn());

vi.mock('../../../../../components/creationStudio/CreationStudioSnapshot.jsx', () => ({
  __esModule: true,
  default: creationSnapshotMock,
}));

vi.mock('../../../../../hooks/useFreelancerOrderPipelineSummary.js', () => ({
  __esModule: true,
  default: (args) => orderPipelineMock(args),
}));

vi.mock('../../../../../hooks/useFreelancerCatalogInsights.js', () => ({
  __esModule: true,
  default: (args) => catalogInsightsMock(args),
}));

import AutomationSection from '../AutomationSection.jsx';
import FinanceComplianceSection from '../FinanceComplianceSection.jsx';
import GigMarketplaceOperationsSection from '../GigMarketplaceOperationsSection.jsx';
import GigStudioSection from '../GigStudioSection.jsx';
import GrowthPartnershipSection from '../GrowthPartnershipSection.jsx';
import OperationalQuickAccessSection from '../OperationalQuickAccessSection.jsx';
import {
  SAMPLE_AUTOMATIONS,
  FINANCE_COMPLIANCE_FEATURES,
  GROWTH_PARTNERSHIP_FEATURES,
  QUICK_ACCESS_COMMERCE,
  QUICK_ACCESS_GROWTH,
  QUICK_ACCESS_SECTIONS,
} from '../../sampleData.js';

describe('Freelancer static dashboard sections', () => {
  beforeEach(() => {
    creationSnapshotMock.mockClear();
    orderPipelineMock.mockReturnValue({
      summary: {
        totals: {
          orders: 6,
          openOrders: 3,
          closedOrders: 3,
          totalValue: 18000,
          openValue: 12000,
          completedValue: 6000,
          currency: 'USD',
        },
        pipeline: {
          inquiry: 2,
          production: 2,
          delivery: 1,
        },
        requirementForms: {
          pending: 2,
          submitted: 1,
          approved: 3,
          needsRevision: 1,
          overdue: 1,
        },
        revisions: {
          active: 2,
          awaitingReview: 1,
          completed: 3,
          declined: 0,
        },
        escrow: {
          counts: {
            funded: 1,
            pendingRelease: 1,
            released: 2,
            held: 0,
            disputed: 0,
          },
          amounts: {
            totalFunded: 15000,
            outstanding: 4200,
            releasedValue: 10800,
            currency: 'USD',
          },
        },
        health: {
          csatAverage: 4.8,
          kickoffScheduled: 2,
          deliveryDueSoon: 1,
        },
      },
      stageDistribution: [
        { stage: 'inquiry', count: 2 },
        { stage: 'production', count: 2 },
        { stage: 'delivery', count: 1 },
      ],
      requirementBreakdown: [
        { id: 'pending', label: 'Awaiting client input', count: 2 },
        { id: 'overdue', label: 'Follow-ups overdue', count: 1 },
        { id: 'approved', label: 'Approved and ready', count: 3 },
        { id: 'submitted', label: 'Submitted for review', count: 1 },
      ],
      revisionBreakdown: [
        { id: 'active', label: 'Revisions in progress', count: 2 },
        { id: 'awaiting-review', label: 'Awaiting freelancer review', count: 1 },
        { id: 'completed', label: 'Completed this period', count: 3 },
      ],
      highlights: [
        { id: 'open-orders', name: 'Open orders', primary: '3', secondary: '$12,000 in flight' },
        {
          id: 'deliveries-due',
          name: 'Deliveries due in 3 days',
          primary: '1',
          secondary: 'On-time delivery safety net',
        },
        {
          id: 'kickoff-scheduled',
          name: 'Kickoff calls scheduled',
          primary: '2',
          secondary: 'Keep agendas ready for smooth onboarding',
        },
        {
          id: 'escrow-outstanding',
          name: 'Outstanding escrow',
          primary: '$4,200',
          secondary: '2 checkpoints awaiting release',
        },
      ],
      orders: [],
      meta: { lookbackDays: 120, fetchedAt: new Date().toISOString(), filters: { freelancerId: 42 } },
      lookback: 120,
      loading: false,
      error: null,
      refresh: vi.fn(),
      fromCache: false,
      lastUpdated: new Date().toISOString(),
    });

    catalogInsightsMock.mockReturnValue({
      insights: {
        summary: {
          conversionRate: {
            value: 18.5,
            change: 1.2,
            label: 'vs prior 30 days',
            totals: { impressions: 1200, clicks: 240, conversions: 44 },
          },
          repeatClientRate: {
            value: 42.1,
            change: 3,
            label: 'new retainers in last 30 days',
            totals: { totalClients: 120, repeatClients: 54, activeRetainers: 18 },
          },
          crossSellAcceptance: {
            value: 12.4,
            change: 0.5,
            label: 'attach rate vs prior 30 days',
            openOpportunities: 4,
          },
        },
      },
      conversionFunnel: [
        { id: 'impressions', label: 'Impressions', value: '1,200' },
        { id: 'clicks', label: 'Listing clicks', value: '240' },
        { id: 'conversions', label: 'Orders won', value: '44' },
      ],
      repeatClientSummary: {
        rate: '42.1%',
        change: 3,
        totalClients: '120',
        repeatClients: '54',
        activeRetainers: '18',
      },
      attachRate: {
        rate: '12.4%',
        change: 0.5,
        openOpportunities: 4,
      },
      topBundles: [
        {
          id: 'bundle-1',
          name: 'AI Brand Sprint',
          description: 'Sprint delivery for venture teams.',
          revenue: 5600,
          currencyCode: 'USD',
          conversionRate: 21.5,
          repeatClients: 8,
          attachRate: 15.2,
        },
      ],
      crossSell: [],
      keywords: [],
      margin: {},
      loading: false,
      error: null,
      refresh: vi.fn(),
      fromCache: false,
      lastUpdated: new Date().toISOString(),
    });
  });

  it('renders automation playbooks from the sample catalogue', () => {
    render(
      <MemoryRouter>
        <AutomationSection />
      </MemoryRouter>,
    );
    const section = document.getElementById('automation');
    expect(section).not.toBeNull();
    const automationWithin = within(section);
    expect(automationWithin.getByRole('heading', { level: 2, name: /Automation & signals/i })).toBeInTheDocument();

    SAMPLE_AUTOMATIONS.forEach((automation) => {
      const automationCard = automationWithin.getByText(automation.name).closest('li');
      expect(automationCard).not.toBeNull();
      const cardWithin = within(automationCard);
      expect(cardWithin.getByText(new RegExp(automation.trigger, 'i'))).toBeInTheDocument();
      expect(cardWithin.getByText(automation.health)).toBeInTheDocument();
      automation.steps.forEach((step) => {
        expect(cardWithin.getByText(step)).toBeInTheDocument();
      });
    });

    const createButton = automationWithin.getByRole('button', { name: /Create new playbook/i });
    expect(createButton).toHaveAttribute('type', 'button');
    expect(automationWithin.getByRole('button', { name: /Manage referrals/i })).toBeInTheDocument();
  });

  it('lists finance and compliance enablement pillars', () => {
    render(
      <MemoryRouter>
        <FinanceComplianceSection />
      </MemoryRouter>,
    );
    const section = document.getElementById('finance-compliance');
    expect(section).not.toBeNull();
    const financeWithin = within(section);
    expect(financeWithin.getByRole('heading', { level: 2, name: /Finance, compliance/i })).toBeInTheDocument();

    FINANCE_COMPLIANCE_FEATURES.forEach((feature) => {
      expect(financeWithin.getByRole('heading', { level: 3, name: feature.title })).toBeInTheDocument();
      expect(financeWithin.getByText(feature.description)).toBeInTheDocument();
      feature.bullets?.forEach((bullet) => {
        expect(financeWithin.getByText(bullet)).toBeInTheDocument();
      });
    });
  });

  it('surfaces gig marketplace conversion and bundle insights', () => {
    render(
      <MemoryRouter>
        <GigMarketplaceOperationsSection />
      </MemoryRouter>,
    );
    const section = document.getElementById('gig-marketplace');
    expect(section).not.toBeNull();
    const gigWithin = within(section);
    expect(gigWithin.getByRole('heading', { level: 2, name: /Gig marketplace operations/i })).toBeInTheDocument();
    expect(gigWithin.getByText(/Open orders/i)).toBeInTheDocument();
    expect(gigWithin.getByText('$12,000 in flight')).toBeInTheDocument();
    expect(gigWithin.getByText(/Conversion analytics/i)).toBeInTheDocument();
    expect(gigWithin.getByText(/Repeat clients & retainers/i)).toBeInTheDocument();
    expect(gigWithin.getByText(/AI Brand Sprint/)).toBeInTheDocument();
  });

  it('exposes the creation studio snapshot entry point', () => {
    render(
      <MemoryRouter>
        <GigStudioSection />
      </MemoryRouter>,
    );
    const section = document.getElementById('creation-studio');
    expect(section).not.toBeNull();
    const studioWithin = within(section);
    expect(studioWithin.getByRole('heading', { level: 2, name: /Creation Studio/i })).toBeInTheDocument();
    const cta = studioWithin.getByRole('link', { name: /Open full studio/i });
    expect(cta).toHaveAttribute('href', '/dashboard/freelancer/creation-studio');
    expect(screen.getByTestId('creation-studio-snapshot')).toBeInTheDocument();
    expect(creationSnapshotMock).toHaveBeenCalledTimes(1);
  });

  it('details growth partnership opportunities', () => {
    render(
      <MemoryRouter>
        <GrowthPartnershipSection />
      </MemoryRouter>,
    );
    const section = document.getElementById('growth-partnerships');
    expect(section).not.toBeNull();
    const growthWithin = within(section);
    expect(growthWithin.getByRole('heading', { level: 2, name: /Growth, partnerships/i })).toBeInTheDocument();

    GROWTH_PARTNERSHIP_FEATURES.forEach((feature) => {
      expect(growthWithin.getByRole('heading', { level: 3, name: feature.title })).toBeInTheDocument();
      expect(growthWithin.getByText(feature.description)).toBeInTheDocument();
      feature.bullets?.forEach((bullet) => {
        expect(growthWithin.getByText(bullet)).toBeInTheDocument();
      });
    });
  });

  it('aggregates operational quick access shortcuts', () => {
    render(
      <MemoryRouter>
        <OperationalQuickAccessSection />
      </MemoryRouter>,
    );
    const section = document.getElementById('quick-access');
    expect(section).not.toBeNull();
    const quickWithin = within(section);
    expect(quickWithin.getByRole('heading', { level: 2, name: /Operational quick access/i })).toBeInTheDocument();

    QUICK_ACCESS_SECTIONS.forEach((card) => {
      expect(quickWithin.getByRole('heading', { level: 3, name: card.title })).toBeInTheDocument();
      expect(quickWithin.getByText(card.description)).toBeInTheDocument();
      card.bullets?.forEach((bullet) => {
        expect(quickWithin.getByText(bullet)).toBeInTheDocument();
      });
    });

    expect(quickWithin.getByRole('heading', { level: 3, name: /Gig commerce/i })).toBeInTheDocument();
    QUICK_ACCESS_COMMERCE.forEach((card) => {
      expect(quickWithin.getByText(card.title)).toBeInTheDocument();
      expect(quickWithin.getByText(card.description)).toBeInTheDocument();
      card.bullets?.forEach((bullet) => {
        expect(quickWithin.getByText(bullet)).toBeInTheDocument();
      });
    });

    expect(quickWithin.getByRole('heading', { level: 3, name: /Growth & profile/i })).toBeInTheDocument();
    QUICK_ACCESS_GROWTH.forEach((card) => {
      expect(quickWithin.getByText(card.title)).toBeInTheDocument();
      expect(quickWithin.getByText(card.description)).toBeInTheDocument();
    });
  });
});
