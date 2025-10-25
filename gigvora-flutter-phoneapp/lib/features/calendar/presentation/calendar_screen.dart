import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../theme/widgets.dart';
import '../../auth/application/session_controller.dart';
import '../application/calendar_controller.dart';
import '../data/calendar_constants.dart';
import '../data/models/calendar_event.dart';
import '../data/models/calendar_focus_session.dart';
import '../data/models/calendar_integration.dart';
import '../data/models/calendar_settings.dart';
import '../data/models/calendar_overview.dart';
import '../data/timezone_options.dart';

class CalendarScreen extends ConsumerStatefulWidget {
  const CalendarScreen({super.key});

  @override
  ConsumerState<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends ConsumerState<CalendarScreen> {
  late DateTime _focusedDay;
  late String _selectedTimeZone;

  @override
  void initState() {
    super.initState();
    final controller = ref.read(calendarControllerProvider.notifier);
    _focusedDay = controller.rangeStart;
    _selectedTimeZone = controller.timeZone;
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionControllerProvider).session;
    final controller = ref.read(calendarControllerProvider.notifier);
    final state = ref.watch(calendarControllerProvider);
    final overview = state.data;
    final events = overview?.events ?? const <CalendarEvent>[];
    final router = GoRouter.of(context);

    final grouped = <String, List<CalendarEvent>>{};
    for (final event in events) {
      grouped.putIfAbsent(event.dayKey, () => <CalendarEvent>[]).add(event);
    }

    final sortedKeys = grouped.keys.toList()..sort();

    return GigvoraScaffold(
      title: 'Team calendar',
      subtitle: 'Scheduling across ${controller.timeZone}',
      useAppDrawer: true,
      actions: [
        IconButton(
          tooltip: 'Refresh events',
          onPressed: controller.refresh,
          icon: const Icon(Icons.refresh),
        ),
      ],
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (state.loading) const LinearProgressIndicator(),
          _CalendarHeader(
            focusedDay: _focusedDay,
            onPrevious: () {
              final previous = DateTime(_focusedDay.year, _focusedDay.month - 1, 1);
              setState(() => _focusedDay = previous);
              controller.focusMonth(previous);
            },
            onNext: () {
              final next = DateTime(_focusedDay.year, _focusedDay.month + 1, 1);
              setState(() => _focusedDay = next);
              controller.focusMonth(next);
            },
          ),
          const SizedBox(height: 16),
          if (controller.isAuthenticated)
            _TimeZonePicker(
              value: _selectedTimeZone,
              onChanged: (value) async {
                setState(() => _selectedTimeZone = value);
                await controller.updateTimeZone(value);
              },
            ),
          if (session != null) ...[
            const SizedBox(height: 16),
            _PersonaBanner(
              name: session.name,
              email: session.email,
              activeMembership: session.activeMembership,
            ),
          ],
          if (state.fromCache)
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: _StatusBanner(
                icon: Icons.offline_bolt,
                background: const Color(0xFFFEF3C7),
                foreground: const Color(0xFFB45309),
                message:
                    'Showing cached ${controller.timeZone} schedule. We\'ll sync fresh meetings as soon as connectivity resumes.',
              ),
            ),
          if (state.hasError)
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: _StatusBanner(
                icon: Icons.error_outline,
                background: const Color(0xFFFEE2E2),
                foreground: Theme.of(context).colorScheme.error,
                message: 'Unable to refresh events. Pull down to retry.',
              ),
            ),
          if (overview != null) ...[
            const SizedBox(height: 16),
            _OverviewStats(stats: overview.stats),
            const SizedBox(height: 16),
            _FocusSessionsSection(
              sessions: overview.focusSessions,
              onCreate: () => _openFocusSessionEditor(controller),
              onEdit: (session) => _openFocusSessionEditor(controller, session: session),
              onToggleCompletion: (session, completed) =>
                  _toggleFocusSession(controller, session, completed),
              onDelete: (session) => _deleteFocusSession(controller, session),
            ),
            if (overview.integrations.isNotEmpty) ...[
              const SizedBox(height: 16),
              _IntegrationsSection(integrations: overview.integrations),
            ],
          ],
          const SizedBox(height: 16),
          Expanded(
            child: RefreshIndicator(
              onRefresh: controller.refresh,
              child: events.isEmpty
                  ? ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: const [
                        _EmptyState(),
                      ],
                    )
                  : ListView.builder(
                      physics: const AlwaysScrollableScrollPhysics(),
                      itemCount: sortedKeys.length,
                      itemBuilder: (context, index) {
                        final key = sortedKeys[index];
                        final dayEvents = grouped[key]!;
                        final date = DateTime.parse('$keyT00:00:00.000');
                        return _DaySection(
                          date: date,
                          events: dayEvents,
                          onEdit: (event) => _openEditor(controller, overview?.settings ?? CalendarSettings.fromJson(null), event: event),
                          onDelete: controller.delete,
                          timezone: controller.timeZone,
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openEditor(controller, overview?.settings ?? CalendarSettings.fromJson(null)),
        icon: const Icon(Icons.add),
        label: const Text('Schedule'),
      ),
      navigationDestinations: const [
        GigvoraNavigationDestination(
          label: 'Home',
          icon: Icon(Icons.home_outlined),
          selectedIcon: Icon(Icons.home),
          route: '/home',
        ),
        GigvoraNavigationDestination(
          label: 'Calendar',
          icon: Icon(Icons.event_available_outlined),
          selectedIcon: Icon(Icons.event_available),
          route: '/calendar',
        ),
        GigvoraNavigationDestination(
          label: 'Marketplace',
          icon: Icon(Icons.storefront_outlined),
          selectedIcon: Icon(Icons.storefront),
          route: '/gigs',
        ),
        GigvoraNavigationDestination(
          label: 'Profile',
          icon: Icon(Icons.person_outline),
          selectedIcon: Icon(Icons.person),
          route: '/profile',
        ),
      ],
      selectedDestination: 1,
      onDestinationSelected: (index) {
        const destinations = ['/home', '/calendar', '/gigs', '/profile'];
        final route = destinations[index];
        if (router.location != route) {
          context.go(route);
        }
      },
    );
  }

  Future<void> _openEditor(
    CalendarController controller,
    CalendarSettings settings, {
    CalendarEvent? event,
  }) async {
    final result = await showModalBottomSheet<CalendarEvent>(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return _CalendarEventSheet(
          event: event,
          settings: settings,
        );
      },
    );

    if (result == null) {
      return;
    }

    try {
      if (event == null) {
        await controller.create(result);
      } else {
        await controller.update(result);
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(event == null ? 'Event scheduled.' : 'Event updated.')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unable to persist event. $error')),
      );
    }
  }

