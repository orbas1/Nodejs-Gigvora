import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../theme/widgets.dart';
import '../../auth/application/session_controller.dart';
import '../application/connections_controller.dart';
import '../domain/connection_network.dart';

class ConnectionsScreen extends ConsumerWidget {
  const ConnectionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionState = ref.watch(sessionControllerProvider);
    final session = sessionState.session;
    final state = ref.watch(connectionsControllerProvider);
    final controller = ref.read(connectionsControllerProvider.notifier);

    if (session == null) {
      return GigvoraScaffold(
        title: 'Network access',
        subtitle: 'Sign in required',
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.lock_outline, size: 48),
              const SizedBox(height: 16),
              Text(
                'Authenticate to view 1st, 2nd and 3rd-degree connections.',
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    final network = state.data;
    final theme = Theme.of(context);

    return GigvoraScaffold(
      title: 'Network connections',
      subtitle: '${session.title} • ${session.location}',
      actions: [
        IconButton(
          tooltip: 'Refresh network',
          onPressed: () => controller.refresh(),
          icon: const Icon(Icons.refresh),
        ),
      ],
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (state.error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: _ErrorBanner(message: '${state.error}'),
              ),
            if (network != null) ...[
              _SummaryCards(network: network),
              const SizedBox(height: 24),
              _ConnectionSections(network: network, loading: state.loading),
            ] else if (state.loading) ...[
              const _LoadingPlaceholder(),
            ] else ...[
              _EmptyState(message: 'No connection data available yet. Pull to refresh.'),
            ],
          ],
        ),
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.errorContainer,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: theme.colorScheme.error.withOpacity(0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.warning_rounded, color: theme.colorScheme.error),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onErrorContainer),
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryCards extends StatelessWidget {
  const _SummaryCards({required this.network});

  final ConnectionNetwork network;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Network summary',
          style: theme.textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: [
            SizedBox(
              width: 260,
              child: GigvoraCard(
                child: _SummaryMetrics(summary: network.summary),
              ),
            ),
            SizedBox(
              width: 260,
              child: GigvoraCard(
                child: _PolicyCard(policy: network.policy),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _SummaryMetrics extends StatelessWidget {
  const _SummaryMetrics({required this.summary});

  final ConnectionSummary summary;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    Text _metric(String label, int value) {
      return Text(
        '$value $label',
        style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Live tiers', style: theme.textTheme.bodySmall),
        const SizedBox(height: 12),
        _metric('1st-degree', summary.firstDegree),
        _metric('2nd-degree', summary.secondDegree),
        _metric('3rd-degree', summary.thirdDegree),
      ],
    );
  }
}

class _PolicyCard extends StatelessWidget {
  const _PolicyCard({required this.policy});

  final ConnectionPolicy policy;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Role policy', style: theme.textTheme.bodySmall),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: policy.allowedRoles
              .map(
                (role) => Chip(
                  label: Text(role),
                  backgroundColor: theme.colorScheme.primary.withOpacity(0.12),
                ),
              )
              .toList(),
        ),
        if (policy.notes != null) ...[
          const SizedBox(height: 12),
          Text(
            policy.notes!,
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
        ],
      ],
    );
  }
}

class _ConnectionSections extends StatelessWidget {
  const _ConnectionSections({required this.network, required this.loading});

  final ConnectionNetwork network;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    if (loading && network.firstDegree.isEmpty) {
      return const _LoadingPlaceholder();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _ConnectionCluster(
          title: 'Direct connections',
          description: 'Collaborators and trusted contacts who receive real-time updates.',
          nodes: network.firstDegree,
        ),
        const SizedBox(height: 20),
        _ConnectionCluster(
          title: '2nd-degree introductions',
          description: 'Warm intros surfaced by your core network. Pair requests with context.',
          nodes: network.secondDegree,
        ),
        const SizedBox(height: 20),
        _ConnectionCluster(
          title: '3rd-degree reach',
          description: 'Strategic relationships discoverable through two intermediaries.',
          nodes: network.thirdDegree,
        ),
      ],
    );
  }
}

class _ConnectionCluster extends StatelessWidget {
  const _ConnectionCluster({
    required this.title,
    required this.description,
    required this.nodes,
  });

  final String title;
  final String description;
  final List<ConnectionNode> nodes;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (nodes.isEmpty) {
      return GigvoraCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              'No members in this tier yet. Grow your direct circle to unlock additional visibility.',
              style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: theme.textTheme.titleMedium),
        const SizedBox(height: 12),
        Text(description, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
        const SizedBox(height: 12),
        Column(
          children: nodes
              .map((node) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _ConnectionNodeCard(node: node),
                  ))
              .toList(),
        ),
      ],
    );
  }
}

class _ConnectionNodeCard extends StatelessWidget {
  const _ConnectionNodeCard({required this.node});

  final ConnectionNode node;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                child: Text(node.name.isNotEmpty ? node.name[0] : '?'),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(node.name, style: theme.textTheme.titleMedium),
                    Text(
                      node.headline ?? 'Gigvora member',
                      style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              Chip(label: Text(node.degreeLabel)),
            ],
          ),
          const SizedBox(height: 12),
          if (node.location != null)
            Text(
              node.location!,
              style: theme.textTheme.bodySmall,
            ),
          if (node.mutualConnections > 0) ...[
            const SizedBox(height: 8),
            Text(
              '${node.mutualConnections} mutual',
              style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600),
            ),
          ],
          if (node.connectors.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: node.connectors
                  .map((connector) => Chip(label: Text(connector.name)))
                  .toList(),
            ),
          ],
          if (node.path.length > 2) ...[
            const SizedBox(height: 8),
            Text(
              node.path.map((segment) => segment.name).join(' • '),
              style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: node.actions.canRequestConnection ? () {} : null,
                  child: Text(node.actions.requiresIntroduction ? 'Request introduction' : 'Connect'),
                ),
              ),
              if (!node.actions.canRequestConnection && node.actions.reason != null) ...[
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    node.actions.reason!,
                    style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.error),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class _LoadingPlaceholder extends StatelessWidget {
  const _LoadingPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(
        3,
        (index) => Container(
          height: 120,
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.3),
            borderRadius: BorderRadius.circular(24),
          ),
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 48),
        child: Text(
          message,
          style: Theme.of(context).textTheme.bodyMedium,
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
