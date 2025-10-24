import {
  markDependencyHealthy,
  markDependencyUnavailable,
  markDependencyDegraded,
} from '../lifecycle/runtimeHealth.js';
import { coerceBoolean } from '../utils/boolean.js';

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function syncStripeDependency(stripeSettings = {}, logger) {
  const missing = [];
  if (!hasValue(stripeSettings.secretKey)) {
    missing.push('secretKey');
  }
  if (!hasValue(stripeSettings.publishableKey)) {
    missing.push('publishableKey');
  }
  if (missing.length > 0) {
    const error = new Error('Stripe configuration incomplete');
    markDependencyUnavailable('paymentsCore', error, {
      provider: 'stripe',
      configured: false,
      missing,
    });
    logger?.warn?.({ provider: 'stripe', missing }, 'Stripe payments dependency unavailable');
    return { status: 'error', provider: 'stripe', missing };
  }

  markDependencyHealthy('paymentsCore', {
    provider: 'stripe',
    configured: true,
    publishableKeyPresent: true,
    webhookConfigured: hasValue(stripeSettings.webhookSecret),
    accountIdPresent: hasValue(stripeSettings.accountId),
  });
  return { status: 'ok', provider: 'stripe' };
}

function syncEscrowDependency(escrowSettings = {}, logger) {
  const missing = [];
  if (!hasValue(escrowSettings.apiKey)) {
    missing.push('apiKey');
  }
  if (!hasValue(escrowSettings.apiSecret)) {
    missing.push('apiSecret');
  }
  if (missing.length > 0) {
    const error = new Error('Escrow.com credentials incomplete');
    markDependencyUnavailable('paymentsCore', error, {
      provider: 'escrow_com',
      configured: false,
      missing,
    });
    logger?.error?.({ provider: 'escrow_com', missing }, 'Escrow.com payments dependency unavailable');
    return { status: 'error', provider: 'escrow_com', missing };
  }

  markDependencyHealthy('paymentsCore', {
    provider: 'escrow_com',
    configured: true,
    sandbox: coerceBoolean(escrowSettings.sandbox, { fallback: true }),
  });
  return { status: 'ok', provider: 'escrow_com' };
}

function syncPaymentDependency(settings = {}, logger) {
  const provider = (settings?.payments?.provider ?? 'stripe').toLowerCase();
  if (provider === 'stripe') {
    return syncStripeDependency(settings?.payments?.stripe ?? {}, logger);
  }
  if (provider === 'escrow_com') {
    return syncEscrowDependency(settings?.payments?.escrow_com ?? {}, logger);
  }

  const error = new Error(`Unsupported payment provider: ${provider || 'unknown'}`);
  markDependencyUnavailable('paymentsCore', error, {
    provider,
    configured: false,
  });
  logger?.error?.({ provider }, 'Unsupported payment provider configured');
  return { status: 'error', provider };
}

function syncComplianceDependency(settings = {}, paymentsStatus = { status: 'unknown' }, logger) {
  const escrowEnabled = coerceBoolean(settings?.featureToggles?.escrow, { fallback: true });
  const custodyProvider = settings?.payments?.provider ?? 'stripe';

  if (!escrowEnabled) {
    const error = new Error('Escrow compliance workflows disabled');
    markDependencyDegraded('complianceProviders', error, {
      escrowEnabled: false,
      custodyProvider,
    });
    logger?.warn?.({ custodyProvider }, 'Compliance dependency degraded because escrow is disabled');
    return { status: 'degraded', custodyProvider, escrowEnabled: false };
  }

  if (paymentsStatus.status !== 'ok') {
    const error = new Error('Payments dependency unavailable');
    markDependencyDegraded('complianceProviders', error, {
      escrowEnabled: true,
      custodyProvider,
    });
    logger?.error?.({ custodyProvider, paymentsStatus }, 'Compliance dependency degraded due to payment outage');
    return { status: 'degraded', custodyProvider, escrowEnabled: true };
  }

  markDependencyHealthy('complianceProviders', {
    custodyProvider,
    escrowEnabled: true,
  });
  return { status: 'ok', custodyProvider, escrowEnabled: true };
}

export function syncCriticalDependencies(settings = {}, { logger } = {}) {
  const log = logger ?? console;
  const paymentsStatus = syncPaymentDependency(settings, log);
  const complianceStatus = syncComplianceDependency(settings, paymentsStatus, log);
  return { paymentsStatus, complianceStatus };
}

export default {
  syncCriticalDependencies,
};
