import {
  normaliseSlug,
  normaliseHexColor,
  normaliseEmail,
  applyModelSlug,
  ensurePublishedTimestamp,
} from '../modelNormalizers.js';

describe('modelNormalizers', () => {
  test('normaliseSlug converts strings to lowercase dashed slugs with fallback', () => {
    expect(normaliseSlug('Hello World!', { fallback: 'default', maxLength: 20 })).toBe('hello-world');
    expect(normaliseSlug('', { fallback: 'fallback' })).toBe('fallback');
  });

  test('normaliseHexColor enforces canonical hash-prefixed colours', () => {
    expect(normaliseHexColor('FFAA00', { fallback: '#000000' })).toBe('#ffaa00');
    expect(normaliseHexColor('invalid', { fallback: '#123456' })).toBe('#123456');
  });

  test('normaliseEmail lowercases and trims values', () => {
    expect(normaliseEmail('  USER@example.com ')).toBe('user@example.com');
    expect(normaliseEmail(null)).toBeNull();
  });

  test('applyModelSlug derives slugs and randomises for new records', () => {
    const instance = { name: 'My Group', isNewRecord: true };
    applyModelSlug(instance, {
      fallback: 'group',
      sourceField: 'name',
      randomiseOnCreate: true,
      randomBytes: () => 'abc123',
    });
    expect(instance.slug).toMatch(/^my-group-/);

    const existing = { slug: 'Existing Slug', isNewRecord: false };
    applyModelSlug(existing, { fallback: 'group', maxLength: 20 });
    expect(existing.slug).toBe('existing-slug');
  });

  test('ensurePublishedTimestamp stamps and clears publishedAt based on status', () => {
    const post = {
      status: 'published',
      publishedAt: null,
      changed: jest.fn(() => true),
    };
    ensurePublishedTimestamp(post, { publishStatuses: ['published'] });
    expect(post.publishedAt).toBeInstanceOf(Date);

    post.status = 'draft';
    ensurePublishedTimestamp(post, { publishStatuses: ['published'] });
    expect(post.publishedAt).toBeNull();
  });
});
