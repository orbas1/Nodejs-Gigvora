import apiClient from './apiClient.js';

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  return [];
}

function withDefaults(suite = {}) {
  const pipelines = suite.pipelines ?? {};
  const releases = suite.releases ?? {};
  const rollouts = suite.rollouts ?? {};

  return {
    generatedAt: suite.generatedAt ?? new Date().toISOString(),
    pipelines: {
      stats: pipelines.stats ?? {},
      pipelines: ensureArray(pipelines.pipelines).map((pipeline) => ({
        ...pipeline,
        blockers: ensureArray(pipeline.blockers),
      })),
      tooling: pipelines.tooling ?? {},
    },
    releases: {
      latest: releases.latest ?? null,
      notes: ensureArray(releases.notes),
      stats: releases.stats ?? {},
    },
    rollouts: {
      cohorts: ensureArray(rollouts.cohorts),
      stats: rollouts.stats ?? {},
    },
    health: suite.health ?? {},
  };
}

export async function fetchReleaseOperationsSuite(client = apiClient) {
  const response = await client.get('/release-engineering/suite');
  return withDefaults(response.data);
}

export function normaliseReleaseSuite(data) {
  return withDefaults(data);
}

export default fetchReleaseOperationsSuite;
