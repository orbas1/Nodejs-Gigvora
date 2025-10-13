import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../theme/widgets.dart';
import '../application/service_operations_controller.dart';
import '../data/models/dispute_case.dart';
import '../data/models/fulfillment_step.dart';
import '../data/models/service_operations_overview.dart';
import '../data/models/service_order.dart';
import '../data/models/service_zone.dart';

class ServiceOperationsScreen extends ConsumerWidget {
  const ServiceOperationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(serviceOperationsControllerProvider);
    final controller = ref.read(serviceOperationsControllerProvider.notifier);
    final overview = state.data ?? ServiceOperationsOverview.empty();

    return GigvoraScaffold(
      title: 'Service operations',
      subtitle: 'Zonal coverage, order fulfillment, and dispute handling',
      actions: [
        IconButton(
          onPressed: () => controller.refresh(),
          icon: const Icon(Icons.refresh),
          tooltip: 'Refresh overview',
        ),
      ],
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (state.fromCache && !state.loading)
            const _StatusBanner(
              icon: Icons.offline_bolt,
              background: Color(0xFFFEF3C7),
              foreground: Color(0xFF92400E),
              message: 'Showing cached operations data while the network reconnects.',
            ),
          if (state.hasError && !state.loading)
            const _StatusBanner(
              icon: Icons.error_outline,
              background: Color(0xFFFEE2E2),
              foreground: Color(0xFFB91C1C),
              message: 'We could not sync the latest operations metrics. Pull to refresh to try again.',
            ),
          if (state.lastUpdated != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Text(
                'Last updated ${formatRelativeTime(state.lastUpdated!)}',
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
            ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: controller.refresh,
              child: state.loading && overview.isEmpty
                  ? const _OperationsSkeleton()
                  : ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        if (!overview.isEmpty) ...[
                          _MetricsOverview(metrics: overview.metrics),
                          const SizedBox(height: 24),
                          _ZoneSection(
                            zones: overview.zones,
                            onConnect: (zone) async {
                              await controller.recordZoneConnect(zone);
                              _showSnack(context, 'Connection intent recorded for ${zone.name}.');
                            },
                          ),
                          const SizedBox(height: 24),
                          _OrderSection(
                            orders: overview.orders,
                            onTrackOrder: (order) async {
                              await controller.recordOrderAction(order, action: 'track');
                              _showSnack(context, 'Tracking logged for order ${order.id}.');
                            },
                            onEscalate: (order) async {
                              await controller.recordOrderAction(order, action: 'escalate');
                              _showSnack(context, 'Escalation noted for ${order.serviceName}.');
                            },
                          ),
                          const SizedBox(height: 24),
                          _FulfillmentSection(
                            pipelines: overview.pipelines,
                            onStepFollowUp: (pipeline, step) async {
                              await controller.recordPipelineFollowUp(pipeline, step, action: 'follow_up_${step.id}');
                              _showSnack(context, 'Follow-up logged for ${pipeline.orderTitle}.');
                            },
                          ),
                          const SizedBox(height: 24),
                          _DisputeSection(
                            disputes: overview.disputes,
                            onReview: (dispute) async {
                              await controller.recordDisputeAction(dispute, action: 'review');
                              _showSnack(context, 'Review opened for dispute ${dispute.id}.');
                            },
                            onAddEvidence: (dispute) async {
                              await controller.recordDisputeAction(dispute, action: 'add_evidence');
                              _showSnack(context, 'Evidence reminder sent for ${dispute.id}.');
                            },
                          ),
                        ] else ...[
                          const _EmptyOperationsState(),
                        ],
                        const SizedBox(height: 32),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({
    required this.icon,
    required this.background,
    required this.foreground,
    required this.message,
  });

  final IconData icon;
  final Color background;
  final Color foreground;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Icon(icon, color: foreground),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: foreground, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricsOverview extends StatelessWidget {
  const _MetricsOverview({required this.metrics});

  final ServiceOperationsMetrics metrics;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final tiles = [
      _MetricTile(
        label: 'Active zones',
        value: metrics.activeZones.toString(),
        caption: 'Locations with on-demand coverage',
        icon: Icons.map_outlined,
        color: colorScheme.primary,
      ),
      _MetricTile(
        label: 'Connected providers',
        value: metrics.connectedProviders.toString(),
        caption: 'Live partner integrations',
        icon: Icons.hub_outlined,
        color: colorScheme.tertiary,
      ),
      _MetricTile(
        label: 'Orders in flight',
        value: metrics.ordersInProgress.toString(),
        caption: 'Actively serviced engagements',
        icon: Icons.sync_alt,
        color: colorScheme.secondary,
      ),
      _MetricTile(
        label: 'Orders at risk',
        value: metrics.ordersAtRisk.toString(),
        caption: 'Needing intervention this week',
        icon: Icons.warning_amber_outlined,
        color: const Color(0xFFF97316),
      ),
      _MetricTile(
        label: 'Open disputes',
        value: metrics.disputesOpen.toString(),
        caption: 'Escalations in the queue',
        icon: Icons.gavel_outlined,
        color: const Color(0xFFDC2626),
      ),
      _MetricTile(
        label: 'SLA breaches (7d)',
        value: metrics.slaBreachesLastWeek.toString(),
        caption: 'Follow-ups triggered last week',
        icon: Icons.speed_outlined,
        color: const Color(0xFF0EA5E9),
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Operations snapshot',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: tiles,
        ),
      ],
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.label,
    required this.value,
    required this.caption,
    required this.icon,
    required this.color,
  });

  final String label;
  final String value;
  final String caption;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 160,
      child: GigvoraCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color),
            const SizedBox(height: 12),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: color,
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 6),
            Text(
              caption,
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}

class _ZoneSection extends StatelessWidget {
  const _ZoneSection({required this.zones, required this.onConnect});

