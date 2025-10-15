import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../governance/application/domain_governance_provider.dart';
import '../../governance/domain/domain_governance_models.dart';
import '../../../theme/widgets.dart';

class DomainGovernanceSummaryCard extends ConsumerWidget {
  const DomainGovernanceSummaryCard({super.key});

  int _statusScore(String status) {
    switch (status) {
      case 'remediation_required':
        return 3;
      case 'in_progress':
        return 2;
      case 'approved':
        return 1;
      default:
        return 0;
    }
  }

  Color _statusColor(BuildContext context, String status) {
    final scheme = Theme.of(context).colorScheme;
    switch (status) {
      case 'remediation_required':
        return scheme.errorContainer;
      case 'in_progress':
        return scheme.secondaryContainer;
      case 'approved':
        return scheme.primaryContainer;
      default:
        return scheme.surfaceVariant;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'remediation_required':
        return 'Remediation required';
      case 'in_progress':
        return 'In progress';
      case 'approved':
        return 'Approved';
      default:
        return 'Unknown';
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(domainGovernanceSummariesProvider);
    final theme = Theme.of(context);

    return summary.when(
      loading: () => GigvoraCard(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Row(
            children: [
              const SizedBox(
                height: 28,
                width: 28,
                child: CircularProgressIndicator(strokeWidth: 2.5),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  'Loading governance snapshot…',
                  style: theme.textTheme.bodyMedium,
                ),
              ),
            ],
          ),
        ),
      ),
      error: (error, stackTrace) => GigvoraCard(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Text(
            'Unable to fetch data governance status. ${error?.toString() ?? 'Try again shortly.'}',
            style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.error),
          ),
        ),
      ),
      data: (response) {
        final contexts = [...response.contexts]
          ..sort((a, b) => _statusScore(b.reviewStatus).compareTo(_statusScore(a.reviewStatus)));
        final topContexts = contexts.take(3).toList();
        final formatter = DateFormat.yMMMd().add_jm();
        final generatedLabel = formatter.format(response.generatedAt.toLocal());

        return GigvoraCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.verified_user_outlined, color: theme.colorScheme.primary),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Data governance alerts',
                          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Review the contexts requiring attention before onboarding new data sources.',
                          style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (topContexts.isEmpty)
                Text(
                  'All domain contexts are compliant with the latest retention and review policies.',
                  style: theme.textTheme.bodyMedium,
                )
              else
                Column(
                  children: topContexts.map((summary) {
                    final color = _statusColor(context, summary.reviewStatus).withOpacity(0.25);
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: color,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  summary.displayName,
                                  style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
                                ),
                                if (summary.ownerTeam != null)
                                  Text(
                                    'Owner: ${summary.ownerTeam}${summary.dataSteward != null ? ' • Steward: ${summary.dataSteward}' : ''}',
                                    style: theme.textTheme.bodySmall,
                                  ),
                                Text(
                                  '${summary.piiModelCount} models • ${summary.piiFieldCount} PII fields',
                                  style: theme.textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: _statusColor(context, summary.reviewStatus),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              _statusLabel(summary.reviewStatus),
                              style: theme.textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              const SizedBox(height: 8),
              Text(
                'Snapshot generated $generatedLabel',
                style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
              ),
            ],
          ),
        );
      },
    );
  }
}
