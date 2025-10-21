import {
  CREATOR_ROLE_SET,
  evaluateCreationAccess,
  buildInitialItem,
  extractPackages,
  extractFaqs,
  getTypeConfig,
} from '../config.js';

describe('creation studio config helpers', () => {
  it('defines creator roles', () => {
    expect(Array.from(CREATOR_ROLE_SET)).toContain('freelancer');
  });

  it('evaluates creation access from a session payload', () => {
    const result = evaluateCreationAccess({ id: 11, memberships: ['freelancer', 'viewer'] });
    expect(result.ownerId).toBe(11);
    expect(result.allowedRoles).toEqual(['freelancer']);
    expect(result.hasAccess).toBe(true);
  });

  it('derives the owner id from alternate session identifiers', () => {
    const result = evaluateCreationAccess({ userId: 'user-77', memberships: ['agency'] });
    expect(result.ownerId).toBe('user-77');
    expect(result.allowedRoles).toEqual(['agency']);
    expect(result.hasAccess).toBe(true);
  });

  it('builds a base draft using type defaults', () => {
    const type = getTypeConfig('gig');
    const draft = buildInitialItem('gig', 7);
    expect(draft.type).toBe('gig');
    expect(draft.ownerId).toBe(7);
    expect(draft.packages).toHaveLength(type.defaults.packages.length);
  });

  it('extracts persisted packages and faqs', () => {
    const metadata = {
      packages: [
        { id: 'basic', name: 'Basic', price: '$100', features: ['Audit'] },
      ],
      faqs: [
        { id: 'faq-1', question: 'What is included?', answer: 'Audit' },
      ],
    };
    expect(extractPackages(metadata)[0]).toMatchObject({ name: 'Basic', features: ['Audit'] });
    expect(extractFaqs(metadata)[0]).toMatchObject({ id: 'faq-1', question: 'What is included?' });
  });
});

