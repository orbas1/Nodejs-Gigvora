import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../theme/widgets.dart';
import '../application/integration_hub_controller.dart';
import '../data/models/integration_models.dart';

class CompanyIntegrationsScreen extends ConsumerWidget {
  const CompanyIntegrationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(integrationHubControllerProvider);
    final controller = ref.read(integrationHubControllerProvider.notifier);
    final overview = state.data ?? IntegrationHubOverview.empty();
    final summary = overview.summary;
    final theme = Theme.of(context);

    return GigvoraScaffold(
      title: 'Integration command center',
      subtitle: 'Salesforce, monday.com, Slack, HubSpot, Google Drive, and BYOK AI automations',
      actions: [
        IconButton(
          onPressed: () => controller.refresh(),
          tooltip: 'Refresh integrations',
          icon: const Icon(Icons.refresh),
        ),
      ],
      body: RefreshIndicator(
        onRefresh: controller.refresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            if (state.hasError && !state.loading)
              _StatusBanner(
                icon: Icons.warning_amber_outlined,
                background: const Color(0xFFFEE2E2),
                foreground: const Color(0xFFB91C1C),
                message: 'We could not sync the latest integration metrics. Showing cached data while offline.',
              ),
            if (state.fromCache && !state.loading)
              _StatusBanner(
                icon: Icons.offline_bolt,
                background: const Color(0xFFFEF3C7),
                foreground: const Color(0xFF92400E),
                message: 'Offline safe mode active. Data reflects the last secure sync.',
              ),
            _SummaryHeader(
              summary: summary,
              lastSyncedAt: state.lastUpdated ?? overview.lastSyncedAt,
              onRefresh: controller.refresh,
              refreshing: state.loading,
            ),
            const SizedBox(height: 24),
            for (final category in overview.categories) ...[
              _CategorySection(category: category, controller: controller),
              const SizedBox(height: 24),
            ],
            _ByokSection(connectors: overview.categories.expand((c) => c.connectors).where((c) => c.requiresApiKey).toList()),
            const SizedBox(height: 24),
            const _SecuritySection(),
            const SizedBox(height: 24),
            _AuditTrail(auditLog: overview.auditLog),
            const SizedBox(height: 24),
            Text(
              'Need a desktop view? Visit dashboard.company -> integrations for the full web experience.',
              style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 48),
          ],
        ),
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
        borderRadius: BorderRadius.circular(20),
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

class _SummaryHeader extends StatelessWidget {
  const _SummaryHeader({
    required this.summary,
    required this.lastSyncedAt,
    required this.onRefresh,
    required this.refreshing,
  });

  final IntegrationSummary summary;
  final DateTime? lastSyncedAt;
  final Future<void> Function() onRefresh;
  final bool refreshing;

