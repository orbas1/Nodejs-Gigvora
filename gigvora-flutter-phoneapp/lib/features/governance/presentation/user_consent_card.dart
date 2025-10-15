import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../application/user_consent_provider.dart';
import '../domain/consent_models.dart';

class UserConsentCard extends ConsumerWidget {
  const UserConsentCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final snapshotAsync = ref.watch(userConsentSnapshotProvider);

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      elevation: 2,
      shadowColor: Theme.of(context).colorScheme.primary.withOpacity(0.08),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: snapshotAsync.when(
          loading: () => _LoadingState(),
          error: (error, stackTrace) => _ErrorState(message: error.toString()),
          data: (snapshot) {
            if (snapshot == null || snapshot.entries.isEmpty) {
              return const _EmptyState();
            }
            return _ConsentContent(snapshot: snapshot);
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Consent health',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: List.generate(
            3,
            (index) => Container(
              width: 180,
              height: 56,
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.3),
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Consent health',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        Text(
          message,
          style: Theme.of(context)
              .textTheme
              .bodyMedium
              ?.copyWith(color: Theme.of(context).colorScheme.error),
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
        Text(
          'Consent health',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        Text(
          'No consent policies have been published for your persona yet. Operations will notify you once preferences are ready.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      ],
    );
  }
}

class _ConsentContent extends StatelessWidget {
  const _ConsentContent({required this.snapshot});

  final UserConsentSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final total = snapshot.entries.length;
    final granted = snapshot.grantedCount;

    final theme = Theme.of(context);
    final consentColours = theme.colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Consent health',
          style: theme.textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        Text(
          '$granted of $total preferences enabled',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: consentColours.primary,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: snapshot.entries
              .take(3)
              .map((entry) => _ConsentChip(entry: entry))
              .toList(),
        ),
        const SizedBox(height: 16),
        OutlinedButton.icon(
          onPressed: () => GoRouter.of(context).go('/settings'),
          icon: const Icon(Icons.shield_outlined),
          label: const Text('Manage privacy preferences'),
        ),
      ],
    );
  }
}

class _ConsentChip extends StatelessWidget {
  const _ConsentChip({required this.entry});

  final ConsentSnapshotEntry entry;

  @override
  Widget build(BuildContext context) {
    final granted = entry.consent?.status == 'granted';
    final colourScheme = Theme.of(context).colorScheme;
    final background = granted
        ? colourScheme.secondaryContainer
        : colourScheme.errorContainer.withOpacity(0.4);
    final foreground = granted
        ? colourScheme.onSecondaryContainer
        : colourScheme.onErrorContainer;
    return Container(
      width: 200,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                granted ? Icons.check_circle : Icons.error_outline,
                size: 18,
                color: foreground,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  entry.policy.title,
                  style: Theme.of(context)
                      .textTheme
                      .bodyMedium
                      ?.copyWith(color: foreground, fontWeight: FontWeight.w600),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            granted ? 'Granted' : 'Withdrawn',
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: foreground.withOpacity(0.8)),
          ),
        ],
      ),
    );
  }
}
