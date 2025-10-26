import { describe, expect, it } from '@jest/globals';
import { serialiseComment } from '../feedSerializationService.js';

describe('feedSerializationService.serialiseComment', () => {
  it('exposes metadata, flags, and tags for engagement-aware comments', () => {
    const createdAt = new Date('2024-05-01T12:00:00.000Z');
    const comment = {
      id: 11,
      postId: 9,
      parentId: null,
      body: 'Celebrating the release and guiding pods through the rollout.',
      createdAt,
      updatedAt: createdAt,
      metadata: {
        isPinned: true,
        isOfficial: false,
        insightTags: ['Mentor POV', 'Release plan'],
        guidance: 'Share the adoption playbook with your squads before Friday.',
        language: 'es',
      },
      author: {
        id: 5,
        firstName: 'Avery',
        lastName: 'Mentor',
        title: 'Mentor Lead',
        Profile: { id: 7, headline: 'Mentor Lead', bio: null, avatarSeed: 'avery' },
      },
      replies: [
        {
          id: 12,
          postId: 9,
          parentId: 11,
          body: 'Thanks for the coaching notes — dashboards will be live Friday.',
          createdAt,
          updatedAt: createdAt,
          metadata: {
            isOfficial: true,
            insightTags: ['Founder update'],
            guidance: 'Log follow-ups in the release workspace thread.',
          },
          author: {
            id: 1,
            firstName: 'Ava',
            lastName: 'Founder',
            title: 'Co-founder',
            Profile: { id: 2, headline: 'Co-founder', bio: null, avatarSeed: 'ava' },
          },
        },
      ],
    };

    const serialised = serialiseComment(comment);

    expect(serialised).toEqual(
      expect.objectContaining({
        id: 11,
        postId: 9,
        isPinned: true,
        isOfficial: false,
        insightTags: ['Mentor POV', 'Release plan'],
        guidance: 'Share the adoption playbook with your squads before Friday.',
        language: 'es',
        metadata: expect.objectContaining({
          isPinned: true,
          insightTags: ['Mentor POV', 'Release plan'],
          guidance: 'Share the adoption playbook with your squads before Friday.',
        }),
      }),
    );
    expect(serialised.replies[0]).toEqual(
      expect.objectContaining({
        id: 12,
        parentId: 11,
        isOfficial: true,
        insightTags: ['Founder update'],
        metadata: expect.objectContaining({ insightTags: ['Founder update'], isOfficial: true }),
      }),
    );
  });
});
