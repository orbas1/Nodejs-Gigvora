import { domainRegistry } from '../models/index.js';
import logger from '../utils/logger.js';
import { AuthDomainService } from './auth/authDomainService.js';
import { MarketplaceDomainService } from './marketplace/marketplaceDomainService.js';
import { FeatureFlagService } from './platform/featureFlagService.js';

const services = {
  auth: new AuthDomainService({ domainRegistry, logger }),
  marketplace: new MarketplaceDomainService({ domainRegistry, logger }),
  platform: new FeatureFlagService({ domainRegistry, logger }),
};

export function getAuthDomainService() {
  return services.auth;
}

export function getMarketplaceDomainService() {
  return services.marketplace;
}

export function getFeatureFlagService() {
  return services.platform;
}

export function getDomainServicesSnapshot() {
  return {
    contexts: domainRegistry.snapshot(),
  };
}

export default services;
