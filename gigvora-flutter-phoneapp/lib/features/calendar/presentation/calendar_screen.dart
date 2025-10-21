import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../theme/widgets.dart';
import '../../auth/application/session_controller.dart';
import '../application/calendar_controller.dart';
import '../data/models/calendar_event.dart';

class CalendarScreen extends ConsumerStatefulWidget {
  const CalendarScreen({super.key});

  @override
  ConsumerState<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends ConsumerState<CalendarScreen> {
  DateTime _focusedDay = DateTime.now();

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionControllerProvider).session;
    final controller = ref.read(calendarControllerProvider.notifier);
    final state = ref.watch(calendarControllerProvider);
    final events = state.data ?? const <CalendarEvent>[];
    final router = GoRouter.of(context);

    final destinations = [
      const GigvoraNavigationDestination(
        label: 'Home',
        icon: Icon(Icons.home_outlined),
        selectedIcon: Icon(Icons.home),
        route: '/home',
      ),
      const GigvoraNavigationDestination(
        label: 'Calendar',
        icon: Icon(Icons.event_available_outlined),
        selectedIcon: Icon(Icons.event_available),
        route: '/calendar',
      ),
      const GigvoraNavigationDestination(
        label: 'Marketplace',
        icon: Icon(Icons.storefront_outlined),
        selectedIcon: Icon(Icons.storefront),
        route: '/gigs',
      ),
      const GigvoraNavigationDestination(
        label: 'Profile',
        icon: Icon(Icons.person_outline),
        selectedIcon: Icon(Icons.person),
        route: '/profile',
      ),
    ];

    final grouped = <String, List<CalendarEvent>>{};
    for (final event in events) {
      grouped.putIfAbsent(event.dayKey, () => <CalendarEvent>[]).add(event);
    }

    final sortedKeys = grouped.keys.toList()
      ..sort((a, b) => a.compareTo(b));

    return GigvoraScaffold(
      title: 'Team calendar',
      subtitle: 'Production ready scheduling',
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
          _CalendarHeader(
            focusedDay: _focusedDay,
            onPrevious: () => setState(() {
              _focusedDay = DateTime(_focusedDay.year, _focusedDay.month - 1, 1);
            }),
            onNext: () => setState(() {
              _focusedDay = DateTime(_focusedDay.year, _focusedDay.month + 1, 1);
            }),
          ),
          const SizedBox(height: 24),
          if (session != null)
            _PersonaBanner(
              name: session.name,
              email: session.email,
              activeMembership: session.activeMembership,
            ),
          if (state.fromCache)
            const Padding(
              padding: EdgeInsets.only(top: 16),
              child: _StatusBanner(
                icon: Icons.offline_bolt,
                background: Color(0xFFFEF3C7),
                foreground: Color(0xFFB45309),
                message:
                    'Showing workspace cached schedule. We\'ll sync fresh meetings as soon as connectivity resumes.',
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
                          onEdit: (event) => _openEditor(controller, event: event),
                          onDelete: (event) => controller.delete(event),
                          onToggle: (event, completed) => controller.toggleCompletion(event, completed: completed),
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openEditor(controller),
        icon: const Icon(Icons.add),
        label: const Text('Schedule'),
      ),
      navigationDestinations: destinations,
      selectedDestination: 1,
      onDestinationSelected: (index) {
        final destination = destinations[index];
        if (destination.route != null && router.location != destination.route) {
          context.go(destination.route!);
        }
      },
    );
  }