  String _formatRelative(DateTime? value) {
    if (value == null) return 'never';
    final now = DateTime.now();
    final difference = now.difference(value);
    if (difference.inMinutes < 1) return 'just now';
    if (difference.inHours < 1) return '${difference.inMinutes}m ago';
    if (difference.inDays < 1) return '${difference.inHours}h ago';
    return DateFormat('MMM d, HH:mm').format(value.toLocal());
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: LinearGradient(
          colors: [
            colorScheme.primary.withOpacity(0.12),
            colorScheme.primary.withOpacity(0.08),
            colorScheme.surface,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(color: colorScheme.primary.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Live sync fabric',
            style: Theme.of(context)
                .textTheme
                .labelSmall
                ?.copyWith(letterSpacing: 3, color: colorScheme.primary, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          Text(
            '${summary.connected} of ${summary.total} connectors healthy',
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(fontWeight: FontWeight.w700, color: colorScheme.onSurface),
          ),
          const SizedBox(height: 6),
          Text(
            'Last refreshed ${_formatRelative(lastSyncedAt)}. Run manual refresh to validate downstream automations.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _MetricTile(
                label: 'Connected',
                value: summary.connected.toString(),
                caption: 'Live, verified tokens with SLAs enforced.',
                color: const Color(0xFF047857),
              ),
              _MetricTile(
                label: 'Action required',
                value: summary.actionRequired.toString(),
                caption: 'Re-authentication or incident triage required.',
                color: const Color(0xFFB45309),
              ),
              _MetricTile(
                label: 'BYOK configured',
                value: '${summary.byokConfigured}/${summary.byok}',
                caption: 'Secrets hashed locally and stored as fingerprints.',
                color: const Color(0xFF6D28D9),
              ),
              _MetricTile(
                label: 'Health score',
                value: '${summary.healthScore}%',
                caption: 'Weighted uptime across the integration fabric.',
                color: const Color(0xFF047857),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: refreshing ? null : () => onRefresh(),
            icon: const Icon(Icons.refresh),
            label: Text(refreshing ? 'Refreshing…' : 'Refresh now'),
            style: ElevatedButton.styleFrom(
              backgroundColor: colorScheme.primary,
              foregroundColor: colorScheme.onPrimary,
              shape: const StadiumBorder(),
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.label,
    required this.value,
    required this.caption,
    required this.color,
  });

  final String label;
  final String value;
  final String caption;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 180,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.labelSmall?.copyWith(color: color, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(value, style: Theme.of(context).textTheme.titleLarge?.copyWith(color: color, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(caption, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: color.withOpacity(0.9))),
        ],
      ),
    );
  }
}

class _CategorySection extends StatelessWidget {
  const _CategorySection({required this.category, required this.controller});

  final IntegrationCategory category;
  final IntegrationHubController controller;

  Color _accentColor() {
    switch (category.id) {
      case 'crm':
        return const Color(0xFFFCD34D);
      case 'work_management':
        return const Color(0xFF38BDF8);
      case 'communication':
        return const Color(0xFF818CF8);
      case 'content':
        return const Color(0xFF4ADE80);
      case 'ai':
        return const Color(0xFFA855F7);
      default:
        return const Color(0xFFCBD5F5);
    }
  }

  @override
  Widget build(BuildContext context) {
    final accent = _accentColor();
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(26),
            border: Border.all(color: accent.withOpacity(0.5)),
            color: accent.withOpacity(0.18),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(category.title, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 6),
              Text(category.description, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
            ],
          ),
        ),
        const SizedBox(height: 16),
        for (final connector in category.connectors) ...[
          _ConnectorCard(connector: connector, controller: controller),
          const SizedBox(height: 16),
        ],
      ],
    );
  }
}

class _ConnectorCard extends ConsumerStatefulWidget {
  const _ConnectorCard({required this.connector, required this.controller});

  final IntegrationConnector connector;
  final IntegrationHubController controller;

  @override
  ConsumerState<_ConnectorCard> createState() => _ConnectorCardState();
}

class _ConnectorCardState extends ConsumerState<_ConnectorCard> {
  late final TextEditingController _controller;
  bool _processing = false;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Color _statusColor(IntegrationStatus status, {bool background = false}) {
    switch (status) {
      case IntegrationStatus.connected:
        return background ? const Color(0xFFD1FAE5) : const Color(0xFF047857);
      case IntegrationStatus.actionRequired:
        return background ? const Color(0xFFFEF3C7) : const Color(0xFFB45309);
      case IntegrationStatus.degraded:
        return background ? const Color(0xFFFEE2E2) : const Color(0xFFB91C1C);
      case IntegrationStatus.notConnected:
      default:
        return background ? const Color(0xFFE2E8F0) : const Color(0xFF475569);
    }
  }

  String _statusLabel(IntegrationStatus status) {
    switch (status) {
      case IntegrationStatus.connected:
        return 'Connected';
      case IntegrationStatus.actionRequired:
        return 'Action required';
      case IntegrationStatus.degraded:
        return 'Degraded';
      case IntegrationStatus.notConnected:
      default:
        return 'Not connected';
    }
  }

