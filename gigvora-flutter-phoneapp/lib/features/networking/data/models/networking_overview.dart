import 'package:collection/collection.dart';

const _defaultPenaltyRules = NetworkingPenaltyRules(
  noShowThreshold: 2,
  cooldownDays: 14,
  penaltyWeight: 1,
);

int _parseInt(dynamic value, [int defaultValue = 0]) {
  if (value == null) return defaultValue;
  if (value is int) return value;
  if (value is num) return value.round();
  final parsed = int.tryParse('$value');
  return parsed ?? defaultValue;
}

double? _parseDouble(dynamic value) {
  if (value == null) return null;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  if (value is num) return value.toDouble();
  return double.tryParse('$value');
}

num? _parseNum(dynamic value) {
  if (value == null) return null;
  if (value is num) return value;
  return num.tryParse('$value');
}

DateTime? _parseDate(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  return DateTime.tryParse('$value');
}

class NetworkingOverviewBundle {
  const NetworkingOverviewBundle({
    required this.overview,
    required this.permittedWorkspaceIds,
    this.selectedWorkspaceId,
  });

  final NetworkingOverview overview;
  final List<int> permittedWorkspaceIds;
  final int? selectedWorkspaceId;

  NetworkingOverviewBundle copyWith({
    NetworkingOverview? overview,
    List<int>? permittedWorkspaceIds,
    int? selectedWorkspaceId,
  }) {
    return NetworkingOverviewBundle(
      overview: overview ?? this.overview,
      permittedWorkspaceIds: permittedWorkspaceIds ?? this.permittedWorkspaceIds,
      selectedWorkspaceId: selectedWorkspaceId ?? this.selectedWorkspaceId,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'overview': overview.toJson(),
      'permittedWorkspaceIds': permittedWorkspaceIds,
      'selectedWorkspaceId': selectedWorkspaceId,
    };
  }

  factory NetworkingOverviewBundle.fromJson(Map<String, dynamic> json) {
    final ids = (json['permittedWorkspaceIds'] as List<dynamic>? ?? const <dynamic>[])
        .map((value) => _parseInt(value, 0))
        .where((value) => value > 0)
        .toList();
    return NetworkingOverviewBundle(
      overview: NetworkingOverview.fromJson(Map<String, dynamic>.from(json['overview'] as Map)),
      permittedWorkspaceIds: ids,
      selectedWorkspaceId: json['selectedWorkspaceId'] == null
          ? null
          : _parseInt(json['selectedWorkspaceId'], 0),
    );
  }
}

class NetworkingOverview {
  const NetworkingOverview({
    required this.sessions,
    required this.scheduling,
    required this.monetization,
    required this.penalties,
    required this.attendeeExperience,
    required this.digitalCards,
    required this.video,
    required this.showcase,
  });

  final NetworkingSessionsAnalytics sessions;
  final NetworkingSchedulingAnalytics scheduling;
  final NetworkingMonetizationAnalytics monetization;
  final NetworkingPenaltyAnalytics penalties;
  final NetworkingAttendeeExperience attendeeExperience;
  final NetworkingDigitalCardAnalytics digitalCards;
  final NetworkingVideoAnalytics video;
  final NetworkingShowcase showcase;

  NetworkingOverview copyWith({
    NetworkingSessionsAnalytics? sessions,
    NetworkingSchedulingAnalytics? scheduling,
    NetworkingMonetizationAnalytics? monetization,
    NetworkingPenaltyAnalytics? penalties,
    NetworkingAttendeeExperience? attendeeExperience,
    NetworkingDigitalCardAnalytics? digitalCards,
    NetworkingVideoAnalytics? video,
    NetworkingShowcase? showcase,
  }) {
    return NetworkingOverview(
      sessions: sessions ?? this.sessions,
      scheduling: scheduling ?? this.scheduling,
      monetization: monetization ?? this.monetization,
      penalties: penalties ?? this.penalties,
      attendeeExperience: attendeeExperience ?? this.attendeeExperience,
      digitalCards: digitalCards ?? this.digitalCards,
      video: video ?? this.video,
      showcase: showcase ?? this.showcase,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'sessions': sessions.toJson(),
      'scheduling': scheduling.toJson(),
      'monetization': monetization.toJson(),
      'penalties': penalties.toJson(),
      'attendeeExperience': attendeeExperience.toJson(),
      'digitalCards': digitalCards.toJson(),
      'video': video.toJson(),
      'showcase': showcase.toJson(),
    };
  }

