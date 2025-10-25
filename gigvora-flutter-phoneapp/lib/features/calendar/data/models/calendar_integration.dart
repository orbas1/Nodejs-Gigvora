import 'package:equatable/equatable.dart';

class CalendarIntegration extends Equatable {
  const CalendarIntegration({
    required this.id,
    required this.provider,
    this.externalAccount,
    this.status = 'connected',
    this.lastSyncedAt,
    this.syncError,
    this.metadata = const <String, dynamic>{},
  });

  factory CalendarIntegration.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(dynamic value) {
      if (value == null) {
        return null;
      }
      final parsed = DateTime.tryParse('$value');
      return parsed?.toLocal();
    }

    int parseInt(dynamic value) {
      if (value == null || value == '') {
        return 0;
      }
      if (value is int) {
        return value;
      }
      return int.tryParse('$value') ?? 0;
    }

    return CalendarIntegration(
      id: parseInt(json['id']),
      provider: (json['provider'] as String?)?.trim() ?? 'manual',
      externalAccount: (json['externalAccount'] as String?)?.trim(),
      status: (json['status'] as String?)?.trim() ?? 'connected',
      lastSyncedAt: parseDate(json['lastSyncedAt']),
      syncError: (json['syncError'] as String?)?.trim(),
      metadata: json['metadata'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(json['metadata'] as Map<String, dynamic>)
          : const <String, dynamic>{},
    );
  }

  final int id;
  final String provider;
  final String? externalAccount;
  final String status;
  final DateTime? lastSyncedAt;
  final String? syncError;
  final Map<String, dynamic> metadata;

  @override
  List<Object?> get props => [
        id,
        provider,
        externalAccount,
        status,
        lastSyncedAt,
        syncError,
        metadata,
      ];
}
