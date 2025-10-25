import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../theme/widgets.dart';
import '../application/support_controller.dart';
import '../data/models/support_models.dart';
import '../../analytics/utils/formatters.dart';

class SupportScreen extends ConsumerStatefulWidget {
  const SupportScreen({super.key});

  @override
  ConsumerState<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends ConsumerState<SupportScreen> {
  late final TextEditingController _searchController;

  @override
  void initState() {
    super.initState();
    final state = ref.read(supportControllerProvider);
    _searchController = TextEditingController(text: state.metadata['search'] as String? ?? '');
    _searchController.addListener(() {
      ref.read(supportControllerProvider.notifier).updateSearch(_searchController.text);
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(supportControllerProvider);
    final controller = ref.read(supportControllerProvider.notifier);
    final snapshot = state.data;

    if (state.loading && snapshot == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final cases = snapshot?.cases ?? const <SupportCase>[];
    final search = (state.metadata['search'] as String? ?? '').toLowerCase().trim();
    final statusFilter = state.metadata['statusFilter'] as String? ?? 'all';
    final categoryFilter = state.metadata['categoryFilter'] as String? ?? 'all';

    final filteredCases = cases.where((supportCase) {
      final matchesSearch = search.isEmpty ||
          supportCase.title.toLowerCase().contains(search) ||
          supportCase.summary.toLowerCase().contains(search) ||
          supportCase.messages.any((message) => message.body.toLowerCase().contains(search));
      final matchesStatus =
          statusFilter == 'all' || supportCase.status.toLowerCase() == statusFilter.toLowerCase();
      final matchesCategory =
          categoryFilter == 'all' || supportCase.category.toLowerCase() == categoryFilter.toLowerCase();
      return matchesSearch && matchesStatus && matchesCategory;
    }).toList();

    final busy = state.metadata['creatingTicket'] == true;

    return GigvoraScaffold(
      title: 'Support centre',
      subtitle: 'Resolve incidents and collaborate with Gigvora specialists.',
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openTicketSheet(context, controller),
        icon: const Icon(Icons.add),
        label: const Text('New ticket'),
      ),
      body: RefreshIndicator(
        onRefresh: controller.refresh,
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            if (snapshot != null) _SupportHealthHeader(snapshot: snapshot, lastUpdated: state.lastUpdated),
            const SizedBox(height: 24),
            _Filters(
              controller: controller,
              searchController: _searchController,
              statusFilter: statusFilter,
              categoryFilter: categoryFilter,
              availableStatuses: snapshot?.cases.map((c) => c.status.toLowerCase()).toSet() ?? const <String>{},
              availableCategories:
                  snapshot?.cases.map((c) => c.category.toLowerCase()).toSet() ?? const <String>{},
            ),
            const SizedBox(height: 16),
            if (busy)
              const Align(
                alignment: Alignment.centerLeft,
                child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
              ),
            const SizedBox(height: 8),
            if (filteredCases.isEmpty)
              const _EmptyState()
            else
              ...filteredCases.map((ticket) => Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: SupportTicketCard(
                      ticket: ticket,
                      onReply: () => _openReplySheet(context, controller, ticket),
                      onClose: () => controller.closeTicket(ticket.id),
                      onEscalate: () => controller.escalateTicket(ticket.id),
                    ),
                  )),
            const SizedBox(height: 24),
            if (snapshot != null && snapshot.incidents.isNotEmpty)
              _IncidentSection(incidents: snapshot.incidents),
            if (snapshot != null)
              Padding(
                padding: const EdgeInsets.only(top: 24),
                child: _KnowledgeBaseSection(articles: snapshot.knowledgeBase),
              ),
            const SizedBox(height: 24),
            const _AccessibilitySupportPanel(),
          ],
        ),
      ),
    );
  }