  Future<void> _handleToggle() async {
    final nextStatus = widget.connector.status == IntegrationStatus.connected
        ? IntegrationStatus.notConnected
        : IntegrationStatus.connected;
    await widget.controller.toggleConnector(widget.connector.key, nextStatus);
  }

  Future<void> _handleRotate() async {
    if (_processing) return;
    setState(() => _processing = true);
    try {
      await widget.controller.rotateApiKey(widget.connector.key, _controller.text.trim());
      _controller.clear();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Credential fingerprint updated securely.')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unable to hash credential: $error')),
      );
    } finally {
      if (mounted) {
        setState(() => _processing = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final statusColor = _statusColor(widget.connector.status);
    final statusBackground = _statusColor(widget.connector.status, background: true);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: colorScheme.outline.withOpacity(0.15)),
        color: colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            offset: const Offset(0, 16),
            blurRadius: 32,
          ),
        ],
      ),
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
                    Text(widget.connector.name,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(widget.connector.description,
                        style: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.copyWith(color: colorScheme.onSurfaceVariant)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: statusBackground,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: statusColor.withOpacity(0.4)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.hub_outlined, size: 16, color: statusColor),
                    const SizedBox(width: 6),
                    Text(
                      _statusLabel(widget.connector.status),
                      style: Theme.of(context)
                          .textTheme
                          .labelSmall
                          ?.copyWith(color: statusColor, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 16,
            runSpacing: 12,
            children: [
              _InfoColumn(title: 'Owner', value: widget.connector.owner),
              _InfoColumn(
                title: 'Regions',
                value: widget.connector.regions.isEmpty ? '—' : widget.connector.regions.join(', '),
              ),
              _InfoColumn(
                title: 'Compliance',
                value: widget.connector.compliance.isEmpty ? '—' : widget.connector.compliance.join(', '),
              ),
              _InfoColumn(
                title: 'Last sync',
                value: widget.connector.lastSyncedAt == null
                    ? 'Never'
                    : DateFormat('MMM d, HH:mm').format(widget.connector.lastSyncedAt!.toLocal()),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: widget.connector.scopes
                .map(
                  (scope) => Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: colorScheme.surfaceVariant.withOpacity(0.4),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(scope,
                        style: Theme.of(context)
                            .textTheme
                            .labelSmall
                            ?.copyWith(color: colorScheme.onSurfaceVariant, fontWeight: FontWeight.w600)),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 16),
          if (widget.connector.incidents.isNotEmpty)
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Incidents', style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: 12),
                ...widget.connector.incidents.map(
                  (incident) => Card(
                    elevation: 0,
                    color: const Color(0xFFFEF3C7),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      title: Text(incident.summary,
                          style: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.copyWith(fontWeight: FontWeight.w700, color: const Color(0xFF92400E))),
                      subtitle: Text('Opened ${DateFormat('MMM d, HH:mm').format(incident.openedAt.toLocal())}',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: const Color(0xFFB45309))),
                      trailing: incident.status == IncidentStatus.resolved
                          ? const Icon(Icons.check_circle, color: Color(0xFF047857))
                          : TextButton.icon(
                              onPressed: () => widget.controller
                                  .resolveIncident(widget.connector.key, incident.id),
                              icon: const Icon(Icons.done_all),
                              label: const Text('Resolve'),
                            ),
                    ),
                  ),
                ),
              ],
            ),
          const SizedBox(height: 16),
          Row(
            children: [
              OutlinedButton.icon(
                onPressed: _handleToggle,
                icon: const Icon(Icons.sync_alt),
                label: Text(widget.connector.status == IntegrationStatus.connected
                    ? 'Disable connection'
                    : 'Enable connection'),
              ),
              const SizedBox(width: 12),
              if (widget.connector.requiresApiKey)
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TextField(
                        controller: _controller,
                        obscureText: true,
                        enableSuggestions: false,
                        autocorrect: false,
                        decoration: InputDecoration(
                          hintText: 'Paste secure key',
                          suffixIcon: IconButton(
                            icon: _processing
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  )
                                : const Icon(Icons.key),
                            onPressed: _processing ? null : _handleRotate,
                            tooltip: 'Secure upload',
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(999),
                          ),
                        ),
                        onSubmitted: (_) => _handleRotate(),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        widget.connector.apiKeyFingerprint == null
                            ? 'No fingerprint stored.'
                            : 'Fingerprint ${widget.connector.apiKeyFingerprint}',
                        style: Theme.of(context)
                            .textTheme
                            .labelSmall
                            ?.copyWith(color: colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _InfoColumn extends StatelessWidget {
  const _InfoColumn({required this.title, required this.value});

  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title,
            style: Theme.of(context)
                .textTheme
                .labelSmall
                ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant, letterSpacing: 1.2)),
        const SizedBox(height: 4),
        Text(value,
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: Theme.of(context).colorScheme.onSurface, fontWeight: FontWeight.w600)),
      ],
    );
  }
}