  factory NetworkingOverview.fromJson(Map<String, dynamic> json) {
    return NetworkingOverview(
      sessions: NetworkingSessionsAnalytics.fromJson(
        Map<String, dynamic>.from(json['sessions'] as Map),
      ),
      scheduling: NetworkingSchedulingAnalytics.fromJson(
        Map<String, dynamic>.from(json['scheduling'] as Map),
      ),
      monetization: NetworkingMonetizationAnalytics.fromJson(
        Map<String, dynamic>.from(json['monetization'] as Map),
      ),
      penalties: NetworkingPenaltyAnalytics.fromJson(
        Map<String, dynamic>.from(json['penalties'] as Map),
      ),
      attendeeExperience: NetworkingAttendeeExperience.fromJson(
        Map<String, dynamic>.from(json['attendeeExperience'] as Map),
      ),
      digitalCards: NetworkingDigitalCardAnalytics.fromJson(
        Map<String, dynamic>.from(json['digitalCards'] as Map),
      ),
      video: NetworkingVideoAnalytics.fromJson(
        Map<String, dynamic>.from(json['video'] as Map),
      ),
      showcase: NetworkingShowcase.fromJson(
        Map<String, dynamic>.from(json['showcase'] as Map),
      ),
    );
  }

  factory NetworkingOverview.compute({
    required List<NetworkingSession> sessions,
    required List<NetworkingBusinessCard> cards,
  }) {
    final now = DateTime.now();
    final sessionSnapshots = sessions;

    final totals = _NetworkingTotals();

    for (final session in sessionSnapshots) {
      totals.total += 1;
      final status = session.status;
      if (status == 'in_progress') {
        totals.active += 1;
      }
      if (status == 'cancelled') {
        totals.cancelled += 1;
      }
      if (status == 'draft') {
        totals.draft += 1;
      }
      if (status == 'scheduled' && session.isUpcoming(now)) {
        totals.upcoming += 1;
      }
      if (status == 'completed' || session.isCompleted(now)) {
        totals.completed += 1;
      }

      if (session.joinLimit != null) {
        totals.joinLimits.add(session.joinLimit!);
      }
      if (session.rotationDurationSeconds != null) {
        totals.rotationDurations.add(session.rotationDurationSeconds!);
      }

      final metrics = session.metrics;
      totals.registered += metrics.registered;
      totals.waitlist += metrics.waitlisted;
      totals.checkedIn += metrics.checkedIn;
      totals.completedAttendees += metrics.completed;
      totals.noShows += metrics.noShows;
      totals.profileShares += metrics.profileSharedCount;
      totals.connectionsSaved += metrics.connectionsSaved;
      totals.messagesSent += metrics.messagesSent;
      totals.followUps += metrics.followUpsScheduled;
      totals.cardShares += metrics.cardShares;

      if (session.accessType == 'paid') {
        totals.paidSessions += 1;
        final price = session.priceCents;
        if (price != null) {
          final attendees = metrics.checkedIn + metrics.completed;
          totals.revenueCents += price * attendees;
          totals.pricePoints.add(price);
        }
      } else {
        totals.freeSessions += 1;
      }

      if (metrics.averageSatisfaction != null) {
        totals.satisfactionScores.add(metrics.averageSatisfaction!);
      }

      final telemetry = session.videoTelemetry;
      final qualityScore = _parseDouble(telemetry['qualityScore']);
      if (qualityScore != null) {
        totals.videoQuality.add(qualityScore);
      }
      final announcementCount = _parseNum(telemetry['announcements']);
      if (announcementCount != null) {
        totals.hostAnnouncements += announcementCount.round();
      }
      final failoverRate = _parseDouble(telemetry['failoverRate']);
      if (failoverRate != null) {
        totals.videoFailover.add(failoverRate);
      }

      final videoConfig = session.videoConfig;
      final loadShare = _parseDouble(videoConfig['clientLoadShare']);
      if (loadShare != null) {
        totals.browserLoadShare.add(loadShare);
      }

      totals.remindersSent += _parseInt(session.metadata['remindersSent']);
      totals.searchDemand += _parseInt(session.metadata['searchInterest']);
      totals.sponsorSlots += _parseInt(session.monetization['sponsorSlots']);
    }

    final averageJoinLimit = totals.joinLimits.isEmpty
        ? null
        : (totals.joinLimits.reduce((sum, value) => sum + value) / totals.joinLimits.length).round();
    final averageRotationSeconds = totals.rotationDurations.isEmpty
        ? null
        : (totals.rotationDurations.reduce((sum, value) => sum + value) /
                totals.rotationDurations.length)
            .round();
    final averagePriceCents = totals.pricePoints.isEmpty
        ? null
        : (totals.pricePoints.reduce((sum, value) => sum + value) /
                totals.pricePoints.length)
            .round();
    final averageSatisfaction = totals.satisfactionScores.isEmpty
        ? null
        : double.parse(
            (totals.satisfactionScores.reduce((sum, value) => sum + value) /
                    totals.satisfactionScores.length)
                .toStringAsFixed(2),
          );
    final averageVideoQuality = totals.videoQuality.isEmpty
        ? null
        : double.parse(
            (totals.videoQuality.reduce((sum, value) => sum + value) /
                    totals.videoQuality.length)
                .toStringAsFixed(2),
          );
    final averageBrowserLoadShare = totals.browserLoadShare.isEmpty
        ? null
        : double.parse(
            (totals.browserLoadShare.reduce((sum, value) => sum + value) /
                    totals.browserLoadShare.length)
                .toStringAsFixed(2),
          );
    final averageFailoverRate = totals.videoFailover.isEmpty
        ? null
        : double.parse(
            (totals.videoFailover.reduce((sum, value) => sum + value) /
                    totals.videoFailover.length)
                .toStringAsFixed(3),
          );

    final totalSignups = totals.registered +
        totals.waitlist +
        totals.checkedIn +
        totals.completedAttendees +
        totals.noShows;
    final noShowRate = totalSignups > 0
        ? double.parse(((totals.noShows / totalSignups) * 100).toStringAsFixed(1))
        : null;

    final sevenDaysAgo = DateTime.now().subtract(const Duration(days: 7));
    final cardsUpdatedThisWeek = cards
        .where((card) => card.updatedAt != null && card.updatedAt!.isAfter(sevenDaysAgo))
        .length;
    final uniqueTags = cards
        .expand((card) => card.tags)
        .where((tag) => tag.isNotEmpty)
        .toSet();
    final cardsAvailable = cards.where((card) => card.status != 'archived').length;

    final restrictedParticipants = sessionSnapshots.fold<int>(0, (count, session) {
      final threshold = session.metrics.penaltyRules.noShowThreshold;
      return count +
          session.signups
              .where((signup) => signup.penaltyCount >= threshold)
              .length;
    });
    final cooldownDays = sessionSnapshots.fold<int>(
      _defaultPenaltyRules.cooldownDays,
      (maxCooldown, session) => session.metrics.penaltyRules.cooldownDays > maxCooldown
          ? session.metrics.penaltyRules.cooldownDays
          : maxCooldown,
    );

    final featuredSession = sessionSnapshots
        .where((session) => session.isUpcoming(now))
        .sorted((a, b) {
          final aStart = a.startTime;
          final bStart = b.startTime;
          if (aStart == null && bStart == null) return 0;
          if (aStart == null) return 1;
          if (bStart == null) return -1;
          return aStart.compareTo(bStart);
        })
        .firstOrNull ??
        sessionSnapshots.firstOrNull;

    final sessionsAnalytics = NetworkingSessionsAnalytics(
      total: totals.total,
      active: totals.active,
      upcoming: totals.upcoming,
      completed: totals.completed,
      draft: totals.draft,
      cancelled: totals.cancelled,
      averageJoinLimit: averageJoinLimit,
      rotationDurationSeconds: averageRotationSeconds,
      registered: totals.registered,
      waitlist: totals.waitlist,
      checkedIn: totals.checkedIn,
      completedAttendees: totals.completedAttendees,
      paid: totals.paidSessions,
      free: totals.freeSessions,
      revenueCents: totals.revenueCents,
      averagePriceCents: averagePriceCents,
      satisfactionAverage: averageSatisfaction,
      list: sessionSnapshots,
    );

    final schedulingAnalytics = NetworkingSchedulingAnalytics(
      preRegistrations: totals.registered + totals.checkedIn + totals.completedAttendees,
      waitlist: totals.waitlist,
      remindersSent: totals.remindersSent,
      searches: totals.searchDemand,
      sponsorSlots: totals.sponsorSlots,
    );

    final monetizationAnalytics = NetworkingMonetizationAnalytics(
      paid: totals.paidSessions,
      free: totals.freeSessions,
      revenueCents: totals.revenueCents,
      averagePriceCents: averagePriceCents,
    );

    final penaltyAnalytics = NetworkingPenaltyAnalytics(
      noShowRate: noShowRate,
      activePenalties: totals.noShows,
      restrictedParticipants: restrictedParticipants,
      cooldownDays: cooldownDays,
    );

    final experience = NetworkingAttendeeExperience(
      profilesShared: totals.profileShares,
      connectionsSaved: totals.connectionsSaved,
      averageMessagesPerSession: sessionSnapshots.isEmpty
          ? 0
          : double.parse(
              (totals.messagesSent / sessionSnapshots.length).toStringAsFixed(1),
            ),
      followUpsScheduled: totals.followUps,
    );

    final digitalCards = NetworkingDigitalCardAnalytics(
      created: cards.length,
      updatedThisWeek: cardsUpdatedThisWeek,
      sharedInSession: totals.cardShares,
      templates: uniqueTags.isEmpty ? 3 : uniqueTags.length,
      available: cardsAvailable,
    );

    final video = NetworkingVideoAnalytics(
      averageQualityScore: averageVideoQuality,
      browserLoadShare: averageBrowserLoadShare,
      hostAnnouncements: totals.hostAnnouncements,
      failoverRate: averageFailoverRate,
    );

    final showcase = NetworkingShowcase(
      featuredSessionId: featuredSession?.id,
      librarySize: sessionSnapshots.length,
      cardsAvailable: cardsAvailable,
      highlights: featuredSession?.showcaseHighlights ?? const [
        'Timed rotations',
        'Digital business cards',
        'Browser-based video',
      ],
    );

    return NetworkingOverview(
      sessions: sessionsAnalytics,
      scheduling: schedulingAnalytics,
      monetization: monetizationAnalytics,
      penalties: penaltyAnalytics,
      attendeeExperience: experience,
      digitalCards: digitalCards,
      video: video,
      showcase: showcase,
    );
  }
}

