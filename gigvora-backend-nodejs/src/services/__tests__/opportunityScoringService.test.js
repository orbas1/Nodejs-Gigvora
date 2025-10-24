import { annotateWithScores } from '../opportunityScoringService.js';

describe('opportunityScoringService', () => {
  it('annotates opportunities with AI scoring signals', () => {
    const now = new Date().toISOString();
    const opportunities = [
      {
        id: 1,
        title: 'Remote React Developer',
        description: 'Join our remote React squad',
        updatedAt: now,
        isRemote: true,
        taxonomySlugs: ['react', 'frontend'],
        taxonomyTypes: ['skill'],
        geo: { lat: 45, lng: -73 },
      },
    ];

    const result = annotateWithScores(opportunities, {
      query: 'React developer',
      filters: { taxonomySlugs: ['react'], isRemote: true },
      viewport: { boundingBox: { north: 50, south: 40, east: -60, west: -80 } },
      reputationSignals: { trustScore: 85 },
    });

    expect(result).toHaveLength(1);
    expect(result[0].aiSignals).toMatchObject({
      total: expect.any(Number),
      freshness: expect.any(Number),
      queryAffinity: expect.any(Number),
      taxonomy: expect.any(Number),
      remoteFit: expect.any(Number),
      reputation: expect.any(Number),
    });
    expect(result[0].aiSignals.total).toBeGreaterThan(0.3);
  });

  it('returns an empty array when no opportunities are provided', () => {
    expect(annotateWithScores(null)).toEqual([]);
    expect(annotateWithScores([])).toEqual([]);
  });
});
