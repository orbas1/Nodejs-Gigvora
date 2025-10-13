import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { __internals } from '../../src/services/pipelineService.js';

const {
  calculateSummaryMetrics,
  calculateConversionRates,
  calculateVelocityMetrics,
  buildForecastScenarios,
  identifyPipelineRisks,
  buildEnterpriseInsights,
  calculateDealFlow,
  scorePipelineHealth,
  buildExperienceUx,
} = __internals;

const NOW = new Date('2024-01-01T00:00:00Z').getTime();

const sampleDeals = [
  {
    id: 1,
    stageId: 10,
    stage: { id: 10, name: 'Discovery Scheduled', winProbability: 40, statusCategory: 'open' },
    status: 'open',
    pipelineValue: 20000,
    winProbability: 40,
    createdAt: '2023-11-20T00:00:00Z',
    updatedAt: '2023-12-28T00:00:00Z',
    lastContactAt: '2023-12-20T00:00:00Z',
    nextFollowUpAt: '2024-01-05T00:00:00Z',
    expectedCloseDate: '2024-02-01T00:00:00Z',
    followUps: [
      { id: 100, dueAt: '2024-01-05T10:00:00Z', status: 'scheduled' },
    ],
    proposals: [],
  },
  {
    id: 2,
    stageId: 11,
    stage: { id: 11, name: 'Negotiation', winProbability: 70, statusCategory: 'open' },
    status: 'on_hold',
    pipelineValue: 15000,
    winProbability: 70,
    createdAt: '2023-09-01T00:00:00Z',
    updatedAt: '2023-12-20T00:00:00Z',
    lastContactAt: '2023-10-15T00:00:00Z',
    nextFollowUpAt: null,
    expectedCloseDate: '2023-12-01T00:00:00Z',
    followUps: [
      { id: 101, dueAt: '2023-12-15T00:00:00Z', status: 'scheduled' },
    ],
    proposals: [{ id: 201, status: 'sent' }],
  },
  {
    id: 3,
    stageId: 12,
    stage: { id: 12, name: 'Closed Won', winProbability: 100, statusCategory: 'won' },
    status: 'won',
    pipelineValue: 25000,
    winProbability: 100,
    createdAt: '2023-08-01T00:00:00Z',
    updatedAt: '2023-12-10T00:00:00Z',
    lastContactAt: '2023-12-08T00:00:00Z',
    nextFollowUpAt: null,
    expectedCloseDate: '2023-12-10T00:00:00Z',
    followUps: [],
    proposals: [{ id: 202, status: 'accepted', acceptedAt: '2023-12-01T00:00:00Z' }],
  },
  {
    id: 4,
    stageId: 13,
    stage: { id: 13, name: 'Closed Lost', winProbability: 0, statusCategory: 'lost' },
    status: 'lost',
    pipelineValue: 10000,
    winProbability: 0,
    createdAt: '2023-07-01T00:00:00Z',
    updatedAt: '2023-10-01T00:00:00Z',
    lastContactAt: '2023-09-20T00:00:00Z',
    nextFollowUpAt: null,
    expectedCloseDate: '2023-09-15T00:00:00Z',
    followUps: [],
    proposals: [{ id: 203, status: 'sent' }],
  },
];