  Future<void> _openEditor(CalendarController controller, {CalendarEvent? event}) async {
    final result = await showModalBottomSheet<CalendarEvent>(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return _CalendarEventSheet(event: event);
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

class _DaySection extends StatelessWidget {
  const _DaySection({
    required this.date,
    required this.events,
    required this.onEdit,
    required this.onDelete,
    required this.onToggle,
  });

  final DateTime date;
  final List<CalendarEvent> events;
  final ValueChanged<CalendarEvent> onEdit;
  final ValueChanged<CalendarEvent> onDelete;
  final void Function(CalendarEvent event, bool completed) onToggle;

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
                onToggle: onToggle,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EventCard extends StatelessWidget {
  const _EventCard({
    required this.event,
    required this.onEdit,
    required this.onDelete,
    required this.onToggle,
  });

  final CalendarEvent event;
  final ValueChanged<CalendarEvent> onEdit;
  final ValueChanged<CalendarEvent> onDelete;
  final void Function(CalendarEvent event, bool completed) onToggle;

  @override
  Widget build(BuildContext context) {
    final timeRange = event.allDay
        ? 'All day'
        : '${DateFormat.jm().format(event.start)} – ${DateFormat.jm().format(event.end)}';
    final colorScheme = Theme.of(context).colorScheme;
    return Dismissible(
      key: ValueKey(event.id),
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
          onDelete(event);
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
                  tooltip: event.completed ? 'Mark incomplete' : 'Mark completed',
                  onPressed: () => onToggle(event, !event.completed),
                  icon: Icon(event.completed ? Icons.check_circle : Icons.radio_button_unchecked),
                ),
                IconButton(
                  tooltip: 'Edit event',
                  onPressed: () => onEdit(event),
                  icon: const Icon(Icons.edit_outlined),
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
            if (event.description?.isNotEmpty ?? false) ...[
              const SizedBox(height: 12),
              Text(
                event.description!,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
            if (event.attendees.isNotEmpty) ...[
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: event.attendees
                    .map(
                      (attendee) => Chip(
                        avatar: const Icon(Icons.person_outline),
                        label: Text(attendee),
                      ),
                    )
                    .toList(growable: false),
              ),
            ],
            if (event.attachments.isNotEmpty) ...[
              const SizedBox(height: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: event.attachments
                    .map(
                      (attachment) => Row(
                        children: [
                          const Icon(Icons.attach_file, size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              attachment,
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.copyWith(color: colorScheme.primary),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    )
                    .toList(growable: false),
              ),
            ],
          ],
        ),
      ),
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
  const _CalendarEventSheet({this.event});

  final CalendarEvent? event;

  @override
  State<_CalendarEventSheet> createState() => _CalendarEventSheetState();
}

class _CalendarEventSheetState extends State<_CalendarEventSheet> {
  late final TextEditingController _titleController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _locationController;
  late final TextEditingController _attendeesController;
  late final TextEditingController _attachmentsController;
  late DateTime _start;
  late DateTime _end;
  bool _allDay = false;
  int? _reminderMinutes;

  @override
  void initState() {
    super.initState();
    final event = widget.event;
    _titleController = TextEditingController(text: event?.title ?? '');
    _descriptionController = TextEditingController(text: event?.description ?? '');
    _locationController = TextEditingController(text: event?.location ?? '');
    _attendeesController = TextEditingController(text: event == null ? '' : event.attendees.join(', '));
    _attachmentsController = TextEditingController(text: event == null ? '' : event.attachments.join(', '));
    _start = event?.start ?? DateTime.now();
    _end = event?.end ?? DateTime.now().add(const Duration(hours: 1));
    _allDay = event?.allDay ?? false;
    _reminderMinutes = event?.reminderMinutes;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
    _attendeesController.dispose();
    _attachmentsController.dispose();
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
        _end = _start.add(const Duration(hours: 1));
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
                labelText: 'Location or meeting link',
                prefixIcon: Icon(Icons.location_on_outlined),
              ),
            ),
            const SizedBox(height: 12),
            SwitchListTile.adaptive(
              value: _allDay,
              title: const Text('All-day event'),
              onChanged: (value) {
                setState(() {
                  _allDay = value;
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
            TextField(
              controller: _attendeesController,
              decoration: const InputDecoration(
                labelText: 'Attendees (comma separated emails)',
                prefixIcon: Icon(Icons.people_outline),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _attachmentsController,
              decoration: const InputDecoration(
                labelText: 'Attachments (comma separated URLs)',
                prefixIcon: Icon(Icons.attach_file),
              ),
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
    if (_titleController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a title before saving.')),
      );
      return;
    }
    final attendees = _attendeesController.text
        .split(',')
        .map((value) => value.trim())
        .where((value) => value.isNotEmpty)
        .toList(growable: false);
    final attachments = _attachmentsController.text
        .split(',')
        .map((value) => value.trim())
        .where((value) => value.isNotEmpty)
        .toList(growable: false);

    final base = widget.event ?? CalendarEvent(
      id: '',
      title: _titleController.text.trim(),
      start: _start,
      end: _end,
    );

    final event = base.copyWith(
      title: _titleController.text.trim(),
      description:
          _descriptionController.text.trim().isEmpty ? null : _descriptionController.text.trim(),
      location: _locationController.text.trim().isEmpty ? null : _locationController.text.trim(),
      start: _start,
      end: _end,
      allDay: _allDay,
      attendees: attendees,
      attachments: attachments,
      reminderMinutes: _reminderMinutes,
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
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      tileColor: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.35),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Text(label, style: Theme.of(context).textTheme.labelMedium),
      subtitle: Text(value),
      trailing: const Icon(Icons.calendar_today_outlined),
      onTap: onTap,
    );
  }
}

