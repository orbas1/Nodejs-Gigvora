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

    it('rejects posts linking to blocked domains', () => {
      const result = evaluateFeedPostContent({
        content: 'Suspicious promotion to check out now',
        link: 'https://bit.ly/unsafe-offer',
      });

      expect(result.decision).toBe('reject');
      expect(result.reasons).toContain('Links from this domain are blocked for safety reasons.');
      expect(result.signals.some((signal) => signal.type === 'blocked_domain')).toBe(true);
    });

    it('optionally allows medium severity warnings when configured', () => {
      const mentionHeavyContent =
        '@ops1 @ops2 @ops3 @ops4 @ops5 @ops6 @ops7 @ops8 @ops9 reviewing escalation playbooks';

      const strictEvaluation = evaluateFeedPostContent({ content: mentionHeavyContent });
      expect(strictEvaluation.decision).toBe('reject');
      expect(strictEvaluation.reasons).toContain('Tag up to 8 handles in a single update.');

      const permissiveEvaluation = evaluateFeedPostContent(
        { content: mentionHeavyContent },
        { allowWarnings: true },
      );

      expect(permissiveEvaluation.decision).toBe('approve');
      expect(permissiveEvaluation.reasons).toEqual([]);
      expect(
        permissiveEvaluation.signals.some((signal) => signal.type === 'excessive_mentions'),
      ).toBe(true);
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
