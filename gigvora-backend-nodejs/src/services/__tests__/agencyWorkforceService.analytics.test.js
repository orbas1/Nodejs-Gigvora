import { describe, it, expect } from '@jest/globals';
import { __internals } from '../agencyWorkforceService.js';

const {
  detectBaseCurrency,
  computeBillableRateAverages,
  computeUtilizationForecast,
  computeSummary,
} = __internals;

describe('agencyWorkforceService analytics helpers', () => {
  it('detects base currency prioritising payroll delegations', () => {
    const base = detectBaseCurrency({
      payDelegations: [{ currency: 'eur' }, { currency: 'usd' }],
      projectDelegations: [{ metadata: { currency: 'gbp' } }],
      fallback: 'USD',
    });

    expect(base).toBe('EUR');
  });

  it('computes billable rate averages with per-currency breakdown and conversion', () => {
    const averages = computeBillableRateAverages(
      [
        { billableRate: '110', metadata: { currency: 'eur' } },
        { billableRate: 90, metadata: { currency: 'usd' } },
        { billableRate: 75, metadata: { currency: 'gbp' } },
        { billableRate: null, metadata: { currency: 'usd' } },
      ],
      {
        baseCurrency: 'USD',
        currencyRates: { USD: 1, EUR: 1.1, GBP: 1.25 },
      },
    );

    expect(averages.baseCurrency).toBe('USD');
    expect(averages.perCurrency).toEqual({ EUR: 110, USD: 90, GBP: 75 });
    expect(averages.average).toBeCloseTo((110 * 1.1 + 90 + 75 * 1.25) / 3, 2);
    expect(averages.samples).toBe(3);
    expect(averages.unsupportedCurrencies).toEqual([]);
  });

  it('returns multi-currency breakdown even when conversion factors missing', () => {
    const averages = computeBillableRateAverages(
      [
        { billableRate: 100, metadata: { currency: 'cad' } },
        { billableRate: 120, metadata: { currency: 'usd' } },
      ],
      {
        baseCurrency: 'USD',
        currencyRates: { USD: 1 },
      },
    );

    expect(averages.perCurrency).toEqual({ CAD: 100, USD: 120 });
    expect(averages.average).toBeCloseTo(120, 2);
    expect(averages.unsupportedCurrencies).toEqual(['CAD']);
  });

  it('forecasts utilisation trends based on recent capacity snapshots', () => {
    const snapshots = [
      { recordedFor: '2024-01-01', utilizationPercent: 60 },
      { recordedFor: '2024-02-01', utilizationPercent: 64 },
      { recordedFor: '2024-03-01', utilizationPercent: 70 },
      { recordedFor: '2024-04-01', utilizationPercent: 74 },
    ];

    const forecast = computeUtilizationForecast(snapshots, { lookbackPeriods: 4, forecastHorizon: 1 });

    expect(forecast.forecastedUtilizationPercent).toBeGreaterThan(74);
    expect(forecast.trend).toBe('upward');
    expect(forecast.samples).toBe(4);
  });

  it('enriches summary with forecasting and multi-currency analytics', () => {
    const members = [
      { id: 1, status: 'active', capacityHoursPerWeek: 40, allocationPercent: 50 },
      { id: 2, status: 'on_leave', capacityHoursPerWeek: 30, allocationPercent: 20 },
    ];
    const projectDelegations = [
      { billableRate: 120, metadata: { currency: 'usd' }, status: 'active' },
      { billableRate: 95, metadata: { currency: 'eur' }, status: 'in_progress' },
    ];
    const gigDelegations = [{ status: 'in_delivery' }];
    const payDelegations = [
      { status: 'scheduled', nextPayDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), currency: 'USD' },
    ];
    const capacitySnapshots = [
      { recordedFor: '2024-04-01', utilizationPercent: 75 },
      { recordedFor: '2024-03-01', utilizationPercent: 70 },
      { recordedFor: '2024-02-01', utilizationPercent: 68 },
    ];

    const summary = computeSummary(
      {
        members,
        payDelegations,
        projectDelegations,
        gigDelegations,
        capacitySnapshots,
      },
      {
        baseCurrency: 'USD',
        currencyRates: { USD: 1, EUR: 1.1 },
        forecastOptions: { lookbackPeriods: 3, forecastHorizon: 1 },
      },
    );

    expect(summary.totalMembers).toBe(2);
    expect(summary.totalActiveAssignments).toBe(3);
    expect(summary.upcomingPayouts).toBe(1);
    expect(summary.averageBillableRate).toBeCloseTo((120 + 95 * 1.1) / 2, 2);
    expect(summary.averageBillableRateCurrency).toBe('USD');
    expect(summary.averageBillableRateBreakdown.perCurrency).toHaveProperty('EUR', 95);
    expect(summary.forecasting.forecastedUtilizationPercent).toBeGreaterThanOrEqual(75);
  });
});
