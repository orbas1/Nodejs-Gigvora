process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';

import { describe, it, expect, beforeAll } from '@jest/globals';
import {
  createCampaign,
  createCreative,
  createPlacement,
  updateCampaign,
  updateCreative,
  updatePlacement,
  listCampaigns,
  getCampaign,
  getReferenceData,
} from '../../src/services/agencyAdService.js';
import { sequelize } from '../../src/models/index.js';
import { createUser, createProviderWorkspace } from '../helpers/factories.js';

describe('agencyAdService', () => {
  let owner;
  let workspace;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    owner = await createUser({ email: 'agency.owner@gigvora.test', userType: 'agency' });
    workspace = await createProviderWorkspace({ ownerId: owner.id, slug: 'agency-ads' });
  });

  it('creates, lists, and updates agency ad campaigns with creatives and placements', async () => {
    const campaign = await createCampaign(
      {
        name: 'Spring Awareness',
        objective: 'brand',
        status: 'draft',
        budgetAmount: 12500,
        currencyCode: 'USD',
        workspaceId: workspace.id,
        keywordHints: ['launch', 'growth'],
      },
      { actorId: owner.id, roles: ['agency'] },
    );

    expect(campaign).toMatchObject({
      name: 'Spring Awareness',
      objective: 'brand',
      status: 'draft',
      currencyCode: 'USD',
    });
    expect(campaign.metadata.keywordHints).toEqual(expect.arrayContaining(['launch', 'growth']));

    const creative = await createCreative(
      campaign.id,
      {
        name: 'Hero Banner',
        type: 'display',
        status: 'active',
        headline: 'Power your next launch',
        subheadline: 'Showcase campaigns across Gigvora surfaces',
        callToAction: 'View plans',
        mediaUrl: 'https://cdn.gigvora.test/ads/hero.png',
      },
      { actorId: owner.id, roles: ['agency'] },
    );

    expect(creative).toMatchObject({
      campaignId: campaign.id,
      status: 'active',
      headline: 'Power your next launch',
    });

    const placement = await createPlacement(
      campaign.id,
      {
        creativeId: creative.id,
        surface: 'agency_dashboard',
        position: 'hero',
        status: 'active',
        startAt: new Date().toISOString(),
        priority: 6,
      },
      { actorId: owner.id, roles: ['agency'] },
    );

    expect(placement).toMatchObject({
      creativeId: creative.id,
      surface: 'agency_dashboard',
      position: 'hero',
      status: 'active',
    });

    const listings = await listCampaigns({ workspaceId: workspace.id }, { actorId: owner.id, roles: ['agency'] });
    expect(listings.campaigns).toHaveLength(1);
    expect(listings.campaigns[0].summary.placements.total).toBe(1);

    const detail = await getCampaign(campaign.id, { workspaceId: workspace.id }, { actorId: owner.id, roles: ['agency'] });
    expect(detail.creatives).toHaveLength(1);
    expect(detail.creatives[0].placements).toHaveLength(1);
    expect(detail.performance.overview.totalPlacements).toBeGreaterThanOrEqual(1);

    const updatedCampaign = await updateCampaign(
      campaign.id,
      { status: 'active', budgetAmount: 15000 },
      { actorId: owner.id, roles: ['agency'] },
    );
    expect(updatedCampaign.status).toBe('active');
    expect(updatedCampaign.budgetCents).toBe(1500000);

    const updatedCreative = await updateCreative(
      creative.id,
      { status: 'paused', headline: 'Refined hero headline' },
      { actorId: owner.id, roles: ['agency'] },
    );
    expect(updatedCreative.status).toBe('paused');
    expect(updatedCreative.headline).toBe('Refined hero headline');

    const updatedPlacement = await updatePlacement(
      placement.id,
      { status: 'paused', priority: 2 },
      { actorId: owner.id, roles: ['agency'] },
    );
    expect(updatedPlacement.status).toBe('paused');
    expect(updatedPlacement.priority).toBe(2);

    const referenceData = getReferenceData();
    expect(referenceData.objectives.find((option) => option.value === 'brand')).toBeTruthy();
    expect(referenceData.surfaces.find((option) => option.value === 'agency_dashboard')).toBeTruthy();
  });
});
