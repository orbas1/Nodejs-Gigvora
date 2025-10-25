import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const statusTaxonomy = require('../../../../shared-contracts/domain/common/statuses.json');

const STATUS_TAXONOMY = Object.freeze(statusTaxonomy);

function unique(values) {
  return Array.from(new Set(values.filter((value) => value != null))).map((value) => `${value}`);
}

export function getStatusValues(category, fallback = []) {
  if (!category) {
    return unique(fallback);
  }
  const domainStatuses = STATUS_TAXONOMY[category]?.statuses ?? [];
  return unique([...domainStatuses, ...fallback]);
}

export default {
  STATUS_TAXONOMY,
  getStatusValues,
};
