import 'package:intl/intl.dart';

String formatRelativeTime(DateTime dateTime, {DateTime? reference}) {
  final now = reference ?? DateTime.now();
  final delta = now.difference(dateTime);
  final isFuture = delta.isNegative;
  final span = isFuture ? dateTime.difference(now) : delta;

  if (span.inSeconds < 45) {
    return isFuture ? 'in a moment' : 'just now';
  }

  String buildLabel(int value, String unit) {
    final safeValue = value <= 0 ? 1 : value;
    return safeValue == 1 ? '1$unit' : '$safeValue$unit';
  }

  String label;
  if (span.inMinutes < 1) {
    label = buildLabel(span.inSeconds, 's');
  } else if (span.inHours < 1) {
    label = buildLabel(span.inMinutes, 'm');
  } else if (span.inDays < 1) {
    label = buildLabel(span.inHours, 'h');
  } else if (span.inDays < 7) {
    label = buildLabel(span.inDays, 'd');
  } else if (span.inDays < 30) {
    final weeks = (span.inDays / 7).floor();
    label = buildLabel(weeks, 'w');
  } else if (span.inDays < 365) {
    final months = (span.inDays / 30).floor();
    label = buildLabel(months, 'mo');
  } else {
    final years = (span.inDays / 365).floor();
    label = buildLabel(years, 'y');
  }

  return isFuture ? 'in $label' : '$label ago';
}

String formatAbsolute(DateTime dateTime) {
  final formatter = DateFormat('d MMM yyyy • HH:mm');
  return formatter.format(dateTime.toLocal());
}
