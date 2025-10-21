import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import AffiliateProgramSection from '../AffiliateProgramSection.jsx';

const buildData = () => ({
  overview: {
    lifetimeEarnings: 12345,
    pendingPayouts: 560,
    conversionRate: 37.4,
    lifetimeConversions: 52,
    lifetimeClicks: 203,
    referralWindowDays: 60,
  },
  payoutSchedule: {
    minimumThreshold: 100,
    nextPayoutAt: '2024-04-01T10:00:00.000Z',
    recurrence: { type: 'finite', limit: 3 },
    autoApprove: true,
  },
  tiers: [
    { id: 'tier-1', name: 'Starter', minValue: 0, maxValue: 999, rate: 10 },
    { id: 'tier-2', name: 'Pro', minValue: 1000, maxValue: null, rate: 15 },
  ],
  links: [
    {
      id: 'link-1',
      label: 'Website banner',
      code: 'AFF-001',
      estimatedCommission: 250,
      totalRevenue: 2000,
      totalConversions: 12,
      currency: 'USD',
      topReferral: { name: 'Acme Corp', source: 'Landing page', amount: 820 },
    },
  ],
  referrals: [
    { id: 'ref-1', name: 'Acme Corp', status: 'Active', occurredAt: '2024-03-10T09:00:00.000Z', amount: 420, currency: 'USD' },
  ],
  insights: { topPerformer: { label: 'Acme Corp', commission: 420, conversions: 11 }, diversificationScore: 'broad' },
  security: { twoFactorRequired: true, requiredDocuments: ['W8-BEN'] },
  settings: { enabled: true, currency: 'USD', referralWindowDays: 45 },
});

describe('AffiliateProgramSection', () => {
  it('renders affiliate programme metrics and listings', () => {
    render(<AffiliateProgramSection data={buildData()} />);

    expect(screen.getByText(/grow with partner-led revenue/i)).toBeInTheDocument();
    expect(screen.getByText(/starter/i)).toBeInTheDocument();
    expect(screen.getByText(/website banner/i)).toBeInTheDocument();
    expect(screen.getByText(/w8-ben/i)).toBeInTheDocument();
    expect(screen.getByText(/referral performance/i)).toBeInTheDocument();
  });

  it('falls back to helpful empty states', () => {
    render(<AffiliateProgramSection data={{ overview: {}, payoutSchedule: {}, tiers: [], links: [], referrals: [] }} />);

    expect(screen.getByText(/define tiers/i)).toBeInTheDocument();
    expect(screen.getByText(/create your first affiliate link/i)).toBeInTheDocument();
  });
});
