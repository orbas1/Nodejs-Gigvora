import 'package:equatable/equatable.dart';
import 'package:intl/intl.dart';

class CalendarEvent extends Equatable {
  const CalendarEvent({
    required this.id,
    required this.title,
    required this.startsAt,
    this.endsAt,
    this.eventType = 'event',
    this.source = 'manual',
    this.location,
    this.description,
    this.videoConferenceLink,
    this.isAllDay = false,
    this.reminderMinutes,
    this.visibility = 'private',
    this.relatedEntityType,
    this.relatedEntityId,
    this.colorHex,
    this.focusMode,
    Map<String, dynamic>? metadata,
  }) : metadata = metadata ?? const <String, dynamic>{};

  factory CalendarEvent.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(dynamic value) {
      if (value == null) {
        return null;
      }
      final parsed = DateTime.tryParse('$value');
      return parsed?.toLocal();
    }

    int? parseInt(dynamic value) {
      if (value == null || value == '') {
        return null;
      }
      if (value is int) {
        return value;
      }
      return int.tryParse('$value');
    }

    return CalendarEvent(
      id: parseInt(json['id']),
      title: (json['title'] as String?)?.trim() ?? 'Untitled',
      startsAt: parseDate(json['startsAt']) ?? DateTime.now(),
      endsAt: parseDate(json['endsAt']),
      eventType: (json['eventType'] as String?)?.trim() ?? 'event',
      source: (json['source'] as String?)?.trim() ?? 'manual',
      location: (json['location'] as String?)?.trim(),
      description: (json['description'] as String?)?.trim(),
      videoConferenceLink: (json['videoConferenceLink'] as String?)?.trim(),
      isAllDay: json['isAllDay'] as bool? ?? false,
      reminderMinutes: parseInt(json['reminderMinutes']),
      visibility: (json['visibility'] as String?)?.trim() ?? 'private',
      relatedEntityType: (json['relatedEntityType'] as String?)?.trim(),
      relatedEntityId: parseInt(json['relatedEntityId']),
      colorHex: (json['colorHex'] as String?)?.trim(),
      focusMode: (json['focusMode'] as String?)?.trim(),
      metadata: json['metadata'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(json['metadata'] as Map<String, dynamic>)
          : const <String, dynamic>{},
    );
  }

  final int? id;
  final String title;
  final DateTime startsAt;
  final DateTime? endsAt;
  final String eventType;
  final String source;
  final String? location;
  final String? description;
  final String? videoConferenceLink;
  final bool isAllDay;
  final int? reminderMinutes;
  final String visibility;
  final String? relatedEntityType;
  final int? relatedEntityId;
  final String? colorHex;
  final String? focusMode;
  final Map<String, dynamic> metadata;

  DateTime get startsAtLocal => startsAt.toLocal();

  DateTime get endsAtLocal => (endsAt ?? startsAt).toLocal();

  String get dayKey => DateFormat('yyyy-MM-dd').format(startsAtLocal);

  CalendarEvent copyWith({
    int? id,
    String? title,
    DateTime? startsAt,
    DateTime? endsAt,
    String? eventType,
    String? source,
    String? location,
    String? description,
    String? videoConferenceLink,
    bool? isAllDay,
    int? reminderMinutes,
    String? visibility,
    String? relatedEntityType,
    int? relatedEntityId,
    String? colorHex,
    String? focusMode,
    Map<String, dynamic>? metadata,
  }) {
    return CalendarEvent(
      id: id ?? this.id,
      title: title ?? this.title,
      startsAt: startsAt ?? this.startsAt,
      endsAt: endsAt ?? this.endsAt,
      eventType: eventType ?? this.eventType,
      source: source ?? this.source,
      location: location ?? this.location,
      description: description ?? this.description,
      videoConferenceLink: videoConferenceLink ?? this.videoConferenceLink,
      isAllDay: isAllDay ?? this.isAllDay,
      reminderMinutes: reminderMinutes ?? this.reminderMinutes,
      visibility: visibility ?? this.visibility,
      relatedEntityType: relatedEntityType ?? this.relatedEntityType,
      relatedEntityId: relatedEntityId ?? this.relatedEntityId,
      colorHex: colorHex ?? this.colorHex,
      focusMode: focusMode ?? this.focusMode,
      metadata: metadata ?? this.metadata,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'startsAt': startsAt.toUtc().toIso8601String(),
      'endsAt': endsAt?.toUtc().toIso8601String(),
      'eventType': eventType,
      'source': source,
      'location': location,
      'description': description,
      'videoConferenceLink': videoConferenceLink,
      'isAllDay': isAllDay,
      'reminderMinutes': reminderMinutes,
      'visibility': visibility,
      'relatedEntityType': relatedEntityType,
      'relatedEntityId': relatedEntityId,
      'colorHex': colorHex,
      'focusMode': focusMode,
      'metadata': metadata,
    };
  }

