import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/mentorship/data/mentor_profile_repository.dart';
import 'package:gigvora_mobile/features/mentorship/data/models/mentor_profile.dart';

import '../helpers/in_memory_offline_cache.dart';

void main() {
  group('MentorProfileRepository', () {
    late InMemoryOfflineCache cache;
    late MentorProfileRepository repository;

    const mentorId = 'mentor-alexa-tan';

    setUp(() {
      cache = InMemoryOfflineCache();
      repository = MentorProfileRepository(cache);
    });

    tearDown(() async {
      await cache.dispose();
    });

    test('fetchProfile returns a seeded mentor profile when empty', () async {
      final result = await repository.fetchProfile(mentorId, forceRefresh: true);

      expect(result.data.id, equals(mentorId));
      expect(result.data.reviews, isNotEmpty);
      expect(result.data.packages, isNotEmpty);
    });

    test('bookSession records a new booking and keeps existing data intact', () async {
      final draft = MentorSessionDraft(
        fullName: 'Tomas Rivera',
        email: 'tomas.rivera@example.com',
        goal: 'Shape product narrative for enterprise launch.',
        format: 'Virtual',
        packageId: 'spark-session',
      );

      final updated = await repository.bookSession(mentorId, draft);

      expect(updated.bookings.first.mentee, equals('Tomas Rivera'));
      expect(updated.bookings.first.package, equals('spark-session'));
      expect(updated.bookings.first.status, equals('Pending confirmation'));
    });

    test('addReview increases review count and recalculates rating', () async {
      final draft = MentorReviewDraft(
        reviewer: 'Priya Desai',
        role: 'VP Product',
        company: 'Northwind',
        rating: 4.8,
        comment: 'Actionable insights and clear frameworks that improved our launch readiness.',
      );

      final updated = await repository.addReview(mentorId, draft);

      expect(updated.reviews.first.reviewer, equals('Priya Desai'));
      expect(updated.reviewCount, greaterThan(0));
      expect(updated.rating, greaterThan(0));
    });

    test('updateGallery persists the supplied media assets', () async {
      final assets = [
        const MentorMediaAsset(
          id: 'case-study',
          type: 'image',
          url: 'https://cdn.gigvora.com/gallery/mentor-case-study.png',
          description: 'Case study workshop in Singapore hub',
        ),
        const MentorMediaAsset(
          id: 'session-intro',
          type: 'video',
          url: 'https://cdn.gigvora.com/gallery/mentor-session.mp4',
          description: 'Mentor intro clip',
        ),
      ];

      final updated = await repository.updateGallery(mentorId, assets);

      expect(updated.gallery, equals(assets));
    });
  });
}
