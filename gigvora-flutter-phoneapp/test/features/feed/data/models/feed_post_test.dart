import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/feed/data/models/feed_post.dart';

void main() {
  test('FeedAuthor infers fallback name from profile fields', () {
    final author = FeedAuthor.fromJson({
      'firstName': 'Kai',
      'lastName': 'Morgan',
      'Profile': {'headline': 'Strategy Lead'},
    });

    expect(author.name, 'Kai Morgan');
    expect(author.headline, 'Strategy Lead');
  });

  test('FeedPost parses heterogeneous payloads', () {
    final post = FeedPost.fromJson({
      'id': 88,
      'message': 'Scaling product org',
      'created_at': '2024-03-02T10:00:00Z',
      'type': 'job',
      'reactions': {'viewerHasReacted': true, 'likes': 5},
      'comments': {'total': 2},
      'User': {
        'firstName': 'Devon',
        'lastName': 'Lee',
        'profile': {'headline': 'Fractional CPO'},
      },
    });

    expect(post.id, '88');
    expect(post.type, FeedPostType.job);
    expect(post.reactionCount, 5);
    expect(post.viewerHasReacted, isTrue);
    expect(post.author.headline, 'Fractional CPO');
  });
}