  Future<void> _openFocusSessionEditor(
    CalendarController controller, {
    CalendarFocusSession? session,
  }) async {
    final result = await showModalBottomSheet<CalendarFocusSession>(
      context: context,
      isScrollControlled: true,
      builder: (context) => _FocusSessionSheet(session: session),
    );

    if (result == null) {
      return;
    }

    try {
      if (session == null) {
        await controller.createFocusSession(result);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Focus session logged.')),
        );
      } else {
        await controller.updateFocusSession(result);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Focus session updated.')),
        );
      }
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unable to persist focus session. $error')),
      );
    }
  }

  Future<void> _deleteFocusSession(
    CalendarController controller,
    CalendarFocusSession session,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete focus session'),
        content: Text(
          'Remove the ${session.focusType.replaceAll('_', ' ')} session logged on '
          '${DateFormat.yMMMd().add_jm().format(session.startedAtLocal)}?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton.tonal(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) {
      return;
    }
    try {
      await controller.deleteFocusSession(session);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Focus session removed.')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unable to delete focus session. $error')),
      );
    }
  }

  Future<void> _toggleFocusSession(
    CalendarController controller,
    CalendarFocusSession session,
    bool completed,
  ) async {
    try {
      await controller.toggleFocusSessionCompletion(session, completed);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            completed ? 'Focus session marked complete.' : 'Focus session reopened.',
          ),
        ),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unable to update focus session. $error')),
      );
    }
  }
}

class _CalendarHeader extends StatelessWidget {
  const _CalendarHeader({
    required this.focusedDay,
    required this.onPrevious,
    required this.onNext,
  });

  final DateTime focusedDay;
  final VoidCallback onPrevious;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    final monthLabel = DateFormat.yMMMM().format(focusedDay);
    return Row(
      children: [
        Expanded(
          child: Text(
            monthLabel,
            style: Theme.of(context).textTheme.headlineSmall,
          ),
        ),
        IconButton(
          tooltip: 'Previous month',
          onPressed: onPrevious,
          icon: const Icon(Icons.chevron_left),
        ),
        IconButton(
          tooltip: 'Next month',
          onPressed: onNext,
          icon: const Icon(Icons.chevron_right),
        ),
      ],
    );
  }
}

