import 'package:equatable/equatable.dart';
import 'package:intl/intl.dart';

enum CalendarRecurrenceFrequency { daily, weekly, monthly }

extension CalendarRecurrenceFrequencyLabel on CalendarRecurrenceFrequency {
  String get label {
    switch (this) {
      case CalendarRecurrenceFrequency.daily:
        return 'Daily';
      case CalendarRecurrenceFrequency.weekly:
        return 'Weekly';
      case CalendarRecurrenceFrequency.monthly:
        return 'Monthly';
    }
  }

  String get icsValue {
    switch (this) {
      case CalendarRecurrenceFrequency.daily:
        return 'DAILY';
      case CalendarRecurrenceFrequency.weekly:
        return 'WEEKLY';
      case CalendarRecurrenceFrequency.monthly:
        return 'MONTHLY';
    }
  }
}

class CalendarRecurrence extends Equatable {
  const CalendarRecurrence({
    required this.frequency,
    this.interval = 1,
    this.until,
  }) : assert(interval > 0, 'interval must be greater than zero');

  factory CalendarRecurrence.fromJson(Map<String, dynamic> json) {
    final value = json['frequency'] as String?;
    final frequency = CalendarRecurrenceFrequency.values.firstWhere(
      (entry) => entry.name == value,
      orElse: () => CalendarRecurrenceFrequency.weekly,
    );
    return CalendarRecurrence(
      frequency: frequency,
      interval: (json['interval'] as num?)?.toInt() ?? 1,
      until: json['until'] != null ? DateTime.tryParse('${json['until']}') : null,
    );
  }

  final CalendarRecurrenceFrequency frequency;
  final int interval;
  final DateTime? until;

  Map<String, dynamic> toJson() {
    return {
      'frequency': frequency.name,
      'interval': interval,
      'until': until?.toIso8601String(),
    };
  }

  String toRrule() {
    final buffer = StringBuffer('FREQ=${frequency.icsValue};INTERVAL=$interval');
    if (until != null) {
      buffer.write(';UNTIL=${DateFormat('yyyyMMdd\'T\'HHmmss\'Z\'').format(until!.toUtc())}');
    }
    return buffer.toString();
  }

  String describe(DateFormat dateFormat) {
    final cadence = '${frequency.label} cadence';
    if (until == null) {
      return interval == 1 ? cadence : '$cadence every $interval cycles';
    }
    final untilLabel = dateFormat.format(until!);
    if (interval == 1) {
      return '$cadence until $untilLabel';
    }
    return '$cadence every $interval cycles until $untilLabel';
  }

  @override
  List<Object?> get props => [frequency, interval, until];
}