  Future<void> _openTicketSheet(BuildContext context, SupportController controller) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (context) => SupportTicketSheet(onSubmit: controller.createTicket),
    );
    if (result == true && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Support ticket submitted.')), 
      );
    }
  }

  Future<void> _openReplySheet(
    BuildContext context,
    SupportController controller,
    SupportCase ticket,
  ) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (context) => SupportReplySheet(ticket: ticket, onSubmit: controller.addMessage),
    );
    if (result == true && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Reply posted to ${ticket.title}.')),
      );
    }
  }
}

class _SupportHealthHeader extends StatelessWidget {
  const _SupportHealthHeader({required this.snapshot, required this.lastUpdated});

  final SupportDeskSnapshot snapshot;
  final DateTime? lastUpdated;

  @override
  Widget build(BuildContext context) {
    final metrics = snapshot.metrics;
    final theme = Theme.of(context);
    final responseMinutes = metrics.averageFirstResponseMinutes ?? 0;
    final resolutionMinutes = metrics.averageResolutionMinutes ?? 0;
    final formatter = NumberFormat.compact();

    String formatDuration(double minutes) {
      if (minutes <= 0) return '—';
      if (minutes < 60) return '${minutes.toStringAsFixed(1)} mins';
      final hours = minutes / 60;
      if (hours < 24) return '${hours.toStringAsFixed(1)} hrs';
      final days = hours / 24;
      return '${days.toStringAsFixed(1)} days';
    }

    return Semantics(
      label: 'Support health overview',
      child: GigvoraCard(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Live support metrics', style: theme.textTheme.titleMedium),
                      const SizedBox(height: 4),
                      Text(
                        'Specialists respond within ${formatDuration(responseMinutes)} on average.',
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                if (lastUpdated != null)
                  Text(
                    'Updated ${formatRelativeTime(lastUpdated!)}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                _MetricChip(
                  label: 'Open cases',
                  value: formatter.format(metrics.openSupportCases),
                  semanticsLabel: '${metrics.openSupportCases} open support cases',
                  icon: Icons.support_agent_outlined,
                ),
                _MetricChip(
                  label: 'Open disputes',
                  value: formatter.format(metrics.openDisputes),
                  semanticsLabel: '${metrics.openDisputes} open disputes',
                  icon: Icons.gavel_outlined,
                ),
                _MetricChip(
                  label: 'CSAT',
                  value: '${metrics.csatScore.toStringAsFixed(1)}/5',
                  semanticsLabel: 'Customer satisfaction ${metrics.csatScore.toStringAsFixed(1)} out of 5',
                  icon: Icons.thumb_up_outlined,
                  caption: metrics.csatResponses > 0
                      ? '${metrics.csatResponses} responses'
                      : 'Awaiting feedback',
                ),
                _MetricChip(
                  label: 'Resolution time',
                  value: formatDuration(resolutionMinutes),
                  semanticsLabel: 'Average resolution time ${formatDuration(resolutionMinutes)}',
                  icon: Icons.timer_outlined,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Filters extends StatelessWidget {
  const _Filters({
    required this.controller,
    required this.searchController,
    required this.statusFilter,
    required this.categoryFilter,
    required this.availableStatuses,
    required this.availableCategories,
  });

  final SupportController controller;
  final TextEditingController searchController;
  final String statusFilter;
  final String categoryFilter;
  final Set<String> availableStatuses;
  final Set<String> availableCategories;

  @override
  Widget build(BuildContext context) {
    final statusOptions = {'all', ...availableStatuses.where((value) => value.isNotEmpty)}.toList()
      ..sort();
    final categoryOptions = {'all', ...availableCategories.where((value) => value.isNotEmpty)}.toList()
      ..sort();
    return GigvoraCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: searchController,
            decoration: const InputDecoration(
              labelText: 'Search tickets',
              prefixIcon: Icon(Icons.search),
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              DropdownButton<String>(
                value: statusFilter,
                items: statusOptions
                    .map(
                      (value) => DropdownMenuItem(
                        value: value,
                        child: Text(value == 'all'
                            ? 'All statuses'
                            : value.replaceAll('_', ' ').toUpperCase()),
                      ),
                    )
                    .toList(growable: false),
                onChanged: (value) {
                  if (value != null) controller.updateStatusFilter(value);
                },
              ),
              DropdownButton<String>(
                value: categoryFilter,
                items: categoryOptions
                    .map(
                      (value) => DropdownMenuItem(
                        value: value,
                        child: Text(value == 'all'
                            ? 'All categories'
                            : value.replaceAll('_', ' ').toUpperCase()),
                      ),
                    )
                    .toList(growable: false),
                onChanged: (value) {
                  if (value != null) controller.updateCategoryFilter(value);
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Everything is clear', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          const Text('No open tickets that match the filters. Create one to speak with our support team.'),
        ],
      ),
    );
  }
}

class SupportTicketCard extends StatelessWidget {
  const SupportTicketCard({
    super.key,
    required this.ticket,
    required this.onReply,
    required this.onClose,
    required this.onEscalate,
  });

  final SupportCase ticket;
  final Future<void> Function() onReply;
  final Future<void> Function() onClose;
  final Future<void> Function() onEscalate;

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat.yMMMd().add_jm();
    final theme = Theme.of(context);
    final linkedOrder = ticket.linkedOrder;
    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(ticket.title, style: theme.textTheme.titleMedium),
                    Text('${ticket.category} • Priority ${ticket.priority}'),
                  ],
                ),
              ),
              Chip(label: Text(ticket.status.toUpperCase())),
            ],
          ),
          const SizedBox(height: 12),
          Text(ticket.summary),
          const SizedBox(height: 12),
          if (linkedOrder != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _LinkedOrderPreview(order: linkedOrder),
            ),
          Text(
            'Updated ${dateFormat.format(ticket.updatedAt)}',
            style: theme.textTheme.bodySmall,
          ),
          const SizedBox(height: 12),
          if (ticket.messages.isNotEmpty) ...[
            const SizedBox(height: 16),
            ...ticket.messages.map((message) => _TicketMessage(message: message)),
          ],
          if (ticket.links.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: ticket.links
                  .map(
                    (link) => Chip(
                      avatar: const Icon(Icons.attach_file, size: 16),
                      label: Text(link.reference ?? link.type),
                    ),
                  )
                  .toList(growable: false),
            ),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              TextButton.icon(onPressed: onReply, icon: const Icon(Icons.reply_outlined), label: const Text('Reply')),
              const SizedBox(width: 12),
              TextButton.icon(onPressed: onClose, icon: const Icon(Icons.check_circle_outline), label: const Text('Close')),
              const SizedBox(width: 12),
              TextButton.icon(
                onPressed: onEscalate,
                icon: const Icon(Icons.arrow_circle_up_outlined),
                label: const Text('Escalate'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TicketMessage extends StatelessWidget {
  const _TicketMessage({required this.message});

  final SupportMessage message;

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat.MMMd().add_Hm();
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: message.fromSupport
            ? Theme.of(context).colorScheme.surfaceVariant
            : Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(message.author, style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(width: 8),
              Text(dateFormat.format(message.createdAt), style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
          const SizedBox(height: 8),
          Text(message.body),
          if (message.attachments.isNotEmpty) ...[
            const SizedBox(height: 8),
            ...message.attachments.map(
              (attachment) => Row(
                children: [
                  const Icon(Icons.attach_file, size: 16),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      attachment.label,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _MetricChip extends StatelessWidget {
  const _MetricChip({
    required this.label,
    required this.value,
    required this.semanticsLabel,
    required this.icon,
    this.caption,
  });

  final String label;
  final String value;
  final String semanticsLabel;
  final IconData icon;
  final String? caption;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Semantics(
      label: semanticsLabel,
      child: Container(
        width: 180,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: theme.colorScheme.outlineVariant.withOpacity(0.5)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 20, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    label,
                    style: theme.textTheme.labelLarge,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            if (caption != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  caption!,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _LinkedOrderPreview extends StatelessWidget {
  const _LinkedOrderPreview({required this.order});

  final SupportCaseLinkedOrder order;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final amount = order.amount != null
        ? NumberFormat.simpleCurrency(name: order.currencyCode ?? 'USD').format(order.amount)
        : null;
    final details = [
      if (order.gigTitle?.isNotEmpty == true) order.gigTitle!,
      if (order.clientName?.isNotEmpty == true) order.clientName!,
      if (order.status?.isNotEmpty == true) order.status!,
    ].join(' • ');
    return Semantics(
      label: 'Linked order reference ${order.reference ?? 'pending'}',
      child: Container(
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceVariant.withOpacity(0.6),
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Icon(Icons.receipt_long_outlined, color: theme.colorScheme.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    order.reference ?? 'Pending reference',
                    style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  if (details.isNotEmpty)
                    Text(
                      details,
                      style: theme.textTheme.bodySmall,
                    ),
                ],
              ),
            ),
            if (amount != null)
              Text(
                amount,
                style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
          ],
        ),
      ),
    );
  }
}

class _KnowledgeBaseSection extends StatelessWidget {
  const _KnowledgeBaseSection({required this.articles});

  final List<SupportArticle> articles;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Guides & updates', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          ...articles.map((article) {
            final hasUrl = article.url.isNotEmpty;
            final tags = article.tags.isNotEmpty
                ? article.tags.map((tag) => '#${tag.toLowerCase()}').join(' ')
                : 'Knowledge base';
            final lastReviewed = article.lastReviewedAt != null
                ? 'Reviewed ${DateFormat.yMMMd().format(article.lastReviewedAt!)}'
                : null;
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(article.title, style: theme.textTheme.titleSmall),
                      ),
                      if (hasUrl)
                        IconButton(
                          tooltip: 'Open article in browser',
                          onPressed: () => launchUrl(
                            Uri.parse(article.url),
                            mode: LaunchMode.externalApplication,
                          ),
                          icon: const Icon(Icons.open_in_new),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    article.summary,
                    style: theme.textTheme.bodySmall,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${article.category} • ${article.readTimeMinutes} min read',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(tags, style: theme.textTheme.bodySmall?.copyWith(fontStyle: FontStyle.italic)),
                  if (article.resourceLinks.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        children: article.resourceLinks
                            .map(
                              (link) => OutlinedButton.icon(
                                onPressed: () => launchUrl(
                                  Uri.parse(link.url),
                                  mode: LaunchMode.externalApplication,
                                ),
                                icon: const Icon(Icons.link),
                                label: Text(link.label),
                              ),
                            )
                            .toList(growable: false),
                      ),
                    ),
                  if (lastReviewed != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        lastReviewed,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _IncidentSection extends StatelessWidget {
  const _IncidentSection({required this.incidents});

  final List<SupportIncident> incidents;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Active incidents & disputes', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          ...incidents.map((incident) {
            final opened = DateFormat.yMMMd().add_jm().format(incident.openedAt);
            final statusChip = incident.status.toUpperCase();
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          incident.summary,
                          style: theme.textTheme.titleSmall,
                        ),
                      ),
                      Chip(label: Text(statusChip)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Opened $opened • Priority ${incident.priority.toUpperCase()}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  if (incident.linkedOrder != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: _LinkedOrderPreview(order: incident.linkedOrder!),
                    ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _AccessibilitySupportPanel extends StatelessWidget {
  const _AccessibilitySupportPanel();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.accessibility_new, size: 20),
              const SizedBox(width: 8),
              Text('Accessibility escalation', style: theme.textTheme.titleMedium),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Need extra assistance? Request captioning, interpreter support, or personalised guidance and our trust team will respond within one business hour.',
            style: theme.textTheme.bodySmall,
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 8,
            children: [
              OutlinedButton.icon(
                onPressed: () => launchUrl(
                  Uri.parse('https://support.gigvora.com/accessibility'),
                  mode: LaunchMode.externalApplication,
                ),
                icon: const Icon(Icons.open_in_new),
                label: const Text('Accessibility hub'),
              ),
              OutlinedButton.icon(
                onPressed: () => launchUrl(
                  Uri.parse('mailto:accessibility@gigvora.com'),
                  mode: LaunchMode.platformDefault,
                ),
                icon: const Icon(Icons.email_outlined),
                label: const Text('Email support'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class SupportTicketSheet extends StatefulWidget {
  const SupportTicketSheet({super.key, required this.onSubmit});

  final Future<SupportCase> Function(SupportTicketDraft draft) onSubmit;

  @override
  State<SupportTicketSheet> createState() => _SupportTicketSheetState();
}

class _SupportTicketSheetState extends State<SupportTicketSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _subjectController;
  late final TextEditingController _summaryController;
  String _priority = 'Medium';
  String _category = 'Integrations';
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _subjectController = TextEditingController();
    _summaryController = TextEditingController();
  }

  @override
  void dispose() {
    _subjectController.dispose();
    _summaryController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() => _submitting = true);
    final draft = SupportTicketDraft(
      subject: _subjectController.text.trim(),
      summary: _summaryController.text.trim(),
      category: _category,
      priority: _priority,
    );
    await widget.onSubmit(draft);
    if (!mounted) return;
    Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: bottom + 24),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Raise a ticket', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              TextFormField(
                controller: _subjectController,
                decoration: const InputDecoration(labelText: 'Subject'),
                validator: (value) => value == null || value.trim().isEmpty ? 'Enter a subject' : null,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _category,
                decoration: const InputDecoration(labelText: 'Category'),
                items: const [
                  DropdownMenuItem(value: 'Integrations', child: Text('Integrations')),
                  DropdownMenuItem(value: 'Billing', child: Text('Billing')),
                  DropdownMenuItem(value: 'Security', child: Text('Security')),
                  DropdownMenuItem(value: 'Platform', child: Text('Platform')),
                ],
                onChanged: (value) => setState(() => _category = value ?? _category),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _priority,
                decoration: const InputDecoration(labelText: 'Priority'),
                items: const [
                  DropdownMenuItem(value: 'Low', child: Text('Low')),
                  DropdownMenuItem(value: 'Medium', child: Text('Medium')),
                  DropdownMenuItem(value: 'High', child: Text('High')),
                ],
                onChanged: (value) => setState(() => _priority = value ?? _priority),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _summaryController,
                decoration: const InputDecoration(labelText: 'How can we help?'),
                maxLines: 4,
                validator: (value) => value == null || value.trim().isEmpty ? 'Share more context' : null,
              ),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: _submitting ? null : _submit,
                icon: _submitting
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.send),
                label: Text(_submitting ? 'Submitting...' : 'Submit ticket'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class SupportReplySheet extends StatefulWidget {
  const SupportReplySheet({super.key, required this.ticket, required this.onSubmit});

  final SupportCase ticket;
  final Future<void> Function(String ticketId, SupportMessageDraft draft) onSubmit;

  @override
  State<SupportReplySheet> createState() => _SupportReplySheetState();
}

class _SupportReplySheetState extends State<SupportReplySheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _messageController;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _messageController = TextEditingController();
  }

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() => _submitting = true);
    final draft = SupportMessageDraft(
      body: _messageController.text.trim(),
      fromSupport: false,
    );
    await widget.onSubmit(widget.ticket.id, draft);
    if (!mounted) return;
    Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: bottom + 24),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Reply to ${widget.ticket.title}', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            TextFormField(
              controller: _messageController,
              decoration: const InputDecoration(labelText: 'Message'),
              maxLines: 5,
              validator: (value) => value == null || value.trim().isEmpty ? 'Enter a reply' : null,
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _submitting ? null : _submit,
              icon: _submitting
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.send),
              label: Text(_submitting ? 'Sending...' : 'Send reply'),
            ),
          ],
        ),
      ),
    );
  }
}
