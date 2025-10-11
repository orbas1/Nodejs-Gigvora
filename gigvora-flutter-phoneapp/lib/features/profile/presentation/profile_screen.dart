import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../../theme/widgets.dart';
import '../application/profile_controller.dart';
import '../data/models/profile.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key, this.profileId});

  final String? profileId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final config = ref.watch(appConfigProvider);
    final resolvedId = profileId ?? (config.featureFlags['demoProfileId'] as String? ?? 'usr_demo');
    final state = ref.watch(profileControllerProvider(resolvedId));
    final controller = ref.read(profileControllerProvider(resolvedId).notifier);
    final profile = state.data;

    return GigvoraScaffold(
      title: profile?.fullName ?? 'Profile',
      subtitle: profile?.headline ?? 'Your Gigvora presence',
      actions: [
        IconButton(
          tooltip: 'Refresh profile',
          onPressed: () => controller.refresh(),
          icon: const Icon(Icons.refresh),
        ),
      ],
      body: RefreshIndicator(
        onRefresh: () => controller.refresh(),
        child: ListView(
          padding: const EdgeInsets.only(bottom: 32),
          children: [
            if (state.loading && profile == null)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: CircularProgressIndicator()),
              ),
            if (state.hasError && profile == null)
              _ErrorState(
                error: state.error,
                onRetry: () => controller.refresh(),
              ),
            if (profile != null) ...[
              _ProfileHeaderCard(profile: profile),
              const SizedBox(height: 16),
              if (profile.metrics.isNotEmpty)
                _ProfileMetricsCard(metrics: profile.metrics),
              if (profile.metrics.isNotEmpty) const SizedBox(height: 16),
              if (profile.skills.isNotEmpty)
                _SkillsCard(
                  skills: profile.skills,
                  onSkillTap: controller.recordSkillTap,
                ),
              if (profile.skills.isNotEmpty) const SizedBox(height: 16),
              _AvailabilityCard(availability: profile.availability, focusAreas: profile.focusAreas),
              const SizedBox(height: 16),
              if (profile.groups.isNotEmpty)
                _GroupsCard(
                  groups: profile.groups,
                  onGroupTap: controller.recordGroupTap,
                ),
              if (profile.groups.isNotEmpty) const SizedBox(height: 16),
              if (profile.experiences.isNotEmpty)
                _ExperienceCard(experiences: profile.experiences),
            ],
          ],
        ),
      ),
    );
  }
}

class _ProfileHeaderCard extends StatelessWidget {
  const _ProfileHeaderCard({required this.profile});

  final ProfileModel profile;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 28,
            backgroundImage: profile.avatarUrl != null && profile.avatarUrl!.isNotEmpty
                ? NetworkImage(profile.avatarUrl!)
                : null,
            child: profile.avatarUrl == null || profile.avatarUrl!.isEmpty
                ? Text(
                    profile.fullName.isNotEmpty ? profile.fullName[0] : '?',
                    style: Theme.of(context).textTheme.titleLarge,
                  )
                : null,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(profile.fullName, style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 4),
                if (profile.headline.isNotEmpty)
                  Text(profile.headline, style: Theme.of(context).textTheme.bodySmall),
                if (profile.location.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 16),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            profile.location,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ),
                      ],
                    ),
                  ),
                if (profile.bio.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Text(profile.bio, style: Theme.of(context).textTheme.bodyMedium),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileMetricsCard extends StatelessWidget {
  const _ProfileMetricsCard({required this.metrics});

  final List<ProfileMetric> metrics;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Impact metrics', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: metrics
                .map(
                  (metric) => _MetricTile(
                    label: metric.label,
                    value: metric.value,
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({required this.label, required this.value});

  final String label;
  final num value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SizedBox(
      width: 120,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$value',
            style: theme.textTheme.headlineSmall?.copyWith(color: theme.colorScheme.primary),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: theme.textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _SkillsCard extends StatelessWidget {
  const _SkillsCard({required this.skills, required this.onSkillTap});

  final List<String> skills;
  final Future<void> Function(String skill) onSkillTap;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Skills & capabilities', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: skills
                .map(
                  (skill) => ActionChip(
                    label: Text(skill),
                    onPressed: () => onSkillTap(skill),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _GroupsCard extends StatelessWidget {
  const _GroupsCard({required this.groups, required this.onGroupTap});

  final List<ProfileGroup> groups;
  final Future<void> Function(ProfileGroup group) onGroupTap;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Communities & programmes', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          ...groups.map(
            (group) => ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(group.name, style: Theme.of(context).textTheme.titleSmall),
              subtitle: group.description != null && group.description!.isNotEmpty
                  ? Text(group.description!)
                  : null,
              trailing: const Icon(Icons.chevron_right),
              onTap: () => onGroupTap(group),
            ),
          ),
        ],
      ),
    );
  }
}

class _AvailabilityCard extends StatelessWidget {
  const _AvailabilityCard({
    required this.availability,
    required this.focusAreas,
  });

  final ProfileAvailability availability;
  final List<String> focusAreas;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Availability & focus areas', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(
                availability.status == 'available_now' ? Icons.check_circle : Icons.schedule,
                color: availability.status == 'available_now'
                    ? theme.colorScheme.primary
                    : theme.colorScheme.secondary,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      availability.status == 'available_now'
                          ? 'Available for new engagements now'
                          : 'Next availability ${availability.nextAvailability != null ? availability.nextAvailability!.toLocal().toString().split(' ').first : 'TBC'}',
                      style: theme.textTheme.bodyMedium,
                    ),
                    if (availability.acceptingVolunteers || availability.acceptingLaunchpad)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          [
                            if (availability.acceptingVolunteers) 'Open to volunteer invitations',
                            if (availability.acceptingLaunchpad) 'Launchpad opportunities welcomed',
                          ].join(' • '),
                          style: theme.textTheme.bodySmall,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
          if (focusAreas.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: focusAreas
                  .map((area) => Chip(
                        label: Text(area),
                        backgroundColor: theme.colorScheme.primaryContainer,
                        labelStyle: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onPrimaryContainer),
                      ))
                  .toList(),
            ),
          ],
        ],
      ),
    );
  }
}

class _ExperienceCard extends StatelessWidget {
  const _ExperienceCard({required this.experiences});

  final List<ProfileExperience> experiences;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Experience', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          ...experiences.map(
            (experience) => Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(experience.title, style: theme.textTheme.titleSmall),
                  const SizedBox(height: 4),
                  Text(experience.organisation, style: theme.textTheme.bodySmall),
                  const SizedBox(height: 4),
                  Text(
                    _formatExperienceDates(experience),
                    style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                  ),
                  if (experience.summary != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(experience.summary!),
                    ),
                  if (experience.achievements.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: experience.achievements
                            .map(
                              (achievement) => Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('• '),
                                  Expanded(child: Text(achievement)),
                                ],
                              ),
                            )
                            .toList(),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatExperienceDates(ProfileExperience experience) {
    final start = experience.startDate.toLocal().toString().split(' ').first;
    final end = experience.endDate?.toLocal().toString().split(' ').first ?? 'Present';
    return '$start — $end';
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.error, required this.onRetry});

  final Object? error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, size: 48, color: Color(0xFFB91C1C)),
          const SizedBox(height: 12),
          const Text(
            'We couldn\'t load this profile right now.',
            style: TextStyle(fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            '${error ?? 'Unexpected error'}',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: onRetry,
            child: const Text('Try again'),
          ),
        ],
      ),
    );
  }
}