class _OverviewStats extends StatelessWidget {
  const _OverviewStats({required this.stats});

  final CalendarOverviewStats stats;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return GigvoraCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Overview', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              _StatTile(label: 'Total events', value: stats.totalEvents.toString()),
              _StatTile(label: 'Upcoming', value: stats.upcomingEvents.toString()),
              if (stats.nextEvent != null)
                _StatTile(
                  label: 'Next event',
                  value: DateFormat.yMMMd().add_jm().format(stats.nextEvent!.startsAtLocal),
                ),
              if (stats.eventsByType.isNotEmpty)
                _StatTile(
                  label: 'Top category',
                  value: stats.eventsByType.entries
                      .reduce((a, b) => a.value >= b.value ? a : b)
                      .key
                      .replaceAll('_', ' '),
                ),
            ],
          ),
          if (stats.eventsByType.isNotEmpty) ...[
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: stats.eventsByType.entries
                  .map(
                    (entry) => Chip(
                      label: Text('${entry.key.replaceAll('_', ' ')} • ${entry.value}'),
                      avatar: const Icon(Icons.event_outlined),
                    ),
                  )
                  .toList(growable: false),
            ),
          ],
        ],
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: colorScheme.surfaceVariant.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: Theme.of(context)
                .textTheme
                .labelMedium
                ?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ],
      ),
    );
  }
}

class _FocusSessionsSection extends StatelessWidget {
  const _FocusSessionsSection({
    required this.sessions,
    required this.onCreate,
    required this.onEdit,
    required this.onToggleCompletion,
    required this.onDelete,
  });

  final List<CalendarFocusSession> sessions;
  final VoidCallback onCreate;
  final Future<void> Function(CalendarFocusSession) onEdit;
  final Future<void> Function(CalendarFocusSession, bool) onToggleCompletion;
  final Future<void> Function(CalendarFocusSession) onDelete;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final hasSessions = sessions.isNotEmpty;
    return GigvoraCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Focus sessions',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              TextButton.icon(
                onPressed: onCreate,
                icon: const Icon(Icons.add_task_outlined),
                label: const Text('Log session'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (!hasSessions)
            Text(
              'Track deep work, outreach, and accountability blocks right from mobile.',
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: colorScheme.onSurfaceVariant),
            )
          else
            ...sessions.map(
              (session) => _FocusSessionTile(
                session: session,
                onEdit: onEdit,
                onToggleCompletion: onToggleCompletion,
                onDelete: onDelete,
              ),
            ),
        ],
      ),
    );
  }
}

class _FocusSessionTile extends StatelessWidget {
  const _FocusSessionTile({
    required this.session,
    required this.onEdit,
    required this.onToggleCompletion,
    required this.onDelete,
  });

  final CalendarFocusSession session;
  final Future<void> Function(CalendarFocusSession) onEdit;
  final Future<void> Function(CalendarFocusSession, bool) onToggleCompletion;
  final Future<void> Function(CalendarFocusSession) onDelete;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final duration = session.durationMinutes;
    final durationLabel = duration != null && duration > 0 ? '$duration min' : null;
    final notes = session.notes;
    final startLabel = DateFormat.yMMMd().add_jm().format(session.startedAtLocal);
    final end = session.endedAtLocal;
    final rangeLabel = end != null
        ? '$startLabel → ${DateFormat.jm().format(end)}'
        : startLabel;
    final subtitleChildren = <Widget>[];
    if (durationLabel != null) {
      subtitleChildren.add(
        Text(
          durationLabel,
          style: Theme.of(context)
              .textTheme
              .labelMedium
              ?.copyWith(color: colorScheme.onSurfaceVariant),
        ),
      );
    }
    if (notes != null && notes.isNotEmpty) {
      if (subtitleChildren.isNotEmpty) {
        subtitleChildren.add(const SizedBox(height: 4));
      }
      subtitleChildren.add(Text(notes, style: Theme.of(context).textTheme.bodySmall));
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        contentPadding: EdgeInsets.zero,
        leading: Checkbox(
          value: session.completed,
          onChanged: (value) async {
            if (value == null) {
              return;
            }
            await onToggleCompletion(session, value);
          },
        ),
        title: Text(
          '${session.focusType.replaceAll('_', ' ')} • $rangeLabel',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        subtitle: subtitleChildren.isEmpty
            ? null
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: subtitleChildren,
              ),
        trailing: PopupMenuButton<_FocusSessionAction>(
          tooltip: 'More',
          onSelected: (action) async {
            switch (action) {
              case _FocusSessionAction.edit:
                await onEdit(session);
                break;
              case _FocusSessionAction.delete:
                await onDelete(session);
                break;
            }
          },
          itemBuilder: (context) => const [
            PopupMenuItem<_FocusSessionAction>(
              value: _FocusSessionAction.edit,
              child: Text('Edit'),
            ),
            PopupMenuItem<_FocusSessionAction>(
              value: _FocusSessionAction.delete,
              child: Text('Delete'),
            ),
          ],
        ),
        onTap: () => onEdit(session),
      ),
    );
  }
}

