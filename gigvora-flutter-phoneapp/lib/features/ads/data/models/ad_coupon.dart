class AdCoupon {
  const AdCoupon({
    required this.id,
    required this.code,
    required this.name,
    required this.description,
    required this.discountType,
    required this.discountValue,
    required this.lifecycleStatus,
    required this.isActive,
    required this.startAt,
    required this.endAt,
    required this.surfaceTargets,
    required this.termsUrl,
    required this.metadata,
  });

  final int id;
  final String code;
  final String name;
  final String description;
  final String discountType;
  final double discountValue;
  final String lifecycleStatus;
  final bool isActive;
  final DateTime? startAt;
  final DateTime? endAt;
  final List<String> surfaceTargets;
  final String? termsUrl;
  final Map<String, dynamic> metadata;

  factory AdCoupon.fromJson(Map<String, dynamic> json) {
    return AdCoupon(
      id: json['id'] as int? ?? 0,
      code: json['code'] as String? ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      discountType: json['discountType'] as String? ?? 'percentage',
      discountValue: (json['discountValue'] is num)
          ? (json['discountValue'] as num).toDouble()
          : double.tryParse('${json['discountValue']}') ?? 0,
      lifecycleStatus: json['lifecycleStatus'] as String? ?? json['status'] as String? ?? 'draft',
      isActive: json['isActive'] as bool? ?? false,
      startAt: json['startAt'] != null ? DateTime.tryParse('${json['startAt']}') : null,
      endAt: json['endAt'] != null ? DateTime.tryParse('${json['endAt']}') : null,
      surfaceTargets: (json['surfaceTargets'] as List?)
              ?.map((value) => '$value'.trim())
              .where((value) => value.isNotEmpty)
              .toList() ??
          const <String>[],
      termsUrl: json['termsUrl'] as String?,
      metadata: json['metadata'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(json['metadata'] as Map)
          : const {},
    );
  }
}
