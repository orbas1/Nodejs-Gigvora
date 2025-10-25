import 'package:equatable/equatable.dart';
import 'package:intl/intl.dart';

import 'calendar_recurrence.dart';

class CalendarEvent extends Equatable {
  const CalendarEvent({
    required this.id,
    required this.title,
    required this.start,
    required this.end,
    this.description,
    this.location,
    this.attendees = const <String>[],
    this.attachments = const <String>[],
    this.allDay = false,
    this.reminderMinutes,
    this.completed = false,
    this.timeZone = 'UTC',
    this.recurrence,
  });

  factory CalendarEvent.fromJson(Map<String, dynamic> json) {
    return CalendarEvent(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? 'Untitled event',
      description: json['description'] as String?,
      location: json['location'] as String?,
      start: DateTime.tryParse(json['start'] as String? ?? '') ?? DateTime.now(),
      end: DateTime.tryParse(json['end'] as String? ?? '') ??
          DateTime.now().add(const Duration(hours: 1)),
      attendees: (json['attendees'] as List<dynamic>?)
              ?.map((value) => value.toString())
              .toList(growable: false) ??
          const <String>[],
      attachments: (json['attachments'] as List<dynamic>?)
              ?.map((value) => value.toString())
              .toList(growable: false) ??
          const <String>[],
      allDay: json['allDay'] as bool? ?? false,
      reminderMinutes: json['reminderMinutes'] as int?,
      completed: json['completed'] as bool? ?? false,
      timeZone: json['timeZone'] as String? ?? 'UTC',
      recurrence: json['recurrence'] is Map
          ? CalendarRecurrence.fromJson(
              Map<String, dynamic>.from(json['recurrence'] as Map),
            )
          : null,
    );
  }

  final String id;
  final String title;
  final DateTime start;
  final DateTime end;
  final String? description;
  final String? location;
  final List<String> attendees;
  final List<String> attachments;
  final bool allDay;
  final int? reminderMinutes;
  final bool completed;
  final String timeZone;
  final CalendarRecurrence? recurrence;

  CalendarEvent copyWith({
    String? id,
    String? title,
    DateTime? start,
    DateTime? end,
    String? description,
    String? location,
    List<String>? attendees,
    List<String>? attachments,
    bool? allDay,
    int? reminderMinutes,
    bool? completed,
    String? timeZone,
    CalendarRecurrence? recurrence,
  }) {
    return CalendarEvent(
      id: id ?? this.id,
      title: title ?? this.title,
      start: start ?? this.start,
      end: end ?? this.end,
      description: description ?? this.description,
      location: location ?? this.location,
      attendees: attendees ?? this.attendees,
      attachments: attachments ?? this.attachments,
      allDay: allDay ?? this.allDay,
      reminderMinutes: reminderMinutes ?? this.reminderMinutes,
      completed: completed ?? this.completed,
      timeZone: timeZone ?? this.timeZone,
      recurrence: recurrence ?? this.recurrence,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'location': location,
      'start': start.toIso8601String(),
      'end': end.toIso8601String(),
      'attendees': attendees,
      'attachments': attachments,
      'allDay': allDay,
      'reminderMinutes': reminderMinutes,
      'completed': completed,
      'timeZone': timeZone,
      'recurrence': recurrence?.toJson(),
    };
  }

  String get dayKey => DateFormat('yyyy-MM-dd').format(start);

  String toIcs({String productId = 'Gigvora Mobile'}) {
    final buffer = StringBuffer()
      ..writeln('BEGIN:VCALENDAR')
      ..writeln('PRODID:-//$productId//EN')
      ..writeln('VERSION:2.0')
      ..writeln('CALSCALE:GREGORIAN')
      ..writeln('BEGIN:VEVENT')
      ..writeln('UID:$id')
      ..writeln('DTSTAMP:${_formatUtc(DateTime.now().toUtc())}')
      ..writeln(
          'SUMMARY:${_escapeText(title.isEmpty ? 'Untitled event' : title)}');

    if (description?.isNotEmpty ?? false) {
      buffer.writeln('DESCRIPTION:${_escapeText(description!)}');
    }

    if (location?.isNotEmpty ?? false) {
      buffer.writeln('LOCATION:${_escapeText(location!)}');
    }

    if (allDay) {
      buffer
        ..writeln('DTSTART;VALUE=DATE:${DateFormat('yyyyMMdd').format(start)}')
        ..writeln('DTEND;VALUE=DATE:${DateFormat('yyyyMMdd').format(end)}');
    } else {
      buffer
        ..writeln(
            'DTSTART;TZID=$timeZone:${_formatLocal(start, timeZone: timeZone)}')
        ..writeln(
            'DTEND;TZID=$timeZone:${_formatLocal(end, timeZone: timeZone)}');
    }

    for (final attendee in attendees) {
      if (attendee.isEmpty) continue;
      buffer.writeln('ATTENDEE:${_escapeText(attendee)}');
    }

    if (recurrence != null) {
      buffer.writeln('RRULE:${recurrence!.toRrule()}');
    }

    buffer
      ..writeln('STATUS:${completed ? 'COMPLETED' : 'CONFIRMED'}')
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
    return DateFormat('yyyyMMdd\'T\'HHmmss\'Z\'').format(value.toUtc());
  }

  static String _formatLocal(DateTime value, {required String timeZone}) {
    return DateFormat('yyyyMMdd\'T\'HHmmss').format(value);
  }

  @override
  List<Object?> get props => [
        id,
        title,
        start,
        end,
        description,
        location,
        attendees,
        attachments,
        allDay,
        reminderMinutes,
        completed,
        timeZone,
        recurrence,
      ];
}
