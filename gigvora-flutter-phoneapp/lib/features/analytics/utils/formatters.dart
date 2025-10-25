import 'package:flutter/material.dart';

/// Shared formatting helpers for finance and analytics surfaces.
String formatCurrency(
  num? value, {
  String currency = 'USD',
  int fractionDigits = 2,
}) {
  if (value == null) {
    return '$currency —';
  }
  final amount = value.toDouble();
  final sign = amount < 0 ? '-' : '';
  final absValue = amount.abs();
  final parts = absValue.toStringAsFixed(fractionDigits).split('.');
  final whole = parts[0].replaceAllMapped(
    RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
    (match) => '${match[1]}',
  );
  final decimals = fractionDigits > 0 ? '.${parts[1]}' : '';
  return '$sign$currency $whole$decimals';
}

String formatPercent(num? value, {int fractionDigits = 1}) {
  if (value == null) {
    return '—';
  }
  return '${(value.toDouble() * 100).toStringAsFixed(fractionDigits)}%';
}

String formatRelativeTime(DateTime timestamp) {
  final now = DateTime.now();
  final difference = now.difference(timestamp);
  if (difference.inMinutes < 1) return 'just now';
  if (difference.inMinutes < 60) return '${difference.inMinutes}m ago';
  if (difference.inHours < 24) return '${difference.inHours}h ago';
  if (difference.inDays < 7) return '${difference.inDays}d ago';
  return '${timestamp.month.toString().padLeft(2, '0')}/${timestamp.day.toString().padLeft(2, '0')}/${timestamp.year}';
}

String formatDate(DateTime? date) {
  if (date == null) return 'Pending';
  return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
}

String formatDateTime(DateTime? date) {
  if (date == null) {
    return 'Ready now';
  }
  final local = date.toLocal();
  return '${local.year}-${local.month.toString().padLeft(2, '0')}-${local.day.toString().padLeft(2, '0')} · '
      '${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}';
}

Color analyticsTrendColor(BuildContext context, AnalyticsTrend? trend, {bool inverse = false}) {
  final colorScheme = Theme.of(context).colorScheme;
  switch (trend) {
    case AnalyticsTrend.up:
      return inverse ? const Color(0xFFBBF7D0) : colorScheme.primary;
    case AnalyticsTrend.down:
      return inverse ? const Color(0xFFFECACA) : colorScheme.error;
    case AnalyticsTrend.neutral:
    case null:
      return inverse ? Colors.white70 : colorScheme.onSurfaceVariant;
  }
}

enum AnalyticsTrend { up, down, neutral }
