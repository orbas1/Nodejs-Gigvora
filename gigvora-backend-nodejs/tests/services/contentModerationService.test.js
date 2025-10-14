import { enforceFeedPostPolicies, evaluateFeedPostContent } from '../../src/services/contentModerationService.js';
import { ModerationError } from '../../src/utils/errors.js';

describe('contentModerationService', () => {
  describe('evaluateFeedPostContent', () => {
    it('approves compliant content', () => {
      const result = evaluateFeedPostContent({
        content: 'Celebrating a huge launch with the team today! 🎉',
        summary: 'Celebrating a huge launch with the team today! 🎉',
        title: 'Launch update',
        link: 'https://gigvora.com/launch',
      });

      expect(result.decision).toBe('approve');
      expect(result.reasons).toEqual([]);
      expect(result.content).toBe('Celebrating a huge launch with the team today! 🎉');
    });

    it('rejects content containing banned words', () => {
      const result = evaluateFeedPostContent({
        content: 'This is a secret porn link',
      });

      expect(result.decision).toBe('reject');
      expect(result.reasons).toContain('The term "porn" is not permitted on the community feed.');
    });

    it('flags aggressive spam signals', () => {
      const result = evaluateFeedPostContent({
        content: 'CLICK HERE CLICK HERE CLICK HERE CLICK HERE CLICK HERE',
        link: 'https://tinyurl.com/spam-offer',
      });

      expect(result.decision).toBe('reject');
      expect(result.reasons.some((reason) => reason.includes('links'))).toBe(true);
    });
  });

  describe('enforceFeedPostPolicies', () => {
    it('throws a ModerationError when content is rejected', () => {
      expect(() =>
        enforceFeedPostPolicies({
          content: 'buy followers now buy followers now buy followers now',
          link: 'https://bit.ly/suspicious',
        }),
      ).toThrow(ModerationError);
    });

    it('returns evaluation when content passes checks', () => {
      const evaluation = enforceFeedPostPolicies({
        content: 'We just shipped a new integration for the Berlin hub!',
        summary: 'We just shipped a new integration for the Berlin hub!',
      });

      expect(evaluation.content).toBe('We just shipped a new integration for the Berlin hub!');
      expect(evaluation.decision).toBe('approve');
    });
  });
});
