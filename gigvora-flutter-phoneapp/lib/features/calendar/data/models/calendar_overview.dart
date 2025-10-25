import 'package:equatable/equatable.dart';

import 'calendar_event.dart';
import 'calendar_focus_session.dart';
import 'calendar_integration.dart';
import 'calendar_settings.dart';

class CalendarOverviewStats extends Equatable {
  const CalendarOverviewStats({
    required this.totalEvents,
    required this.upcomingEvents,
    required this.eventsByType,
    this.nextEvent,
    this.openFocusSessions = const <CalendarFocusSession>[],
  });

  factory CalendarOverviewStats.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const CalendarOverviewStats(
        totalEvents: 0,
        upcomingEvents: 0,
        eventsByType: <String, int>{},
      );
    }

    final map = <String, int>{};
    if (json['eventsByType'] is Map) {
      (json['eventsByType'] as Map).forEach((key, value) {
        if (key is String) {
          map[key] = value is int ? value : int.tryParse('$value') ?? 0;
        }
      });
    }

    final focusSessions = <CalendarFocusSession>[];
    if (json['openFocusSessions'] is List) {
      for (final entry in json['openFocusSessions'] as List<dynamic>) {
        if (entry is Map<String, dynamic>) {
          focusSessions.add(CalendarFocusSession.fromJson(entry));
        }
      }
    }

    return CalendarOverviewStats(
      totalEvents: json['totalEvents'] is num ? (json['totalEvents'] as num).toInt() : 0,
      upcomingEvents: json['upcomingEvents'] is num ? (json['upcomingEvents'] as num).toInt() : 0,
      eventsByType: map,
      nextEvent: json['nextEvent'] is Map<String, dynamic>
          ? CalendarEvent.fromJson(json['nextEvent'] as Map<String, dynamic>)
          : null,
      openFocusSessions: focusSessions,
    );
  }

  final int totalEvents;
  final int upcomingEvents;
  final Map<String, int> eventsByType;
  final CalendarEvent? nextEvent;
  final List<CalendarFocusSession> openFocusSessions;

  CalendarOverviewStats copyWith({
    int? totalEvents,
    int? upcomingEvents,
    Map<String, int>? eventsByType,
    CalendarEvent? nextEvent,
    List<CalendarFocusSession>? openFocusSessions,
  }) {
    return CalendarOverviewStats(
      totalEvents: totalEvents ?? this.totalEvents,
      upcomingEvents: upcomingEvents ?? this.upcomingEvents,
      eventsByType: eventsByType ?? this.eventsByType,
      nextEvent: nextEvent ?? this.nextEvent,
      openFocusSessions: openFocusSessions ?? this.openFocusSessions,
    );
  }

  @override
  List<Object?> get props => [
        totalEvents,
        upcomingEvents,
        eventsByType,
        nextEvent,
        openFocusSessions,
      ];
}

class CalendarOverview extends Equatable {
  const CalendarOverview({
    required this.events,
    required this.focusSessions,
    required this.integrations,
    required this.settings,
    required this.stats,
  });

  factory CalendarOverview.fromJson(Map<String, dynamic> json) {
    final events = <CalendarEvent>[];
    if (json['events'] is List) {
      for (final entry in json['events'] as List<dynamic>) {
        if (entry is Map<String, dynamic>) {
          events.add(CalendarEvent.fromJson(entry));
        }
      }
    }

    final focusSessions = <CalendarFocusSession>[];
    if (json['focusSessions'] is List) {
      for (final entry in json['focusSessions'] as List<dynamic>) {
        if (entry is Map<String, dynamic>) {
          focusSessions.add(CalendarFocusSession.fromJson(entry));
        }
      }
    }

    final integrations = <CalendarIntegration>[];
    if (json['integrations'] is List) {
      for (final entry in json['integrations'] as List<dynamic>) {
        if (entry is Map<String, dynamic>) {
          integrations.add(CalendarIntegration.fromJson(entry));
        }
      }
    }

    final settings = CalendarSettings.fromJson(json['settings'] as Map<String, dynamic>?);
    final stats = CalendarOverviewStats.fromJson(json['stats'] as Map<String, dynamic>?);

    return CalendarOverview(
      events: events,
      focusSessions: focusSessions,
      integrations: integrations,
      settings: settings,
      stats: stats,
    );
  }

  final List<CalendarEvent> events;
  final List<CalendarFocusSession> focusSessions;
  final List<CalendarIntegration> integrations;
  final CalendarSettings settings;
  final CalendarOverviewStats stats;

  factory CalendarOverview.empty() => CalendarOverview(
    events: const <CalendarEvent>[],
    focusSessions: const <CalendarFocusSession>[],
    integrations: const <CalendarIntegration>[],
    settings: CalendarSettings.fromJson(null),
    stats: const CalendarOverviewStats(
      totalEvents: 0,
      upcomingEvents: 0,
      eventsByType: <String, int>{},
    ),
  );

  CalendarOverview copyWith({
    List<CalendarEvent>? events,
    List<CalendarFocusSession>? focusSessions,
    List<CalendarIntegration>? integrations,
    CalendarSettings? settings,
    CalendarOverviewStats? stats,
  }) {
    return CalendarOverview(
      events: events ?? this.events,
      focusSessions: focusSessions ?? this.focusSessions,
      integrations: integrations ?? this.integrations,
      settings: settings ?? this.settings,
      stats: stats ?? this.stats,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'events': events.map((event) => event.toJson()).toList(growable: false),
      'focusSessions': focusSessions.map((session) => session.toJson()).toList(growable: false),
      'integrations': integrations.map((integration) => {
            'id': integration.id,
            'provider': integration.provider,
            'externalAccount': integration.externalAccount,
            'status': integration.status,
            'lastSyncedAt': integration.lastSyncedAt?.toUtc().toIso8601String(),
            'syncError': integration.syncError,
            'metadata': integration.metadata,
          }).toList(growable: false),
      'settings': settings.toJson(),
      'stats': {
        'totalEvents': stats.totalEvents,
        'upcomingEvents': stats.upcomingEvents,
        'eventsByType': stats.eventsByType,
        'nextEvent': stats.nextEvent?.toJson(),
        'openFocusSessions': stats.openFocusSessions.map((session) => session.toJson()).toList(growable: false),
      },
    };
  }

  @override
  List<Object?> get props => [events, focusSessions, integrations, settings, stats];
}
