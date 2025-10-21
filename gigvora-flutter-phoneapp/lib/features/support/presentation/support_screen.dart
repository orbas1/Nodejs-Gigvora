import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../theme/widgets.dart';
import '../application/support_controller.dart';
import '../data/models/support_models.dart';

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
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    await ref.read(supportControllerProvider.notifier).refresh();
  }

  Future<void> _openTicketSheet() async {
    final controller = ref.read(supportControllerProvider.notifier);
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const _SupportTicketSheet(),
    );
    if (result == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Support ticket submitted. We\'ll reply shortly.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(supportControllerProvider);
    final controller = ref.read(supportControllerProvider.notifier);
    final snapshot = state.data;
    final searchQuery = (state.metadata['search'] as String? ?? '').toLowerCase();
    final statusFilter = state.metadata['statusFilter'] as String? ?? 'all';
    final categoryFilter = state.metadata['categoryFilter'] as String? ?? 'all';
    final creatingTicket = state.metadata['creatingTicket'] == true;
    final replyingId = state.metadata['replyingTicketId'] as String?;

    final openTickets = snapshot?.openTickets ?? const <SupportTicket>[];
    final filteredTickets = openTickets.where((ticket) {
      final matchesStatus = statusFilter == 'all' || ticket.status.toLowerCase() == statusFilter;
      final matchesCategory = categoryFilter == 'all' || ticket.category.toLowerCase() == categoryFilter;
      final matchesSearch = searchQuery.isEmpty ||
          ticket.subject.toLowerCase().contains(searchQuery) ||
          ticket.summary.toLowerCase().contains(searchQuery) ||
          ticket.messages.any((message) => message.body.toLowerCase().contains(searchQuery));
      return matchesStatus && matchesCategory && matchesSearch;
    }).toList(growable: false);

    final articles = snapshot?.articles ?? const <SupportArticle>[];
    final filteredArticles = articles.where((article) {
      if (searchQuery.isEmpty) return true;
      final combined = '${article.title} ${article.summary} ${article.tags.join(' ')}'.toLowerCase();
      return combined.contains(searchQuery);
    }).toList(growable: false);

    return GigvoraScaffold(
      title: 'Support centre',
      subtitle: 'Live help, knowledge base, and escalation workflows',
      actions: [
        IconButton(
          tooltip: 'Refresh support',
          onPressed: _refresh,
          icon: const Icon(Icons.refresh),
        ),
      ],
      floatingActionButton: FloatingActionButton.extended(
        onPressed: creatingTicket ? null : _openTicketSheet,
        icon: creatingTicket
            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
            : const Icon(Icons.add_alert),
        label: Text(creatingTicket ? 'Submitting…' : 'New support ticket'),
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            if (state.loading && snapshot == null)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: CircularProgressIndicator()),
              ),
            if (state.hasError && snapshot == null)
              Padding(
                padding: const EdgeInsets.only(bottom: 24),
                child: GigvoraCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.error_outline, color: Color(0xFFB91C1C)),
                          SizedBox(width: 12),
                          Text('We couldn\'t load support data'),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Pull to refresh or email support@gigvora.com if the issue persists.',
                        style: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
              ),
            if (snapshot != null) ...[
              _SupportSearchBar(
                controller: _searchController,
                onChanged: controller.updateSearch,
              ),
              const SizedBox(height: 16),
              _SupportMetrics(snapshot: snapshot),
              const SizedBox(height: 16),
              _SupportChannelsCard(onScheduleCall: _scheduleCall, onOpenChat: _openChat, onEmail: _sendEmail),
              const SizedBox(height: 16),
              _KnowledgeBaseSection(articles: filteredArticles, onLaunch: _launchUrl),
              const SizedBox(height: 16),
              _TicketFilters(
                statusFilter: statusFilter,
                categoryFilter: categoryFilter,
                onStatusChanged: controller.updateStatusFilter,
                onCategoryChanged: controller.updateCategoryFilter,
              ),
              const SizedBox(height: 12),
              if (filteredTickets.isEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: GigvoraCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('No tickets match your filters', style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 8),
                        Text(
                          'Adjust your filters or open a new ticket if you need assistance.',
                          style: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                )
              else
                ...filteredTickets.map(
                  (ticket) => Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: _TicketCard(
                      ticket: ticket,
                      replying: replyingId == ticket.id,
                      onReply: (body) => controller.addMessage(
                        ticket.id,
                        SupportMessageDraft(author: 'You', role: 'Workspace admin', body: body),
                      ),
                      onClose: () => controller.closeTicket(ticket.id),
                      onEscalate: () => controller.escalateTicket(ticket.id),
                      onLaunch: _launchUrl,
                    ),
                  ),
                ),
            ],
            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }

  void _openChat() {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        const SnackBar(
          content: Text('Live chat will connect you with a support engineer within 90 seconds.'),
        ),
      );
  }

  void _scheduleCall() {
    _launchUrl('https://cal.com/gigvora/support');
  }

  void _sendEmail() {
    _launchUrl('mailto:support@gigvora.com');
  }
}

