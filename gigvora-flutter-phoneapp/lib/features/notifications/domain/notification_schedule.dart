import 'package:flutter/material.dart';

class NotificationSchedule {
  const NotificationSchedule({
    this.quietHoursEnabled = false,
    this.quietHoursStart = const TimeOfDay(hour: 22, minute: 0),
    this.quietHoursEnd = const TimeOfDay(hour: 7, minute: 0),
    this.digestEnabled = true,
    this.digestTime = const TimeOfDay(hour: 8, minute: 0),
  });

  final bool quietHoursEnabled;
  final TimeOfDay quietHoursStart;
  final TimeOfDay quietHoursEnd;
  final bool digestEnabled;
  final TimeOfDay digestTime;

  NotificationSchedule copyWith({
    bool? quietHoursEnabled,
    TimeOfDay? quietHoursStart,
    TimeOfDay? quietHoursEnd,
    bool? digestEnabled,
    TimeOfDay? digestTime,
  }) {
    return NotificationSchedule(
      quietHoursEnabled: quietHoursEnabled ?? this.quietHoursEnabled,
      quietHoursStart: quietHoursStart ?? this.quietHoursStart,
      quietHoursEnd: quietHoursEnd ?? this.quietHoursEnd,
      digestEnabled: digestEnabled ?? this.digestEnabled,
      digestTime: digestTime ?? this.digestTime,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'quietHoursEnabled': quietHoursEnabled,
      'quietHoursStart': _formatTime(quietHoursStart),
      'quietHoursEnd': _formatTime(quietHoursEnd),
      'digestEnabled': digestEnabled,
      'digestTime': _formatTime(digestTime),
    };
  }

  factory NotificationSchedule.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const NotificationSchedule();
    }
    return NotificationSchedule(
      quietHoursEnabled: json['quietHoursEnabled'] as bool? ?? false,
      quietHoursStart: _parseTime(json['quietHoursStart']) ?? const TimeOfDay(hour: 22, minute: 0),
      quietHoursEnd: _parseTime(json['quietHoursEnd']) ?? const TimeOfDay(hour: 7, minute: 0),
      digestEnabled: json['digestEnabled'] as bool? ?? true,
      digestTime: _parseTime(json['digestTime']) ?? const TimeOfDay(hour: 8, minute: 0),
    );
  }

  static String _formatTime(TimeOfDay time) {
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  static TimeOfDay? _parseTime(dynamic raw) {
    if (raw is! String) {
      return null;
    }
    final parts = raw.split(':');
    if (parts.length != 2) {
      return null;
    }
    final hour = int.tryParse(parts[0]);
    final minute = int.tryParse(parts[1]);
    if (hour == null || minute == null) {
      return null;
    }
    final safeHour = hour < 0
        ? 0
        : hour > 23
            ? 23
            : hour;
    final safeMinute = minute < 0
        ? 0
        : minute > 59
            ? 59
            : minute;
    return TimeOfDay(hour: safeHour, minute: safeMinute);
  }
}
