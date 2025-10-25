import 'package:equatable/equatable.dart';

class CalendarFocusSession extends Equatable {
  const CalendarFocusSession({
    this.id,
    required this.focusType,
    required this.startedAt,
    this.endedAt,
    this.durationMinutes,
    this.completed = false,
    this.notes,
    this.metadata = const <String, dynamic>{},
  });

  factory CalendarFocusSession.fromJson(Map<String, dynamic> json) {
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

    return CalendarFocusSession(
      id: parseInt(json['id']),
      focusType: (json['focusType'] as String?)?.trim() ?? 'deep_work',
      startedAt: parseDate(json['startedAt']) ?? DateTime.now(),
      endedAt: parseDate(json['endedAt']),
      durationMinutes: parseInt(json['durationMinutes']),
      completed: json['completed'] as bool? ?? false,
      notes: (json['notes'] as String?)?.trim(),
      metadata: json['metadata'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(json['metadata'] as Map<String, dynamic>)
          : const <String, dynamic>{},
    );
  }

  final int? id;
  final String focusType;
  final DateTime startedAt;
  final DateTime? endedAt;
  final int? durationMinutes;
  final bool completed;
  final String? notes;
  final Map<String, dynamic> metadata;

  DateTime get startedAtLocal => startedAt.toLocal();

  DateTime? get endedAtLocal => endedAt?.toLocal();

  CalendarFocusSession copyWith({
    int? id,
    String? focusType,
    DateTime? startedAt,
    DateTime? endedAt,
    int? durationMinutes,
    bool? completed,
    String? notes,
    Map<String, dynamic>? metadata,
  }) {
    return CalendarFocusSession(
      id: id ?? this.id,
      focusType: focusType ?? this.focusType,
      startedAt: startedAt ?? this.startedAt,
      endedAt: endedAt ?? this.endedAt,
      durationMinutes: durationMinutes ?? this.durationMinutes,
      completed: completed ?? this.completed,
      notes: notes ?? this.notes,
      metadata: metadata ?? this.metadata,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'focusType': focusType,
      'startedAt': startedAt.toUtc().toIso8601String(),
      'endedAt': endedAt?.toUtc().toIso8601String(),
      'durationMinutes': durationMinutes,
      'completed': completed,
      'notes': notes,
      'metadata': metadata,
    };
  }

  Map<String, dynamic> toPayload() {
    return {
      'focusType': focusType,
      'startedAt': startedAt.toUtc().toIso8601String(),
      'endedAt': endedAt?.toUtc().toIso8601String(),
      'durationMinutes': durationMinutes,
      'completed': completed,
      'notes': notes,
      'metadata': metadata.isEmpty ? null : metadata,
    };
  }

  @override
  List<Object?> get props => [
        id,
        focusType,
        startedAt,
        endedAt,
        durationMinutes,
        completed,
        notes,
        metadata,
      ];
}
