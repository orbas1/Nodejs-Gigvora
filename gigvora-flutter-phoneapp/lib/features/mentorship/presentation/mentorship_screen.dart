import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../theme/widgets.dart';
import '../application/mentorship_controller.dart';
import '../data/models/mentor_dashboard.dart';

class MentorshipScreen extends ConsumerStatefulWidget {
  const MentorshipScreen({super.key});

  @override
  ConsumerState<MentorshipScreen> createState() => _MentorshipScreenState();
}

class _MentorshipScreenState extends ConsumerState<MentorshipScreen> with TickerProviderStateMixin {
  late final TabController _tabController;

  static const _tabs = [
    Tab(text: 'Performance'),
    Tab(text: 'Pipeline'),
    Tab(text: 'Availability'),
    Tab(text: 'Packages'),
    Tab(text: 'Resources'),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(mentorshipControllerProvider);
    final controller = ref.read(mentorshipControllerProvider.notifier);
    final dashboard = state.data ?? const MentorDashboard();
    final savingAvailability = state.metadata['savingAvailability'] == true;
    final savingPackages = state.metadata['savingPackages'] == true;

    return GigvoraScaffold(
      title: 'Mentor mission control',
      subtitle: 'Manage bookings, packages, and Explorer visibility',
      actions: [
        IconButton(
          tooltip: 'Refresh dashboard',
          onPressed: state.loading ? null : () => controller.refresh(),
          icon: state.loading
              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
              : const Icon(Icons.refresh),
        ),
      ],
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (state.hasError && !state.loading)
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFEE2E2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: Color(0xFFB91C1C)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Unable to sync the latest mentorship data. Pull to refresh to retry.',
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(color: const Color(0xFFB91C1C)),
                    ),
                  ),
                ],
              ),
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
          TabBar(
            controller: _tabController,
            isScrollable: true,
            labelStyle: Theme.of(context).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
            unselectedLabelColor: Theme.of(context).colorScheme.onSurfaceVariant,
            indicator: UnderlineTabIndicator(
              borderSide: BorderSide(color: Theme.of(context).colorScheme.primary, width: 3),
              insets: const EdgeInsets.symmetric(horizontal: 12),
            ),
            tabs: _tabs,
          ),
          const SizedBox(height: 16),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _PerformanceTab(state: state, onRefresh: controller.refresh),
                _PipelineTab(dashboard: dashboard),
                MentorAvailabilityTab(
                  saving: savingAvailability,
                  controller: controller,
                ),
                MentorPackagesTab(
                  saving: savingPackages,
                  controller: controller,
                ),
                _ResourcesTab(dashboard: dashboard),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PerformanceTab extends ConsumerWidget {
  const _PerformanceTab({required this.state, required this.onRefresh});

  final ResourceState<MentorDashboard> state;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboard = state.data ?? const MentorDashboard();
    final stats = dashboard.stats;
    final conversion = dashboard.conversion;
    final feedback = dashboard.feedback;

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          GigvoraCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Mentorship performance',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Keep tabs on mentee growth, upcoming sessions, and the health of your mentorship revenue stream.',
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: state.loading ? null : onRefresh,
                      icon: state.loading
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.refresh),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if (stats != null)
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      _StatTile(
                        label: 'Active mentees',
                        value: '${stats.activeMentees}',
                        trend: stats.activeMenteesChange,
                      ),
                      _StatTile(
                        label: 'Upcoming sessions',
                        value: '${stats.upcomingSessions}',
                        trend: stats.upcomingSessionsChange,
                      ),
                      _StatTile(
                        label: 'Avg. rating',
                        value: stats.avgRating.toStringAsFixed(1),
                        suffix: '/5',
                        trend: stats.avgRatingChange,
                      ),
                      _StatTile(
                        label: 'Monthly revenue',
                        value: '£${_formatNumber(stats.monthlyRevenue)}',
                        trend: stats.monthlyRevenueChange,
                      ),
                    ],
                  )
                else
                  const Text('Performance data will appear once bookings are confirmed.'),
                if (conversion.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(24),
                      gradient: const LinearGradient(
                        colors: [Color(0xFFFFFFFF), Color(0xFFE0F2FE)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Conversion funnel', style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 4),
                        Text(
                          'Explorer demand, booking requests, and confirmed sessions across the past 30 days.',
                          style: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                        const SizedBox(height: 16),
                        Wrap(
                          spacing: 12,
                          runSpacing: 12,
                          children: conversion
                              .map(
                                (stage) => _ConversionTile(stage: stage),
                              )
                              .toList(growable: false),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),
          GigvoraCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Recent feedback', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(
                  'High-signal notes from mentees help you tune your programmes and promotion copy.',
                  style: Theme.of(context)
                      .textTheme
                      .bodyMedium
                      ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                ),
                const SizedBox(height: 16),
                if (feedback.isEmpty)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
                    ),
                    child: Text(
                      'No feedback yet. Collect quotes after each session to increase conversion in Explorer.',
                      style: Theme.of(context).textTheme.bodyMedium,
                      textAlign: TextAlign.center,
                    ),
                  )
                else
                  Column(
                    children: feedback
                        .map(
                          (entry) => Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(20),
                              color: const Color(0xFFF8FAFC),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  entry.mentee,
                                  style: Theme.of(context)
                                      .textTheme
                                      .labelMedium
                                      ?.copyWith(color: Theme.of(context).colorScheme.primary),
                                ),
                                const SizedBox(height: 8),
                                Text(entry.highlight, style: Theme.of(context).textTheme.bodyMedium),
                                const SizedBox(height: 8),
                                Text('Rating ${entry.rating}/5',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodySmall
                                        ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                              ],
                            ),
                          ),
                        )
                        .toList(growable: false),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.label,
    required this.value,
    this.suffix,
    this.trend,
  });

  final String label;
  final String value;
  final String? suffix;
  final num? trend;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      constraints: const BoxConstraints(minWidth: 140),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colorScheme.outlineVariant.withOpacity(0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(),
              style: Theme.of(context)
                  .textTheme
                  .labelSmall
                  ?.copyWith(color: colorScheme.onSurfaceVariant, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text('$value${suffix ?? ''}', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 6),
          Text(
            _trendLabel(trend),
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: _trendColor(context, trend), fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  String _trendLabel(num? value) {
    if (value == null) {
      return 'Last 30 days';
    }
    if (value == 0) {
      return 'Holding steady vs. last month';
    }
    final sign = value > 0 ? '+' : '';
    return '$sign${value.toString()}%';
  }

  Color _trendColor(BuildContext context, num? value) {
    if (value == null || value == 0) {
      return Theme.of(context).colorScheme.onSurfaceVariant;
    }
    return value > 0 ? const Color(0xFF047857) : const Color(0xFFB91C1C);
  }
}

class _ConversionTile extends StatelessWidget {
  const _ConversionTile({required this.stage});

  final MentorConversionStage stage;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final trendColor = stage.delta == null
        ? colorScheme.onSurfaceVariant
        : (stage.delta! >= 0 ? const Color(0xFF047857) : const Color(0xFFB91C1C));
    final trendPrefix = stage.delta == null
        ? ''
        : stage.delta! > 0
            ? '+'
            : '';

    return Container(
      width: 180,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colorScheme.outlineVariant.withOpacity(0.3), style: BorderStyle.solid),
        borderStyle: BorderStyle.solid,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(stage.label.toUpperCase(),
              style: Theme.of(context)
                  .textTheme
                  .labelSmall
                  ?.copyWith(color: colorScheme.onSurfaceVariant, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text('${stage.value}', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          Text(
            stage.delta == null ? 'Stable' : '$trendPrefix${stage.delta}%',
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: trendColor, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _PipelineTab extends StatelessWidget {
  const _PipelineTab({required this.dashboard});

  final MentorDashboard dashboard;

  @override
  Widget build(BuildContext context) {
    final segments = dashboard.segments;
    final bookings = dashboard.bookings;

    final grouped = segments.isEmpty
        ? [
            _PipelineGroup(
              title: 'Active bookings',
              description: 'Upcoming mentorship sessions with payment tracked in Finance hub.',
              bookings: bookings,
            ),
          ]
        : segments
            .map((segment) => _PipelineGroup(
                  title: segment.title,
                  description: segment.description,
                  bookings: bookings.where((booking) => booking.segment == segment.id).toList(growable: false),
                ))
            .toList(growable: false);

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      itemCount: grouped.length + 1,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      padding: EdgeInsets.zero,
      itemBuilder: (context, index) {
        if (index == grouped.length) {
          return GigvoraCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('Automation tips', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18)),
                SizedBox(height: 8),
                _Bullet(text: 'Sync paid invoices to the Finance hub for clearer mentor earnings reporting.'),
                _Bullet(text: 'Automate pre-work reminders 48 hours before each mentorship session.'),
                _Bullet(text: 'Enable Explorer instant booking to auto-confirm 1:1 sessions against your published availability.'),
              ],
            ),
          );
        }

        final group = grouped[index];
        return GigvoraCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(group.title, style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 4),
                        Text(
                          group.description,
                          style: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: () {},
                    child: const Text('Reconcile in Finance hub'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (group.bookings.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Theme.of(context).colorScheme.outlineVariant, style: BorderStyle.solid),
                  ),
                  child: Text(
                    'No bookings yet. Publish availability or packages to attract mentees.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                )
              else
                Column(
                  children: group.bookings
                      .map(
                        (booking) => Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(20),
                            color: Colors.white,
                            border:
                                Border.all(color: Theme.of(context).colorScheme.outlineVariant.withOpacity(0.3)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(booking.mentee,
                                            style: Theme.of(context)
                                                .textTheme
                                                .titleMedium
                                                ?.copyWith(fontWeight: FontWeight.w600)),
                                        const SizedBox(height: 4),
                                        Text(booking.role,
                                            style: Theme.of(context)
                                                .textTheme
                                                .bodySmall
                                                ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                                      ],
                                    ),
                                  ),
                                  Chip(label: Text(booking.channel)),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(
                                booking.package,
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                              ),
                              if (booking.focus.isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(top: 4),
                                  child: Text(
                                    booking.focus,
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodySmall
                                        ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                                  ),
                                ),
                              const SizedBox(height: 12),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        _formatSessionTime(booking.scheduledAt),
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodyMedium
                                            ?.copyWith(fontWeight: FontWeight.w600),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(booking.status,
                                          style: Theme.of(context)
                                              .textTheme
                                              .bodySmall
                                              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                                    ],
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        '${booking.currency}${_formatNumber(booking.price)}',
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodyMedium
                                            ?.copyWith(fontWeight: FontWeight.w600),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(booking.paymentStatus,
                                          style: Theme.of(context)
                                              .textTheme
                                              .bodySmall
                                              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                                    ],
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      )
                      .toList(growable: false),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _PipelineGroup {
  const _PipelineGroup({
    required this.title,
    required this.description,
    required this.bookings,
  });

  final String title;
  final String description;
  final List<MentorBooking> bookings;
}

class _Bullet extends StatelessWidget {
  const _Bullet({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• '),
          Expanded(
            child: Text(
              text,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }
}

class MentorAvailabilityTab extends ConsumerStatefulWidget {
  const MentorAvailabilityTab({super.key, required this.saving, required this.controller});

  final bool saving;
  final MentorshipController controller;

  @override
  ConsumerState<MentorAvailabilityTab> createState() => _MentorAvailabilityTabState();
}

class _MentorAvailabilityTabState extends ConsumerState<MentorAvailabilityTab> {
  static const _days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  final List<MentorAvailabilitySlot> _slots = [];
  String _selectedDay = _days.first;
  DateTime? _start;
  DateTime? _end;
  final TextEditingController _formatController = TextEditingController(text: '1:1 session');
  final TextEditingController _capacityController = TextEditingController(text: '1');
  String? _error;

  @override
  void initState() {
    super.initState();
    final state = ref.read(mentorshipControllerProvider);
    _hydrate(state.data?.availability ?? const <MentorAvailabilitySlot>[]);
    ref.listen<ResourceState<MentorDashboard>>(mentorshipControllerProvider, (previous, next) {
      final previousSlots = previous?.data?.availability ?? const <MentorAvailabilitySlot>[];
      final nextSlots = next.data?.availability ?? const <MentorAvailabilitySlot>[];
      if (!_listEquals(previousSlots, nextSlots)) {
        _hydrate(nextSlots);
      }
    });
  }

  @override
  void dispose() {
    _formatController.dispose();
    _capacityController.dispose();
    super.dispose();
  }

  void _hydrate(List<MentorAvailabilitySlot> slots) {
    setState(() {
      _slots
        ..clear()
        ..addAll(slots);
    });
  }

  Future<void> _pickStart() async {
    final picked = await _pickDateTime(initial: _start ?? DateTime.now());
    if (picked != null) {
      setState(() {
        _start = picked;
      });
    }
  }

  Future<void> _pickEnd() async {
    final base = _start ?? DateTime.now();
    final picked = await _pickDateTime(initial: _end ?? base.add(const Duration(hours: 1)));
    if (picked != null) {
      setState(() {
        _end = picked;
      });
    }
  }

  Future<DateTime?> _pickDateTime({required DateTime initial}) async {
    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime.now().subtract(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date == null) {
      return null;
    }
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initial),
    );
    if (time == null) {
      return null;
    }
    return DateTime(date.year, date.month, date.day, time.hour, time.minute);
  }

  void _addSlot() {
    setState(() {
      _error = null;
    });
    if (_start == null || _end == null) {
      setState(() {
        _error = 'Select both start and end times for the slot.';
      });
      return;
    }
    if (!_end!.isAfter(_start!)) {
      setState(() {
        _error = 'End time must be later than the start time.';
      });
      return;
    }
    final capacityValue = int.tryParse(_capacityController.text.trim()) ?? 1;
    final capacity = capacityValue.clamp(1, 1000).toInt();
    final slot = MentorAvailabilitySlot(
      id: '${_selectedDay}-${_start!.toIso8601String()}-${_end!.toIso8601String()}-${_formatController.text.trim()}',
      day: _selectedDay,
      start: _start!,
      end: _end!,
      format: _formatController.text.trim().isEmpty ? '1:1 session' : _formatController.text.trim(),
      capacity: capacity ?? 1,
    );
    setState(() {
      _slots.add(slot);
      _start = null;
      _end = null;
    });
  }

  Future<void> _save() async {
    try {
      await widget.controller.saveAvailability(_slots);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Availability updated.')),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to save availability: $error')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        GigvoraCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Availability & formats', style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 4),
                        Text(
                          'Publish recurring office hours or ad-hoc mentorship sessions. These slots sync to Explorer and the mentee booking flow.',
                          style: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                  FilledButton(
                    onPressed: widget.saving ? null : _save,
                    child: widget.saving
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Text('Save availability'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedDay,
                decoration: const InputDecoration(labelText: 'Day of week'),
                items: _days.map((day) => DropdownMenuItem(value: day, child: Text(day))).toList(),
                onChanged: (value) {
                  if (value != null) {
                    setState(() {
                      _selectedDay = value;
                    });
                  }
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _formatController,
                decoration: const InputDecoration(labelText: 'Session format'),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _DateTimeField(
                      label: 'Start time',
                      value: _start,
                      onTap: _pickStart,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _DateTimeField(
                      label: 'End time',
                      value: _end,
                      onTap: _pickEnd,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _capacityController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Seats per slot'),
              ),
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerLeft,
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.add),
                  label: const Text('Add slot'),
                  onPressed: _addSlot,
                ),
              ),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Text(
                    _error!,
                    style: const TextStyle(color: Color(0xFFB91C1C)),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        GigvoraCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Published slots', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              if (_slots.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
                  ),
                  child: Text(
                    'No availability published yet. Add at least one slot to go live on Explorer.',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                )
              else
                Column(
                  children: _slots
                      .map(
                        (slot) => Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(20),
                            color: const Color(0xFFF8FAFC),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(slot.day, style: Theme.of(context).textTheme.titleSmall),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${_formatSessionTime(slot.start)} – ${_formatSessionTime(slot.end)} • ${slot.format} • ${slot.capacity} seats',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodyMedium
                                          ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                                    ),
                                  ],
                                ),
                              ),
                              IconButton(
                                tooltip: 'Remove slot',
                                onPressed: () {
                                  setState(() {
                                    _slots.removeWhere((item) => item.id == slot.id);
                                  });
                                },
                                icon: const Icon(Icons.delete_outline),
                              ),
                            ],
                          ),
                        ),
                      )
                      .toList(growable: false),
                ),
            ],
          ),
        ),
      ],
    );
  }

  bool _listEquals(List<MentorAvailabilitySlot> a, List<MentorAvailabilitySlot> b) {
    if (identical(a, b)) {
      return true;
    }
    if (a.length != b.length) {
      return false;
    }
    for (var i = 0; i < a.length; i++) {
      final left = a[i];
      final right = b[i];
      if (left.id != right.id ||
          left.day != right.day ||
          left.start != right.start ||
          left.end != right.end ||
          left.format != right.format ||
          left.capacity != right.capacity) {
        return false;
      }
    }
    return true;
  }
}

