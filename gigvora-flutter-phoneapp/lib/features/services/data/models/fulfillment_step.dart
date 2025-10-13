enum FulfillmentStepStatus { completed, active, pending, blocked }

class FulfillmentStep {
  const FulfillmentStep({
    required this.id,
    required this.label,
    required this.description,
    required this.status,
    this.completedAt,
    this.dueAt,
  });

  final String id;
  final String label;
  final String description;
  final FulfillmentStepStatus status;
  final DateTime? completedAt;
  final DateTime? dueAt;

  factory FulfillmentStep.fromJson(Map<String, dynamic> json) {
    FulfillmentStepStatus parseStatus(String? value) {
      final normalised = (value ?? '').replaceAll(RegExp(r'[^a-zA-Z]'), '').toLowerCase();
      return FulfillmentStepStatus.values.firstWhere(
        (status) => status.name.replaceAll(RegExp(r'[^a-zA-Z]'), '').toLowerCase() == normalised,
        orElse: () => FulfillmentStepStatus.pending,
      );
    }

    return FulfillmentStep(
      id: json['id'] as String? ?? 'step',
      label: json['label'] as String? ?? 'Step',
      description: json['description'] as String? ?? '',
      status: parseStatus(json['status'] as String?),
      completedAt: DateTime.tryParse(json['completedAt'] as String? ?? ''),
      dueAt: DateTime.tryParse(json['dueAt'] as String? ?? ''),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'label': label,
      'description': description,
      'status': status.name,
      'completedAt': completedAt?.toIso8601String(),
      'dueAt': dueAt?.toIso8601String(),
    };
  }
}

class FulfillmentPipeline {
  const FulfillmentPipeline({
    required this.orderId,
    required this.orderTitle,
    required this.zoneName,
    required this.steps,
  });

  final String orderId;
  final String orderTitle;
  final String zoneName;
  final List<FulfillmentStep> steps;

  factory FulfillmentPipeline.fromJson(Map<String, dynamic> json) {
    final steps = (json['steps'] as List?)?.map((step) {
          if (step is Map<String, dynamic>) {
            return FulfillmentStep.fromJson(step);
          }
          return null;
        }).whereType<FulfillmentStep>().toList(growable: false) ??
        const <FulfillmentStep>[];

    return FulfillmentPipeline(
      orderId: json['orderId'] as String? ?? 'order',
      orderTitle: json['orderTitle'] as String? ?? 'Service order',
      zoneName: json['zoneName'] as String? ?? 'Zone',
      steps: steps,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'orderId': orderId,
      'orderTitle': orderTitle,
      'zoneName': zoneName,
      'steps': steps.map((step) => step.toJson()).toList(growable: false),
    };
  }
}
