import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../application/rbac_matrix_provider.dart';
import '../domain/rbac_matrix.dart';

class RbacMatrixCard extends ConsumerWidget {
  const RbacMatrixCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final matrixAsync = ref.watch(rbacMatrixProvider);
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      elevation: 2,
      shadowColor: Theme.of(context).colorScheme.primary.withOpacity(0.08),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: matrixAsync.when(
          loading: () => const _LoadingState(),
          error: (error, stackTrace) => _ErrorState(message: error.toString()),
          data: (matrix) {
            if (matrix == null) {
              return const _EmptyState();
            }
            return _MatrixContent(matrix: matrix);
          },
        ),
      ),
    );
  }
}

class _LoadingState extends StatelessWidget {
  const _LoadingState();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Security guardrails', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: colorScheme.surfaceVariant.withOpacity(0.3),
                borderRadius: BorderRadius.circular(18),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(height: 10, width: double.infinity, decoration: BoxDecoration(color: colorScheme.surfaceVariant.withOpacity(0.3), borderRadius: BorderRadius.circular(12))),
                  const SizedBox(height: 8),
                  Container(height: 10, width: 120, decoration: BoxDecoration(color: colorScheme.surfaceVariant.withOpacity(0.3), borderRadius: BorderRadius.circular(12))),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Security guardrails', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        Text(
          message,
          style: Theme.of(context)
              .textTheme
              .bodyMedium
              ?.copyWith(color: colorScheme.error),
        ),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Security guardrails', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        Text(
          'RBAC telemetry will appear here once your account is assigned to an operations or security persona.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      ],
    );
  }
}

class _MatrixContent extends StatelessWidget {
  const _MatrixContent({required this.matrix});

  final RbacMatrix matrix;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final guardrails = matrix.guardrails.take(3).toList(growable: false);
    final nextReview = matrix.reviewCadenceDays != null
        ? matrix.publishedAt.add(Duration(days: matrix.reviewCadenceDays!))
        : null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Security guardrails', style: theme.textTheme.titleMedium),
        const SizedBox(height: 6),
        Text(
          '${matrix.guardrails.length} guardrails across ${matrix.personas.length} personas',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: colorScheme.primary,
            fontWeight: FontWeight.w600,
          ),
        ),
        if (nextReview != null) ...[
          const SizedBox(height: 4),
          Text(
            'Next review ${_formatDate(nextReview)}',
            style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
        ],
        const SizedBox(height: 16),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            _MetricChip(
              label: 'Guardrails',
              value: matrix.guardrails.length.toString(),
              color: colorScheme.secondaryContainer,
              foreground: colorScheme.onSecondaryContainer,
            ),
            _MetricChip(
              label: 'Resources',
              value: matrix.resources.length.toString(),
              color: colorScheme.surfaceVariant,
              foreground: colorScheme.onSurfaceVariant,
            ),
            _MetricChip(
              label: 'Review cadence',
              value: matrix.reviewCadenceDays != null ? '${matrix.reviewCadenceDays} days' : 'Scheduled',
              color: colorScheme.tertiaryContainer,
              foreground: colorScheme.onTertiaryContainer,
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (guardrails.isEmpty)
          Text(
            'Guardrail catalogue not yet published. Confirm the RBAC matrix from the admin dashboard to surface controls here.',
            style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
          )
        else
          ...guardrails.map(
            (guardrail) => _GuardrailRow(guardrail: guardrail),
          ),
      ],
    );
  }
}

class _MetricChip extends StatelessWidget {
  const _MetricChip({
    required this.label,
    required this.value,
    required this.color,
    required this.foreground,
  });

  final String label;
  final String value;
  final Color color;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(), style: Theme.of(context).textTheme.labelSmall?.copyWith(color: foreground)),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(color: foreground, fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}

class _GuardrailRow extends StatelessWidget {
  const _GuardrailRow({required this.guardrail});

  final RbacGuardrail guardrail;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colourScheme = theme.colorScheme;
    final tone = _severityTone(guardrail.severity, colourScheme);
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: tone.background,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: tone.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            guardrail.label,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: tone.foreground,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            guardrail.description,
            style: theme.textTheme.bodySmall?.copyWith(color: tone.foreground.withOpacity(0.85)),
          ),
          const SizedBox(height: 6),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: guardrail.coverage
                .map(
                  (persona) => Chip(
                    label: Text(persona, style: theme.textTheme.labelSmall?.copyWith(color: tone.foreground)),
                    backgroundColor: tone.chipBackground,
                  ),
                )
                .toList(growable: false),
          ),
        ],
      ),
    );
  }
}

class _SeverityTone {
  const _SeverityTone({
    required this.background,
    required this.border,
    required this.foreground,
    required this.chipBackground,
  });

  final Color background;
  final Color border;
  final Color foreground;
  final Color chipBackground;
}

_SeverityTone _severityTone(String severity, ColorScheme colorScheme) {
  switch (severity.toLowerCase()) {
    case 'critical':
      return _SeverityTone(
        background: colorScheme.errorContainer,
        border: colorScheme.error.withOpacity(0.3),
        foreground: colorScheme.onErrorContainer,
        chipBackground: colorScheme.onErrorContainer.withOpacity(0.12),
      );
    case 'high':
      return _SeverityTone(
        background: colorScheme.tertiaryContainer,
        border: colorScheme.tertiary.withOpacity(0.3),
        foreground: colorScheme.onTertiaryContainer,
        chipBackground: colorScheme.onTertiaryContainer.withOpacity(0.12),
      );
    case 'medium':
      return _SeverityTone(
        background: colorScheme.secondaryContainer,
        border: colorScheme.secondary.withOpacity(0.3),
        foreground: colorScheme.onSecondaryContainer,
        chipBackground: colorScheme.onSecondaryContainer.withOpacity(0.12),
      );
    default:
      return _SeverityTone(
        background: colorScheme.surfaceVariant,
        border: colorScheme.outline.withOpacity(0.3),
        foreground: colorScheme.onSurfaceVariant,
        chipBackground: colorScheme.onSurfaceVariant.withOpacity(0.08),
      );
  }
}

String _formatDate(DateTime date) {
  final formatter = DateFormat.yMMMMd();
  return formatter.format(date);
}
