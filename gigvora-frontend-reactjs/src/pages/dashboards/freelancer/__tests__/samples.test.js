import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROFILE,
  SAMPLE_AUTOMATIONS,
  SAMPLE_ESCROW_OVERVIEW,
  FINANCE_COMPLIANCE_FEATURES,
  GIG_MARKETPLACE_FEATURES,
  GROWTH_PARTNERSHIP_FEATURES,
  QUICK_ACCESS_COMMERCE,
  QUICK_ACCESS_GROWTH,
  QUICK_ACCESS_SECTIONS,
} from '../sampleData.js';
import { SAMPLE_PROJECT_MANAGEMENT_SNAPSHOT } from '../sampleProjectManagementData.js';

describe('freelancer dashboard sample data', () => {
  it('provides a complete default profile', () => {
    expect(DEFAULT_PROFILE.name).toBeTruthy();
    expect(DEFAULT_PROFILE.role).toBeTruthy();
    expect(DEFAULT_PROFILE.badges).toEqual(expect.arrayContaining([expect.any(String)]));
    expect(DEFAULT_PROFILE.metrics.every((entry) => entry.label && entry.value)).toBe(true);
  });

  it('maintains escrow totals and release eligibility parity', () => {
    const releaseVolume = SAMPLE_ESCROW_OVERVIEW.accounts
      .reduce((sum, account) => sum + (account.releasedVolume ?? 0), 0);

    expect(releaseVolume).toBeCloseTo(SAMPLE_ESCROW_OVERVIEW.metrics.released, 2);
    expect(SAMPLE_ESCROW_OVERVIEW.releaseQueue.every((item) => item.releaseEligible)).toBe(true);
  });

  it('defines actionable automation and finance features', () => {
    expect(SAMPLE_AUTOMATIONS.length).toBeGreaterThan(0);
    SAMPLE_AUTOMATIONS.forEach((automation) => {
      expect(automation.steps.length).toBeGreaterThan(0);
      expect(typeof automation.trigger).toBe('string');
    });

    const featureCollections = [
      FINANCE_COMPLIANCE_FEATURES,
      GIG_MARKETPLACE_FEATURES,
      GROWTH_PARTNERSHIP_FEATURES,
      QUICK_ACCESS_COMMERCE,
      QUICK_ACCESS_GROWTH,
      QUICK_ACCESS_SECTIONS,
    ];

    featureCollections.forEach((collection) => {
      expect(collection.length).toBeGreaterThan(0);
      collection.forEach((feature) => {
        expect(feature.title).toBeTruthy();
        expect(feature.description).toBeTruthy();
      });
    });
  });

  it('exposes a frozen project management snapshot with consistent budgets', () => {
    expect(Object.isFrozen(SAMPLE_PROJECT_MANAGEMENT_SNAPSHOT)).toBe(true);

    const openBudget = SAMPLE_PROJECT_MANAGEMENT_SNAPSHOT.projectLifecycle.open
      .reduce((sum, project) => sum + project.budgetAllocated, 0);
    const closedBudget = SAMPLE_PROJECT_MANAGEMENT_SNAPSHOT.projectLifecycle.closed
      .reduce((sum, project) => sum + project.budgetAllocated, 0);

    expect(openBudget + closedBudget).toBe(
      SAMPLE_PROJECT_MANAGEMENT_SNAPSHOT.summary.budgetInPlay,
    );
    expect(SAMPLE_PROJECT_MANAGEMENT_SNAPSHOT.projectLifecycle.stats.budgetInPlay).toBe(openBudget);
  });
});
