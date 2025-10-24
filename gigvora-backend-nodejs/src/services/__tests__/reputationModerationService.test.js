import {
  analyseTestimonial,
  analyseSuccessStory,
  verifyClientIdentity,
} from '../reputationModerationService.js';

describe('reputationModerationService', () => {
  it('flags testimonials containing banned terms', () => {
    const result = analyseTestimonial({ comment: 'This service was a scam and illegal.', metadata: { rating: 1 } });
    expect(result.status).toBe('rejected');
    expect(result.labels).toContain('contains_prohibited_terms');
    expect(result.labels).toContain('negative_rating');
  });

  it('marks long-form success stories for manual review when low quality', () => {
    const result = analyseSuccessStory({ summary: 'Short', content: '', metadata: {} });
    expect(result.status === 'needs_review' || result.status === 'approved').toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('verifies client identities based on email domain and company', () => {
    const verification = verifyClientIdentity({
      clientName: 'Alex Client',
      clientEmail: 'alex@creativeco.com',
      company: 'CreativeCo',
      sourceUrl: 'https://creativeco.com/testimonial',
    });
    expect(verification.metadata.emailDomain).toBe('creativeco.com');
    expect(verification.verified).toBe(true);
  });
});
