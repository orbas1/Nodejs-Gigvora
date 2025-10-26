import { describe, expect, it } from '@jest/globals';
import { sanitizeHomepageSettingsInput } from '../../src/utils/adminSanitizers.js';

function buildTestimonial(overrides = {}) {
  return {
    id: '  flagship-enterprise  ',
    quote: '  Launch crews delivered ahead of schedule.  ',
    name: '  Morgan Wells  ',
    role: 'VP People',
    company: 'Northwind Digital',
    avatar: {
      src: ' https://cdn.gigvora.com/assets/avatars/morgan-wells.png ',
      alt: ' Morgan smiling ',
    },
    highlightSummary: ' 68 NPS boost in 90 days ',
    segment: 'Enterprise rollout',
    ...overrides,
  };
}

describe('sanitizeHomepageSettingsInput', () => {
  it('normalises testimonial payloads into trimmed production fields', () => {
    const payload = sanitizeHomepageSettingsInput({
      testimonials: [
        buildTestimonial({ highlight: true }),
        { quote: '  Missing attribution  ' },
        buildTestimonial({
          id: ' mentor-guild ',
          authorName: ' Diego Martínez ',
          authorRole: ' Programme Director ',
          authorCompany: ' Aurora Collective ',
          avatarUrl: 'https://cdn.gigvora.com/assets/avatars/diego-martinez.png',
          avatarAltText: 'Portrait of Diego',
          highlightSummary: 'Raised cohort satisfaction to 96%',
          tag: 'Global accelerator',
        }),
      ],
    });

    expect(payload.testimonials).toHaveLength(3);

    const [primary, , tertiary] = payload.testimonials;

    expect(primary).toMatchObject({
      id: 'flagship-enterprise',
      quote: 'Launch crews delivered ahead of schedule.',
      authorName: 'Morgan Wells',
      name: 'Morgan Wells',
      authorRole: 'VP People',
      role: 'VP People',
      authorCompany: 'Northwind Digital',
      company: 'Northwind Digital',
      avatarUrl: 'https://cdn.gigvora.com/assets/avatars/morgan-wells.png',
      avatarAlt: 'Morgan smiling',
      highlight: '68 NPS boost in 90 days',
      badge: 'Enterprise rollout',
    });

    expect(payload.testimonials[1]).toMatchObject({
      quote: 'Missing attribution',
    });

    expect(tertiary).toMatchObject({
      id: 'mentor-guild',
      authorName: 'Diego Martínez',
      authorRole: 'Programme Director',
      authorCompany: 'Aurora Collective',
      avatarUrl: 'https://cdn.gigvora.com/assets/avatars/diego-martinez.png',
      avatarAlt: 'Portrait of Diego',
      highlight: 'Raised cohort satisfaction to 96%',
      badge: 'Global accelerator',
    });
  });
});