describe('pipelineService enterprise metrics', () => {
  beforeAll(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterAll(() => {
    Date.now.mockRestore();
  });

  it('calculates extended summary metrics for the CRM pipeline', () => {
    const summary = calculateSummaryMetrics(sampleDeals);

    expect(summary.totalDeals).toBe(4);
    expect(summary.openDeals).toBe(2);
    expect(summary.onHoldDeals).toBe(1);
    expect(summary.wonDeals).toBe(1);
    expect(summary.lostDeals).toBe(1);
    expect(summary.pipelineValue).toBeCloseTo(70000);
    expect(summary.weightedPipelineValue).toBeCloseTo(43500);
    expect(summary.wonPipelineValue).toBeCloseTo(25000);
    expect(summary.openPipelineValue).toBeCloseTo(35000);
    expect(summary.averageDealSize).toBeCloseTo(17500, 2);
    expect(summary.winRate).toBeCloseTo(0.5, 3);
    expect(summary.pipelineMomentum).toBeCloseTo(0.5, 3);
    expect(summary.closedDealCycleAverageDays).toBeCloseTo(111.5, 1);
    expect(summary.openDealAgeAverageDays).toBeCloseTo(82, 1);
  });

  it('derives enterprise insights across conversion, velocity, forecast, and risk', () => {
    const summary = calculateSummaryMetrics(sampleDeals);
    const conversionRates = calculateConversionRates(sampleDeals, summary);
    const velocity = calculateVelocityMetrics(sampleDeals);
    const forecast = buildForecastScenarios(sampleDeals);
    const risk = identifyPipelineRisks(sampleDeals);
    const enterprise = buildEnterpriseInsights({ deals: sampleDeals, summary });

    expect(conversionRates.proposalCoverage).toBeCloseTo(0.75, 3);
    expect(conversionRates.proposalAcceptanceRate).toBeCloseTo(0.333, 3);
    expect(conversionRates.activeFollowUpRate).toBeCloseTo(0.25, 3);

    expect(velocity.averageOpenDays).toBeCloseTo(82, 1);
    expect(velocity.overdueDeals).toBe(1);
    expect(velocity.overduePipelineValue).toBeCloseTo(15000);

    expect(forecast.totalPipeline).toBeCloseTo(70000);
    expect(forecast.baseCase).toBeCloseTo(50500);
    expect(forecast.coverageRatio).toBeCloseTo(1.75, 2);

    expect(risk.stalledDealCount).toBe(1);
    expect(risk.overdueFollowUpCount).toBe(1);
    expect(risk.stalledPipelineValue).toBeCloseTo(15000);

    expect(enterprise.recommendations.length).toBeGreaterThan(0);
    expect(enterprise.recommendations.length).toBeLessThanOrEqual(6);
    const titles = enterprise.recommendations.map((item) => item.title);
    expect(titles).toEqual(
      expect.arrayContaining([
        'Shorten deal cycle times',
        'Re-engage stalled accounts',
        'Automate follow-up cadences',
      ]),
    );
    expect(enterprise.dealFlow.wins.count).toBe(1);
    expect(enterprise.dealFlow.newDeals.previousCount).toBe(1);
    expect(enterprise.health).toMatchObject({ status: expect.any(String), score: expect.any(Number) });
    expect(enterprise.experience.healthStatus).toBe(enterprise.health.status);
    expect(enterprise.experience.spotlights.length).toBeGreaterThan(0);
  });

  it('tracks deal flow momentum and orchestrates an enterprise-grade experience layer', () => {
    const summary = calculateSummaryMetrics(sampleDeals);
    const dealFlow = calculateDealFlow(sampleDeals, { now: NOW, lookbackDays: 30 });

    expect(dealFlow.newDeals.count).toBe(0);
    expect(dealFlow.newDeals.previousCount).toBe(1);
    expect(dealFlow.wins.count).toBe(1);
    expect(dealFlow.netNewPipelineValue).toBeCloseTo(-25000, 2);
    expect(dealFlow.momentumIndex).toBeCloseTo(0.033, 3);

    const conversionRates = calculateConversionRates(sampleDeals, summary);
    const velocity = calculateVelocityMetrics(sampleDeals);
    const forecast = buildForecastScenarios(sampleDeals);
    const risk = identifyPipelineRisks(sampleDeals);
    const health = scorePipelineHealth({
      summary,
      conversionRates,
      velocity,
      forecast,
      risk,
      dealFlow,
    });

    expect(health.status).toBe('at_risk');
    expect(health.score).toBeLessThan(70);
    expect(health.summary).toContain('Pipeline health is');
    expect(health.drivers.some((driver) => driver.metric === 'winRate')).toBe(true);

    const experience = buildExperienceUx({
      summary,
      conversionRates,
      velocity,
      forecast,
      risk,
      dealFlow,
      recommendations: [
        {
          title: 'Create new outreach sprint',
          description: 'Activate nurture playbooks to replace lost coverage.',
          priority: 'medium',
          metric: 'pipelineMomentum',
        },
      ],
      health,
    });

    expect(experience.healthStatus).toBe(health.status);
    expect(experience.spotlights.length).toBeGreaterThanOrEqual(3);
    expect(experience.narrative).toContain('Won $');
    expect(experience.nextBestActions[0].title).toBe('Create new outreach sprint');
  });
});