class NetworkingSessionsAnalytics {
  const NetworkingSessionsAnalytics({
    required this.total,
    required this.active,
    required this.upcoming,
    required this.completed,
    required this.draft,
    required this.cancelled,
    required this.averageJoinLimit,
    required this.rotationDurationSeconds,
    required this.registered,
    required this.waitlist,
    required this.checkedIn,
    required this.completedAttendees,
    required this.paid,
    required this.free,
    required this.revenueCents,
    required this.averagePriceCents,
    required this.satisfactionAverage,
    required this.list,
  });

  final int total;
  final int active;
  final int upcoming;
  final int completed;
  final int draft;
  final int cancelled;
  final int? averageJoinLimit;
  final int? rotationDurationSeconds;
  final int registered;
  final int waitlist;
  final int checkedIn;
  final int completedAttendees;
  final int paid;
  final int free;
  final int revenueCents;
  final int? averagePriceCents;
  final double? satisfactionAverage;
  final List<NetworkingSession> list;

  Map<String, dynamic> toJson() {
    return {
      'total': total,
      'active': active,
      'upcoming': upcoming,
      'completed': completed,
      'draft': draft,
      'cancelled': cancelled,
      'averageJoinLimit': averageJoinLimit,
      'rotationDurationSeconds': rotationDurationSeconds,
      'registered': registered,
      'waitlist': waitlist,
      'checkedIn': checkedIn,
      'completedAttendees': completedAttendees,
      'paid': paid,
      'free': free,
      'revenueCents': revenueCents,
      'averagePriceCents': averagePriceCents,
      'satisfactionAverage': satisfactionAverage,
      'list': list.map((session) => session.toJson()).toList(growable: false),
    };
  }