enum _FocusSessionAction { edit, delete }

class _FocusSessionSheet extends StatefulWidget {
  const _FocusSessionSheet({this.session});

  final CalendarFocusSession? session;

  @override
  State<_FocusSessionSheet> createState() => _FocusSessionSheetState();
}

class _FocusSessionSheetState extends State<_FocusSessionSheet> {
  late final TextEditingController _notesController;
  late final TextEditingController _durationController;
  late DateTime _startedAt;
  DateTime? _endedAt;
  late String _focusType;
  bool _completed = false;

  @override
  void initState() {
    super.initState();
    final session = widget.session;
    _notesController = TextEditingController(text: session?.notes ?? '');
    _durationController = TextEditingController(
      text: session?.durationMinutes == null ? '' : '${session!.durationMinutes}',
    );
    _startedAt = session?.startedAtLocal ?? DateTime.now();
    _endedAt = session?.endedAtLocal;
    _focusType = session?.focusType ?? focusSessionTypes.first;
    _completed = session?.completed ?? false;
  }

  @override
  void dispose() {
    _notesController.dispose();
    _durationController.dispose();
    super.dispose();
  }

  Future<void> _pickStart() async {
    final date = await showDatePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
      initialDate: _startedAt,
    );
    if (date == null) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_startedAt),
    );
    if (time == null) return;
    setState(() {
      _startedAt = DateTime(date.year, date.month, date.day, time.hour, time.minute);
      if (_endedAt != null && _endedAt!.isBefore(_startedAt)) {
        _endedAt = _completed ? _startedAt.add(const Duration(hours: 1)) : null;
      }
    });
  }

  Future<void> _pickEnd() async {
    final currentEnd = _endedAt ?? _startedAt.add(const Duration(hours: 1));
    final date = await showDatePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
      initialDate: currentEnd,
    );
    if (date == null) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(currentEnd),
    );
    if (time == null) return;
    setState(() {
      _endedAt = DateTime(date.year, date.month, date.day, time.hour, time.minute);
      if (_endedAt!.isBefore(_startedAt)) {
        _endedAt = _startedAt.add(const Duration(minutes: 30));
      }
    });
  }

  Future<void> _submit() async {
    final durationText = _durationController.text.trim();
    final parsedDuration = durationText.isEmpty ? null : int.tryParse(durationText);
    if (parsedDuration != null && parsedDuration < 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Duration must be zero or greater.')),
      );
      return;
    }
    if (_completed) {
      if (_endedAt == null) {
        _endedAt = _startedAt.add(const Duration(hours: 1));
      }
      if (_endedAt!.isBefore(_startedAt)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('End time must be after the start time.')),
        );
        return;
      }
    } else {
      _endedAt = null;
    }

    int? resolvedDuration = parsedDuration;
    if (_completed && resolvedDuration == null && _endedAt != null) {
      final diff = _endedAt!.difference(_startedAt).inMinutes;
      if (diff > 0) {
        resolvedDuration = diff;
      }
    }

    final notes = _notesController.text.trim();
    final session = CalendarFocusSession(
      id: widget.session?.id,
      focusType: _focusType,
      startedAt: _startedAt,
      endedAt: _endedAt,
      durationMinutes: resolvedDuration,
      completed: _completed,
      notes: notes.isEmpty ? null : notes,
      metadata: widget.session?.metadata ?? const <String, dynamic>{},
    );
    if (!mounted) return;
    Navigator.of(context).pop(session);
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              widget.session == null ? 'Log focus session' : 'Update focus session',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _focusType,
              decoration: const InputDecoration(
                labelText: 'Focus type',
                prefixIcon: Icon(Icons.category_outlined),
              ),
              items: [
                for (final value in focusSessionTypes)
                  DropdownMenuItem(
                    value: value,
                    child: Text(value.replaceAll('_', ' ')),
                  ),
              ],
              onChanged: (value) {
                if (value == null) return;
                setState(() => _focusType = value);
              },
            ),
            const SizedBox(height: 12),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.play_arrow_outlined),
              title: const Text('Started at'),
              subtitle: Text(DateFormat.yMMMd().add_jm().format(_startedAt)),
              onTap: _pickStart,
            ),
            SwitchListTile.adaptive(
              contentPadding: EdgeInsets.zero,
              value: _completed,
              title: const Text('Session completed'),
              subtitle: const Text('Mark complete to capture end time and duration'),
              onChanged: (value) {
                setState(() {
                  _completed = value;
                  if (!value) {
                    _endedAt = null;
                  }
                });
              },
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.stop_circle_outlined),
              title: const Text('Ended at'),
              subtitle: Text(
                _endedAt == null
                    ? 'Not set'
                    : DateFormat.yMMMd().add_jm().format(_endedAt!),
              ),
              onTap: _completed ? _pickEnd : null,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _durationController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Duration (minutes)',
                helperText: 'Optional. Leave blank to calculate automatically.',
                prefixIcon: Icon(Icons.timer_outlined),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _notesController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Notes',
                prefixIcon: Icon(Icons.notes_outlined),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Cancel'),
                ),
                const SizedBox(width: 12),
                FilledButton(
                  onPressed: _submit,
                  child: Text(widget.session == null ? 'Save session' : 'Save changes'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _IntegrationsSection extends StatelessWidget {
  const _IntegrationsSection({required this.integrations});

  final List<CalendarIntegration> integrations;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return GigvoraCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Connected calendars', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          ...integrations.map(
            (integration) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Icon(Icons.link, size: 18, color: colorScheme.primary),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      integration.externalAccount ?? integration.provider,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: colorScheme.secondaryContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      integration.status.replaceAll('_', ' '),
                      style: Theme.of(context)
                          .textTheme
                          .labelSmall
                          ?.copyWith(color: colorScheme.onSecondaryContainer),
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
}

class _DaySection extends StatelessWidget {
  const _DaySection({
    required this.date,
    required this.events,
    required this.onEdit,
    required this.onDelete,
    required this.timezone,
  });

  final DateTime date;
  final List<CalendarEvent> events;
  final Future<void> Function(CalendarEvent) onEdit;
  final Future<void> Function(CalendarEvent) onDelete;
  final String timezone;

  @override
  Widget build(BuildContext context) {
    final label = DateFormat.EEEE().add_yMMMMd().format(date);
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(color: colorScheme.primary, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          ...events.map(
            (event) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _EventCard(
                event: event,
                onEdit: onEdit,
                onDelete: onDelete,
                timezone: timezone,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

enum _EventCardAction { copyIcs }

class _EventCard extends StatelessWidget {
  const _EventCard({
    required this.event,
    required this.onEdit,
    required this.onDelete,
    required this.timezone,
  });

  final CalendarEvent event;
  final Future<void> Function(CalendarEvent) onEdit;
  final Future<void> Function(CalendarEvent) onDelete;
  final String timezone;

  @override
  Widget build(BuildContext context) {
    final timeRange = event.formatTimeRange();
    final colorScheme = Theme.of(context).colorScheme;
    return Dismissible(
      key: ValueKey(event.id ?? '${event.startsAt.millisecondsSinceEpoch}:${event.title}'),
      direction: DismissDirection.endToStart,
      background: Container(
        decoration: BoxDecoration(
          color: colorScheme.errorContainer,
          borderRadius: BorderRadius.circular(20),
        ),
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Icon(Icons.delete_outline, color: colorScheme.onErrorContainer),
      ),
      confirmDismiss: (_) async {
        final confirmed = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Delete event'),
            content: Text('Remove ${event.title}? This action cannot be undone.'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: const Text('Cancel'),
              ),
              FilledButton.tonal(
                onPressed: () => Navigator.of(context).pop(true),
                child: const Text('Delete'),
              ),
            ],
          ),
        );
        if (confirmed == true) {
          await onDelete(event);
        }
        return confirmed ?? false;
      },
      child: GigvoraCard(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    event.title,
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ),
                IconButton(
                  tooltip: 'Edit event',
                  onPressed: () => onEdit(event),
                  icon: const Icon(Icons.edit_outlined),
                ),
                PopupMenuButton<_EventCardAction>(
                  tooltip: 'More actions',
                  onSelected: (action) async {
                    if (action == _EventCardAction.copyIcs) {
                      await Clipboard.setData(
                        ClipboardData(text: event.toIcs(timezone: timezone)),
                      );
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('ICS invite copied to clipboard.')),
                        );
                      }
                    }
                  },
                  itemBuilder: (context) => const [
                    PopupMenuItem(
                      value: _EventCardAction.copyIcs,
                      child: Text('Copy ICS invite'),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              timeRange,
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 12,
              runSpacing: 8,
              children: [
                _EventMetaPill(icon: Icons.category_outlined, label: event.eventType.replaceAll('_', ' ')),
                _EventMetaPill(icon: Icons.visibility_outlined, label: event.visibility),
                _EventMetaPill(icon: Icons.sync_alt_outlined, label: event.source),
              ],
            ),
            if (event.location?.isNotEmpty ?? false) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.location_on_outlined, size: 18, color: colorScheme.primary),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      event.location!,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
            ],
            if (event.videoConferenceLink?.isNotEmpty ?? false) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.videocam_outlined, size: 18, color: colorScheme.primary),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      event.videoConferenceLink!,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
            ],
            if (event.description?.isNotEmpty ?? false) ...[
              const SizedBox(height: 12),
              Text(
                event.description!,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _EventMetaPill extends StatelessWidget {
  const _EventMetaPill({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: colorScheme.surfaceVariant.withOpacity(0.45),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: colorScheme.primary),
          const SizedBox(width: 6),
          Text(
            label,
            style: Theme.of(context).textTheme.labelMedium,
          ),
        ],
      ),
    );
  }
}

class _TimeZonePicker extends StatelessWidget {
  const _TimeZonePicker({required this.value, required this.onChanged});

  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final resolvedValue = supportedCalendarTimeZones.any((option) => option.identifier == value)
        ? value
        : supportedCalendarTimeZones.first.identifier;
    return DropdownButtonFormField<String>(
      value: resolvedValue,
      decoration: const InputDecoration(
        labelText: 'Workspace time zone',
        prefixIcon: Icon(Icons.public),
      ),
      items: [
        for (final option in supportedCalendarTimeZones)
          DropdownMenuItem(
            value: option.identifier,
            child: Text(option.label),
          ),
      ],
      onChanged: (value) {
        if (value == null) {
          return;
        }
        onChanged(value);
      },
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Plan your next delivery',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          Text(
            'Schedule stand-ups, syncs, and release gates. Every event keeps the Gigvora workspace aligned.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 12),
          const Text('Tap “Schedule” to create your first event.'),
        ],
      ),
    );
  }
}