  Map<String, dynamic> toPayload() {
    return {
      'title': title,
      'eventType': eventType,
      'source': source,
      'startsAt': startsAt.toUtc().toIso8601String(),
      'endsAt': endsAt?.toUtc().toIso8601String(),
      'location': location,
      'description': description,
      'videoConferenceLink': videoConferenceLink,
      'isAllDay': isAllDay,
      'reminderMinutes': reminderMinutes,
      'visibility': visibility,
      'relatedEntityType': relatedEntityType,
      'relatedEntityId': relatedEntityId,
      'colorHex': colorHex,
      'metadata': metadata,
      'focusMode': focusMode,
    };
  }

  String formatTimeRange() {
    if (isAllDay) {
      return 'All day';
    }
    final startLabel = DateFormat.jm().format(startsAtLocal);
    final endLabel = DateFormat.jm().format(endsAtLocal);
    return '$startLabel – $endLabel';
  }

  String toIcs({String productId = 'Gigvora Mobile', String? timezone}) {
    final buffer = StringBuffer()
      ..writeln('BEGIN:VCALENDAR')
      ..writeln('PRODID:-//$productId//EN')
      ..writeln('VERSION:2.0')
      ..writeln('CALSCALE:GREGORIAN')
      ..writeln('BEGIN:VEVENT')
      ..writeln('UID:${id ?? '${startsAt.millisecondsSinceEpoch}@$productId'}')
      ..writeln('DTSTAMP:${_formatUtc(DateTime.now().toUtc())}')
      ..writeln('SUMMARY:${_escapeText(title)}');

    if (description?.isNotEmpty ?? false) {
      buffer.writeln('DESCRIPTION:${_escapeText(description!)}');
    }

    if (location?.isNotEmpty ?? false) {
      buffer.writeln('LOCATION:${_escapeText(location!)}');
    }

    if (isAllDay) {
      buffer
        ..writeln('DTSTART;VALUE=DATE:${DateFormat('yyyyMMdd').format(startsAtLocal)}')
        ..writeln('DTEND;VALUE=DATE:${DateFormat('yyyyMMdd').format(endsAtLocal)}');
    } else if (timezone != null && timezone.isNotEmpty) {
      buffer
        ..writeln('DTSTART;TZID=$timezone:${_formatLocal(startsAtLocal)}')
        ..writeln('DTEND;TZID=$timezone:${_formatLocal(endsAtLocal)}');
    } else {
      buffer
        ..writeln('DTSTART:${_formatUtc(startsAt.toUtc())}')
        ..writeln('DTEND:${_formatUtc((endsAt ?? startsAt).toUtc())}');
    }

    buffer
      ..writeln('STATUS:CONFIRMED')
      ..writeln('END:VEVENT')
      ..writeln('END:VCALENDAR');

    return buffer.toString();
  }

  static String _escapeText(String input) {
    return input
        .replaceAll('\\', '\\\\')
        .replaceAll('\n', '\\n')
        .replaceAll(',', '\\,')
        .replaceAll(';', '\\;');
  }

  static String _formatUtc(DateTime value) {
    return DateFormat("yyyyMMdd'T'HHmmss'Z'").format(value.toUtc());
  }

  static String _formatLocal(DateTime value) {
    return DateFormat("yyyyMMdd'T'HHmmss").format(value);
  }

  @override
  List<Object?> get props => [
        id,
        title,
        startsAt,
        endsAt,
        eventType,
        source,
        location,
        description,
        videoConferenceLink,
        isAllDay,
        reminderMinutes,
        visibility,
        relatedEntityType,
        relatedEntityId,
        colorHex,
        focusMode,
        metadata,
      ];
}