  factory NetworkingSessionsAnalytics.fromJson(Map<String, dynamic> json) {
    final list = (json['list'] as List<dynamic>? ?? const <dynamic>[])
        .map((item) => NetworkingSession.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList(growable: false);
    return NetworkingSessionsAnalytics(
      total: _parseInt(json['total']),
      active: _parseInt(json['active']),
      upcoming: _parseInt(json['upcoming']),
      completed: _parseInt(json['completed']),
      draft: _parseInt(json['draft']),
      cancelled: _parseInt(json['cancelled']),
      averageJoinLimit: json['averageJoinLimit'] == null ? null : _parseInt(json['averageJoinLimit']),
      rotationDurationSeconds:
          json['rotationDurationSeconds'] == null ? null : _parseInt(json['rotationDurationSeconds']),
      registered: _parseInt(json['registered']),
      waitlist: _parseInt(json['waitlist']),
      checkedIn: _parseInt(json['checkedIn']),
      completedAttendees: _parseInt(json['completedAttendees']),
      paid: _parseInt(json['paid']),
      free: _parseInt(json['free']),
      revenueCents: _parseInt(json['revenueCents']),
      averagePriceCents: json['averagePriceCents'] == null ? null : _parseInt(json['averagePriceCents']),
      satisfactionAverage: _parseDouble(json['satisfactionAverage']),
      list: list,
    );
  }
}

class NetworkingSchedulingAnalytics {
  const NetworkingSchedulingAnalytics({
    required this.preRegistrations,
    required this.waitlist,
    required this.remindersSent,
    required this.searches,
    required this.sponsorSlots,
  });

  final int preRegistrations;
  final int waitlist;
  final int remindersSent;
  final int searches;
  final int sponsorSlots;

  Map<String, dynamic> toJson() {
    return {
      'preRegistrations': preRegistrations,
      'waitlist': waitlist,
      'remindersSent': remindersSent,
      'searches': searches,
      'sponsorSlots': sponsorSlots,
    };
  }

  factory NetworkingSchedulingAnalytics.fromJson(Map<String, dynamic> json) {
    return NetworkingSchedulingAnalytics(
      preRegistrations: _parseInt(json['preRegistrations']),
      waitlist: _parseInt(json['waitlist']),
      remindersSent: _parseInt(json['remindersSent']),
      searches: _parseInt(json['searches']),
      sponsorSlots: _parseInt(json['sponsorSlots']),
    );
  }
}

class NetworkingMonetizationAnalytics {
  const NetworkingMonetizationAnalytics({
    required this.paid,
    required this.free,
    required this.revenueCents,
    required this.averagePriceCents,
  });