class _SupportSearchBar extends StatelessWidget {
  const _SupportSearchBar({required this.controller, required this.onChanged});

  final TextEditingController controller;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: TextField(
        controller: controller,
        decoration: InputDecoration(
          hintText: 'Search tickets, articles, or keywords',
          prefixIcon: const Icon(Icons.search),
          suffixIcon: controller.text.isEmpty
              ? null
              : IconButton(
                  onPressed: () {
                    controller.clear();
                    onChanged('');
                  },
                  icon: const Icon(Icons.clear),
                ),
        ),
        onChanged: onChanged,
      ),
    );
  }
}

class _SupportMetrics extends StatelessWidget {
  const _SupportMetrics({required this.snapshot});

  final SupportSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Row(
        children: [
          Expanded(
            child: _MetricTile(
              label: 'Open cases',
              value: snapshot.openTickets.length.toString(),
              icon: Icons.support_agent_outlined,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: _MetricTile(
              label: 'First response',
              value: '${snapshot.firstResponseMinutes} min',
              icon: Icons.schedule_outlined,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: _MetricTile(
              label: 'CSAT',
              value: snapshot.satisfactionScore.toStringAsFixed(1),
              icon: Icons.sentiment_satisfied_outlined,
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({required this.label, required this.value, required this.icon});

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.4),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: theme.colorScheme.primary),
          const SizedBox(height: 8),
          Text(value, style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(label, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
        ],
      ),
    );
  }
}

class _SupportChannelsCard extends StatelessWidget {
  const _SupportChannelsCard({
    required this.onOpenChat,
    required this.onScheduleCall,
    required this.onEmail,
  });

  final VoidCallback onOpenChat;
  final VoidCallback onScheduleCall;
  final VoidCallback onEmail;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Choose your channel', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _ChannelButton(
                icon: Icons.chat_bubble_outline,
                label: 'Live chat',
                subtitle: 'Average wait ~90 seconds',
                onPressed: onOpenChat,
              ),
              _ChannelButton(
                icon: Icons.video_call_outlined,
                label: 'Schedule call',
                subtitle: '15-minute concierge onboarding',
                onPressed: onScheduleCall,
              ),
              _ChannelButton(
                icon: Icons.mail_outline,
                label: 'Email support',
                subtitle: 'support@gigvora.com',
                onPressed: onEmail,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ChannelButton extends StatelessWidget {
  const _ChannelButton({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.onPressed,
  });

  final IconData icon;
  final String label;
  final String subtitle;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return OutlinedButton.icon(
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        alignment: Alignment.centerLeft,
      ),
      onPressed: onPressed,
      icon: Icon(icon, size: 20),
      label: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: theme.textTheme.titleSmall),
          const SizedBox(height: 2),
          Text(subtitle, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
        ],
      ),
    );
  }
}

class _KnowledgeBaseSection extends StatelessWidget {
  const _KnowledgeBaseSection({required this.articles, required this.onLaunch});

  final List<SupportArticle> articles;
  final ValueChanged<String> onLaunch;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (articles.isEmpty) {
      return GigvoraCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Knowledge base', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              'No articles matched your search. Reach out via live chat or create a ticket for tailored help.',
              style: theme.textTheme.bodyMedium,
            ),
          ],
        ),
      );
    }
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Knowledge base', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          ...articles.map(
            (article) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
                  backgroundColor: theme.colorScheme.primary.withOpacity(0.12),
                  child: const Icon(Icons.library_books_outlined),
                ),
                title: Text(article.title),
                subtitle: Text(article.summary),
                trailing: Text('${article.readTimeMinutes} min'),
                onTap: () => onLaunch(article.url),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TicketFilters extends StatelessWidget {
  const _TicketFilters({
    required this.statusFilter,
    required this.categoryFilter,
    required this.onStatusChanged,
    required this.onCategoryChanged,
  });

  final String statusFilter;
  final String categoryFilter;
  final ValueChanged<String> onStatusChanged;
  final ValueChanged<String> onCategoryChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Expanded(
          child: DropdownButtonFormField<String>(
            value: statusFilter,
            decoration: const InputDecoration(labelText: 'Status'),
            items: const [
              DropdownMenuItem(value: 'all', child: Text('All statuses')), 
              DropdownMenuItem(value: 'open', child: Text('Open')), 
              DropdownMenuItem(value: 'awaiting_customer', child: Text('Awaiting your reply')), 
              DropdownMenuItem(value: 'escalated', child: Text('Escalated')), 
              DropdownMenuItem(value: 'solved', child: Text('Solved')),
            ],
            onChanged: (value) => onStatusChanged(value ?? 'all'),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: DropdownButtonFormField<String>(
            value: categoryFilter,
            decoration: const InputDecoration(labelText: 'Category'),
            items: const [
              DropdownMenuItem(value: 'all', child: Text('All categories')), 
              DropdownMenuItem(value: 'integrations', child: Text('Integrations')), 
              DropdownMenuItem(value: 'analytics', child: Text('Analytics')), 
              DropdownMenuItem(value: 'mentorship', child: Text('Mentorship')), 
              DropdownMenuItem(value: 'billing', child: Text('Billing')), 
              DropdownMenuItem(value: 'security', child: Text('Security')), 
              DropdownMenuItem(value: 'platform', child: Text('Platform')),
            ],
            onChanged: (value) => onCategoryChanged(value ?? 'all'),
          ),
        ),
      ],
    );
  }
}

