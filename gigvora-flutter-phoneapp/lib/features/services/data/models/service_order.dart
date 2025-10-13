enum ServiceOrderStatus { pendingIntake, inProgress, atRisk, completed }

enum ServiceOrderStage {
  intake,
  awaitingRequirements,
  scheduling,
  dispatch,
  inDelivery,
  qaReview,
  completed,
}

class ServiceOrderSummary {
  const ServiceOrderSummary({
    required this.id,
    required this.serviceName,
    required this.customer,
    required this.zoneId,
    required this.zoneName,
    required this.status,
    required this.stage,
    required this.progress,
    this.eta,
    this.updatedAt,
    this.orderValue,
    this.currencyCode,
    this.requirementsOutstanding,
  });

  final String id;
  final String serviceName;
  final String customer;
  final String zoneId;
  final String zoneName;
  final ServiceOrderStatus status;
  final ServiceOrderStage stage;
  final double progress;
  final DateTime? eta;
  final DateTime? updatedAt;
  final double? orderValue;
  final String? currencyCode;
  final int? requirementsOutstanding;

  factory ServiceOrderSummary.fromJson(Map<String, dynamic> json) {
    String _normalise(String? value) => (value ?? '').replaceAll(RegExp(r'[^a-zA-Z]'), '').toLowerCase();

    ServiceOrderStatus parseStatus(String? value) {
      final target = _normalise(value);
      return ServiceOrderStatus.values.firstWhere(
        (status) => _normalise(status.name) == target,
        orElse: () => ServiceOrderStatus.inProgress,
      );
    }

    ServiceOrderStage parseStage(String? value) {
      final target = _normalise(value);
      return ServiceOrderStage.values.firstWhere(
        (stage) => _normalise(stage.name) == target,
        orElse: () => ServiceOrderStage.inDelivery,
      );
    }

    return ServiceOrderSummary(
      id: json['id'] as String? ?? 'unknown',
      serviceName: json['serviceName'] as String? ?? 'Service',
      customer: json['customer'] as String? ?? 'Customer',
      zoneId: json['zoneId'] as String? ?? 'zone',
      zoneName: json['zoneName'] as String? ?? 'Zone',
      status: parseStatus(json['status'] as String?),
      stage: parseStage(json['stage'] as String?),
      progress: (json['progress'] as num?)?.toDouble() ?? 0,
      eta: DateTime.tryParse(json['eta'] as String? ?? ''),
      updatedAt: DateTime.tryParse(json['updatedAt'] as String? ?? ''),
      orderValue: (json['orderValue'] as num?)?.toDouble(),
      currencyCode: json['currencyCode'] as String?,
      requirementsOutstanding: json['requirementsOutstanding'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'serviceName': serviceName,
      'customer': customer,
      'zoneId': zoneId,
      'zoneName': zoneName,
      'status': status.name,
      'stage': stage.name,
      'progress': progress,
      'eta': eta?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'orderValue': orderValue,
      'currencyCode': currencyCode,
      'requirementsOutstanding': requirementsOutstanding,
    };
  }
}

typedef ServiceOrderList = List<ServiceOrderSummary>;