  final int paid;
  final int free;
  final int revenueCents;
  final int? averagePriceCents;

  Map<String, dynamic> toJson() {
    return {
      'paid': paid,
      'free': free,
      'revenueCents': revenueCents,
      'averagePriceCents': averagePriceCents,
    };
  }

  factory NetworkingMonetizationAnalytics.fromJson(Map<String, dynamic> json) {
    return NetworkingMonetizationAnalytics(
      paid: _parseInt(json['paid']),
      free: _parseInt(json['free']),
      revenueCents: _parseInt(json['revenueCents']),
      averagePriceCents: json['averagePriceCents'] == null ? null : _parseInt(json['averagePriceCents']),
    );
  }
}

class NetworkingPenaltyAnalytics {
  const NetworkingPenaltyAnalytics({
    required this.noShowRate,
    required this.activePenalties,
    required this.restrictedParticipants,
    required this.cooldownDays,
  });

  final double? noShowRate;
  final int activePenalties;
  final int restrictedParticipants;
  final int cooldownDays;

  Map<String, dynamic> toJson() {
    return {
      'noShowRate': noShowRate,
      'activePenalties': activePenalties,
      'restrictedParticipants': restrictedParticipants,
      'cooldownDays': cooldownDays,
    };
  }

  factory NetworkingPenaltyAnalytics.fromJson(Map<String, dynamic> json) {
    return NetworkingPenaltyAnalytics(
      noShowRate: _parseDouble(json['noShowRate']),
      activePenalties: _parseInt(json['activePenalties']),
      restrictedParticipants: _parseInt(json['restrictedParticipants']),
      cooldownDays: _parseInt(json['cooldownDays'], _defaultPenaltyRules.cooldownDays),
    );
  }
}

class NetworkingAttendeeExperience {
  const NetworkingAttendeeExperience({
    required this.profilesShared,
    required this.connectionsSaved,
    required this.averageMessagesPerSession,
    required this.followUpsScheduled,
  });

  final int profilesShared;
  final int connectionsSaved;
  final double averageMessagesPerSession;
  final int followUpsScheduled;

  Map<String, dynamic> toJson() {
    return {
      'profilesShared': profilesShared,
      'connectionsSaved': connectionsSaved,
      'averageMessagesPerSession': averageMessagesPerSession,
      'followUpsScheduled': followUpsScheduled,
    };
  }

  factory NetworkingAttendeeExperience.fromJson(Map<String, dynamic> json) {
    return NetworkingAttendeeExperience(
      profilesShared: _parseInt(json['profilesShared']),
      connectionsSaved: _parseInt(json['connectionsSaved']),
      averageMessagesPerSession: _parseDouble(json['averageMessagesPerSession']) ?? 0,
      followUpsScheduled: _parseInt(json['followUpsScheduled']),
    );
  }
}

class NetworkingDigitalCardAnalytics {
  const NetworkingDigitalCardAnalytics({
    required this.created,
    required this.updatedThisWeek,
    required this.sharedInSession,
    required this.templates,
    required this.available,
  });

  final int created;
  final int updatedThisWeek;
  final int sharedInSession;
  final int templates;
  final int available;

  Map<String, dynamic> toJson() {
    return {
      'created': created,
      'updatedThisWeek': updatedThisWeek,
      'sharedInSession': sharedInSession,
      'templates': templates,
      'available': available,
    };
  }

  factory NetworkingDigitalCardAnalytics.fromJson(Map<String, dynamic> json) {
    return NetworkingDigitalCardAnalytics(
      created: _parseInt(json['created']),
      updatedThisWeek: _parseInt(json['updatedThisWeek']),
      sharedInSession: _parseInt(json['sharedInSession']),
      templates: _parseInt(json['templates'], 3),
      available: _parseInt(json['available']),
    );
  }
}

class NetworkingVideoAnalytics {
  const NetworkingVideoAnalytics({
    required this.averageQualityScore,
    required this.browserLoadShare,
    required this.hostAnnouncements,
    required this.failoverRate,
  });

  final double? averageQualityScore;
  final double? browserLoadShare;
  final int hostAnnouncements;
  final double? failoverRate;

  Map<String, dynamic> toJson() {
    return {
      'averageQualityScore': averageQualityScore,
      'browserLoadShare': browserLoadShare,
      'hostAnnouncements': hostAnnouncements,
      'failoverRate': failoverRate,
    };
  }

  factory NetworkingVideoAnalytics.fromJson(Map<String, dynamic> json) {
    return NetworkingVideoAnalytics(
      averageQualityScore: _parseDouble(json['averageQualityScore']),
      browserLoadShare: _parseDouble(json['browserLoadShare']),
      hostAnnouncements: _parseInt(json['hostAnnouncements']),
      failoverRate: _parseDouble(json['failoverRate']),
    );
  }
}

class NetworkingShowcase {
  const NetworkingShowcase({
    required this.featuredSessionId,
    required this.librarySize,
    required this.cardsAvailable,
    required this.highlights,
  });

