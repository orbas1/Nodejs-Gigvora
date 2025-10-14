import 'ad_coupon.dart';

class AdCreative {
  const AdCreative({
    required this.id,
    required this.name,
    required this.headline,
    required this.subheadline,
    required this.callToAction,
    required this.ctaUrl,
  });

  final int id;
  final String name;
  final String headline;
  final String subheadline;
  final String callToAction;
  final String ctaUrl;

  factory AdCreative.fromJson(Map<String, dynamic> json) {
    return AdCreative(
      id: json['id'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      headline: json['headline'] as String? ?? '',
      subheadline: json['subheadline'] as String? ?? '',
      callToAction: json['callToAction'] as String? ?? '',
      ctaUrl: json['ctaUrl'] as String? ?? '',
    );
  }
}

class AdPlacement {
  const AdPlacement({
    required this.id,
    required this.surface,
    required this.position,
    required this.status,
    required this.isActive,
    required this.isUpcoming,
    required this.coupons,
    required this.creative,
    required this.startAt,
    required this.endAt,
  });

  final int id;
  final String surface;
  final String position;
  final String status;
  final bool isActive;
  final bool isUpcoming;
  final List<AdCoupon> coupons;
  final AdCreative? creative;
  final DateTime? startAt;
  final DateTime? endAt;

  factory AdPlacement.fromJson(Map<String, dynamic> json) {
    return AdPlacement(
      id: json['id'] as int? ?? 0,
      surface: json['surface'] as String? ?? 'global_dashboard',
      position: json['position'] as String? ?? 'inline',
      status: json['status'] as String? ?? 'scheduled',
      isActive: json['isActive'] as bool? ?? false,
      isUpcoming: json['isUpcoming'] as bool? ?? false,
      coupons: (json['coupons'] as List?)
              ?.map((coupon) => AdCoupon.fromJson(Map<String, dynamic>.from(coupon as Map)))
              .toList() ??
          const <AdCoupon>[],
      creative: json['creative'] is Map<String, dynamic>
          ? AdCreative.fromJson(Map<String, dynamic>.from(json['creative'] as Map))
          : null,
      startAt: json['startAt'] != null ? DateTime.tryParse('${json['startAt']}') : null,
      endAt: json['endAt'] != null ? DateTime.tryParse('${json['endAt']}') : null,
    );
  }
}