class _PersonaBanner extends StatelessWidget {
  const _PersonaBanner({
    required this.name,
    required this.email,
    required this.activeMembership,
  });

  final String name;
  final String email;
  final String activeMembership;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: colorScheme.primaryContainer,
        borderRadius: BorderRadius.circular(20),
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: colorScheme.onPrimaryContainer.withOpacity(0.15),
            child: Text(name.characters.first.toUpperCase()),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: Theme.of(context).textTheme.titleMedium),
                Text(
                  email,
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(color: colorScheme.onPrimaryContainer.withOpacity(0.8)),
                ),
                const SizedBox(height: 4),
                Chip(
                  label: Text(activeMembership.toUpperCase()),
                  avatar: const Icon(Icons.workspace_premium, size: 18),
                ),
              ],
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
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Icon(icon, color: foreground),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: foreground, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _CalendarEventSheet extends StatefulWidget {
  const _CalendarEventSheet({
    this.event,
    required this.settings,
  });

  final CalendarEvent? event;
  final CalendarSettings settings;

  @override
  State<_CalendarEventSheet> createState() => _CalendarEventSheetState();
}

class _CalendarEventSheetState extends State<_CalendarEventSheet> {
  late final TextEditingController _titleController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _locationController;
  late final TextEditingController _videoLinkController;
  late final TextEditingController _relatedEntityIdController;
  late final TextEditingController _colorHexController;
  late final TextEditingController _focusModeController;
  late DateTime _start;
  late DateTime _end;
  late String _eventType;
  late String _source;
  late String _visibility;
  String? _relatedEntityType;
  bool _allDay = false;
  int? _reminderMinutes;