  final int? featuredSessionId;
  final int librarySize;
  final int cardsAvailable;
  final List<String> highlights;

  Map<String, dynamic> toJson() {
    return {
      'featuredSessionId': featuredSessionId,
      'librarySize': librarySize,
      'cardsAvailable': cardsAvailable,
      'highlights': highlights,
    };
  }

  factory NetworkingShowcase.fromJson(Map<String, dynamic> json) {
    final highlights = (json['highlights'] as List<dynamic>? ?? const <dynamic>[])
        .map((value) => '$value'.trim())
        .where((value) => value.isNotEmpty)
        .toList(growable: false);
    return NetworkingShowcase(
      featuredSessionId:
          json['featuredSessionId'] == null ? null : _parseInt(json['featuredSessionId'], 0),
      librarySize: _parseInt(json['librarySize']),
      cardsAvailable: _parseInt(json['cardsAvailable']),
      highlights: highlights.isEmpty
          ? const ['Timed rotations', 'Digital business cards', 'Browser-based video']
          : highlights,
    );
  }
}

class NetworkingSession {
  const NetworkingSession({
    required this.id,
    required this.companyId,
    required this.title,
    required this.description,
    required this.status,
    required this.startTime,
    required this.endTime,
    required this.joinLimit,
    required this.rotationDurationSeconds,
    required this.accessType,
    required this.priceCents,
    required this.penaltyRules,
    required this.videoTelemetry,
    required this.videoConfig,
    required this.monetization,
    required this.metadata,
    required this.showcaseConfig,
    required this.signups,
    required this.metrics,
  });

  final int id;
  final int? companyId;
  final String title;
  final String? description;
  final String status;
  final DateTime? startTime;
  final DateTime? endTime;
  final int? joinLimit;
  final int? rotationDurationSeconds;
  final String? accessType;
  final int? priceCents;
  final NetworkingPenaltyRules penaltyRules;
  final Map<String, dynamic> videoTelemetry;
  final Map<String, dynamic> videoConfig;
  final Map<String, dynamic> monetization;
  final Map<String, dynamic> metadata;
  final Map<String, dynamic> showcaseConfig;
  final List<NetworkingSignup> signups;
  final NetworkingSessionMetrics metrics;

  bool isUpcoming(DateTime reference) {
    if (startTime == null) return false;
    return startTime!.isAfter(reference);
  }

  bool isCompleted(DateTime reference) {
    if (status == 'completed') return true;
    if (endTime == null) return false;
    return endTime!.isBefore(reference);
  }

  List<String> get showcaseHighlights {
    final highlights = (showcaseConfig['sessionHighlights'] as List<dynamic>? ?? const <dynamic>[])
        .map((value) => '$value'.trim())
        .where((value) => value.isNotEmpty)
        .toList(growable: false);
    return highlights.isEmpty
        ? const ['Timed rotations', 'Digital business cards', 'Browser-based video']
        : highlights;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'companyId': companyId,
      'title': title,
      'description': description,
      'status': status,
      'startTime': startTime?.toIso8601String(),
      'endTime': endTime?.toIso8601String(),
      'joinLimit': joinLimit,
      'rotationDurationSeconds': rotationDurationSeconds,
      'accessType': accessType,
      'priceCents': priceCents,
      'penaltyRules': penaltyRules.toJson(),
      'videoTelemetry': videoTelemetry,
      'videoConfig': videoConfig,
      'monetization': monetization,
      'metadata': metadata,
      'showcaseConfig': showcaseConfig,
      'signups': signups.map((signup) => signup.toJson()).toList(growable: false),
      'metrics': metrics.toJson(),
    };
  }

