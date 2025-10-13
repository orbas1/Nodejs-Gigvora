import 'package:collection/collection.dart';

class MentorStats {
  const MentorStats({
    required this.activeMentees,
    required this.activeMenteesChange,
    required this.upcomingSessions,
    required this.upcomingSessionsChange,
    required this.avgRating,
    required this.avgRatingChange,
    required this.monthlyRevenue,
    required this.monthlyRevenueChange,
  });

  final int activeMentees;
  final num? activeMenteesChange;
  final int upcomingSessions;
  final num? upcomingSessionsChange;
  final double avgRating;
  final num? avgRatingChange;
  final num monthlyRevenue;
  final num? monthlyRevenueChange;

  factory MentorStats.fromJson(Map<String, dynamic> json) {
    return MentorStats(
      activeMentees: _parseInt(json['activeMentees']),
      activeMenteesChange: _parseNum(json['activeMenteesChange']),
      upcomingSessions: _parseInt(json['upcomingSessions']),
      upcomingSessionsChange: _parseNum(json['upcomingSessionsChange']),
      avgRating: _parseDouble(json['avgRating']),
      avgRatingChange: _parseNum(json['avgRatingChange']),
      monthlyRevenue: _parseNum(json['monthlyRevenue']) ?? 0,
      monthlyRevenueChange: _parseNum(json['monthlyRevenueChange']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'activeMentees': activeMentees,
      'activeMenteesChange': activeMenteesChange,
      'upcomingSessions': upcomingSessions,
      'upcomingSessionsChange': upcomingSessionsChange,
      'avgRating': avgRating,
      'avgRatingChange': avgRatingChange,
      'monthlyRevenue': monthlyRevenue,
      'monthlyRevenueChange': monthlyRevenueChange,
    };
  }
}

class MentorConversionStage {
  const MentorConversionStage({
    required this.id,
    required this.label,
    required this.value,
    this.delta,
  });

  final String id;
  final String label;
  final int value;
  final num? delta;

  factory MentorConversionStage.fromJson(Map<String, dynamic> json) {
    return MentorConversionStage(
      id: (json['id'] as String? ?? '').trim(),
      label: (json['label'] as String? ?? '').trim(),
      value: _parseInt(json['value']),
      delta: _parseNum(json['delta']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'label': label,
      'value': value,
      'delta': delta,
    };
  }
}

class MentorAvailabilitySlot {
  const MentorAvailabilitySlot({
    required this.id,
    required this.day,
    required this.start,
    required this.end,
    required this.format,
    required this.capacity,
  });

  final String id;
  final String day;
  final DateTime start;
  final DateTime end;
  final String format;
  final int capacity;

  factory MentorAvailabilitySlot.fromJson(Map<String, dynamic> json) {
    final start = DateTime.tryParse(json['start'] as String? ?? '');
    final end = DateTime.tryParse(json['end'] as String? ?? '');
    return MentorAvailabilitySlot(
      id: (json['id'] as String? ?? _buildSlotId(json)).trim(),
      day: (json['day'] as String? ?? '').trim(),
      start: start ?? DateTime.now(),
      end: end ?? DateTime.now(),
      format: (json['format'] as String? ?? '').trim(),
      capacity: _parseInt(json['capacity']),
    );
  }

  MentorAvailabilitySlot copyWith({
    String? id,
    String? day,
    DateTime? start,
    DateTime? end,
    String? format,
    int? capacity,
  }) {
    return MentorAvailabilitySlot(
      id: id ?? this.id,
      day: day ?? this.day,
      start: start ?? this.start,
      end: end ?? this.end,
      format: format ?? this.format,
      capacity: capacity ?? this.capacity,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'day': day,
      'start': start.toIso8601String(),
      'end': end.toIso8601String(),
      'format': format,
      'capacity': capacity,
    };
  }

  Map<String, dynamic> toPayload() {
    return {
      'day': day,
      'start': start.toIso8601String(),
      'end': end.toIso8601String(),
      'format': format,
      'capacity': capacity,
    };
  }

  static String _buildSlotId(Map<String, dynamic> json) {
    final day = (json['day'] as String? ?? '').trim();
    final start = (json['start'] as String? ?? '').trim();
    final end = (json['end'] as String? ?? '').trim();
    final format = (json['format'] as String? ?? '').trim();
    return [day, start, end, format].where((value) => value.isNotEmpty).join('-');
  }
}

class MentorPackage {
  const MentorPackage({
    required this.id,
    required this.name,
    required this.description,
    required this.sessions,
    required this.price,
    required this.currency,
    required this.format,
    required this.outcome,
  });

  final String id;
  final String name;
  final String description;
  final int sessions;
  final num price;
  final String currency;
  final String format;
  final String outcome;

