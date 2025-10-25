import 'package:equatable/equatable.dart';

class CalendarSettings extends Equatable {
  const CalendarSettings({
    required this.timezone,
    required this.weekStart,
    required this.workStartMinutes,
    required this.workEndMinutes,
    required this.defaultView,
    required this.defaultReminderMinutes,
    required this.autoFocusBlocks,
    required this.shareAvailability,
    this.colorHex,
    this.metadata = const <String, dynamic>{},
  });

  factory CalendarSettings.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const CalendarSettings(
        timezone: 'UTC',
        weekStart: 1,
        workStartMinutes: 480,
        workEndMinutes: 1020,
        defaultView: 'agenda',
        defaultReminderMinutes: 30,
        autoFocusBlocks: false,
        shareAvailability: false,
      );
    }

    int parseInt(dynamic value, int fallback) {
      if (value == null || value == '') {
        return fallback;
      }
      if (value is int) {
        return value;
      }
      return int.tryParse('$value') ?? fallback;
    }

    return CalendarSettings(
      timezone: (json['timezone'] as String?)?.trim().isNotEmpty == true
          ? (json['timezone'] as String).trim()
          : 'UTC',
      weekStart: parseInt(json['weekStart'], 1),
      workStartMinutes: parseInt(json['workStartMinutes'], 480),
      workEndMinutes: parseInt(json['workEndMinutes'], 1020),
      defaultView: (json['defaultView'] as String?)?.trim() ?? 'agenda',
      defaultReminderMinutes: parseInt(json['defaultReminderMinutes'], 30),
      autoFocusBlocks: json['autoFocusBlocks'] as bool? ?? false,
      shareAvailability: json['shareAvailability'] as bool? ?? false,
      colorHex: (json['colorHex'] as String?)?.trim(),
      metadata: json['metadata'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(json['metadata'] as Map<String, dynamic>)
          : const <String, dynamic>{},
    );
  }

  final String timezone;
  final int weekStart;
  final int workStartMinutes;
  final int workEndMinutes;
  final String defaultView;
  final int defaultReminderMinutes;
  final bool autoFocusBlocks;
  final bool shareAvailability;
  final String? colorHex;
  final Map<String, dynamic> metadata;

  CalendarSettings copyWith({
    String? timezone,
    int? weekStart,
    int? workStartMinutes,
    int? workEndMinutes,
    String? defaultView,
    int? defaultReminderMinutes,
    bool? autoFocusBlocks,
    bool? shareAvailability,
    String? colorHex,
    Map<String, dynamic>? metadata,
  }) {
    return CalendarSettings(
      timezone: timezone ?? this.timezone,
      weekStart: weekStart ?? this.weekStart,
      workStartMinutes: workStartMinutes ?? this.workStartMinutes,
      workEndMinutes: workEndMinutes ?? this.workEndMinutes,
      defaultView: defaultView ?? this.defaultView,
      defaultReminderMinutes: defaultReminderMinutes ?? this.defaultReminderMinutes,
      autoFocusBlocks: autoFocusBlocks ?? this.autoFocusBlocks,
      shareAvailability: shareAvailability ?? this.shareAvailability,
      colorHex: colorHex ?? this.colorHex,
      metadata: metadata ?? this.metadata,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'timezone': timezone,
      'weekStart': weekStart,
      'workStartMinutes': workStartMinutes,
      'workEndMinutes': workEndMinutes,
      'defaultView': defaultView,
      'defaultReminderMinutes': defaultReminderMinutes,
      'autoFocusBlocks': autoFocusBlocks,
      'shareAvailability': shareAvailability,
      'colorHex': colorHex,
      'metadata': metadata,
    };
  }

  @override
  List<Object?> get props => [
        timezone,
        weekStart,
        workStartMinutes,
        workEndMinutes,
        defaultView,
        defaultReminderMinutes,
        autoFocusBlocks,
        shareAvailability,
        colorHex,
        metadata,
      ];
}