  @override
  void initState() {
    super.initState();
    final event = widget.event;
    _titleController = TextEditingController(text: event?.title ?? '');
    _descriptionController = TextEditingController(text: event?.description ?? '');
    _locationController = TextEditingController(text: event?.location ?? '');
    _videoLinkController = TextEditingController(text: event?.videoConferenceLink ?? '');
    _relatedEntityIdController =
        TextEditingController(text: event?.relatedEntityId == null ? '' : event!.relatedEntityId.toString());
    _colorHexController = TextEditingController(text: event?.colorHex ?? '');
    _focusModeController = TextEditingController(text: event?.focusMode ?? '');
    _start = event?.startsAtLocal ?? DateTime.now();
    _end = event?.endsAtLocal ?? _start.add(const Duration(hours: 1));
    _eventType = event?.eventType ?? calendarEventTypes.first;
    _source = event?.source ?? 'manual';
    _visibility = event?.visibility ?? calendarEventVisibilities.first;
    _relatedEntityType = event?.relatedEntityType;
    _allDay = event?.isAllDay ?? false;
    _reminderMinutes = event?.reminderMinutes;
    if (_allDay) {
      _start = DateTime(_start.year, _start.month, _start.day, 0, 0);
      _end = DateTime(_start.year, _start.month, _start.day, 23, 59);
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
    _videoLinkController.dispose();
    _relatedEntityIdController.dispose();
    _colorHexController.dispose();
    _focusModeController.dispose();
    super.dispose();
  }

  Future<void> _pickStart() async {
    final date = await showDatePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
      initialDate: _start,
    );
    if (date == null) return;
    final time = _allDay
        ? const TimeOfDay(hour: 9, minute: 0)
        : await showTimePicker(
            context: context,
            initialTime: TimeOfDay.fromDateTime(_start),
          );
    if (!mounted) return;
    setState(() {
      _start = DateTime(
        date.year,
        date.month,
        date.day,
        _allDay ? 0 : time?.hour ?? _start.hour,
        _allDay ? 0 : time?.minute ?? _start.minute,
      );
      if (_start.isAfter(_end)) {
        _end = _allDay
            ? DateTime(_start.year, _start.month, _start.day, 23, 59)
            : _start.add(const Duration(hours: 1));
      }
    });
  }