  final List<ServiceZone> zones;
  final ValueChanged<ServiceZone> onConnect;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Location zonal service coverage',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        Column(
          children: zones
              .map(
                (zone) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: GigvoraCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    zone.name,
                                    style: Theme.of(context).textTheme.titleMedium,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    zone.region,
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                '${(zone.coveragePercentage * 100).toStringAsFixed(0)}% coverage',
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: LinearProgressIndicator(
                            value: zone.coveragePercentage.clamp(0, 1),
                            backgroundColor:
                                Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.4),
                            color: Theme.of(context).colorScheme.primary,
                            minHeight: 6,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: zone.availableServices
                              .map(
                                (service) => Chip(
                                  label: Text(service),
                                  backgroundColor: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.4),
                                ),
                              )
                              .toList(),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Connected providers',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 4),
                        Wrap(
                          spacing: 8,
                          runSpacing: 4,
                          children: zone.connectedProviders
                              .map((provider) => Chip(label: Text(provider)))
                              .toList(),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Last synced ${formatRelativeTime(zone.lastSynced)} · SLA ${zone.slaCommitment ?? 'Not set'}',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                        if (zone.escalationContact != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Escalation: ${zone.escalationContact}',
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                          ),
                        ],
                        const SizedBox(height: 12),
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton.icon(
                            onPressed: () => onConnect(zone),
                            icon: const Icon(Icons.link),
                            label: const Text('Connect providers'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              )
              .toList(),
        ),
      ],
    );
  }
}

class _OrderSection extends StatelessWidget {
  const _OrderSection({
    required this.orders,
    required this.onTrackOrder,
    required this.onEscalate,
  });

  final List<ServiceOrderSummary> orders;
  final ValueChanged<ServiceOrderSummary> onTrackOrder;
  final ValueChanged<ServiceOrderSummary> onEscalate;

  Color _statusColor(BuildContext context, ServiceOrderStatus status) {
    switch (status) {
      case ServiceOrderStatus.pendingIntake:
        return Theme.of(context).colorScheme.surfaceVariant;
      case ServiceOrderStatus.inProgress:
        return Theme.of(context).colorScheme.primary;
      case ServiceOrderStatus.atRisk:
        return const Color(0xFFF59E0B);
      case ServiceOrderStatus.completed:
        return const Color(0xFF16A34A);
    }
  }

  String _statusLabel(ServiceOrderStatus status) {
    switch (status) {
      case ServiceOrderStatus.pendingIntake:
        return 'Pending intake';
      case ServiceOrderStatus.inProgress:
        return 'In progress';
      case ServiceOrderStatus.atRisk:
        return 'At risk';
      case ServiceOrderStatus.completed:
        return 'Completed';
    }
  }