class _DateTimeField extends StatelessWidget {
  const _DateTimeField({required this.label, required this.value, required this.onTap});

  final String label;
  final DateTime? value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          border: const OutlineInputBorder(),
        ),
        child: Text(value == null ? 'Select…' : _formatSessionTime(value!),
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: value == null ? Theme.of(context).hintColor : null)),
      ),
    );
  }
}

class MentorPackagesTab extends ConsumerStatefulWidget {
  const MentorPackagesTab({super.key, required this.saving, required this.controller});

  final bool saving;
  final MentorshipController controller;

  @override
  ConsumerState<MentorPackagesTab> createState() => _MentorPackagesTabState();
}

class _MentorPackagesTabState extends ConsumerState<MentorPackagesTab> {
  final List<MentorPackage> _packages = [];

  @override
  void initState() {
    super.initState();
    final state = ref.read(mentorshipControllerProvider);
    _hydrate(state.data?.packages ?? const <MentorPackage>[]);
    ref.listen<ResourceState<MentorDashboard>>(mentorshipControllerProvider, (previous, next) {
      final previousPackages = previous?.data?.packages ?? const <MentorPackage>[];
      final nextPackages = next.data?.packages ?? const <MentorPackage>[];
      if (!_packageEquals(previousPackages, nextPackages)) {
        _hydrate(nextPackages);
      }
    });
  }

