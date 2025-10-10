import 'package:intl/intl.dart';

String formatRelativeTime(DateTime dateTime, {DateTime? reference}) {
  final now = reference ?? DateTime.now();
  final difference = now.difference(dateTime);

  if (difference.inSeconds.abs() < 45) {
    return 'just now';
  }

  if (difference.inMinutes < 1) {
    return '${difference.inSeconds}s ago';
  }
  if (difference.inMinutes < 60) {
    return '${difference.inMinutes}m ago';
  }
  if (difference.inHours < 24) {
    return '${difference.inHours}h ago';
  }
  if (difference.inDays < 7) {
    return '${difference.inDays}d ago';
  }
  if (difference.inDays < 30) {
    final weeks = (difference.inDays / 7).floor();
    return weeks <= 1 ? '1w ago' : '${weeks}w ago';
  }
  if (difference.inDays < 365) {
    final months = (difference.inDays / 30).floor();
    return months <= 1 ? '1mo ago' : '${months}mo ago';
  }
  final years = (difference.inDays / 365).floor();
  return years <= 1 ? '1y ago' : '${years}y ago';
}

String formatAbsolute(DateTime dateTime) {
  final formatter = DateFormat('d MMM yyyy • HH:mm');
  return formatter.format(dateTime.toLocal());
}