  factory NetworkingSession.fromJson(Map<String, dynamic> json) {
    final signups = (json['signups'] as List<dynamic>? ?? const <dynamic>[])
        .map((value) => NetworkingSignup.fromJson(Map<String, dynamic>.from(value as Map)))
        .toList(growable: false);
    final penaltyRules = NetworkingPenaltyRules.fromJson(json['penaltyRules']);
    final metrics = NetworkingSessionMetrics.fromSignups(signups, penaltyRules: penaltyRules);
    return NetworkingSession(
      id: _parseInt(json['id']),
      companyId: json['companyId'] == null ? null : _parseInt(json['companyId']),
      title: (json['title'] as String? ?? '').trim(),
      description: (json['description'] as String?)?.trim(),
      status: (json['status'] as String? ?? 'draft').trim(),
      startTime: _parseDate(json['startTime']),
      endTime: _parseDate(json['endTime']),
      joinLimit: json['joinLimit'] == null ? null : _parseInt(json['joinLimit']),
      rotationDurationSeconds:
          json['rotationDurationSeconds'] == null ? null : _parseInt(json['rotationDurationSeconds']),
      accessType: (json['accessType'] as String?)?.trim(),
      priceCents: json['priceCents'] == null ? null : _parseInt(json['priceCents']),
      penaltyRules: penaltyRules,
      videoTelemetry: json['videoTelemetry'] is Map
          ? Map<String, dynamic>.from(json['videoTelemetry'] as Map)
          : const <String, dynamic>{},
      videoConfig: json['videoConfig'] is Map
          ? Map<String, dynamic>.from(json['videoConfig'] as Map)
          : const <String, dynamic>{},
      monetization: json['monetization'] is Map
          ? Map<String, dynamic>.from(json['monetization'] as Map)
          : const <String, dynamic>{},
      metadata: json['metadata'] is Map
          ? Map<String, dynamic>.from(json['metadata'] as Map)
          : const <String, dynamic>{},
      showcaseConfig: json['showcaseConfig'] is Map
          ? Map<String, dynamic>.from(json['showcaseConfig'] as Map)
          : const <String, dynamic>{},
      signups: signups,
      metrics: metrics,
    );
  }
}

class NetworkingSessionMetrics {
  const NetworkingSessionMetrics({
    required this.registered,
    required this.waitlisted,
    required this.checkedIn,
    required this.completed,
    required this.noShows,
    required this.cardShares,
    required this.penalties,
    required this.profileSharedCount,
    required this.connectionsSaved,
    required this.messagesSent,
    required this.followUpsScheduled,
    required this.averageSatisfaction,
    required this.penaltyRules,
  });

  final int registered;
  final int waitlisted;
  final int checkedIn;
  final int completed;
  final int noShows;
  final int cardShares;
  final int penalties;
  final int profileSharedCount;
  final int connectionsSaved;
  final int messagesSent;
  final int followUpsScheduled;
  final double? averageSatisfaction;
  final NetworkingPenaltyRules penaltyRules;

  Map<String, dynamic> toJson() {
    return {
      'registered': registered,
      'waitlisted': waitlisted,
      'checkedIn': checkedIn,
      'completed': completed,
      'noShows': noShows,
      'cardShares': cardShares,
      'penalties': penalties,
      'profileSharedCount': profileSharedCount,
      'connectionsSaved': connectionsSaved,
      'messagesSent': messagesSent,
      'followUpsScheduled': followUpsScheduled,
      'averageSatisfaction': averageSatisfaction,
      'penaltyRules': penaltyRules.toJson(),
    };
  }

  factory NetworkingSessionMetrics.fromSignups(
    List<NetworkingSignup> signups, {
    required NetworkingPenaltyRules penaltyRules,
  }) {
    var registered = 0;
    var waitlisted = 0;
    var checkedIn = 0;
    var completed = 0;
    var noShows = 0;
    var cardShares = 0;
    var penalties = 0;
    var profileSharedCount = 0;
    var connectionsSaved = 0;
    var messagesSent = 0;
    var followUpsScheduled = 0;
    final scores = <double>[];

    for (final signup in signups) {
      switch (signup.status) {
        case 'registered':
          registered += 1;
          break;
        case 'waitlisted':
          waitlisted += 1;
          break;
        case 'checked_in':
          checkedIn += 1;
          break;
        case 'completed':
          completed += 1;
          break;
        case 'no_show':
          noShows += 1;
          break;
        default:
          break;
      }
      if (signup.businessCardId != null) {
        cardShares += 1;
      }
      if (signup.penaltyCount > 0) {
        penalties += 1;
      }
      profileSharedCount += signup.profileSharedCount;
      connectionsSaved += signup.connectionsSaved;
      messagesSent += signup.messagesSent;
      followUpsScheduled += signup.followUpsScheduled;
      if (signup.satisfactionScore != null) {
        scores.add(signup.satisfactionScore!);
      }
    }

    final average = scores.isEmpty
        ? null
        : double.parse(
            (scores.reduce((sum, value) => sum + value) / scores.length).toStringAsFixed(2),
          );

    return NetworkingSessionMetrics(
      registered: registered,
      waitlisted: waitlisted,
      checkedIn: checkedIn,
      completed: completed,
      noShows: noShows,
      cardShares: cardShares,
      penalties: penalties,
      profileSharedCount: profileSharedCount,
      connectionsSaved: connectionsSaved,
      messagesSent: messagesSent,
      followUpsScheduled: followUpsScheduled,
      averageSatisfaction: average,
      penaltyRules: penaltyRules,
    );
  }
}

class NetworkingPenaltyRules {
  const NetworkingPenaltyRules({
    required this.noShowThreshold,
    required this.cooldownDays,
    required this.penaltyWeight,
  });

  final int noShowThreshold;
  final int cooldownDays;
  final int penaltyWeight;