  void _hydrate(List<MentorPackage> packages) {
    setState(() {
      _packages
        ..clear()
        ..addAll(packages);
    });
  }

  Future<void> _save() async {
    try {
      await widget.controller.savePackages(_packages);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Packages updated.')),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to save packages: $error')),
        );
      }
    }
  }

  Future<void> _addOrEditPackage([MentorPackage? initial]) async {
    final result = await showDialog<MentorPackage>(
      context: context,
      builder: (context) => _PackageDialog(initial: initial),
    );
    if (result != null) {
      setState(() {
        final index = _packages.indexWhere((pkg) => pkg.id == result.id);
        if (index >= 0) {
          _packages[index] = result;
        } else {
          _packages.add(result);
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        GigvoraCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Mentorship packages', style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 4),
                        Text(
                          'Bundle sessions and rituals into offerings that mentees can book instantly from Explorer.',
                          style: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                  Row(
                    children: [
                      IconButton(
                        tooltip: 'Add package',
                        onPressed: () => _addOrEditPackage(),
                        icon: const Icon(Icons.add_circle_outline),
                      ),
                      const SizedBox(width: 4),
                      FilledButton(
                        onPressed: widget.saving ? null : _save,
                        child: widget.saving
                            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                            : const Text('Save packages'),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (_packages.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
                  ),
                  child: Text(
                    'No packages published yet. Add at least one to showcase your mentorship programmes.',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                )
              else
                Column(
                  children: _packages
                      .map(
                        (pack) => Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(20),
                            color: const Color(0xFFF8FAFC),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(pack.name, style: Theme.of(context).textTheme.titleMedium),
                                        const SizedBox(height: 4),
                                        Text(
                                          pack.description,
                                          style: Theme.of(context)
                                              .textTheme
                                              .bodySmall
                                              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                                        ),
                                      ],
                                    ),
                                  ),
                                  IconButton(
                                    tooltip: 'Edit package',
                                    onPressed: () => _addOrEditPackage(pack),
                                    icon: const Icon(Icons.edit_outlined),
                                  ),
                                  IconButton(
                                    tooltip: 'Remove package',
                                    onPressed: () {
                                      setState(() {
                                        _packages.removeWhere((item) => item.id == pack.id);
                                      });
                                    },
                                    icon: const Icon(Icons.delete_outline),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Wrap(
                                spacing: 12,
                                runSpacing: 8,
                                children: [
                                  Chip(label: Text('${pack.sessions} sessions')),
                                  Chip(label: Text(pack.format.isEmpty ? 'Hybrid' : pack.format)),
                                  Chip(label: Text('${pack.currency}${_formatNumber(pack.price)}')),
                                ],
                              ),
                              if (pack.outcome.isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(top: 8),
                                  child: Text(
                                    pack.outcome,
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodySmall
                                        ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      )
                      .toList(growable: false),
                ),
            ],
          ),
        ),
      ],
    );
  }

  bool _packageEquals(List<MentorPackage> a, List<MentorPackage> b) {
    if (identical(a, b)) {
      return true;
    }
    if (a.length != b.length) {
      return false;
    }
    for (var i = 0; i < a.length; i++) {
      final left = a[i];
      final right = b[i];
      if (left.id != right.id ||
          left.name != right.name ||
          left.description != right.description ||
          left.sessions != right.sessions ||
          left.price != right.price ||
          left.currency != right.currency ||
          left.format != right.format ||
          left.outcome != right.outcome) {
        return false;
      }
    }
    return true;
  }
}

class _PackageDialog extends StatefulWidget {
  const _PackageDialog({this.initial});

  final MentorPackage? initial;

  @override
  State<_PackageDialog> createState() => _PackageDialogState();
}

class _PackageDialogState extends State<_PackageDialog> {
  late final TextEditingController _nameController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _sessionsController;
  late final TextEditingController _priceController;
  late final TextEditingController _currencyController;
  late final TextEditingController _formatController;
  late final TextEditingController _outcomeController;
  String? _error;

  @override
  void initState() {
    super.initState();
    final initial = widget.initial;
    _nameController = TextEditingController(text: initial?.name ?? '');
    _descriptionController = TextEditingController(text: initial?.description ?? '');
    _sessionsController = TextEditingController(text: initial?.sessions.toString() ?? '3');
    _priceController = TextEditingController(text: initial?.price.toString() ?? '0');
    _currencyController = TextEditingController(text: initial?.currency.isNotEmpty == true ? initial!.currency : '£');
    _formatController = TextEditingController(text: initial?.format ?? 'Hybrid');
    _outcomeController = TextEditingController(text: initial?.outcome ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _sessionsController.dispose();
    _priceController.dispose();
    _currencyController.dispose();
    _formatController.dispose();
    _outcomeController.dispose();
    super.dispose();
  }

  void _submit() {
    setState(() {
      _error = null;
    });
    if (_nameController.text.trim().isEmpty) {
      setState(() {
        _error = 'Package name is required.';
      });
      return;
    }
    final sessions = int.tryParse(_sessionsController.text.trim());
    if (sessions == null || sessions <= 0) {
      setState(() {
        _error = 'Provide a valid number of sessions.';
      });
      return;
    }
    final price = num.tryParse(_priceController.text.trim()) ?? 0;
    final currency = _currencyController.text.trim().isEmpty ? '£' : _currencyController.text.trim();
    final id = widget.initial?.id ?? _nameController.text.trim().toLowerCase().replaceAll(' ', '-');
    Navigator.of(context).pop(
      MentorPackage(
        id: id,
        name: _nameController.text.trim(),
        description: _descriptionController.text.trim(),
        sessions: sessions,
        price: price,
        currency: currency,
        format: _formatController.text.trim(),
        outcome: _outcomeController.text.trim(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.initial == null ? 'Add mentorship package' : 'Edit mentorship package'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Package name'),
            ),
            TextField(
              controller: _descriptionController,
              decoration: const InputDecoration(labelText: 'Description'),
            ),
            TextField(
              controller: _sessionsController,
              decoration: const InputDecoration(labelText: 'Number of sessions'),
              keyboardType: TextInputType.number,
            ),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _priceController,
                    decoration: const InputDecoration(labelText: 'Price'),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  ),
                ),
                const SizedBox(width: 12),
                SizedBox(
                  width: 80,
                  child: TextField(
                    controller: _currencyController,
                    decoration: const InputDecoration(labelText: 'Currency'),
                  ),
                ),
              ],
            ),
            TextField(
              controller: _formatController,
              decoration: const InputDecoration(labelText: 'Format'),
            ),
            TextField(
              controller: _outcomeController,
              decoration: const InputDecoration(labelText: 'Outcome'),
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(_error!, style: const TextStyle(color: Color(0xFFB91C1C))),
              ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _submit,
          child: const Text('Save'),
        ),
      ],
    );
  }
}