class _TicketCard extends StatefulWidget {
  const _TicketCard({
    required this.ticket,
    required this.replying,
    required this.onReply,
    required this.onClose,
    required this.onEscalate,
    required this.onLaunch,
  });

  final SupportTicket ticket;
  final bool replying;
  final Future<void> Function(String body) onReply;
  final Future<void> Function() onClose;
  final Future<void> Function() onEscalate;
  final ValueChanged<String> onLaunch;

  @override
  State<_TicketCard> createState() => _TicketCardState();
}

class _TicketCardState extends State<_TicketCard> {
  late final TextEditingController _replyController;

  @override
  void initState() {
    super.initState();
    _replyController = TextEditingController();
  }

  @override
  void dispose() {
    _replyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final ticket = widget.ticket;
    final formatter = DateFormat('MMM d, HH:mm');
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.35),
        borderRadius: BorderRadius.circular(22),
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
                    Text(ticket.subject, style: theme.textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(ticket.summary, style: theme.textTheme.bodyMedium),
                    const SizedBox(height: 4),
                    Text(
                      'Opened ${formatter.format(ticket.createdAt)} • Updated ${formatRelativeTime(ticket.updatedAt)}',
                      style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Chip(
                    label: Text(ticket.status.replaceAll('_', ' ')),
                    avatar: const Icon(Icons.flag_outlined, size: 16),
                  ),
                  const SizedBox(height: 8),
                  Chip(
                    label: Text(ticket.priority),
                    avatar: const Icon(Icons.priority_high_outlined, size: 16),
                    backgroundColor: theme.colorScheme.primary.withOpacity(0.12),
                    labelStyle: theme.textTheme.labelMedium?.copyWith(color: theme.colorScheme.primary),
                  ),
                ],
              ),
            ],
          ),
          if (ticket.attachments.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: ticket.attachments
                  .map(
                    (attachment) => OutlinedButton.icon(
                      onPressed: () => widget.onLaunch(attachment),
                      icon: const Icon(Icons.attach_file, size: 16),
                      label: Text(attachment.split('/').last),
                    ),
                  )
                  .toList(growable: false),
            ),
          ],
          if (ticket.messages.isNotEmpty) ...[
            const SizedBox(height: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: ticket.messages
                  .map(
                    (message) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: message.fromSupport
                              ? theme.colorScheme.secondary.withOpacity(0.12)
                              : theme.colorScheme.surface,
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(message.author,
                                    style: theme.textTheme.labelLarge?.copyWith(
                                      color: message.fromSupport
                                          ? theme.colorScheme.secondary
                                          : theme.colorScheme.primary,
                                    )),
                                Text(
                                  formatRelativeTime(message.createdAt),
                                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(message.body, style: theme.textTheme.bodyMedium?.copyWith(height: 1.4)),
                          ],
                        ),
                      ),
                    ),
                  )
                  .toList(growable: false),
            ),
          ],
          const SizedBox(height: 16),
          if (ticket.status != 'solved')
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: _replyController,
                  maxLines: 3,
                  decoration: const InputDecoration(hintText: 'Reply with context or updates…'),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    FilledButton(
                      onPressed: widget.replying
                          ? null
                          : () async {
                              final body = _replyController.text.trim();
                              if (body.isEmpty) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Add a message before replying.')),
                                );
                                return;
                              }
                              await widget.onReply(body);
                              if (!mounted) return;
                              _replyController.clear();
                            },
                      child: Text(widget.replying ? 'Sending…' : 'Send update'),
                    ),
                    const SizedBox(width: 12),
                    OutlinedButton(
                      onPressed: widget.replying ? null : widget.onClose,
                      child: const Text('Mark as solved'),
                    ),
                    const SizedBox(width: 12),
                    TextButton(
                      onPressed: widget.replying ? null : widget.onEscalate,
                      child: const Text('Escalate'),
                    ),
                  ],
                ),
              ],
            )
          else
            FilledButton.tonal(
              onPressed: widget.onEscalate,
              child: const Text('Reopen & escalate'),
            ),
        ],
      ),
    );
  }
}