  factory MentorPackage.fromJson(Map<String, dynamic> json) {
    return MentorPackage(
      id: (json['id'] as String? ?? json['name'] as String? ?? '').trim(),
      name: (json['name'] as String? ?? '').trim(),
      description: (json['description'] as String? ?? '').trim(),
      sessions: _parseInt(json['sessions']),
      price: _parseNum(json['price']) ?? 0,
      currency: (json['currency'] as String? ?? '£').trim(),
      format: (json['format'] as String? ?? '').trim(),
      outcome: (json['outcome'] as String? ?? '').trim(),
    );
  }

  MentorPackage copyWith({
    String? id,
    String? name,
    String? description,
    int? sessions,
    num? price,
    String? currency,
    String? format,
    String? outcome,
  }) {
    return MentorPackage(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      sessions: sessions ?? this.sessions,
      price: price ?? this.price,
      currency: currency ?? this.currency,
      format: format ?? this.format,
      outcome: outcome ?? this.outcome,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'sessions': sessions,
      'price': price,
      'currency': currency,
      'format': format,
      'outcome': outcome,
    };
  }
}

class MentorBooking {
  const MentorBooking({
    required this.id,
    required this.mentee,
    required this.role,
    required this.package,
    required this.focus,
    required this.scheduledAt,
    required this.status,
    required this.price,
    required this.currency,
    required this.paymentStatus,
    required this.channel,
    required this.segment,
  });

  final String id;
  final String mentee;
  final String role;
  final String package;
  final String focus;
  final DateTime scheduledAt;
  final String status;
  final num price;
  final String currency;
  final String paymentStatus;
  final String channel;
  final String segment;

  factory MentorBooking.fromJson(Map<String, dynamic> json) {
    final scheduledAt = DateTime.tryParse(json['scheduledAt'] as String? ?? '');
    return MentorBooking(
      id: (json['id'] as String? ?? '').trim(),
      mentee: (json['mentee'] as String? ?? '').trim(),
      role: (json['role'] as String? ?? '').trim(),
      package: (json['package'] as String? ?? '').trim(),
      focus: (json['focus'] as String? ?? '').trim(),
      scheduledAt: scheduledAt ?? DateTime.now(),
      status: (json['status'] as String? ?? '').trim(),
      price: _parseNum(json['price']) ?? 0,
      currency: (json['currency'] as String? ?? '£').trim(),
      paymentStatus: (json['paymentStatus'] as String? ?? '').trim(),
      channel: (json['channel'] as String? ?? '').trim(),
      segment: (json['segment'] as String? ?? '').trim(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'mentee': mentee,
      'role': role,
      'package': package,
      'focus': focus,
      'scheduledAt': scheduledAt.toIso8601String(),
      'status': status,
      'price': price,
      'currency': currency,
      'paymentStatus': paymentStatus,
      'channel': channel,
      'segment': segment,
    };
  }
}

class MentorSegment {
  const MentorSegment({
    required this.id,
    required this.title,
    required this.description,
  });

  final String id;
  final String title;
  final String description;

  factory MentorSegment.fromJson(Map<String, dynamic> json) {
    return MentorSegment(
      id: (json['id'] as String? ?? '').trim(),
      title: (json['title'] as String? ?? '').trim(),
      description: (json['description'] as String? ?? '').trim(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
    };
  }
}

class MentorFeedback {
  const MentorFeedback({
    required this.id,
    required this.mentee,
    required this.highlight,
    required this.rating,
  });

  final String id;
  final String mentee;
  final String highlight;
  final num rating;

  factory MentorFeedback.fromJson(Map<String, dynamic> json) {
    return MentorFeedback(
      id: (json['id'] as String? ?? '').trim(),
      mentee: (json['mentee'] as String? ?? '').trim(),
      highlight: (json['highlight'] as String? ?? '').trim(),
      rating: _parseNum(json['rating']) ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'mentee': mentee,
      'highlight': highlight,
      'rating': rating,
    };
  }
}

class MentorExplorerPlacement {
  const MentorExplorerPlacement({
    required this.score,
    required this.position,
    required this.nextActions,
  });

  final int score;
  final String position;
  final List<String> nextActions;

  factory MentorExplorerPlacement.fromJson(Map<String, dynamic> json) {
    final rawActions = json['nextActions'];
    final nextActions = rawActions is List
        ? rawActions
            .whereType<String>()
            .map((value) => value.trim())
            .where((value) => value.isNotEmpty)
            .toList(growable: false)
        : const <String>[];
    return MentorExplorerPlacement(
      score: _parseInt(json['score']),
      position: (json['position'] as String? ?? '').trim(),
      nextActions: nextActions,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'score': score,
      'position': position,
      'nextActions': nextActions,
    };
  }
}

class MentorDashboard {
  const MentorDashboard({
    this.stats,
    this.conversion = const <MentorConversionStage>[],
    this.availability = const <MentorAvailabilitySlot>[],
    this.packages = const <MentorPackage>[],
    this.bookings = const <MentorBooking>[],
    this.segments = const <MentorSegment>[],
    this.feedback = const <MentorFeedback>[],
    this.explorerPlacement,
  });