class _ResourcesTab extends StatelessWidget {
  const _ResourcesTab({required this.dashboard});

  final MentorDashboard dashboard;

  @override
  Widget build(BuildContext context) {
    final placement = dashboard.explorerPlacement;

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        GigvoraCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Explorer placement', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 4),
              Text(
                'Your mentor profile ranks in Explorer based on responsiveness, feedback quality, and package clarity.',
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 16),
              if (placement != null) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Score',
                        style: Theme.of(context)
                            .textTheme
                            .labelLarge
                            ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                    Text('${placement.score}/100',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Placement',
                        style: Theme.of(context)
                            .textTheme
                            .labelLarge
                            ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                    Text(placement.position,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                  ],
                ),
                if (placement.nextActions.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.only(top: 16),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Next actions'.toUpperCase(),
                            style: Theme.of(context)
                                .textTheme
                                .labelSmall
                                ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 8),
                        ...placement.nextActions
                            .map((action) => Padding(
                                  padding: const EdgeInsets.only(bottom: 6),
                                  child: Text(action, style: Theme.of(context).textTheme.bodyMedium),
                                ))
                            .toList(),
                      ],
                    ),
                  ),
              ]
              else
                Text(
                  'Explorer ranking data will appear once your first mentees leave feedback.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        GigvoraCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Mentor resource hub', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              const _ResourceLink(
                title: 'Mentor playbook',
                description: 'Frameworks for onboarding mentees, defining outcomes, and measuring progress.',
              ),
              const SizedBox(height: 12),
              const _ResourceLink(
                title: 'Automation toolkit',
                description: 'Templates for calendar routing, Loom feedback workflows, and billing automation.',
              ),
              const SizedBox(height: 12),
              const _ResourceLink(
                title: 'Mentor guild community',
                description: 'Swap playbooks with other mentors, host clinics, and share best practices.',
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ResourceLink extends StatelessWidget {
  const _ResourceLink({required this.title, required this.description});

  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleSmall?.copyWith(color: Theme.of(context).colorScheme.primary)),
        const SizedBox(height: 4),
        Text(description, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

String _formatNumber(num value) {
  if (value.abs() >= 1000) {
    return value.toStringAsFixed(0);
  }
  if (value % 1 == 0) {
    return value.toStringAsFixed(0);
  }
  return value.toStringAsFixed(1);
}

String _formatSessionTime(DateTime date) {
  final hour = date.hour % 12 == 0 ? 12 : date.hour % 12;
  final minute = date.minute.toString().padLeft(2, '0');
  final period = date.hour >= 12 ? 'PM' : 'AM';
  return '${date.day.toString().padLeft(2, '0')} ${_monthLabel(date.month)} • $hour:$minute $period';
}

String _monthLabel(int month) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return months[(month - 1).clamp(0, 11)];
}
