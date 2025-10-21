import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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

    final tickets = snapshot?.openTickets ?? const <SupportTicket>[];
    final search = (state.metadata['search'] as String? ?? '').toLowerCase().trim();
    final statusFilter = state.metadata['statusFilter'] as String? ?? 'all';
    final categoryFilter = state.metadata['categoryFilter'] as String? ?? 'all';

    final filteredTickets = tickets.where((ticket) {
      final matchesSearch = search.isEmpty ||
          ticket.subject.toLowerCase().contains(search) ||
          ticket.summary.toLowerCase().contains(search);
      final matchesStatus = statusFilter == 'all' || ticket.status == statusFilter;
      final matchesCategory = categoryFilter == 'all' || ticket.category == categoryFilter;
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
            _SupportHealthHeader(snapshot: snapshot),
            const SizedBox(height: 24),
            _Filters(
              controller: controller,
              searchController: _searchController,
              statusFilter: statusFilter,
              categoryFilter: categoryFilter,
            ),
            const SizedBox(height: 16),
            if (busy)
              const Align(
                alignment: Alignment.centerLeft,
                child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
              ),
            const SizedBox(height: 8),
            if (filteredTickets.isEmpty)
              const _EmptyState()
            else
              ...filteredTickets.map((ticket) => Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: SupportTicketCard(
                      ticket: ticket,
                      onReply: () => _openReplySheet(context, controller, ticket),
                      onClose: () => controller.closeTicket(ticket.id),
                      onEscalate: () => controller.escalateTicket(ticket.id),
                    ),
                  )),
            const SizedBox(height: 24),
            if (snapshot != null) _KnowledgeBaseSection(articles: snapshot.articles),
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
    SupportTicket ticket,
  ) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (context) => SupportReplySheet(ticket: ticket, onSubmit: controller.addMessage),
    );
    if (result == true && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Reply posted to ${ticket.subject}.')),
      );
    }
  }
}

class _SupportHealthHeader extends StatelessWidget {
  const _SupportHealthHeader({required this.snapshot});

  final SupportSnapshot? snapshot;

  @override
  Widget build(BuildContext context) {
    final responseMinutes = snapshot?.firstResponseMinutes ?? 12;
    final satisfaction = snapshot?.satisfactionScore ?? 4.7;
    final openCount = snapshot?.openTickets.length ?? 0;
    final formatter = NumberFormat.compact();

    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Live support metrics', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Text('We reply within ${responseMinutes.toString()} minutes on average.'),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('$openCount open', style: Theme.of(context).textTheme.titleMedium),
              Text('CSAT ${formatter.format(satisfaction)}/5'),
            ],
          ),
        ],
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
  });

  final SupportController controller;
  final TextEditingController searchController;
  final String statusFilter;
  final String categoryFilter;

  @override
  Widget build(BuildContext context) {
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
                items: const [
                  DropdownMenuItem(value: 'all', child: Text('All statuses')),
                  DropdownMenuItem(value: 'open', child: Text('Open')),
                  DropdownMenuItem(value: 'awaiting_customer', child: Text('Waiting on you')),
                  DropdownMenuItem(value: 'escalated', child: Text('Escalated')),
                ],
                onChanged: (value) {
                  if (value != null) controller.updateStatusFilter(value);
                },
              ),
              DropdownButton<String>(
                value: categoryFilter,
                items: const [
                  DropdownMenuItem(value: 'all', child: Text('All categories')),
                  DropdownMenuItem(value: 'Integrations', child: Text('Integrations')),
                  DropdownMenuItem(value: 'Billing', child: Text('Billing')),
                  DropdownMenuItem(value: 'Security', child: Text('Security')),
                  DropdownMenuItem(value: 'Platform', child: Text('Platform')),
                ],
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

  final SupportTicket ticket;
  final Future<void> Function() onReply;
  final Future<void> Function() onClose;
  final Future<void> Function() onEscalate;

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat.yMMMd().add_jm();
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
                    Text(ticket.subject, style: Theme.of(context).textTheme.titleMedium),
                    Text('${ticket.category} • Priority ${ticket.priority}'),
                  ],
                ),
              ),
              Chip(label: Text(ticket.status.toUpperCase())),
              if (ticket.escalated) const SizedBox(width: 8),
              if (ticket.escalated)
                Chip(
                  label: const Text('Escalated'),
                  backgroundColor: Theme.of(context).colorScheme.errorContainer,
                ),
            ],
          ),
          const SizedBox(height: 12),
          Text(ticket.summary),
          const SizedBox(height: 12),
          Text('Updated ${dateFormat.format(ticket.updatedAt)}', style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 12),
          if (ticket.attachments.isNotEmpty)
            Wrap(
              spacing: 8,
              children: ticket.attachments
                  .map(
                    (attachment) => ActionChip(
                      label: Text(attachment.split('/').last),
                      onPressed: () => _launchAttachment(attachment),
                    ),
                  )
                  .toList(),
            ),
          if (ticket.messages.isNotEmpty) ...[
            const SizedBox(height: 16),
            ...ticket.messages.map((message) => _TicketMessage(message: message)),
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
        ],
      ),
    );
  }
}

class _KnowledgeBaseSection extends StatelessWidget {
  const _KnowledgeBaseSection({required this.articles});

  final List<SupportArticle> articles;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Guides & updates', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          ...articles.map((article) {
            return ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(article.title),
              subtitle: Text('${article.summary}\n${article.readTimeMinutes} min read'),
              trailing: const Icon(Icons.open_in_new),
              onTap: () => launchUrl(Uri.parse(article.url), mode: LaunchMode.externalApplication),
            );
          }),
        ],
      ),
    );
  }
}

class SupportTicketSheet extends StatefulWidget {
  const SupportTicketSheet({super.key, required this.onSubmit});

  final Future<SupportTicket> Function(SupportTicketDraft draft) onSubmit;

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

  final SupportTicket ticket;
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
    final draft = SupportMessageDraft(author: 'You', role: 'Customer', body: _messageController.text.trim());
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
            Text('Reply to ${widget.ticket.subject}', style: Theme.of(context).textTheme.titleLarge),
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

Future<void> _launchAttachment(String url) async {
  final uri = Uri.tryParse(url);
  if (uri != null) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}
