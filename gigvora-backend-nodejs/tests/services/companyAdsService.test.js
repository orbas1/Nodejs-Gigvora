import { beforeEach, describe, expect, it } from '@jest/globals';
import '../setupTestEnv.js';
import { AdCampaign, AdCreative, AdPlacement } from '../../src/models/companyAdsModels.js';
import {
  getCompanyAdsWorkspace,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  createCreative,
  updateCreative,
  deleteCreative,
  createPlacement,
  updatePlacement,
  deletePlacement,
  togglePlacementStatus,
} from '../../src/services/companyAdsService.js';

function hoursFromNow(hours) {
  const now = new Date();
  now.setHours(now.getHours() + hours);
  return now;
}

describe('companyAdsService', () => {
  const ownerId = 512;

  beforeEach(async () => {
    await Promise.all([
      AdPlacement.truncate({ cascade: true, restartIdentity: true }),
      AdCreative.truncate({ cascade: true, restartIdentity: true }),
      AdCampaign.truncate({ cascade: true, restartIdentity: true }),
    ]);
  });

  it('hydrates the workspace dashboard with campaigns, creatives, placements, and metrics', async () => {
    const campaign = await AdCampaign.create({
      ownerId,
      name: 'Launch Awareness',
      objective: 'brand',
      status: 'active',
      currencyCode: 'USD',
      budgetCents: 125_000,
      startDate: hoursFromNow(-24),
    });

    const creative = await AdCreative.create({
      campaignId: campaign.id,
      name: 'Hero Banner',
      type: 'display',
      status: 'active',
      headline: 'Gigvora Hiring Week',
      callToAction: 'Launch campaign',
      ctaUrl: 'https://gigvora.test/ads',
    });

    await AdPlacement.create({
      creativeId: creative.id,
      surface: 'company_dashboard',
      position: 'hero',
      status: 'active',
      pacingMode: 'even',
      weight: 5,
      priority: 4,
      startAt: hoursFromNow(-2),
      endAt: hoursFromNow(24),
      opportunityType: 'awareness',
    });

    const workspace = await getCompanyAdsWorkspace({ ownerId, surfaces: ['company_dashboard'], now: new Date() });

    expect(workspace.campaigns).toHaveLength(1);
    expect(workspace.campaigns[0]).toEqual(
      expect.objectContaining({
        id: campaign.id,
        name: 'Launch Awareness',
        status: 'active',
        currencyCode: 'USD',
        budgetCents: 125000,
      }),
    );
    expect(workspace.campaigns[0].creatives).toHaveLength(1);
    expect(workspace.campaigns[0].creatives[0].placements).toHaveLength(1);

    expect(workspace.metrics.campaignTotals).toEqual(
      expect.objectContaining({ total: 1, active: 1, paused: 0, scheduled: 0 }),
    );
    expect(workspace.metrics.placementTotals.total).toBe(1);
    expect(workspace.metrics.performance.impressions).toEqual(expect.any(Number));
    expect(workspace.metrics.performance.clicks).toEqual(expect.any(Number));

    expect(workspace.permissions).toEqual(
      expect.objectContaining({
        canManageCampaigns: true,
        canManageCreatives: true,
        canManagePlacements: true,
      }),
    );
    expect(new Date(workspace.lastUpdated).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('supports full campaign lifecycle with owner scoping and validation', async () => {
    const campaign = await createCampaign({
      ownerId,
      payload: {
        name: 'Growth Play',
        objective: 'brand',
        status: 'active',
        currencyCode: 'usd',
        budgetCents: '12345.50',
        metadata: { vertical: 'saas' },
      },
    });

    expect(campaign).toEqual(
      expect.objectContaining({
        name: 'Growth Play',
        status: 'active',
        currencyCode: 'USD',
        budgetCents: 1234550,
        metadata: { vertical: 'saas' },
      }),
    );

    const updated = await updateCampaign({
      ownerId,
      campaignId: campaign.id,
      payload: {
        status: 'paused',
        budget: '789.25',
      },
    });

    expect(updated.status).toBe('paused');
    expect(updated.budgetCents).toBe(78925);

    await expect(
      updateCampaign({ ownerId: ownerId + 1, campaignId: campaign.id, payload: { status: 'active' } }),
    ).rejects.toThrow('Campaign not found');

    await expect(deleteCampaign({ ownerId: ownerId + 1, campaignId: campaign.id })).rejects.toThrow(
      'Campaign not found',
    );

    await expect(deleteCampaign({ ownerId, campaignId: campaign.id })).resolves.toEqual({ success: true });
  });

  it('manages creatives and placements enforcing campaign ownership', async () => {
    const campaign = await createCampaign({
      ownerId,
      payload: {
        name: 'Video Spotlight',
        objective: 'brand',
        status: 'active',
      },
    });

    const creative = await createCreative({
      ownerId,
      campaignId: campaign.id,
      payload: {
        name: 'Hero Reel',
        type: 'video',
        status: 'active',
        headline: 'Meet your next hire',
        callToAction: 'Book demo',
        ctaUrl: 'https://gigvora.test/demo',
        durationSeconds: '45',
      },
    });

    expect(creative).toEqual(
      expect.objectContaining({
        campaignId: campaign.id,
        name: 'Hero Reel',
        type: 'video',
        durationSeconds: 45,
      }),
    );

    const creativeUpdated = await updateCreative({
      ownerId,
      creativeId: creative.id,
      payload: { headline: 'Hire at speed', primaryColor: '#3355FF' },
    });

    expect(creativeUpdated.headline).toBe('Hire at speed');
    expect(creativeUpdated.primaryColor).toBe('#3355FF');

    const placement = await createPlacement({
      ownerId,
      creativeId: creative.id,
      payload: {
        surface: 'company_dashboard',
        position: 'sidebar',
        status: 'active',
        pacingMode: 'even',
        weight: 3,
        priority: 5,
        startAt: hoursFromNow(0).toISOString(),
      },
    });

    expect(placement).toEqual(
      expect.objectContaining({
        creativeId: creative.id,
        surface: 'company_dashboard',
        position: 'sidebar',
        status: 'active',
        weight: 3,
      }),
    );

    const toggled = await togglePlacementStatus({ ownerId, placementId: placement.id });
    expect(toggled.status).toBe('paused');

    const placementUpdated = await updatePlacement({
      ownerId,
      placementId: placement.id,
      payload: { status: 'active', weight: 2, opportunityType: 'lead_gen' },
    });

    expect(placementUpdated.status).toBe('active');
    expect(placementUpdated.weight).toBe(2);
    expect(placementUpdated.opportunityType).toBe('lead_gen');

    await expect(
      updatePlacement({ ownerId: ownerId + 1, placementId: placement.id, payload: { status: 'paused' } }),
    ).rejects.toThrow('Placement not found');

    await expect(deletePlacement({ ownerId: ownerId + 1, placementId: placement.id })).rejects.toThrow(
      'Placement not found',
    );

    await expect(deletePlacement({ ownerId, placementId: placement.id })).resolves.toEqual({ success: true });

    await expect(deleteCreative({ ownerId: ownerId + 1, creativeId: creative.id })).rejects.toThrow('Creative not found');
    await expect(deleteCreative({ ownerId, creativeId: creative.id })).resolves.toEqual({ success: true });
  });
});
