enum DisputeStage { intake, investigation, mediation, awaitingEvidence, resolution }

enum DisputePriority { low, medium, high, urgent }

enum DisputeStatus { open, actionRequired, awaitingCustomer, resolved }

class DisputeCase {
  const DisputeCase({
    required this.id,
    required this.orderId,
    required this.reason,
    required this.stage,
    required this.priority,
    required this.status,
    required this.openedAt,
    required this.updatedAt,
    this.amount,
    this.currencyCode,
    this.customer,
    this.notes,
  });

  final String id;
  final String orderId;
  final String reason;
  final DisputeStage stage;
  final DisputePriority priority;
  final DisputeStatus status;
  final DateTime openedAt;
  final DateTime updatedAt;
  final double? amount;
  final String? currencyCode;
  final String? customer;
  final String? notes;

  factory DisputeCase.fromJson(Map<String, dynamic> json) {
    String normalise(String? value) => (value ?? '').replaceAll(RegExp(r'[^a-zA-Z]'), '').toLowerCase();

    DisputeStage parseStage(String? value) {
      final target = normalise(value);
      return DisputeStage.values.firstWhere(
        (stage) => normalise(stage.name) == target,
        orElse: () => DisputeStage.investigation,
      );
    }

    DisputePriority parsePriority(String? value) {
      final target = normalise(value);
      return DisputePriority.values.firstWhere(
        (priority) => normalise(priority.name) == target,
        orElse: () => DisputePriority.medium,
      );
    }

    DisputeStatus parseStatus(String? value) {
      final target = normalise(value);
      return DisputeStatus.values.firstWhere(
        (status) => normalise(status.name) == target,
        orElse: () => DisputeStatus.open,
      );
    }

    return DisputeCase(
      id: json['id'] as String? ?? 'dispute',
      orderId: json['orderId'] as String? ?? 'order',
      reason: json['reason'] as String? ?? 'Dispute',
      stage: parseStage(json['stage'] as String?),
      priority: parsePriority(json['priority'] as String?),
      status: parseStatus(json['status'] as String?),
      openedAt: DateTime.tryParse(json['openedAt'] as String? ?? '') ?? DateTime.now(),
      updatedAt: DateTime.tryParse(json['updatedAt'] as String? ?? '') ?? DateTime.now(),
      amount: (json['amount'] as num?)?.toDouble(),
      currencyCode: json['currencyCode'] as String?,
      customer: json['customer'] as String?,
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'orderId': orderId,
      'reason': reason,
      'stage': stage.name,
      'priority': priority.name,
      'status': status.name,
      'openedAt': openedAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'amount': amount,
      'currencyCode': currencyCode,
      'customer': customer,
      'notes': notes,
    };
  }
}