  final MentorStats? stats;
  final List<MentorConversionStage> conversion;
  final List<MentorAvailabilitySlot> availability;
  final List<MentorPackage> packages;
  final List<MentorBooking> bookings;
  final List<MentorSegment> segments;
  final List<MentorFeedback> feedback;
  final MentorExplorerPlacement? explorerPlacement;

  factory MentorDashboard.fromJson(Map<String, dynamic> json) {
    final statsJson = json['stats'];
    final conversionJson = json['conversion'];
    final availabilityJson = json['availability'];
    final packagesJson = json['packages'];
    final bookingsJson = json['bookings'];
    final segmentsJson = json['segments'];
    final feedbackJson = json['feedback'];
    final explorerJson = json['explorerPlacement'];

    return MentorDashboard(
      stats: statsJson is Map<String, dynamic> ? MentorStats.fromJson(statsJson) : null,
      conversion: conversionJson is List
          ? conversionJson
              .whereType<Map>()
              .map((item) => MentorConversionStage.fromJson(Map<String, dynamic>.from(item)))
              .toList(growable: false)
          : const <MentorConversionStage>[],
      availability: availabilityJson is List
          ? availabilityJson
              .whereType<Map>()
              .map((item) => MentorAvailabilitySlot.fromJson(Map<String, dynamic>.from(item)))
              .sorted((a, b) => a.start.compareTo(b.start))
              .toList(growable: false)
          : const <MentorAvailabilitySlot>[],
      packages: packagesJson is List
          ? packagesJson
              .whereType<Map>()
              .map((item) => MentorPackage.fromJson(Map<String, dynamic>.from(item)))
              .toList(growable: false)
          : const <MentorPackage>[],
      bookings: bookingsJson is List
          ? bookingsJson
              .whereType<Map>()
              .map((item) => MentorBooking.fromJson(Map<String, dynamic>.from(item)))
              .toList(growable: false)
          : const <MentorBooking>[],
      segments: segmentsJson is List
          ? segmentsJson
              .whereType<Map>()
              .map((item) => MentorSegment.fromJson(Map<String, dynamic>.from(item)))
              .toList(growable: false)
          : const <MentorSegment>[],
      feedback: feedbackJson is List
          ? feedbackJson
              .whereType<Map>()
              .map((item) => MentorFeedback.fromJson(Map<String, dynamic>.from(item)))
              .toList(growable: false)
          : const <MentorFeedback>[],
      explorerPlacement: explorerJson is Map<String, dynamic>
          ? MentorExplorerPlacement.fromJson(explorerJson)
          : null,
    );
  }

  MentorDashboard copyWith({
    MentorStats? stats,
    List<MentorConversionStage>? conversion,
    List<MentorAvailabilitySlot>? availability,
    List<MentorPackage>? packages,
    List<MentorBooking>? bookings,
    List<MentorSegment>? segments,
    List<MentorFeedback>? feedback,
    MentorExplorerPlacement? explorerPlacement,
  }) {
    return MentorDashboard(
      stats: stats ?? this.stats,
      conversion: conversion ?? this.conversion,
      availability: availability ?? this.availability,
      packages: packages ?? this.packages,
      bookings: bookings ?? this.bookings,
      segments: segments ?? this.segments,
      feedback: feedback ?? this.feedback,
      explorerPlacement: explorerPlacement ?? this.explorerPlacement,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'stats': stats?.toJson(),
      'conversion': conversion.map((stage) => stage.toJson()).toList(growable: false),
      'availability': availability.map((slot) => slot.toJson()).toList(growable: false),
      'packages': packages.map((pack) => pack.toJson()).toList(growable: false),
      'bookings': bookings.map((booking) => booking.toJson()).toList(growable: false),
      'segments': segments.map((segment) => segment.toJson()).toList(growable: false),
      'feedback': feedback.map((entry) => entry.toJson()).toList(growable: false),
      'explorerPlacement': explorerPlacement?.toJson(),
    };
  }
}

int _parseInt(dynamic value) {
  if (value is int) {
    return value;
  }
  if (value is double) {
    return value.round();
  }
  if (value is num) {
    return value.toInt();
  }
  if (value is String) {
    return int.tryParse(value) ?? 0;
  }
  return 0;
}

double _parseDouble(dynamic value) {
  if (value is double) {
    return value;
  }
  if (value is int) {
    return value.toDouble();
  }
  if (value is num) {
    return value.toDouble();
  }
  if (value is String) {
    return double.tryParse(value) ?? 0;
  }
  return 0;
}

num? _parseNum(dynamic value) {
  if (value is num) {
    return value;
  }
  if (value is String) {
    return num.tryParse(value);
  }
  return null;
}
