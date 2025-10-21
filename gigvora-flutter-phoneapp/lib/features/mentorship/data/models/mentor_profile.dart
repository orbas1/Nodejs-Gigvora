import 'mentor_dashboard.dart';

enum MentorMediaType { image, video, article, deck }

enum MentorRemoteOption { inPerson, remote, hybrid }

MentorMediaType _parseMediaType(String? raw) {
  switch ((raw ?? '').toLowerCase()) {
    case 'video':
      return MentorMediaType.video;
    case 'article':
      return MentorMediaType.article;
    case 'deck':
      return MentorMediaType.deck;
    case 'image':
    default:
      return MentorMediaType.image;
  }
}

class MentorMediaAsset {
  const MentorMediaAsset({
    required this.url,
    required this.type,
    this.thumbnailUrl,
    this.caption,
  });

  final String url;
  final MentorMediaType type;
  final String? thumbnailUrl;
  final String? caption;

  bool get isVideo => type == MentorMediaType.video;

  Map<String, dynamic> toJson() {
    return {
      'url': url,
      'type': type.name,
      if (thumbnailUrl != null && thumbnailUrl!.isNotEmpty) 'thumbnailUrl': thumbnailUrl,
      if (caption != null && caption!.isNotEmpty) 'caption': caption,
    };
  }

  factory MentorMediaAsset.fromJson(Map<String, dynamic> json) {
    return MentorMediaAsset(
      url: (json['url'] as String? ?? '').trim(),
      type: _parseMediaType(json['type'] as String?),
      thumbnailUrl: (json['thumbnailUrl'] as String?)?.trim(),
      caption: (json['caption'] as String?)?.trim(),
    );
  }
}

class MentorShowcaseItem {
  const MentorShowcaseItem({
    required this.id,
    required this.title,
    required this.description,
    required this.url,
    required this.type,
    this.coverImageUrl,
    this.duration,
  });

  final String id;
  final String title;
  final String description;
  final String url;
  final MentorMediaType type;
  final String? coverImageUrl;
  final String? duration;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'url': url,
      'type': type.name,
      if (coverImageUrl != null && coverImageUrl!.isNotEmpty) 'coverImageUrl': coverImageUrl,
      if (duration != null && duration!.isNotEmpty) 'duration': duration,
    };
  }

  factory MentorShowcaseItem.fromJson(Map<String, dynamic> json) {
    return MentorShowcaseItem(
      id: (json['id'] as String? ?? '').trim(),
      title: (json['title'] as String? ?? '').trim(),
      description: (json['description'] as String? ?? '').trim(),
      url: (json['url'] as String? ?? '').trim(),
      type: _parseMediaType(json['type'] as String?),
      coverImageUrl: (json['coverImageUrl'] as String?)?.trim(),
      duration: (json['duration'] as String?)?.trim(),
    );
  }
}

class MentorReview {
  const MentorReview({
    required this.reviewer,
    required this.role,
    required this.company,
    required this.rating,
    required this.comment,
    required this.createdAt,
    this.highlight,
  });

  final String reviewer;
  final String role;
  final String company;
  final double rating;
  final String comment;
  final DateTime createdAt;
  final String? highlight;

  Map<String, dynamic> toJson() {
    return {
      'reviewer': reviewer,
      'role': role,
      'company': company,
      'rating': rating,
      'comment': comment,
      'createdAt': createdAt.toIso8601String(),
      if (highlight != null && highlight!.isNotEmpty) 'highlight': highlight,
    };
  }

  factory MentorReview.fromJson(Map<String, dynamic> json) {
    return MentorReview(
      reviewer: (json['reviewer'] as String? ?? 'Anonymous mentee').trim(),
      role: (json['role'] as String? ?? '').trim(),
      company: (json['company'] as String? ?? '').trim(),
      rating: (json['rating'] is num) ? (json['rating'] as num).toDouble() : double.tryParse('${json['rating']}') ?? 0,
      comment: (json['comment'] as String? ?? '').trim(),
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      highlight: (json['highlight'] as String?)?.trim(),
    );
  }
}

class MentorProfile {
  const MentorProfile({
    required this.id,
    required this.name,
    required this.title,
    required this.headline,
    required this.bio,
    required this.avatarUrl,
    required this.heroImageUrl,
    required this.location,
    required this.rate,
    required this.currency,
    required this.rating,
    required this.reviewCount,
    required this.skills,
    required this.categories,
    required this.tags,
    required this.languages,
    required this.remoteOptions,
    required this.badges,
    required this.responseTime,
    required this.videoUrl,
    required this.gallery,
    required this.showcase,
    required this.reviews,
    required this.packages,
    required this.availability,
    required this.bookings,
    required this.socialLinks,
  });

