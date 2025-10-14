import { describe, it, expect } from '@jest/globals';
import {
  AdCampaign,
  AdCreative,
  AdPlacement,
} from '../../src/models/index.js';
import { getAdDashboardSnapshot } from '../../src/services/adService.js';

function daysFromNow(days) {
  const now = new Date();
  now.setDate(now.getDate() + days);
  return now;
}

describe('adService.getAdDashboardSnapshot', () => {
  it('includes a forecast built from placement and traffic signals', async () => {
    const campaign = await AdCampaign.create({
      name: 'Enterprise Awareness',
      objective: 'brand',
      status: 'active',
    });

    const creative = await AdCreative.create({
      campaignId: campaign.id,
      name: 'Hero Banner',
      type: 'display',
      status: 'active',
      headline: 'Gigvora Partner Spotlight',
      subheadline: 'Accelerate reach with precision placements.',
      callToAction: 'Launch a campaign',
      ctaUrl: 'https://gigvora.example.com/ads',
    });

    await AdPlacement.create({
      creativeId: creative.id,
      surface: 'global_dashboard',
      position: 'hero',
      status: 'active',
      weight: 4,
      pacingMode: 'even',
      priority: 6,
      opportunityType: 'awareness',
      startAt: daysFromNow(-2),
      endAt: daysFromNow(10),
    });

    const snapshot = await getAdDashboardSnapshot({
      surfaces: ['global_dashboard'],
      bypassCache: true,
    });

    expect(snapshot.forecast).toBeTruthy();
    expect(snapshot.forecast.summary).toEqual(
      expect.objectContaining({
        expectedImpressions: expect.any(Number),
        expectedClicks: expect.any(Number),
        expectedLeads: expect.any(Number),
      }),
    );
    expect(snapshot.forecast.summary.expectedImpressions).toBeGreaterThan(0);
    expect(snapshot.forecast.summary.projectedSessions).toBeGreaterThan(0);

    expect(snapshot.forecast.scenarios).toHaveLength(3);
    snapshot.forecast.scenarios.forEach((scenario) => {
      expect(scenario).toEqual(
        expect.objectContaining({
          label: expect.any(String),
          impressions: expect.any(Number),
          clicks: expect.any(Number),
          leads: expect.any(Number),
        }),
      );
    });

    expect(snapshot.forecast.traffic).toEqual(
      expect.objectContaining({
        averageDailySessions: expect.any(Number),
        sourceBreakdown: expect.any(Array),
        lookbackDays: expect.any(Number),
      }),
    );
    expect(snapshot.forecast.assumptions.length).toBeGreaterThan(0);
  });
});