class _ByokSection extends StatelessWidget {
  const _ByokSection({required this.connectors});

  final List<IntegrationConnector> connectors;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    if (connectors.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: colorScheme.surfaceVariant.withOpacity(0.4),
          borderRadius: BorderRadius.circular(28),
        ),
        child: Text(
          'No bring-your-own-key connectors configured yet.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      );
    }
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: LinearGradient(
          colors: [
            colorScheme.surface,
            colorScheme.secondaryContainer.withOpacity(0.6),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(color: colorScheme.secondary.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Bring your own key',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Text(
            'Keys are hashed on-device using SHA-256. Gigvora stores fingerprints only and purges values after upload.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: connectors
                .map(
                  (connector) => Container(
                    width: 220,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: colorScheme.surface,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: colorScheme.secondary.withOpacity(0.2)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(connector.name,
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        Text(
                          connector.apiKeyFingerprint == null
                              ? 'Awaiting secure upload'
                              : 'Fingerprint ${connector.apiKeyFingerprint}',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: connector.apiKeyFingerprint == null
                                    ? const Color(0xFFB45309)
                                    : colorScheme.onSurfaceVariant,
                              ),
                        ),
                      ],
                    ),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _SecuritySection extends StatelessWidget {
  const _SecuritySection();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFD1FAE5),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFF047857).withOpacity(0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Security posture',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(color: const Color(0xFF047857), fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          _SecurityRow(
            icon: Icons.shield_outlined,
            message: 'Role-based access control restricts this command center to company operators only.',
          ),
          _SecurityRow(
            icon: Icons.key,
            message: 'Secrets hashed on device with SHA-256. Fingerprints stored server-side for audit only.',
          ),
          _SecurityRow(
            icon: Icons.analytics_outlined,
            message: 'Webhook signing, IP allow lists, and anomaly detection instrumented on every connector.',
          ),
        ],
      ),
    );
  }
}

class _SecurityRow extends StatelessWidget {
  const _SecurityRow({required this.icon, required this.message});

  final IconData icon;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: const Color(0xFF047857)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: const Color(0xFF065F46)),
            ),
          ),
        ],
      ),
    );
  }
}

class _AuditTrail extends StatelessWidget {
  const _AuditTrail({required this.auditLog});

  final List<IntegrationAuditEvent> auditLog;

  @override
  Widget build(BuildContext context) {
    if (auditLog.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: Theme.of(context).colorScheme.outline.withOpacity(0.2)),
        ),
        child: Text('No integration activity recorded yet.', style: Theme.of(context).textTheme.bodyMedium),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Audit readiness',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        ...auditLog.take(8).map(
              (event) => Card(
                margin: const EdgeInsets.only(bottom: 12),
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                child: ListTile(
                  title: Text(event.action.replaceAll('_', ' '),
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        event.context ?? 'No additional context provided.',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Connector ${event.connector} • ${DateFormat('MMM d, HH:mm').format(event.createdAt.toLocal())} • Actor ${event.actor}',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
              ),
            ),
      ],
    );
  }
}
