import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const creationSnapshotMock = vi.hoisted(() => vi.fn(() => <div data-testid="creation-studio-snapshot" />));

vi.mock('../../../../../components/creationStudio/CreationStudioSnapshot.jsx', () => ({
  __esModule: true,
  default: creationSnapshotMock,
}));

const sessionMock = vi.hoisted(() => ({
  useSession: vi.fn(() => ({ session: { id: 42, role: 'freelancer', memberships: ['freelancer'] } })),
}));

const pipelineMock = vi.hoisted(() => ({
  useFreelancerOrderPipeline: vi.fn(() => ({
    summary: {
      totals: {
        orders: 5,
        openOrders: 3,
        closedOrders: 2,
        totalValue: 6400,
        openValue: 4200,
        completedValue: 2200,
        currency: 'USD',
      },
      pipeline: {
        inquiry: 1,
        qualification: 1,
        kickoff_scheduled: 1,
        production: 1,
        delivery: 0,
        completed: 1,
        cancelled: 0,
        on_hold: 1,
      },
      requirementForms: { pending: 2, submitted: 1, overdue: 1 },
      revisions: { active: 1, awaitingReview: 0 },
      escrow: {
        counts: { pendingRelease: 2 },
        amounts: { outstanding: 1500, currency: 'USD' },
      },
      health: { kickoffScheduled: 2, deliveryDueSoon: 1 },
      conversion: {
        qualificationRate: 80,
        kickoffRate: 60,
        deliveryRate: 40,
        winRate: 50,
        cancellationRate: 10,
      },
    },
    conversion: {
      qualificationRate: 80,
      kickoffRate: 60,
      deliveryRate: 40,
      winRate: 50,
      cancellationRate: 10,
    },
    orders: [],
    meta: { lookbackDays: 120, fetchedAt: new Date().toISOString(), filters: { freelancerId: 42 } },
    loading: false,
    error: null,
    fromCache: false,
    lastUpdated: new Date('2024-01-01T00:00:00Z'),
    refresh: vi.fn(),
  })),
}));

vi.mock('../../../../../hooks/useSession.js', () => ({
  __esModule: true,
  default: sessionMock.useSession,
}));

vi.mock('../../../../../hooks/useFreelancerOrderPipeline.js', () => ({
  __esModule: true,
  default: pipelineMock.useFreelancerOrderPipeline,
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
    pipelineMock.useFreelancerOrderPipeline.mockClear();
    sessionMock.useSession.mockClear();
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

  it('describes gig marketplace operations workflows', () => {
    render(
      <MemoryRouter>
        <GigMarketplaceOperationsSection />
      </MemoryRouter>,
    );
    const section = document.getElementById('gig-marketplace');
    expect(section).not.toBeNull();
    const gigWithin = within(section);
    expect(gigWithin.getByRole('heading', { level: 2, name: /Gig marketplace operations/i })).toBeInTheDocument();

    expect(gigWithin.getByText(/Total orders/i)).toBeInTheDocument();
    expect(gigWithin.getByText('5')).toBeInTheDocument();
    expect(gigWithin.getByText(/Value in play/i)).toBeInTheDocument();
    expect(gigWithin.getByText(/\$4,200(\.00)?/)).toBeInTheDocument();
    expect(gigWithin.getAllByText(/Win rate/i).length).toBeGreaterThan(0);
    expect(gigWithin.getAllByText(/50\.0%/).length).toBeGreaterThan(0);
    expect(gigWithin.getByText(/Pipeline status/i)).toBeInTheDocument();
    expect(gigWithin.getAllByText(/Qualification/i).length).toBeGreaterThan(0);
    expect(gigWithin.getByText(/Operational signals/i)).toBeInTheDocument();
    expect(gigWithin.getByText(/Pending requirement forms/i)).toBeInTheDocument();
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