  Map<String, dynamic> toJson() {
    return {
      'noShowThreshold': noShowThreshold,
      'cooldownDays': cooldownDays,
      'penaltyWeight': penaltyWeight,
    };
  }

  factory NetworkingPenaltyRules.fromJson(dynamic json) {
    if (json is! Map) {
      return _defaultPenaltyRules;
    }
    final map = Map<String, dynamic>.from(json as Map);
    final threshold = _parseInt(map['noShowThreshold'], _defaultPenaltyRules.noShowThreshold);
    final cooldown = _parseInt(map['cooldownDays'], _defaultPenaltyRules.cooldownDays);
    final weight = _parseInt(map['penaltyWeight'], _defaultPenaltyRules.penaltyWeight);
    return NetworkingPenaltyRules(
      noShowThreshold: threshold <= 0 ? _defaultPenaltyRules.noShowThreshold : threshold,
      cooldownDays: cooldown <= 0 ? _defaultPenaltyRules.cooldownDays : cooldown,
      penaltyWeight: weight <= 0 ? _defaultPenaltyRules.penaltyWeight : weight,
    );
  }
}

class NetworkingSignup {
  const NetworkingSignup({
    required this.status,
    required this.penaltyCount,
    required this.profileSharedCount,
    required this.connectionsSaved,
    required this.messagesSent,
    required this.followUpsScheduled,
    required this.satisfactionScore,
    required this.businessCardId,
  });

  final String status;
  final int penaltyCount;
  final int profileSharedCount;
  final int connectionsSaved;
  final int messagesSent;
  final int followUpsScheduled;
  final double? satisfactionScore;
  final int? businessCardId;

  Map<String, dynamic> toJson() {
    return {
      'status': status,
      'penaltyCount': penaltyCount,
      'profileSharedCount': profileSharedCount,
      'connectionsSaved': connectionsSaved,
      'messagesSent': messagesSent,
      'followUpsScheduled': followUpsScheduled,
      'satisfactionScore': satisfactionScore,
      'businessCardId': businessCardId,
    };
  }

  factory NetworkingSignup.fromJson(Map<String, dynamic> json) {
    return NetworkingSignup(
      status: (json['status'] as String? ?? 'registered').trim(),
      penaltyCount: _parseInt(json['penaltyCount']),
      profileSharedCount: _parseInt(json['profileSharedCount']),
      connectionsSaved: _parseInt(json['connectionsSaved']),
      messagesSent: _parseInt(json['messagesSent']),
      followUpsScheduled: _parseInt(json['followUpsScheduled']),
      satisfactionScore: _parseDouble(json['satisfactionScore']),
      businessCardId: json['businessCardId'] == null ? null : _parseInt(json['businessCardId']),
    );
  }
}

class NetworkingBusinessCard {
  const NetworkingBusinessCard({
    required this.id,
    required this.companyId,
    required this.status,
    required this.updatedAt,
    required this.shareCount,
    required this.tags,
  });

  final int id;
  final int? companyId;
  final String status;
  final DateTime? updatedAt;
  final int shareCount;
  final List<String> tags;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'companyId': companyId,
      'status': status,
      'updatedAt': updatedAt?.toIso8601String(),
      'shareCount': shareCount,
      'tags': tags,
    };
  }

  factory NetworkingBusinessCard.fromJson(Map<String, dynamic> json) {
    final tags = (json['tags'] as List<dynamic>? ?? const <dynamic>[])
        .map((value) => '$value'.trim())
        .where((value) => value.isNotEmpty)
        .toList(growable: false);
    return NetworkingBusinessCard(
      id: _parseInt(json['id']),
      companyId: json['companyId'] == null ? null : _parseInt(json['companyId']),
      status: (json['status'] as String? ?? 'draft').trim(),
      updatedAt: _parseDate(json['updatedAt']),
      shareCount: _parseInt(json['shareCount']),
      tags: tags,
    );
  }
}

class _NetworkingTotals {
  int total = 0;
  int active = 0;
  int upcoming = 0;
  int completed = 0;
  int draft = 0;
  int cancelled = 0;
  final List<int> joinLimits = <int>[];
  final List<int> rotationDurations = <int>[];
  int registered = 0;
  int waitlist = 0;
  int checkedIn = 0;
  int completedAttendees = 0;
  int paidSessions = 0;
  int freeSessions = 0;
  int revenueCents = 0;
  int hostAnnouncements = 0;
  int remindersSent = 0;
  int searchDemand = 0;
  int sponsorSlots = 0;
  int noShows = 0;
  int profileShares = 0;
  int connectionsSaved = 0;
  int messagesSent = 0;
  int followUps = 0;
  int cardShares = 0;
  final List<int> pricePoints = <int>[];
  final List<double> satisfactionScores = <double>[];
  final List<double> videoQuality = <double>[];
  final List<double> browserLoadShare = <double>[];
  final List<double> videoFailover = <double>[];
}