class _SupportTicketSheet extends ConsumerStatefulWidget {
  const _SupportTicketSheet();

  @override
  ConsumerState<_SupportTicketSheet> createState() => _SupportTicketSheetState();
}

class _SupportTicketSheetState extends ConsumerState<_SupportTicketSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _subjectController;
  late final TextEditingController _summaryController;
  String _category = 'integrations';
  String _priority = 'Medium';
  final TextEditingController _attachmentController = TextEditingController();
  final List<String> _attachments = <String>[];

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
    _attachmentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = ref.read(supportControllerProvider.notifier);
    final creating = ref.watch(supportControllerProvider).metadata['creatingTicket'] == true;
    final theme = Theme.of(context);
    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text('Create a support ticket', style: theme.textTheme.titleLarge),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(false),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _subjectController,
                decoration: const InputDecoration(labelText: 'Subject'),
                validator: (value) => value == null || value.trim().isEmpty ? 'Subject is required' : null,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _category,
                decoration: const InputDecoration(labelText: 'Category'),
                items: const [
                  DropdownMenuItem(value: 'integrations', child: Text('Integrations & API')), 
                  DropdownMenuItem(value: 'analytics', child: Text('Analytics & dashboards')), 
                  DropdownMenuItem(value: 'mentorship', child: Text('Mentorship')), 
                  DropdownMenuItem(value: 'billing', child: Text('Billing & contracts')), 
                  DropdownMenuItem(value: 'security', child: Text('Security & compliance')), 
                  DropdownMenuItem(value: 'platform', child: Text('Platform experience')),
                ],
                onChanged: (value) => setState(() => _category = value ?? 'integrations'),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _priority,
                decoration: const InputDecoration(labelText: 'Priority'),
                items: const [
                  DropdownMenuItem(value: 'Low', child: Text('Low')), 
                  DropdownMenuItem(value: 'Medium', child: Text('Medium')), 
                  DropdownMenuItem(value: 'High', child: Text('High')), 
                  DropdownMenuItem(value: 'Urgent', child: Text('Urgent')),
                ],
                onChanged: (value) => setState(() => _priority = value ?? 'Medium'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _summaryController,
                maxLines: 4,
                decoration: const InputDecoration(labelText: 'Describe the issue'),
                validator: (value) => value == null || value.trim().isEmpty ? 'Please include a summary.' : null,
              ),
              const SizedBox(height: 12),
              Text('Attachments', style: theme.textTheme.labelLarge),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final attachment in _attachments)
                    InputChip(
                      label: Text(attachment.split('/').last),
                      onDeleted: () => setState(() => _attachments.remove(attachment)),
                    ),
                  SizedBox(
                    width: 280,
                    child: TextField(
                      controller: _attachmentController,
                      decoration: InputDecoration(
                        hintText: 'Paste link',
                        suffixIcon: IconButton(
                          icon: const Icon(Icons.add),
                          onPressed: () {
                            final value = _attachmentController.text.trim();
                            if (value.isEmpty) return;
                            setState(() {
                              _attachments.add(value);
                              _attachmentController.clear();
                            });
                          },
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: creating
                      ? null
                      : () async {
                          if (!_formKey.currentState!.validate()) {
                            return;
                          }
                          try {
                            await controller.createTicket(
                              SupportTicketDraft(
                                subject: _subjectController.text.trim(),
                                category: _category,
                                priority: _priority,
                                summary: _summaryController.text.trim(),
                                attachments: List<String>.from(_attachments),
                              ),
                            );
                            if (!mounted) return;
                            Navigator.of(context).pop(true);
                          } catch (error) {
                            if (!mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Unable to create ticket. $error')),
                            );
                          }
                        },
                  child: Text(creating ? 'Submitting…' : 'Create ticket'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

void _launchUrl(String url) async {
  final uri = Uri.tryParse(url);
  if (uri == null) return;
  await launchUrl(uri, mode: LaunchMode.externalApplication);
}
