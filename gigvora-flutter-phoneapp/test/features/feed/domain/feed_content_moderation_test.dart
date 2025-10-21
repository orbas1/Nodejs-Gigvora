import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/feed/data/models/feed_post.dart';
import 'package:gigvora_mobile/features/feed/domain/feed_content_moderation.dart';

void main() {
  group('FeedContentModeration', () {
    test('sanitises rich content and returns moderated payload', () {
      final result = FeedContentModeration.evaluate(
        content: '<h1>Launch update</h1>  New AI gig ready!   ',
        summary: 'Short summary',
        type: FeedPostType.update,
        link: 'gigvora.com/launch',
      );

      expect(result.content, 'Launch update New AI gig ready!');
      expect(result.link, 'https://gigvora.com/launch');
      expect(result.signals, isEmpty);
    });

    test('rejects banned terminology with contextual reasons', () {
      expect(
        () => FeedContentModeration.evaluate(content: 'This porn site is wild.'),
        throwsA(
          isA<FeedModerationException>().having(
            (error) => error.reasons.first,
            'reason',
            contains('not allowed'),
          ),
        ),
      );
    });

    test('blocks unsafe links and spam indicators', () {
      expect(
        () => FeedContentModeration.evaluate(
          content: 'BUY NOW!!! buy now!!! buy now!!!',
          link: 'http://grabify.link/tracker',
        ),
        throwsA(isA<FeedModerationException>()),
      );
    });

    test('sanitiseExternalLink normalises valid links', () {
      expect(
        FeedContentModeration.sanitiseExternalLink('gigvora.com'),
        'https://gigvora.com',
      );
      expect(
        FeedContentModeration.sanitiseExternalLink('https://tinyurl.com/abc'),
        isNull,
      );
      expect(FeedContentModeration.sanitiseExternalLink(''), isNull);
    });
  });
}
