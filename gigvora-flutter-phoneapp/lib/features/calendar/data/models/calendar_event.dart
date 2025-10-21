import 'package:equatable/equatable.dart';
import 'package:intl/intl.dart';

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
    };
  }

  String get dayKey => DateFormat('yyyy-MM-dd').format(start);

  @override
  List<Object?> get props => [id, title, start, end, description, location, attendees, attachments, allDay, reminderMinutes, completed];
}
