import { describe, expect, it, jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.LIGHTWEIGHT_SERVICE_TESTS = 'true';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsModulePath = path.resolve(__dirname, '../../src/models/index.js');
await jest.unstable_mockModule(modelsModulePath, () => ({
  sequelize: { transaction: (fn) => fn({}) },
  UserSecurityPreference: {},
}));

const complianceModulePath = path.resolve(__dirname, '../../src/services/complianceService.js');
await jest.unstable_mockModule(complianceModulePath, () => ({
  getIdentityVerificationOverview: jest.fn(),
}));

const auditModulePath = path.resolve(__dirname, '../../src/services/securityAuditService.js');
await jest.unstable_mockModule(auditModulePath, () => ({
  recordRuntimeSecurityEvent: jest.fn(),
}));

const serviceModulePath = path.resolve(__dirname, '../../src/services/securityPreferenceService.js');
const {
  __testables: { buildIdentitySummary, buildSecurityInsights },
} = await import(serviceModulePath);

describe('securityPreferenceService __testables', () => {
  describe('buildIdentitySummary', () => {
    it('normalises snapshot with document booleans and metadata', () => {
      const snapshot = {
        current: {
          status: 'verified',
          submitted: true,
          verificationProvider: 'persona',
          submittedAt: '2024-04-01T12:30:00Z',
          reviewedAt: '2024-04-02T10:15:00Z',
          expiresAt: '2025-04-01T00:00:00Z',
          lastUpdated: '2024-04-03T11:00:00Z',
          reviewerId: 782,
          declinedReason: null,
          complianceFlags: ['kyc_completed'],
          documents: {
            front: { url: 'front.png' },
            selfie: { url: 'selfie.png' },
          },
        },
        nextActions: ['confirm-bank'],
        requirements: {
          reviewSlaHours: 48,
          supportContact: 'compliance@gigvora.com',
        },
      };

      const summary = buildIdentitySummary(snapshot);

      expect(summary).toEqual({
        status: 'verified',
        submitted: true,
        verificationProvider: 'persona',
        submittedAt: '2024-04-01T12:30:00Z',
        reviewedAt: '2024-04-02T10:15:00Z',
        expiresAt: '2025-04-01T00:00:00Z',
        lastUpdated: '2024-04-03T11:00:00Z',
        reviewerId: 782,
        declinedReason: null,
        complianceFlags: ['kyc_completed'],
        documents: {
          frontUploaded: true,
          backUploaded: false,
          selfieUploaded: true,
        },
        nextActions: ['confirm-bank'],
        reviewSlaHours: 48,
        supportContact: 'compliance@gigvora.com',
      });
    });

    it('returns null when no snapshot exists', () => {
      expect(buildIdentitySummary(null)).toBeNull();
    });
  });

  describe('buildSecurityInsights', () => {
    it('boosts score when protections and verification are complete', () => {
      const preference = {
        sessionTimeoutMinutes: 10,
        biometricApprovalsEnabled: true,
        deviceApprovalsEnabled: true,
      };
      const identity = {
        status: 'verified',
        submitted: true,
        complianceFlags: [],
      };

      const insights = buildSecurityInsights(preference, identity);

      expect(insights).toEqual({
        score: 100,
        label: 'Excellent',
        identityStatus: 'verified',
        recommendations: [],
      });
    });

    it('identifies weaknesses and provides targeted recommendations', () => {
      const preference = {
        sessionTimeoutMinutes: 120,
        biometricApprovalsEnabled: false,
        deviceApprovalsEnabled: false,
      };
      const identity = {
        status: 'pending',
        submitted: false,
        complianceFlags: ['identity_documents_incomplete'],
      };

      const insights = buildSecurityInsights(preference, identity);

      expect(insights).toEqual({
        score: 25,
        label: 'Needs attention',
        identityStatus: 'pending',
        recommendations: [
          'Reduce the session timeout to limit unattended access risk.',
          'Enable biometric approvals to protect payouts and data exports.',
          'Activate trusted device approvals to catch unfamiliar sign-ins.',
          'Submit government ID and proof of address to complete verification.',
          'Upload missing front, back, or selfie documents for identity checks.',
        ],
      });
    });
  });
});