  final String id;
  final String name;
  final String title;
  final String headline;
  final String bio;
  final String avatarUrl;
  final String heroImageUrl;
  final String location;
  final double rate;
  final String currency;
  final double rating;
  final int reviewCount;
  final List<String> skills;
  final List<String> categories;
  final List<String> tags;
  final List<String> languages;
  final List<MentorRemoteOption> remoteOptions;
  final List<String> badges;
  final String responseTime;
  final String? videoUrl;
  final List<MentorMediaAsset> gallery;
  final List<MentorShowcaseItem> showcase;
  final List<MentorReview> reviews;
  final List<MentorPackage> packages;
  final List<MentorAvailabilitySlot> availability;
  final List<MentorBooking> bookings;
  final Map<String, String> socialLinks;

  MentorProfile copyWith({
    String? name,
    String? title,
    String? headline,
    String? bio,
    String? avatarUrl,
    String? heroImageUrl,
    String? location,
    double? rate,
    String? currency,
    double? rating,
    int? reviewCount,
    List<String>? skills,
    List<String>? categories,
    List<String>? tags,
    List<String>? languages,
    List<MentorRemoteOption>? remoteOptions,
    List<String>? badges,
    String? responseTime,
    String? videoUrl,
    List<MentorMediaAsset>? gallery,
    List<MentorShowcaseItem>? showcase,
    List<MentorReview>? reviews,
    List<MentorPackage>? packages,
    List<MentorAvailabilitySlot>? availability,
    List<MentorBooking>? bookings,
    Map<String, String>? socialLinks,
  }) {
    return MentorProfile(
      id: id,
      name: name ?? this.name,
      title: title ?? this.title,
      headline: headline ?? this.headline,
      bio: bio ?? this.bio,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      heroImageUrl: heroImageUrl ?? this.heroImageUrl,
      location: location ?? this.location,
      rate: rate ?? this.rate,
      currency: currency ?? this.currency,
      rating: rating ?? this.rating,
      reviewCount: reviewCount ?? this.reviewCount,
      skills: skills ?? this.skills,
      categories: categories ?? this.categories,
      tags: tags ?? this.tags,
      languages: languages ?? this.languages,
      remoteOptions: remoteOptions ?? this.remoteOptions,
      badges: badges ?? this.badges,
      responseTime: responseTime ?? this.responseTime,
      videoUrl: videoUrl ?? this.videoUrl,
      gallery: gallery ?? this.gallery,
      showcase: showcase ?? this.showcase,
      reviews: reviews ?? this.reviews,
      packages: packages ?? this.packages,
      availability: availability ?? this.availability,
      bookings: bookings ?? this.bookings,
      socialLinks: socialLinks ?? this.socialLinks,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'title': title,
      'headline': headline,
      'bio': bio,
      'avatarUrl': avatarUrl,
      'heroImageUrl': heroImageUrl,
      'location': location,
      'rate': rate,
      'currency': currency,
      'rating': rating,
      'reviewCount': reviewCount,
      'skills': skills,
      'categories': categories,
      'tags': tags,
      'languages': languages,
      'remoteOptions': remoteOptions.map((option) => option.name).toList(growable: false),
      'badges': badges,
      'responseTime': responseTime,
      if (videoUrl != null && videoUrl!.isNotEmpty) 'videoUrl': videoUrl,
      'gallery': gallery.map((asset) => asset.toJson()).toList(growable: false),
      'showcase': showcase.map((item) => item.toJson()).toList(growable: false),
      'reviews': reviews.map((review) => review.toJson()).toList(growable: false),
      'packages': packages.map((pack) => pack.toJson()).toList(growable: false),
      'availability': availability.map((slot) => slot.toJson()).toList(growable: false),
      'bookings': bookings.map((booking) => booking.toJson()).toList(growable: false),
      'socialLinks': socialLinks,
    };
  }

