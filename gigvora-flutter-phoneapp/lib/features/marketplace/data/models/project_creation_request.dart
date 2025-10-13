import 'dart:math' as math;

const Map<String, double> kDefaultProjectWeights = <String, double>{
  'recency': 0.25,
  'rating': 0.20,
  'completionQuality': 0.20,
  'earningsBalance': 0.15,
  'inclusion': 0.20,
};

class ProjectCreationRequest {
  ProjectCreationRequest({
    required this.title,
    required this.description,
    this.status = 'planning',
    this.location,
    this.budgetAmount,
    this.budgetCurrency,
    this.autoAssignEnabled = true,
    this.limit,
    this.expiresInMinutes,
    this.fairnessMaxAssignments,
    Map<String, double>? weights,
    this.actorId = 1,
  }) : weights = Map<String, double>.from(weights ?? kDefaultProjectWeights);

  final String title;
  final String description;
  final String status;
  final String? location;
  final double? budgetAmount;
  final String? budgetCurrency;
  final bool autoAssignEnabled;
  final int? limit;
  final int? expiresInMinutes;
  final int? fairnessMaxAssignments;
  final Map<String, double> weights;
  final int actorId;

  Map<String, double> get normalizedWeights {
    if (weights.isEmpty) {
      return Map<String, double>.from(kDefaultProjectWeights);
    }

    final sanitized = <String, double>{};
    for (final entry in weights.entries) {
      final value = entry.value.isFinite ? entry.value : 0;
      sanitized[entry.key] = value.clamp(0, 1);
    }

    final total = sanitized.values.fold<double>(0, (sum, value) => sum + value);
    if (total <= 0) {
      return Map<String, double>.from(kDefaultProjectWeights);
    }

    return sanitized.map((key, value) {
      final normalized = value / total;
      return MapEntry(key, (normalized * 10000).round() / 10000);
    });
  }

  Map<String, dynamic> toJson() {
    final payload = <String, dynamic>{
      'title': title.trim(),
      'description': description.trim(),
      'status': status.trim().isEmpty ? 'planning' : status.trim(),
      'actorId': actorId,
    };

    final normalizedLocation = location?.trim();
    if (normalizedLocation != null && normalizedLocation.isNotEmpty) {
      payload['location'] = normalizedLocation;
    }

    if (budgetAmount != null && budgetAmount!.isFinite) {
      payload['budgetAmount'] = budgetAmount;
    }

    final currency = budgetCurrency?.trim();
    if (currency != null && currency.isNotEmpty) {
      payload['budgetCurrency'] = currency.toUpperCase();
    }

    payload['autoAssign'] = _buildAutoAssignPayload();

    return payload;
  }

  Map<String, dynamic> _buildAutoAssignPayload() {
    if (!autoAssignEnabled) {
      return const {'enabled': false};
    }

    return <String, dynamic>{
      'enabled': true,
      if (limit != null && limit! > 0) 'limit': limit,
      if (expiresInMinutes != null && expiresInMinutes! > 0) 'expiresInMinutes': expiresInMinutes,
      'fairness': <String, dynamic>{
        'ensureNewcomer': true,
        'maxAssignments': math.max(fairnessMaxAssignments ?? 0, 0),
      },
      'weights': normalizedWeights,
    };
  }
}
