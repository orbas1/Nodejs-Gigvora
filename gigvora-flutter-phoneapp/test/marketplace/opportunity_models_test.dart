import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/marketplace/data/models/opportunity.dart';
import 'package:gigvora_mobile/features/marketplace/data/models/opportunity_detail.dart';

void main() {
  group('OpportunityCategory utilities', () {
    test('parseOpportunityCategory normalises input', () {
      expect(parseOpportunityCategory('gigs'), OpportunityCategory.gig);
      expect(parseOpportunityCategory('Jobs'), OpportunityCategory.job);
      expect(parseOpportunityCategory('Launchpads'), OpportunityCategory.launchpad);
      expect(parseOpportunityCategory('unknown'), OpportunityCategory.project);
    });

    test('categoryToPath maps categories to API routes', () {
      expect(categoryToPath(OpportunityCategory.gig), 'gigs');
      expect(categoryToPath(OpportunityCategory.project), 'projects');
    });
  });

  group('OpportunitySummary', () {
    test('fromJson merges taxonomy labels and slugs without duplicates', () {
      final summary = OpportunitySummary.fromJson(
        OpportunityCategory.gig,
        {
          'id': 'gig-123',
          'title': 'Design lead',
          'description': 'Own the design backlog',
          'updatedAt': '2024-01-01T12:00:00Z',
          'taxonomyLabels': ['Design'],
          'taxonomySlugs': ['design'],
          'taxonomies': [
            {'slug': 'design', 'label': 'Design', 'type': 'discipline'},
            {'slug': 'ux', 'label': 'UX Research'},
          ],
          'isRemote': true,
          'location': 'Remote ',
        },
      );

      expect(summary.taxonomyLabels, equals(['Design', 'UX Research']));
      expect(summary.taxonomySlugs, equals(['design', 'ux']));
      expect(summary.isRemote, isTrue);
      expect(summary.location, 'Remote');
    });

    test('OpportunityPage.fromJson maps items and pagination metadata', () {
      final page = OpportunityPage.fromJson(
        OpportunityCategory.job,
        {
          'items': [
            {
              'id': 'job-1',
              'title': 'Product lead',
              'description': 'Scale experimentation pods',
              'updatedAt': 1704096000000,
            }
          ],
          'page': 2,
          'pageSize': 10,
          'total': 42,
          'totalPages': 5,
          'query': 'leadership',
        },
      );

      expect(page.items, hasLength(1));
      expect(page.page, 2);
      expect(page.total, 42);
      expect(page.query, 'leadership');
    });
  });

  group('OpportunityDetail', () {
    test('fromJson sanitises strings and nested media/reviews', () {
      final detail = OpportunityDetail.fromJson(
        OpportunityCategory.project,
        {
          'id': 77,
          'title': 'Automation pilot',
          'description': 'Build workflow automation',
          'summary': 'Automation pod',
          'skills': [' Automation ', ''],
          'tags': ['AI'],
          'media': [
            {'url': 'https://example.com/preview.png', 'type': 'image'},
          ],
          'reviews': [
            {
              'reviewer': '  Maya ',
              'rating': 4.5,
              'comment': 'Great opportunity',
              'createdAt': 1704096000000,
            }
          ],
          'poster': {'name': 'Aurora Labs', 'avatarUrl': 'https://example.com/avatar.png'},
          'budget': ' £40k ',
          'duration': '6 weeks',
          'employmentType': 'Contract',
          'status': 'Open',
          'videoUrl': 'https://example.com/video.mp4',
          'ctaUrl': 'https://example.com/apply',
          'isRemote': true,
          'publishedAt': '2024-01-01T12:00:00Z',
        },
      );

      expect(detail.id, '77');
      expect(detail.skills, equals(['Automation']));
      expect(detail.media.first.url, contains('preview.png'));
      expect(detail.reviews.first.reviewer, 'Maya');
      expect(detail.posterName, 'Aurora Labs');
      expect(detail.budget, '£40k');
      expect(detail.isRemote, isTrue);
      expect(detail.publishedAt, DateTime.parse('2024-01-01T12:00:00Z'));
    });

    test('toDraft returns draft with matching fields', () {
      final detail = OpportunityDetail(
        id: 'gig-1',
        category: OpportunityCategory.gig,
        title: 'Design lead',
        description: 'Lead design sprints',
        summary: 'Hands-on lead',
        location: 'Remote',
        organization: 'Gigvora',
        isRemote: true,
        skills: const ['Design'],
        tags: const ['UX'],
        media: const [],
        reviews: const [],
        rating: 4.8,
        reviewCount: 12,
        posterName: 'Alex',
        posterAvatarUrl: 'https://example.com/avatar.png',
        ctaUrl: 'https://example.com/apply',
        budget: '£30k',
        duration: '4 weeks',
        employmentType: 'Contract',
        status: 'Open',
        videoUrl: 'https://example.com/video.mp4',
        publishedAt: DateTime.now(),
      );

      final draft = detail.toDraft();
      expect(draft.title, detail.title);
      expect(draft.skills, detail.skills);
      expect(draft.videoUrl, detail.videoUrl);
    });

    test('OpportunityDraft.toJson trims optional strings', () {
      const draft = OpportunityDraft(
        title: 'Automation lead',
        description: 'Lead automation pod',
        location: ' Remote ',
        organization: ' Gigvora ',
        ctaUrl: ' https://example.com ',
        isRemote: true,
        tags: ['AI'],
      );

      final json = draft.toJson();
      expect(json['title'], 'Automation lead');
      expect(json['location'], 'Remote');
      expect(json['isRemote'], isTrue);
      expect(json['tags'], equals(['AI']));
    });
  });
}