  Future<void> _pickEnd() async {
    final date = await showDatePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
      initialDate: _end,
    );
    if (date == null) return;
    final time = _allDay
        ? const TimeOfDay(hour: 17, minute: 0)
        : await showTimePicker(
            context: context,
            initialTime: TimeOfDay.fromDateTime(_end),
          );
    if (!mounted) return;
    setState(() {
      _end = DateTime(
        date.year,
        date.month,
        date.day,
        _allDay ? 23 : time?.hour ?? _end.hour,
        _allDay ? 59 : time?.minute ?? _end.minute,
      );
      if (_end.isBefore(_start)) {
        _start = _end.subtract(const Duration(hours: 1));
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              widget.event == null ? 'Schedule event' : 'Update event',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Title',
                prefixIcon: Icon(Icons.event_note_outlined),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _descriptionController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Description',
                prefixIcon: Icon(Icons.notes),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _locationController,
              decoration: const InputDecoration(
                labelText: 'Location or meeting room',
                prefixIcon: Icon(Icons.location_on_outlined),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _videoLinkController,
              decoration: const InputDecoration(
                labelText: 'Video conference link',
                prefixIcon: Icon(Icons.videocam_outlined),
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _eventType,
              decoration: const InputDecoration(
                labelText: 'Event type',
                prefixIcon: Icon(Icons.category_outlined),
              ),
              items: [
                for (final value in calendarEventTypes)
                  DropdownMenuItem(
                    value: value,
                    child: Text(value.replaceAll('_', ' ')),
                  ),
              ],
              onChanged: (value) {
                if (value == null) return;
                setState(() => _eventType = value);
              },
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _source,
              decoration: const InputDecoration(
                labelText: 'Source',
                prefixIcon: Icon(Icons.sync_alt_outlined),
              ),
              items: [
                for (final value in calendarEventSources)
                  DropdownMenuItem(
                    value: value,
                    child: Text(value.replaceAll('_', ' ')),
                  ),
              ],
              onChanged: (value) {
                if (value == null) return;
                setState(() => _source = value);
              },
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _visibility,
              decoration: const InputDecoration(
                labelText: 'Visibility',
                prefixIcon: Icon(Icons.visibility_outlined),
              ),
              items: [
                for (final value in calendarEventVisibilities)
                  DropdownMenuItem(
                    value: value,
                    child: Text(value.replaceAll('_', ' ')),
                  ),
              ],
              onChanged: (value) {
                if (value == null) return;
                setState(() => _visibility = value);
              },
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String?>(
              value: _relatedEntityType,
              decoration: const InputDecoration(
                labelText: 'Related record',
                prefixIcon: Icon(Icons.link_outlined),
              ),
              items: [
                const DropdownMenuItem<String?>(
                  value: null,
                  child: Text('No related record'),
                ),
                for (final value in calendarRelatedEntityTypes)
                  DropdownMenuItem<String?>(
                    value: value,
                    child: Text(value.replaceAll('_', ' ')),
                  ),
              ],
              onChanged: (value) => setState(() => _relatedEntityType = value),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _relatedEntityIdController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Related entity ID',
                prefixIcon: Icon(Icons.tag),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _colorHexController,
              decoration: const InputDecoration(
                labelText: 'Colour hex (optional)',
                prefixIcon: Icon(Icons.palette_outlined),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _focusModeController,
              decoration: const InputDecoration(
                labelText: 'Focus mode (optional)',
                prefixIcon: Icon(Icons.timelapse),
              ),
            ),
            const SizedBox(height: 12),
            SwitchListTile.adaptive(
              value: _allDay,
              title: const Text('All-day event'),
              onChanged: (value) {
                setState(() {
                  _allDay = value;
                  if (value) {
                    _start = DateTime(_start.year, _start.month, _start.day, 0, 0);
                    _end = DateTime(_start.year, _start.month, _start.day, 23, 59);
                  }
                });
              },
            ),
            Row(
              children: [
                Expanded(
                  child: _DateTile(
                    label: 'Start',
                    value: DateFormat.yMMMd().add_jm().format(_start),
                    onTap: _pickStart,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _DateTile(
                    label: 'End',
                    value: DateFormat.yMMMd().add_jm().format(_end),
                    onTap: _pickEnd,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<int?>(
              value: _reminderMinutes,
              decoration: const InputDecoration(
                labelText: 'Reminder',
                prefixIcon: Icon(Icons.alarm),
              ),
              items: const [
                DropdownMenuItem(value: null, child: Text('No reminder')),
                DropdownMenuItem(value: 5, child: Text('5 minutes before')),
                DropdownMenuItem(value: 15, child: Text('15 minutes before')),
                DropdownMenuItem(value: 30, child: Text('30 minutes before')),
                DropdownMenuItem(value: 60, child: Text('1 hour before')),
                DropdownMenuItem(value: 24 * 60, child: Text('1 day before')),
              ],
              onChanged: (value) => setState(() => _reminderMinutes = value),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    onPressed: _submit,
                    child: Text(widget.event == null ? 'Create' : 'Save changes'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _submit() {
    final title = _titleController.text.trim();
    if (title.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a title before saving.')),
      );
      return;
    }

    final relatedIdText = _relatedEntityIdController.text.trim();
    final relatedId = relatedIdText.isEmpty ? null : int.tryParse(relatedIdText);

    if (relatedIdText.isNotEmpty && relatedId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Related entity ID must be a valid number.')),
      );
      return;
    }

    final end = _allDay
        ? DateTime(_start.year, _start.month, _start.day, 23, 59)
        : _end;

    final base = widget.event ??
        CalendarEvent(
          id: null,
          title: title,
          startsAt: _start,
          endsAt: end,
          eventType: _eventType,
          source: _source,
          visibility: _visibility,
        );

    final event = base.copyWith(
      title: title,
      startsAt: _start,
      endsAt: end,
      eventType: _eventType,
      source: _source,
      location: _locationController.text.trim().isEmpty ? null : _locationController.text.trim(),
      description: _descriptionController.text.trim().isEmpty ? null : _descriptionController.text.trim(),
      videoConferenceLink:
          _videoLinkController.text.trim().isEmpty ? null : _videoLinkController.text.trim(),
      isAllDay: _allDay,
      reminderMinutes: _reminderMinutes,
      visibility: _visibility,
      relatedEntityType: _relatedEntityType,
      relatedEntityId: relatedId,
      colorHex: _colorHexController.text.trim().isEmpty ? null : _colorHexController.text.trim(),
      focusMode: _focusModeController.text.trim().isEmpty ? null : _focusModeController.text.trim(),
    );

    Navigator.of(context).pop(event);
  }
}

class _DateTile extends StatelessWidget {
  const _DateTile({required this.label, required this.value, required this.onTap});

  final String label;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: Theme.of(context)
                  .textTheme
                  .labelMedium
                  ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          ],
        ),
      ),
    );
  }
}