  factory MentorProfile.fromJson(Map<String, dynamic> json) {
    final remoteOptions = (json['remoteOptions'] as List<dynamic>? ?? const [])
        .whereType<String>()
        .map((entry) {
      switch (entry.toLowerCase()) {
        case 'inperson':
        case 'in_person':
        case 'in-person':
          return MentorRemoteOption.inPerson;
        case 'hybrid':
          return MentorRemoteOption.hybrid;
        case 'remote':
        default:
          return MentorRemoteOption.remote;
      }
    }).toList(growable: false);

    return MentorProfile(
      id: (json['id'] as String? ?? '').trim(),
      name: (json['name'] as String? ?? '').trim(),
      title: (json['title'] as String? ?? '').trim(),
      headline: (json['headline'] as String? ?? '').trim(),
      bio: (json['bio'] as String? ?? '').trim(),
      avatarUrl: (json['avatarUrl'] as String? ?? '').trim(),
      heroImageUrl: (json['heroImageUrl'] as String? ?? '').trim(),
      location: (json['location'] as String? ?? '').trim(),
      rate: (json['rate'] is num) ? (json['rate'] as num).toDouble() : double.tryParse('${json['rate']}') ?? 0,
      currency: (json['currency'] as String? ?? '£').trim(),
      rating: (json['rating'] is num) ? (json['rating'] as num).toDouble() : double.tryParse('${json['rating']}') ?? 0,
      reviewCount: json['reviewCount'] is int
          ? json['reviewCount'] as int
          : int.tryParse('${json['reviewCount']}') ?? 0,
      skills: (json['skills'] as List<dynamic>? ?? const [])
          .whereType<String>()
          .map((entry) => entry.trim())
          .where((entry) => entry.isNotEmpty)
          .toList(growable: false),
      categories: (json['categories'] as List<dynamic>? ?? const [])
          .whereType<String>()
          .map((entry) => entry.trim())
          .where((entry) => entry.isNotEmpty)
          .toList(growable: false),
      tags: (json['tags'] as List<dynamic>? ?? const [])
          .whereType<String>()
          .map((entry) => entry.trim())
          .where((entry) => entry.isNotEmpty)
          .toList(growable: false),
      languages: (json['languages'] as List<dynamic>? ?? const [])
          .whereType<String>()
          .map((entry) => entry.trim())
          .where((entry) => entry.isNotEmpty)
          .toList(growable: false),
      remoteOptions: remoteOptions,
      badges: (json['badges'] as List<dynamic>? ?? const [])
          .whereType<String>()
          .map((entry) => entry.trim())
          .where((entry) => entry.isNotEmpty)
          .toList(growable: false),
      responseTime: (json['responseTime'] as String? ?? 'Under 1 hour').trim(),
      videoUrl: (json['videoUrl'] as String?)?.trim(),
      gallery: (json['gallery'] as List<dynamic>? ?? const [])
          .whereType<Map>()
          .map((entry) => MentorMediaAsset.fromJson(Map<String, dynamic>.from(entry)))
          .toList(growable: false),
      showcase: (json['showcase'] as List<dynamic>? ?? const [])
          .whereType<Map>()
          .map((entry) => MentorShowcaseItem.fromJson(Map<String, dynamic>.from(entry)))
          .toList(growable: false),
      reviews: (json['reviews'] as List<dynamic>? ?? const [])
          .whereType<Map>()
          .map((entry) => MentorReview.fromJson(Map<String, dynamic>.from(entry)))
          .toList(growable: false),
      packages: (json['packages'] as List<dynamic>? ?? const [])
          .whereType<Map>()
          .map((entry) => MentorPackage.fromJson(Map<String, dynamic>.from(entry)))
          .toList(growable: false),
      availability: (json['availability'] as List<dynamic>? ?? const [])
          .whereType<Map>()
          .map((entry) => MentorAvailabilitySlot.fromJson(Map<String, dynamic>.from(entry)))
          .toList(growable: false),
      bookings: (json['bookings'] as List<dynamic>? ?? const [])
          .whereType<Map>()
          .map((entry) => MentorBooking.fromJson(Map<String, dynamic>.from(entry)))
          .toList(growable: false),
      socialLinks: (json['socialLinks'] as Map<String, dynamic>? ?? const {})
          .map((key, value) => MapEntry(key, '$value'.trim()))
        ..removeWhere((key, value) => value.isEmpty),
    );
  }
}

class MentorSessionDraft {
  const MentorSessionDraft({
    required this.fullName,
    required this.email,
    required this.goal,
    required this.format,
    this.packageId,
    this.preferredDate,
    this.notes,
  });

  final String fullName;
  final String email;
  final String goal;
  final String format;
  final String? packageId;
  final DateTime? preferredDate;
  final String? notes;

  Map<String, dynamic> toJson() {
    return {
      'fullName': fullName,
      'email': email,
      'goal': goal,
      'format': format,
      if (packageId != null && packageId!.isNotEmpty) 'packageId': packageId,
      if (preferredDate != null) 'preferredDate': preferredDate!.toIso8601String(),
      if (notes != null && notes!.isNotEmpty) 'notes': notes,
    };
  }
}

class MentorReviewDraft {
  const MentorReviewDraft({
    required this.reviewer,
    required this.role,
    required this.company,
    required this.rating,
    required this.comment,
  });

  final String reviewer;
  final String role;
  final String company;
  final double rating;
  final String comment;

  MentorReview toReview() {
    return MentorReview(
      reviewer: reviewer,
      role: role,
      company: company,
      rating: rating,
      comment: comment,
      createdAt: DateTime.now(),
      highlight: rating >= 4.5 ? 'Featured testimonial' : null,
    );
  }
}