  String _stageLabel(ServiceOrderStage stage) {
    return stage.name.replaceAllMapped(RegExp(r'([A-Z])'), (match) => ' ${match.group(0)}').replaceAll('_', ' ').trim();
  }

  String _formatCurrency(double? value, String? currency) {
    if (value == null) {
      return '—';
    }
    final symbol = currency ?? 'USD';
    final formatted = value >= 1000 ? value.toStringAsFixed(0) : value.toStringAsFixed(2);
    final withSeparators = formatted.replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'),
      (match) => ',',
    );
    return '$symbol $withSeparators';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Service order tracking',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        Column(
          children: orders
              .map(
                (order) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: GigvoraCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    order.serviceName,
                                    style: Theme.of(context).textTheme.titleMedium,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${order.customer} • ${order.zoneName}',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: _statusColor(context, order.status).withOpacity(0.16),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                _statusLabel(order.status),
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(color: _statusColor(context, order.status), fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: LinearProgressIndicator(
                            value: order.progress.clamp(0, 1),
                            minHeight: 6,
                            backgroundColor:
                                Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.4),
                            color: _statusColor(context, order.status),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Stage: ${_stageLabel(order.stage)} • Requirements outstanding: ${order.requirementsOutstanding ?? 0}',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'ETA ${order.eta != null ? formatRelativeTime(order.eta!) : 'Pending'} • Last update ${order.updatedAt != null ? formatRelativeTime(order.updatedAt!) : 'Unavailable'}',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Order value ${_formatCurrency(order.orderValue, order.currencyCode)}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            TextButton.icon(
                              onPressed: () => onTrackOrder(order),
                              icon: const Icon(Icons.route),
                              label: const Text('Track order'),
                            ),
                            const SizedBox(width: 8),
                            TextButton.icon(
                              onPressed: () => onEscalate(order),
                              icon: const Icon(Icons.campaign_outlined),
                              label: const Text('Escalate'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              )
              .toList(),
        ),
      ],
    );
  }
}

class _FulfillmentSection extends StatelessWidget {
  const _FulfillmentSection({required this.pipelines, required this.onStepFollowUp});

  final List<FulfillmentPipeline> pipelines;
  final void Function(FulfillmentPipeline pipeline, FulfillmentStep step) onStepFollowUp;

  IconData _statusIcon(FulfillmentStepStatus status) {
    switch (status) {
      case FulfillmentStepStatus.completed:
        return Icons.check_circle;
      case FulfillmentStepStatus.active:
        return Icons.play_circle_fill;
      case FulfillmentStepStatus.pending:
        return Icons.hourglass_bottom;
      case FulfillmentStepStatus.blocked:
        return Icons.error;
    }
  }

  Color _statusColor(BuildContext context, FulfillmentStepStatus status) {
    switch (status) {
      case FulfillmentStepStatus.completed:
        return const Color(0xFF16A34A);
      case FulfillmentStepStatus.active:
        return Theme.of(context).colorScheme.primary;
      case FulfillmentStepStatus.pending:
        return Theme.of(context).colorScheme.onSurfaceVariant;
      case FulfillmentStepStatus.blocked:
        return const Color(0xFFDC2626);
    }
  }

  String _stepSubtitle(FulfillmentStep step) {
    if (step.completedAt != null) {
      return 'Completed ${formatRelativeTime(step.completedAt!)}';
    }
    if (step.dueAt != null) {
      return 'Due ${formatRelativeTime(step.dueAt!)}';
    }
    return 'Awaiting update';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Service order fulfillment steps',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        Column(
          children: pipelines
              .map(
                (pipeline) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: GigvoraCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          pipeline.orderTitle,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          pipeline.zoneName,
                          style: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                        const SizedBox(height: 16),
                        Column(
                          children: pipeline.steps
                              .map(
                                (step) => Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Icon(
                                        _statusIcon(step.status),
                                        color: _statusColor(context, step.status),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              step.label,
                                              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              step.description,
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .bodyMedium
                                                  ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              _stepSubtitle(step),
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall
                                                  ?.copyWith(color: _statusColor(context, step.status)),
                                            ),
                                          ],
                                        ),
                                      ),
                                      TextButton(
                                        onPressed: () => onStepFollowUp(pipeline, step),
                                        child: const Text('Follow up'),
                                      ),
                                    ],
                                  ),
                                ),
                              )
                              .toList(),
                        ),
                      ],
                    ),
                  ),
                ),
              )
              .toList(),
        ),
      ],
    );
  }
}

