process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';

import { describe, expect, it } from '@jest/globals';
import '../setupTestEnv.js';
import {
  createConsentPolicy,
  listConsentPolicies,
  recordUserConsentDecision,
  getUserConsentSnapshot,
} from '../../src/services/consentService.js';
import { User } from '../../src/models/index.js';
import { ConflictError } from '../../src/utils/errors.js';
import {
  ConsentPolicy,
  ConsentPolicyVersion,
  UserConsent,
  ConsentAuditEvent,
} from '../../src/models/consentModels.js';

const basePolicyPayload = {
  code: 'gdpr_marketing',
  title: 'Marketing communications',
  description: 'Consent covering marketing emails, product updates, and curated event alerts.',
  legalBasis: 'consent',
  audience: 'user',
  region: 'eu',
  required: false,
  revocable: true,
  retentionPeriodDays: 730,
};

const baseVersionPayload = {
  version: 1,
  summary: 'Allow Gigvora to send targeted marketing communication.',
  content: 'Full policy text stored in Markdown for cross-channel delivery.',
  effectiveAt: new Date().toISOString(),
};

describe('consentService', () => {
  it('creates policies with active versions and lists them with metadata', async () => {
    await ConsentPolicy.sync({ force: true });
    await ConsentPolicyVersion.sync({ force: true });
    await UserConsent.sync({ force: true });
    await ConsentAuditEvent.sync({ force: true });
    await User.sync({ force: true });

    await createConsentPolicy(basePolicyPayload, baseVersionPayload, { actorId: '42' });

    const policies = await listConsentPolicies({ audience: 'user', region: 'eu' });
    expect(policies).toHaveLength(1);
    expect(policies[0].code).toBe('gdpr_marketing');
    expect(policies[0].activeVersionId).toBeDefined();
    expect(policies[0].versions).toHaveLength(1);
    expect(policies[0].versions[0].version).toBe(1);
  });

  it('records consent decisions and prevents revocation on non-revocable policies', async () => {
    await ConsentPolicy.sync({ force: true });
    await ConsentPolicyVersion.sync({ force: true });
    await UserConsent.sync({ force: true });
    await ConsentAuditEvent.sync({ force: true });
    await User.sync({ force: true });

    await createConsentPolicy(
      { ...basePolicyPayload, code: 'gdpr_core', title: 'Core platform operations', required: true, revocable: false },
      baseVersionPayload,
      { actorId: '42' },
    );

    const user = await User.create({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'secure-password',
      userType: 'user',
    });

    const consent = await recordUserConsentDecision(user.id, 'gdpr_core', {
      status: 'granted',
      source: 'onboarding_flow',
      metadata: { locale: 'en-GB' },
    });

    expect(consent.status).toBe('granted');
    expect(consent.grantedAt).not.toBeNull();

    await expect(
      recordUserConsentDecision(user.id, 'gdpr_core', { status: 'withdrawn', source: 'settings_panel' }),
    ).rejects.toBeInstanceOf(ConflictError);

    const snapshot = await getUserConsentSnapshot(user.id, {});
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0].consent.status).toBe('granted');
  });
});
