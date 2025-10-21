import 'dart:math';

import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import 'models/mentor_dashboard.dart';
import 'models/mentor_profile.dart';

class MentorProfileRepository {
  MentorProfileRepository(this._cache);

  final OfflineCache _cache;

  static const Duration _cacheTtl = Duration(minutes: 5);
  static const String _cachePrefix = 'mentorship:mentor-profile:';

  String _cacheKey(String mentorId) => '$_cachePrefix${mentorId.toLowerCase()}';

  Future<RepositoryResult<MentorProfile>> fetchProfile(
    String mentorId, {
    bool forceRefresh = false,
  }) async {
    final cacheKey = _cacheKey(mentorId);
    CacheEntry<MentorProfile>? cached;
    try {
      cached = _cache.read<MentorProfile>(cacheKey, (raw) {
        if (raw is Map<String, dynamic>) {
          return MentorProfile.fromJson(raw);
        }
        if (raw is Map) {
          return MentorProfile.fromJson(Map<String, dynamic>.from(raw as Map));
        }
        return _seedProfile(mentorId);
      });
    } catch (_) {
      cached = null;
    }

    if (!forceRefresh && cached != null) {
      return RepositoryResult<MentorProfile>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    final seeded = _seedProfile(mentorId);
    await _cache.write(cacheKey, seeded.toJson(), ttl: _cacheTtl);
    return RepositoryResult<MentorProfile>(
      data: seeded,
      fromCache: false,
      lastUpdated: DateTime.now(),
    );
  }

  Future<MentorProfile> saveProfile(MentorProfile profile) async {
    await _cache.write(_cacheKey(profile.id), profile.toJson(), ttl: _cacheTtl);
    return profile;
  }

  Future<MentorProfile> bookSession(String mentorId, MentorSessionDraft draft) async {
    final current = (await fetchProfile(mentorId)).data;
    final preferred = draft.preferredDate ?? DateTime.now().add(const Duration(days: 5));
    final booking = MentorBooking(
      id: 'book-${DateTime.now().microsecondsSinceEpoch}',
      mentee: draft.fullName,
      role: draft.goal,
      package: draft.packageId ?? 'Bespoke session',
      focus: draft.goal,
      scheduledAt: preferred,
      status: 'Pending confirmation',
      price: current.rate,
      currency: current.currency,
      paymentStatus: 'Invoice pending',
      channel: draft.format,
      segment: 'Inbound',
    );
    final updated = current.copyWith(
      bookings: [booking, ...current.bookings],
    );
    await saveProfile(updated);
    return updated;
  }

  Future<MentorProfile> addReview(String mentorId, MentorReviewDraft draft) async {
    final current = (await fetchProfile(mentorId)).data;
    final review = draft.toReview();
    final reviews = [review, ...current.reviews];
    final rating = _recalculateRating(reviews);
    final updated = current.copyWith(
      reviews: reviews,
      rating: rating,
      reviewCount: reviews.length,
    );
    await saveProfile(updated);
    return updated;
  }

  Future<MentorProfile> updateGallery(String mentorId, List<MentorMediaAsset> gallery) async {
    final current = (await fetchProfile(mentorId)).data;
    final updated = current.copyWith(gallery: gallery);
    await saveProfile(updated);
    return updated;
  }

  double _recalculateRating(List<MentorReview> reviews) {
    if (reviews.isEmpty) {
      return 0;
    }
    final sum = reviews.fold<double>(0, (acc, review) => acc + review.rating);
    return double.parse((sum / reviews.length).toStringAsFixed(2));
  }

  MentorProfile _seedProfile(String mentorId) {
    final now = DateTime.now();
    final random = Random(mentorId.hashCode);
    final baseRate = 220 + random.nextInt(45);
    final availability = [
      MentorAvailabilitySlot(
        id: 'mon-am',
        day: 'Monday',
        start: DateTime(now.year, now.month, now.day, 9, 0),
        end: DateTime(now.year, now.month, now.day, 11, 0),
        format: 'Virtual',
        capacity: 2,
      ),
      MentorAvailabilitySlot(
        id: 'wed-lunch',
        day: 'Wednesday',
        start: DateTime(now.year, now.month, now.day, 13, 0),
        end: DateTime(now.year, now.month, now.day, 15, 0),
        format: 'Hybrid',
        capacity: 3,
      ),
      MentorAvailabilitySlot(
        id: 'fri-lab',
        day: 'Friday',
        start: DateTime(now.year, now.month, now.day, 10, 0),
        end: DateTime(now.year, now.month, now.day, 12, 0),
        format: 'In person',
        capacity: 1,
      ),
    ];

    final packages = [
      MentorPackage(
        id: 'spark-session',
        name: 'Product spark session',
        description: '90-minute acceleration to unblock roadmap bets and value articulation.',
        sessions: 1,
        price: baseRate,
        currency: '£',
        format: 'Virtual',
        outcome: 'Actionable priorities, narrative anchors, and orchestration checklist.',
      ),
      MentorPackage(
        id: 'growth-lab',
        name: 'Growth experimentation lab',
        description: '3 x 75 minute workshops to design, test, and institutionalise growth loops.',
        sessions: 3,
        price: baseRate * 3.1,
        currency: '£',
        format: 'Hybrid',
        outcome: 'Experiment pipeline, analytics guardrails, and enablement assets for the go-to-market team.',
      ),
      MentorPackage(
        id: 'mentor-retainer',
        name: 'Executive mentoring retainer',
        description: 'Monthly cadence with async office hours, board-readiness prep, and hiring guidance.',
        sessions: 4,
        price: baseRate * 4.5,
        currency: '£',
        format: 'Remote-first',
        outcome: 'Leadership rituals, stakeholder map, and onboarding toolkit for new hires.',
      ),
    ];

    final reviews = [
      MentorReview(
        reviewer: 'Leah Mensah',
        role: 'VP Product',
        company: 'Orbit Labs',
        rating: 4.9,
        comment: 'The discovery sprint templates and storytelling coaching unlocked our Series B narrative.',
        createdAt: now.subtract(const Duration(days: 12)),
        highlight: 'Featured testimonial',
      ),
      MentorReview(
        reviewer: 'Jonas Hsu',
        role: 'Head of Growth',
        company: 'Nova Partnerships',
        rating: 4.8,
        comment: 'Practical, revenue-aware mentorship that helped us scale experiments without breaking ops.',
        createdAt: now.subtract(const Duration(days: 28)),
      ),
      MentorReview(
        reviewer: 'Ana Rivera',
        role: 'Founder',
        company: 'Atlas Collective',
        rating: 5,
        comment: 'Hands-on frameworks plus the right introductions to close our strategic partnerships.',
        createdAt: now.subtract(const Duration(days: 40)),
      ),
    ];

    final showcase = [
      MentorShowcaseItem(
        id: 'keynote',
        title: 'Keynote: Designing trust in talent marketplaces',
        description: 'Conference session on blending automation with human-centric curation across gig ecosystems.',
        url: 'https://video.gigvora.com/showcase/trust-by-design.mp4',
        type: MentorMediaType.video,
        coverImageUrl: 'https://images.gigvora.com/mentors/trust-design.png',
        duration: '21:42',
      ),
      MentorShowcaseItem(
        id: 'playbook',
        title: 'Mentor playbook: activating async product rituals',
        description: 'Practical playbook for async discovery, roadmap rituals, and board comms.',
        url: 'https://cdn.gigvora.com/playbooks/async-rituals.pdf',
        type: MentorMediaType.deck,
        coverImageUrl: 'https://images.gigvora.com/mentors/async-rituals.png',
      ),
      MentorShowcaseItem(
        id: 'article',
        title: 'Article: Mentoring emerging operations leaders',
        description: 'Published in Gigvora Dispatch — frameworks for early-stage operations leaders.',
        url: 'https://blog.gigvora.com/mentoring-ops-leaders',
        type: MentorMediaType.article,
        coverImageUrl: 'https://images.gigvora.com/mentors/ops-mentoring.png',
      ),
    ];

    final gallery = [
      MentorMediaAsset(
        url: 'https://images.gigvora.com/mentors/aurora-studio.jpg',
        type: MentorMediaType.image,
        caption: 'Strategy lab — where we map GTM and product motions.',
      ),
      MentorMediaAsset(
        url: 'https://images.gigvora.com/mentors/aurora-whiteboard.jpg',
        type: MentorMediaType.image,
        caption: 'Whiteboarding async rituals with mentees from three continents.',
      ),
      MentorMediaAsset(
        url: 'https://video.gigvora.com/mentors/aurora-intro.mp4',
        type: MentorMediaType.video,
        caption: 'Meet Aurora — 90 second intro.',
      ),
    ];

    final bookings = [
      MentorBooking(
        id: 'booking-1',
        mentee: 'Nia Okafor',
        role: 'Director of Product',
        package: packages.first.name,
        focus: 'Scaling discovery rituals with new pods',
        scheduledAt: now.add(const Duration(days: 2, hours: 10)),
        status: 'Confirmed',
        price: packages.first.price,
        currency: '£',
        paymentStatus: 'Paid',
        channel: 'Virtual',
        segment: 'Enterprise',
      ),
      MentorBooking(
        id: 'booking-2',
        mentee: 'Ruben Castillo',
        role: 'COO',
        package: packages[1].name,
        focus: 'Operationalising experimentation',
        scheduledAt: now.add(const Duration(days: 6, hours: 14)),
        status: 'Confirmed',
        price: packages[1].price,
        currency: '£',
        paymentStatus: 'Deposit paid',
        channel: 'Hybrid',
        segment: 'Scale-up',
      ),
    ];

    final socialLinks = {
      'Website': 'https://aurora-studio.gigvora.com',
      'LinkedIn': 'https://linkedin.com/in/aurora',
      'YouTube': 'https://youtube.com/@auroraMentors',
      'Podcast': 'https://podcasts.gigvora.com/mentorship-lab',
    };

    return MentorProfile(
      id: mentorId,
      name: 'Aurora Sethi',
      title: 'Mentor • Product & Growth',
      headline: 'Operator turned mentor guiding product, growth, and talent teams across scaling marketplaces.',
      bio:
          'Aurora advises venture-backed teams on activation, retention, and talent operations. Previously led product at Northwind and built Gigvora\'s marketplace launchpad. Their mentorship pairs practical playbooks with deep empathy for scaling humans.',
      avatarUrl: 'https://images.gigvora.com/mentors/aurora-avatar.png',
      heroImageUrl: 'https://images.gigvora.com/mentors/aurora-hero.jpg',
      location: 'London • Available across GMT, ET, PT',
      rate: baseRate.toDouble(),
      currency: '£',
      rating: 4.9,
      reviewCount: reviews.length,
      skills: const [
        'Product strategy',
        'Growth experimentation',
        'Mentorship systems',
        'Marketplace design',
        'Stakeholder storytelling',
      ],
      categories: const ['Product leadership', 'Growth', 'Operations'],
      tags: const ['product-ops', 'growth-loops', 'mentorship'],
      languages: const ['English', 'Spanish'],
      remoteOptions: const [MentorRemoteOption.remote, MentorRemoteOption.hybrid, MentorRemoteOption.inPerson],
      badges: const ['Top mentor 2024', 'Explorer featured'],
      responseTime: 'Replies within 45 minutes',
      videoUrl: 'https://video.gigvora.com/mentors/aurora-intro.mp4',
      gallery: gallery,
      showcase: showcase,
      reviews: reviews,
      packages: packages,
      availability: availability,
      bookings: bookings,
      socialLinks: socialLinks,
    );
  }
}

final mentorProfileRepositoryProvider = Provider<MentorProfileRepository>((ref) {
  final cache = ref.watch(offlineCacheProvider);
  return MentorProfileRepository(cache);
});