class _DisputeSection extends StatelessWidget {
  const _DisputeSection({
    required this.disputes,
    required this.onReview,
    required this.onAddEvidence,
  });

  final List<DisputeCase> disputes;
  final ValueChanged<DisputeCase> onReview;
  final ValueChanged<DisputeCase> onAddEvidence;

  Color _priorityColor(DisputePriority priority) {
    switch (priority) {
      case DisputePriority.low:
        return const Color(0xFF10B981);
      case DisputePriority.medium:
        return const Color(0xFFF59E0B);
      case DisputePriority.high:
        return const Color(0xFFDC2626);
      case DisputePriority.urgent:
        return const Color(0xFF7C3AED);
    }
  }

  String _stageLabel(DisputeStage stage) {
    return stage.name.replaceAll('_', ' ');
  }

  String _statusLabel(DisputeStatus status) {
    return status.name.replaceAll('_', ' ');
  }

  String _formatCurrency(double? value, String? currency) {
    if (value == null) {
      return '—';
    }
    final symbol = currency ?? 'USD';
    final formatted = value >= 1000 ? value.toStringAsFixed(0) : value.toStringAsFixed(2);
    final withSeparators = formatted.replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'),
      (match) => ',',
    );
    return '$symbol $withSeparators';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Dispute management',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        Column(
          children: disputes
              .map(
                (dispute) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: GigvoraCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Case ${dispute.id}',
                                    style: Theme.of(context).textTheme.titleMedium,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    dispute.reason,
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: _priorityColor(dispute.priority).withOpacity(0.14),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                dispute.priority.name.toUpperCase(),
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(color: _priorityColor(dispute.priority), fontWeight: FontWeight.w700),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Linked order ${dispute.orderId} • ${dispute.customer ?? 'Client pending'}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Stage ${_stageLabel(dispute.stage)} • Status ${_statusLabel(dispute.status)}',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Opened ${formatRelativeTime(dispute.openedAt)} • Updated ${formatRelativeTime(dispute.updatedAt)}',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Escrow at risk ${_formatCurrency(dispute.amount, dispute.currencyCode)}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        if (dispute.notes != null) ...[
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.4),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              dispute.notes!,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ),
                        ],
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            TextButton.icon(
                              onPressed: () => onReview(dispute),
                              icon: const Icon(Icons.fact_check_outlined),
                              label: const Text('Review case'),
                            ),
                            const SizedBox(width: 8),
                            TextButton.icon(
                              onPressed: () => onAddEvidence(dispute),
                              icon: const Icon(Icons.upload_file_outlined),
                              label: const Text('Request evidence'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              )
              .toList(),
        ),
      ],
    );
  }
}

class _EmptyOperationsState extends StatelessWidget {
  const _EmptyOperationsState();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: 80),
        Icon(Icons.map_outlined, size: 48, color: Theme.of(context).colorScheme.primary),
        const SizedBox(height: 16),
        Text(
          'Build your operations workspace',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        Text(
          'Connect service zones, orders, and dispute queues to see real-time orchestration metrics.',
          style: Theme.of(context)
              .textTheme
              .bodyMedium
              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24),
        FilledButton.icon(
          onPressed: () {},
          icon: const Icon(Icons.add_circle_outline),
          label: const Text('Create first service zone'),
        ),
      ],
    );
  }
}

class _OperationsSkeleton extends StatelessWidget {
  const _OperationsSkeleton();

  Widget _skeletonBox({double height = 14, double? width}) {
    return Container(
      height: height,
      width: width,
      decoration: BoxDecoration(
        color: const Color(0xFFE2E8F0),
        borderRadius: BorderRadius.circular(8),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      itemCount: 4,
      itemBuilder: (_, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: GigvoraCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _skeletonBox(height: 16, width: 180),
                const SizedBox(height: 12),
                _skeletonBox(width: double.infinity),
                const SizedBox(height: 8),
                _skeletonBox(width: MediaQuery.of(context).size.width * 0.6),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(child: _skeletonBox(height: 40)),
                    const SizedBox(width: 12),
                    Expanded(child: _skeletonBox(height: 40)),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

void _showSnack(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      behavior: SnackBarBehavior.floating,
    ),
  );
}
