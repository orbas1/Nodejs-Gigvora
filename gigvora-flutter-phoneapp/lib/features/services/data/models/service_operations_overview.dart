import 'dispute_case.dart';
import 'fulfillment_step.dart';
import 'service_order.dart';
import 'service_zone.dart';

class ServiceOperationsMetrics {
  const ServiceOperationsMetrics({
    required this.activeZones,
    required this.connectedProviders,
    required this.ordersInProgress,
    required this.ordersAtRisk,
    required this.disputesOpen,
    required this.slaBreachesLastWeek,
  });

  final int activeZones;
  final int connectedProviders;
  final int ordersInProgress;
  final int ordersAtRisk;
  final int disputesOpen;
  final int slaBreachesLastWeek;

  factory ServiceOperationsMetrics.fromJson(Map<String, dynamic> json) {
    return ServiceOperationsMetrics(
      activeZones: json['activeZones'] as int? ?? 0,
      connectedProviders: json['connectedProviders'] as int? ?? 0,
      ordersInProgress: json['ordersInProgress'] as int? ?? 0,
      ordersAtRisk: json['ordersAtRisk'] as int? ?? 0,
      disputesOpen: json['disputesOpen'] as int? ?? 0,
      slaBreachesLastWeek: json['slaBreachesLastWeek'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'activeZones': activeZones,
      'connectedProviders': connectedProviders,
      'ordersInProgress': ordersInProgress,
      'ordersAtRisk': ordersAtRisk,
      'disputesOpen': disputesOpen,
      'slaBreachesLastWeek': slaBreachesLastWeek,
    };
  }
}

class ServiceOperationsOverview {
  const ServiceOperationsOverview({
    required this.metrics,
    required this.zones,
    required this.orders,
    required this.pipelines,
    required this.disputes,
  });

  final ServiceOperationsMetrics metrics;
  final List<ServiceZone> zones;
  final List<ServiceOrderSummary> orders;
  final List<FulfillmentPipeline> pipelines;
  final List<DisputeCase> disputes;

  factory ServiceOperationsOverview.fromJson(Map<String, dynamic> json) {
    final zones = (json['zones'] as List?)
            ?.map((zone) => zone is Map<String, dynamic> ? ServiceZone.fromJson(zone) : null)
            .whereType<ServiceZone>()
            .toList(growable: false) ??
        const <ServiceZone>[];
    final orders = (json['orders'] as List?)
            ?.map((order) => order is Map<String, dynamic> ? ServiceOrderSummary.fromJson(order) : null)
            .whereType<ServiceOrderSummary>()
            .toList(growable: false) ??
        const <ServiceOrderSummary>[];
    final pipelines = (json['pipelines'] as List?)
            ?.map((pipeline) => pipeline is Map<String, dynamic> ? FulfillmentPipeline.fromJson(pipeline) : null)
            .whereType<FulfillmentPipeline>()
            .toList(growable: false) ??
        const <FulfillmentPipeline>[];
    final disputes = (json['disputes'] as List?)
            ?.map((dispute) => dispute is Map<String, dynamic> ? DisputeCase.fromJson(dispute) : null)
            .whereType<DisputeCase>()
            .toList(growable: false) ??
        const <DisputeCase>[];

    return ServiceOperationsOverview(
      metrics: ServiceOperationsMetrics.fromJson(
        json['metrics'] as Map<String, dynamic>? ?? const <String, dynamic>{},
      ),
      zones: zones,
      orders: orders,
      pipelines: pipelines,
      disputes: disputes,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'metrics': metrics.toJson(),
      'zones': zones.map((zone) => zone.toJson()).toList(growable: false),
      'orders': orders.map((order) => order.toJson()).toList(growable: false),
      'pipelines': pipelines.map((pipeline) => pipeline.toJson()).toList(growable: false),
      'disputes': disputes.map((dispute) => dispute.toJson()).toList(growable: false),
    };
  }

  bool get isEmpty =>
      zones.isEmpty && orders.isEmpty && pipelines.isEmpty && disputes.isEmpty && metrics.activeZones == 0;

  ServiceOperationsOverview copyWith({
    ServiceOperationsMetrics? metrics,
    List<ServiceZone>? zones,
    List<ServiceOrderSummary>? orders,
    List<FulfillmentPipeline>? pipelines,
    List<DisputeCase>? disputes,
  }) {
    return ServiceOperationsOverview(
      metrics: metrics ?? this.metrics,
      zones: zones ?? this.zones,
      orders: orders ?? this.orders,
      pipelines: pipelines ?? this.pipelines,
      disputes: disputes ?? this.disputes,
    );
  }

  static ServiceOperationsOverview empty() {
    return ServiceOperationsOverview(
      metrics: const ServiceOperationsMetrics(
        activeZones: 0,
        connectedProviders: 0,
        ordersInProgress: 0,
        ordersAtRisk: 0,
        disputesOpen: 0,
        slaBreachesLastWeek: 0,
      ),
      zones: const <ServiceZone>[],
      orders: const <ServiceOrderSummary>[],
      pipelines: const <FulfillmentPipeline>[],
      disputes: const <DisputeCase>[],
    );
  }
}
