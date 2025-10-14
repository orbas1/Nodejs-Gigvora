import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/authorization.dart';
import '../../../core/providers.dart';
import '../../../features/auth/application/session_controller.dart';
import '../../../theme/widgets.dart';
import '../application/project_gig_management_controller.dart';
import '../data/models/project_gig_management_snapshot.dart';

enum GigManagementSection { manage, buy, post }

const List<String> _projectManagementRoleLabels = <String>[
  'Agency lead',
  'Operations lead',
  'Company operator',
  'Workspace admin',
  'Platform admin',
];

GigManagementSection? sectionFromQuery(String? value) {
  switch (value?.toLowerCase()) {
    case 'manage':
      return GigManagementSection.manage;
    case 'buy':
      return GigManagementSection.buy;
    case 'post':
      return GigManagementSection.post;
    default:
      return null;
  }
}

class ProjectGigManagementScreen extends ConsumerWidget {
  const ProjectGigManagementScreen({
    super.key,
    this.userId,
    this.initialSection,
  });

  final int? userId;
  final GigManagementSection? initialSection;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final config = ref.watch(appConfigProvider);
    final sessionState = ref.watch(sessionControllerProvider);
    final access = evaluateProjectAccess(sessionState.session);

    if (!access.allowed) {
      return GigvoraScaffold(
        title: 'Gig operations',
        subtitle: 'Operate your purchases, projects, and offers from mobile',
        body: _AccessDeniedCard(reason: access.reason),
      );
    }

    final resolvedUserId = userId ??
        int.tryParse('${config.featureFlags['demoUserId'] ?? config.featureFlags['demoUser'] ?? '1'}') ??
        1;
    final state =
        ref.watch(projectGigManagementControllerProvider(resolvedUserId));
    final controller =
        ref.read(projectGigManagementControllerProvider(resolvedUserId).notifier);
    final snapshot = state.data;

    return GigvoraScaffold(
      title: 'Gig operations',
      subtitle: 'Operate your purchases, projects, and offers from mobile',
      actions: [
        IconButton(
          onPressed: controller.refresh,
          icon: const Icon(Icons.refresh),
          tooltip: 'Refresh dashboard',
        ),
      ],
      body: RefreshIndicator(
        onRefresh: controller.refresh,
        child: ListView(
          padding: EdgeInsets.zero,
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
                          SizedBox(width: 8),
                          Text('Unable to load gig management data'),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Pull to refresh or tap the refresh icon to try again.',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ),
            if (snapshot != null) ...[
              _SummaryCard(snapshot: snapshot, lastUpdated: state.lastUpdated),
              if (!snapshot.access.canManage)
                Padding(
                  padding: const EdgeInsets.only(top: 12, left: 16, right: 16),
                  child: GigvoraCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(Icons.lock_outline, color: Theme.of(context).colorScheme.error),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Gig operations are read-only for your role.',
                                style: Theme.of(context).textTheme.titleSmall,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          snapshot.access.reason ??
                              'Only authorised operators can publish new projects or purchase gigs for this workspace.',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                        if (snapshot.access.allowedRoles.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              'Enabled for roles: ${snapshot.access.allowedRoles.map((role) => role.replaceAll('_', ' ')).join(', ')}',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(letterSpacing: 0.4, fontWeight: FontWeight.w600),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 16),
              _ProjectFormSection(
                controller: controller,
                initiallyExpanded:
                    initialSection == GigManagementSection.manage,
                canManage: snapshot.access.canManage,
                access: snapshot.access,
              ),
              const SizedBox(height: 16),
              _GigOrderFormSection(
                controller: controller,
                initiallyExpanded: initialSection == GigManagementSection.buy,
                canManage: snapshot.access.canManage,
                access: snapshot.access,
              ),
              const SizedBox(height: 16),
              _GigBlueprintFormSection(
                controller: controller,
                initiallyExpanded: initialSection == GigManagementSection.post,
                canManage: snapshot.access.canManage,
                access: snapshot.access,
              ),
              const SizedBox(height: 16),
              _OrdersCard(snapshot: snapshot),
              const SizedBox(height: 16),
              _RemindersCard(reminders: snapshot.reminders),
              const SizedBox(height: 16),
              _StoryCard(storytelling: snapshot.storytelling),
              const SizedBox(height: 24),
            ],
          ],
        ),
      ),
    );
  }
}
class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.snapshot,
    required this.lastUpdated,
  });

  final ProjectGigManagementSnapshot snapshot;
  final DateTime? lastUpdated;

  @override
  Widget build(BuildContext context) {
    final summary = snapshot.summary;
    final assetSummary = snapshot.assetSummary;
    final vendorStats = snapshot.vendorStats;

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Operational snapshot',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 4),
          Text(
            'Monitor progress across projects, assets, and purchased gigs.',
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
          ),
          if (lastUpdated != null) ...[
            const SizedBox(height: 6),
            Text(
              'Last updated ${formatRelativeTime(lastUpdated!)}',
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
          ],
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _SummaryChip(label: 'Total projects', value: '${summary.totalProjects}'),
              _SummaryChip(label: 'Active projects', value: '${summary.activeProjects}'),
              _SummaryChip(label: 'Budget in play', value: _formatCurrency(summary.budgetInPlay)),
              _SummaryChip(label: 'Gigs in delivery', value: '${summary.gigsInDelivery}'),
              _SummaryChip(label: 'Assets secured', value: '${summary.assetsSecured}'),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _SummaryChip(
                label: 'Asset library',
                value: '${assetSummary.total} files (${_formatFileSize(assetSummary.storageBytes)})',
              ),
              _SummaryChip(
                label: 'Restricted assets',
                value: '${assetSummary.restricted}',
              ),
              _SummaryChip(
                label: 'Vendor CSAT',
                value: _formatScore(vendorStats.averageScores.overall),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AccessDeniedCard extends StatelessWidget {
  const _AccessDeniedCard({
    this.reason,
  });

  final String? reason;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        GigvoraCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    height: 44,
                    width: 44,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.secondaryContainer.withOpacity(0.6),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(Icons.lock_outline, color: theme.colorScheme.onSecondaryContainer),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Workspace access required',
                          style: theme.textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          reason ??
                              'Project operations are restricted to agency, company, operations, and admin leads. Request access from your workspace administrator to continue.',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: _projectManagementRoleLabels
                    .map(
                      (label) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.secondaryContainer.withOpacity(0.35),
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: theme.colorScheme.secondaryContainer),
                        ),
                        child: Text(
                          label,
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: theme.colorScheme.onSecondaryContainer,
                            letterSpacing: 0.4,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    )
                    .toList(),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: const [
                    Icon(Icons.mail_outline, size: 18),
                    SizedBox(width: 8),
                    SelectableText('operations@gigvora.com'),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SummaryChip extends StatelessWidget {
  const _SummaryChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: theme.colorScheme.surfaceVariant.withOpacity(0.35),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: theme.textTheme.titleSmall),
          const SizedBox(height: 4),
          Text(label, style: theme.textTheme.bodySmall),
        ],
      ),
    );
  }
}
class _ProjectFormSection extends StatefulWidget {
  const _ProjectFormSection({
    required this.controller,
    this.initiallyExpanded = false,
    required this.canManage,
    required this.access,
  });

  final ProjectGigManagementController controller;
  final bool initiallyExpanded;
  final bool canManage;
  final ProjectGigAccess access;

  @override
  State<_ProjectFormSection> createState() => _ProjectFormSectionState();
}

class _ProjectFormSectionState extends State<_ProjectFormSection> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titleController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _budgetController;
  late final TextEditingController _dueDateController;
  String _currency = 'USD';
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController();
    _descriptionController = TextEditingController();
    _budgetController = TextEditingController();
    _dueDateController = TextEditingController();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _budgetController.dispose();
    _dueDateController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: ExpansionTile(
        key: const PageStorageKey('projectForm'),
        initiallyExpanded: widget.initiallyExpanded,
        title: const Text('Post a project workspace'),
        subtitle: const Text('Create a managed initiative with default rituals'),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (!widget.canManage)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(
                      widget.access.reason ??
                          'Only workspace operators can publish gig offers from mobile.',
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: Theme.of(context).colorScheme.error),
                    ),
                  ),
                AbsorbPointer(
                  absorbing: !widget.canManage,
                  child: Opacity(
                    opacity: widget.canManage ? 1 : 0.65,
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                  TextFormField(
                    controller: _titleController,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(labelText: 'Project title'),
                    enabled: widget.canManage && !_submitting,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Enter a project title';
                      }
                      if (value.trim().length < 3) {
                        return 'Use at least three characters.';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _descriptionController,
                    decoration: const InputDecoration(labelText: 'Description'),
                    minLines: 3,
                    maxLines: 5,
                    enabled: widget.canManage && !_submitting,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Describe the project';
                      }
                      if (value.trim().length < 24) {
                        return 'Add more context so collaborators have a clear brief.';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _budgetController,
                          decoration: const InputDecoration(
                            labelText: 'Budget amount (optional)',
                          ),
                          keyboardType: TextInputType.number,
                          enabled: widget.canManage && !_submitting,
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return null;
                            }
                            final parsed = double.tryParse(value.replaceAll(',', ''));
                            if (parsed == null) {
                              return 'Enter a valid amount';
                            }
                            if (parsed < 0) {
                              return 'Amount cannot be negative';
                            }
                            if (parsed > 1000000000) {
                              return 'Amount exceeds the governance threshold';
                            }
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _currency,
                          decoration: const InputDecoration(labelText: 'Currency'),
                          items: const [
                            DropdownMenuItem(value: 'USD', child: Text('USD')),
                            DropdownMenuItem(value: 'GBP', child: Text('GBP')),
                            DropdownMenuItem(value: 'EUR', child: Text('EUR')),
                          ],
                          onChanged: widget.canManage && !_submitting
                              ? (value) {
                                  if (value != null) {
                                    setState(() {
                                      _currency = value;
                                    });
                                  }
                                }
                              : null,
                          disabledHint: Text(_currency),
                          isDense: true,
                          menuMaxHeight: 240,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _dueDateController,
                    readOnly: true,
                    decoration: InputDecoration(
                      labelText: 'Target completion (optional)',
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.calendar_today),
                        tooltip: 'Select date',
                        onPressed:
                            widget.canManage && !_submitting ? () => _pickDate(context) : null,
                      ),
                    ),
                    onTap: widget.canManage && !_submitting ? () => _pickDate(context) : null,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return null;
                      }
                      final dueDate = _parseDate(value);
                      if (dueDate == null) {
                        return 'Select a valid date';
                      }
                      final today = DateTime.now();
                      final startOfToday = DateTime(today.year, today.month, today.day);
                      if (dueDate.isBefore(startOfToday)) {
                        return 'Choose a future date';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: FilledButton(
                      onPressed: _submitting || !widget.canManage ? null : _handleSubmit,
                      child: Text(
                        _submitting ? 'Creating workspace...' : 'Create project workspace',
                      ),
                    ),
                  ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _pickDate(BuildContext context) async {
    final now = DateTime.now();
    final initialDate = _parseDate(_dueDateController.text) ?? now;
    final firstDate = DateTime(now.year, now.month, now.day);
    final selected = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: firstDate,
      lastDate: now.add(const Duration(days: 365 * 3)),
    );
    if (selected != null) {
      _dueDateController.text = _formatDate(selected);
    }
  }

  Future<void> _handleSubmit() async {
    if (!widget.canManage) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Project creation is restricted for your role.')),
      );
      return;
    }
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() {
      _submitting = true;
    });
    FocusScope.of(context).unfocus();
    try {
      final budgetValue = double.tryParse(_budgetController.text.trim().replaceAll(',', '')) ?? 0;
      final dueDate = _parseDate(_dueDateController.text.trim());
      final draft = ProjectDraft(
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim(),
        budgetCurrency: _currency,
        budgetAllocated: budgetValue,
        dueDate: dueDate,
      );
      await widget.controller.createProject(draft);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Project workspace created.')),
      );
      _formKey.currentState!.reset();
      _titleController.clear();
      _descriptionController.clear();
      _budgetController.clear();
      _dueDateController.clear();
      setState(() {
        _currency = 'USD';
      });
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to create workspace: $error')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }
}
class _GigOrderFormSection extends StatefulWidget {
  const _GigOrderFormSection({
    required this.controller,
    this.initiallyExpanded = false,
    required this.canManage,
    required this.access,
  });

  final ProjectGigManagementController controller;
  final bool initiallyExpanded;
  final bool canManage;
  final ProjectGigAccess access;

  @override
  State<_GigOrderFormSection> createState() => _GigOrderFormSectionState();
}

class _GigOrderFormSectionState extends State<_GigOrderFormSection> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _vendorController;
  late final TextEditingController _serviceController;
  late final TextEditingController _amountController;
  late final TextEditingController _dueDateController;
  String _currency = 'USD';
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _vendorController = TextEditingController();
    _serviceController = TextEditingController();
    _amountController = TextEditingController();
    _dueDateController = TextEditingController();
  }

  @override
  void dispose() {
    _vendorController.dispose();
    _serviceController.dispose();
    _amountController.dispose();
    _dueDateController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: ExpansionTile(
        key: const PageStorageKey('gigOrderForm'),
        initiallyExpanded: widget.initiallyExpanded,
        title: const Text('Buy a gig'),
        subtitle: const Text('Capture vendor engagements and delivery timelines'),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (!widget.canManage)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(
                        widget.access.reason ??
                            'Escrow-backed gig purchases are disabled for your current role.',
                        style: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.copyWith(color: Theme.of(context).colorScheme.error),
                      ),
                    ),
                  TextFormField(
                    controller: _vendorController,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(labelText: 'Vendor name'),
                    enabled: widget.canManage && !_submitting,
                    validator: (value) => value == null || value.trim().isEmpty
                        ? 'Enter the vendor name'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _serviceController,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(labelText: 'Service name'),
                    enabled: widget.canManage && !_submitting,
                    validator: (value) => value == null || value.trim().isEmpty
                        ? 'Describe the service'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _amountController,
                          decoration: const InputDecoration(labelText: 'Budget amount'),
                          keyboardType: TextInputType.number,
                          enabled: widget.canManage && !_submitting,
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Enter a budget amount';
                            }
                            return double.tryParse(value.replaceAll(',', '')) == null
                                ? 'Invalid amount'
                                : null;
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _currency,
                          decoration: const InputDecoration(labelText: 'Currency'),
                          items: const [
                            DropdownMenuItem(value: 'USD', child: Text('USD')),
                            DropdownMenuItem(value: 'GBP', child: Text('GBP')),
                            DropdownMenuItem(value: 'EUR', child: Text('EUR')),
                          ],
                          onChanged: widget.canManage && !_submitting
                              ? (value) {
                                  if (value != null) {
                                    setState(() {
                                      _currency = value;
                                    });
                                  }
                                }
                              : null,
                          disabledHint: Text(_currency),
                          isDense: true,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _dueDateController,
                    readOnly: true,
                    decoration: InputDecoration(
                      labelText: 'Delivery due date (optional)',
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.calendar_today),
                        tooltip: 'Select date',
                        onPressed:
                            widget.canManage && !_submitting ? () => _pickDate(context) : null,
                      ),
                    ),
                    onTap: widget.canManage && !_submitting ? () => _pickDate(context) : null,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return null;
                      }
                      final dueDate = _parseDate(value);
                      if (dueDate == null) {
                        return 'Select a valid date';
                      }
                      final today = DateTime.now();
                      final startOfToday = DateTime(today.year, today.month, today.day);
                      if (dueDate.isBefore(startOfToday)) {
                        return 'Choose a future date';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: FilledButton.tonal(
                      onPressed: _submitting || !widget.canManage ? null : _handleSubmit,
                      child: Text(
                        _submitting ? 'Saving gig...' : 'Add gig engagement',
                      ),
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

  Future<void> _pickDate(BuildContext context) async {
    final now = DateTime.now();
    final initialDate = _parseDate(_dueDateController.text) ?? now;
    final firstDate = DateTime(now.year, now.month, now.day);
    final selected = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: firstDate,
      lastDate: now.add(const Duration(days: 365 * 2)),
    );
    if (selected != null) {
      _dueDateController.text = _formatDate(selected);
    }
  }

  Future<void> _handleSubmit() async {
    if (!widget.canManage) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Gig purchasing is restricted for your role.')),
      );
      return;
    }
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() {
      _submitting = true;
    });
    FocusScope.of(context).unfocus();
    try {
      final amount = double.parse(_amountController.text.trim().replaceAll(',', ''));
      if (amount < 0) {
        throw ArgumentError('Amount cannot be negative.');
      }
      final dueDate = _parseDate(_dueDateController.text.trim());
      final draft = GigOrderDraft(
        vendorName: _vendorController.text.trim(),
        serviceName: _serviceController.text.trim(),
        amount: amount,
        currency: _currency,
        dueAt: dueDate,
      );
      await widget.controller.createGigOrder(draft);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Gig engagement saved.')),
      );
      _formKey.currentState!.reset();
      _vendorController.clear();
      _serviceController.clear();
      _amountController.clear();
      _dueDateController.clear();
      setState(() {
        _currency = 'USD';
      });
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to save gig: $error')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }
}
class _GigBlueprintFormSection extends StatefulWidget {
  const _GigBlueprintFormSection({
    required this.controller,
    this.initiallyExpanded = false,
    required this.canManage,
    required this.access,
  });

  final ProjectGigManagementController controller;
  final bool initiallyExpanded;
  final bool canManage;
  final ProjectGigAccess access;

  @override
  State<_GigBlueprintFormSection> createState() => _GigBlueprintFormSectionState();
}

class _GigBlueprintFormSectionState extends State<_GigBlueprintFormSection> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titleController;
  late final TextEditingController _taglineController;
  late final TextEditingController _categoryController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _packageNameController;
  late final TextEditingController _priceController;
  late final TextEditingController _deliveryDaysController;
  late final TextEditingController _revisionLimitController;
  late final TextEditingController _leadTimeController;
  late final TextEditingController _timezoneController;
  late final TextEditingController _packageDescriptionController;
  late final TextEditingController _highlightsController;
  String _currency = 'USD';
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController();
    _taglineController = TextEditingController();
    _categoryController = TextEditingController();
    _descriptionController = TextEditingController();
    _packageNameController = TextEditingController(text: 'Signature package');
    _priceController = TextEditingController(text: '2500');
    _deliveryDaysController = TextEditingController(text: '14');
    _revisionLimitController = TextEditingController(text: '2');
    _leadTimeController = TextEditingController(text: '5');
    _timezoneController = TextEditingController(text: 'UTC');
    _packageDescriptionController = TextEditingController();
    _highlightsController = TextEditingController();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _taglineController.dispose();
    _categoryController.dispose();
    _descriptionController.dispose();
    _packageNameController.dispose();
    _priceController.dispose();
    _deliveryDaysController.dispose();
    _revisionLimitController.dispose();
    _leadTimeController.dispose();
    _timezoneController.dispose();
    _packageDescriptionController.dispose();
    _highlightsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: ExpansionTile(
        key: const PageStorageKey('gigBlueprintForm'),
        initiallyExpanded: widget.initiallyExpanded,
        title: const Text('Post a gig offer'),
        subtitle: const Text('Design a packaged service with pricing and availability'),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (!widget.canManage)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(
                      widget.access.reason ??
                          'Only workspace operators can publish gig offers from mobile.',
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: Theme.of(context).colorScheme.error),
                    ),
                  ),
                AbsorbPointer(
                  absorbing: !widget.canManage,
                  child: AnimatedOpacity(
                    duration: const Duration(milliseconds: 200),
                    opacity: widget.canManage ? 1 : 0.65,
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          TextFormField(
                            controller: _titleController,
                            textInputAction: TextInputAction.next,
                            decoration: const InputDecoration(labelText: 'Gig title'),
                            validator: (value) => value == null || value.trim().isEmpty
                                ? 'Enter a gig title'
                                : null,
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _taglineController,
                            textInputAction: TextInputAction.next,
                            decoration:
                                const InputDecoration(labelText: 'Tagline (optional)'),
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _categoryController,
                            textInputAction: TextInputAction.next,
                            decoration:
                                const InputDecoration(labelText: 'Category (optional)'),
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _descriptionController,
                            decoration: const InputDecoration(labelText: 'Description'),
                            minLines: 4,
                            maxLines: 6,
                            validator: (value) => value == null || value.trim().isEmpty
                                ? 'Describe the gig'
                                : null,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Pricing package',
                            style: Theme.of(context).textTheme.titleSmall,
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _packageNameController,
                            textInputAction: TextInputAction.next,
                            decoration: const InputDecoration(labelText: 'Package name'),
                            validator: (value) => value == null || value.trim().isEmpty
                                ? 'Name the package'
                                : null,
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: _priceController,
                                  decoration: const InputDecoration(labelText: 'Price'),
                                  keyboardType: TextInputType.number,
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty) {
                                      return 'Enter a price';
                                    }
                                    return double.tryParse(value.replaceAll(',', '')) == null
                                        ? 'Invalid price'
                                        : null;
                                  },
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: DropdownButtonFormField<String>(
                                  value: _currency,
                                  decoration:
                                      const InputDecoration(labelText: 'Currency'),
                                  items: const [
                                    DropdownMenuItem(value: 'USD', child: Text('USD')),
                                    DropdownMenuItem(value: 'GBP', child: Text('GBP')),
                                    DropdownMenuItem(value: 'EUR', child: Text('EUR')),
                                  ],
                                  onChanged: widget.canManage
                                      ? (value) {
                                          if (value != null) {
                                            setState(() {
                                              _currency = value;
                                            });
                                          }
                                        }
                                      : null,
                                  disabledHint: Text(_currency),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: _deliveryDaysController,
                                  decoration:
                                      const InputDecoration(labelText: 'Delivery days'),
                                  keyboardType: TextInputType.number,
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty) {
                                      return 'Required';
                                    }
                                    return int.tryParse(value) == null
                                        ? 'Invalid number'
                                        : null;
                                  },
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: TextFormField(
                                  controller: _revisionLimitController,
                                  decoration:
                                      const InputDecoration(labelText: 'Revision limit'),
                                  keyboardType: TextInputType.number,
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty) {
                                      return 'Required';
                                    }
                                    return int.tryParse(value) == null
                                        ? 'Invalid number'
                                        : null;
                                  },
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _packageDescriptionController,
                            decoration: const InputDecoration(
                                labelText: 'Package description (optional)'),
                            minLines: 2,
                            maxLines: 4,
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _highlightsController,
                            decoration: const InputDecoration(
                                labelText: 'Highlights (one per line)'),
                            minLines: 2,
                            maxLines: 4,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Availability',
                            style: Theme.of(context).textTheme.titleSmall,
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: _leadTimeController,
                                  decoration:
                                      const InputDecoration(labelText: 'Lead time days'),
                                  keyboardType: TextInputType.number,
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty) {
                                      return 'Required';
                                    }
                                    return int.tryParse(value) == null
                                        ? 'Invalid number'
                                        : null;
                                  },
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: TextFormField(
                                  controller: _timezoneController,
                                  decoration:
                                      const InputDecoration(labelText: 'Timezone'),
                                  textInputAction: TextInputAction.done,
                                  validator: (value) =>
                                      value == null || value.trim().isEmpty
                                          ? 'Enter a timezone'
                                          : null,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Align(
                            alignment: Alignment.centerLeft,
                            child: FilledButton(
                              onPressed:
                                  _submitting || !widget.canManage ? null : _handleSubmit,
                              child: Text(
                                _submitting ? 'Publishing gig...' : 'Create gig blueprint',
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleSubmit() async {
    if (!widget.canManage) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Gig blueprint publishing is restricted for your role.')),
      );
      return;
    }
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() {
      _submitting = true;
    });
    FocusScope.of(context).unfocus();
    try {
      final price = double.parse(_priceController.text.trim().replaceAll(',', ''));
      final deliveryDays = int.parse(_deliveryDaysController.text.trim());
      final revisionLimit = int.parse(_revisionLimitController.text.trim());
      final leadTimeDays = int.parse(_leadTimeController.text.trim());
      final rawHighlights = _highlightsController.text.trim();
      final lines = rawHighlights.isEmpty
          ? const <String>[]
          : rawHighlights
              .split(String.fromCharCode(10))
              .map((line) => line.replaceAll(String.fromCharCode(13), '').trim())
              .where((line) => line.isNotEmpty)
              .toList();
      final draft = GigBlueprintDraft(
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim(),
        packageName: _packageNameController.text.trim(),
        packagePrice: price,
        currency: _currency,
        deliveryDays: deliveryDays,
        revisionLimit: revisionLimit,
        leadTimeDays: leadTimeDays,
        timezone: _timezoneController.text.trim(),
        tagline: _taglineController.text.trim().isEmpty
            ? null
            : _taglineController.text.trim(),
        category: _categoryController.text.trim().isEmpty
            ? null
            : _categoryController.text.trim(),
        packageDescription: _packageDescriptionController.text.trim().isEmpty
            ? null
            : _packageDescriptionController.text.trim(),
        highlights: lines.isEmpty ? null : lines,
      );
      await widget.controller.createGigBlueprint(draft);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Gig blueprint saved.')),
      );
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to publish gig: $error')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }
}
class _OrdersCard extends StatelessWidget {
  const _OrdersCard({required this.snapshot});

  final ProjectGigManagementSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final orders = snapshot.orders;
    final stats = snapshot.vendorStats;

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Purchased gigs', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _SummaryChip(label: 'Total orders', value: '${stats.totalOrders}'),
              _SummaryChip(label: 'Active orders', value: '${stats.active}'),
              _SummaryChip(label: 'Completed orders', value: '${stats.completed}'),
              _SummaryChip(label: 'Avg CSAT', value: _formatScore(stats.averageScores.overall)),
            ],
          ),
          const SizedBox(height: 16),
          if (orders.isEmpty)
            Text(
              'No vendor engagements logged yet. Add your first gig order to track delivery.',
              style: Theme.of(context).textTheme.bodyMedium,
            )
          else
            Column(
              children: orders
                  .take(5)
                  .map(
                    (order) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _OrderTile(order: order),
                    ),
                  )
                  .toList(),
            ),
        ],
      ),
    );
  }
}

class _OrderTile extends StatelessWidget {
  const _OrderTile({required this.order});

  final GigOrderInfo order;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: theme.colorScheme.primary.withOpacity(0.15)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(order.serviceName, style: theme.textTheme.titleSmall),
          const SizedBox(height: 4),
          Text(
            order.vendorName,
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 8),
          Text(
            'Status: ${order.status}',
            style: theme.textTheme.bodySmall,
          ),
          const SizedBox(height: 4),
          Text(
            'Budget ${_formatCurrency(order.amount, currency: order.currency)} · Progress ${_formatPercent(order.progressPercent)}',
            style: theme.textTheme.bodySmall,
          ),
          if (order.dueAt != null) ...[
            const SizedBox(height: 4),
            Text(
              'Due ${formatRelativeTime(order.dueAt!)}',
              style: theme.textTheme.bodySmall,
            ),
          ],
        ],
      ),
    );
  }
}

class _RemindersCard extends StatelessWidget {
  const _RemindersCard({required this.reminders});

  final List<GigReminder> reminders;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Delivery reminders', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          if (reminders.isEmpty)
            Text(
              'You are fully up to date — new requirements will appear here as they activate.',
              style: Theme.of(context).textTheme.bodyMedium,
            )
          else
            Column(
              children: reminders
                  .map(
                    (reminder) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _ReminderTile(reminder: reminder),
                    ),
                  )
                  .toList(),
            ),
        ],
      ),
    );
  }
}

class _ReminderTile extends StatelessWidget {
  const _ReminderTile({required this.reminder});

  final GigReminder reminder;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final subtitle = reminder.orderNumber ?? 'Order ${reminder.orderId ?? ''}'.trim();
    final dueLabel = reminder.dueAt == null
        ? 'No due date'
        : reminder.overdue
            ? 'Overdue since ${formatRelativeTime(reminder.dueAt!)}'
            : 'Due ${formatRelativeTime(reminder.dueAt!)}';
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: reminder.overdue
            ? const Color(0xFFFEE2E2)
            : theme.colorScheme.surfaceVariant.withOpacity(0.3),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(reminder.title, style: theme.textTheme.titleSmall),
          const SizedBox(height: 4),
          Text(subtitle, style: theme.textTheme.bodySmall),
          const SizedBox(height: 4),
          Text(dueLabel, style: theme.textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _StoryCard extends StatelessWidget {
  const _StoryCard({required this.storytelling});

  final StorytellingSnapshot storytelling;

  @override
  Widget build(BuildContext context) {
    final achievements = storytelling.achievements.take(4).toList();
    final prompts = storytelling.prompts.take(3).toList();

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Storytelling highlights', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          if (achievements.isEmpty)
            Text(
              'Ship new projects or gigs to unlock automatic storytelling prompts.',
              style: Theme.of(context).textTheme.bodyMedium,
            )
          else ...[
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: achievements
                  .map(
                    (achievement) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text('• ${achievement.bullet}'),
                    ),
                  )
                  .toList(),
            ),
            if (prompts.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text('Prompts to explore', style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 4),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: prompts
                    .map(
                      (prompt) => Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(prompt),
                      ),
                    )
                    .toList(),
              ),
            ],
          ],
        ],
      ),
    );
  }
}
String _formatCurrency(double value, {String currency = 'USD'}) {
  final absolute = value.abs();
  String formatted;
  if (absolute >= 1000000000) {
    formatted = '${(value / 1000000000).toStringAsFixed(1)}B';
  } else if (absolute >= 1000000) {
    formatted = '${(value / 1000000).toStringAsFixed(1)}M';
  } else if (absolute >= 1000) {
    formatted = '${(value / 1000).toStringAsFixed(1)}K';
  } else {
    formatted = value.toStringAsFixed(0);
  }
  return '$currency $formatted';
}

String _formatPercent(double value) {
  return '${value.round()}%';
}

String _formatScore(double? value) {
  if (value == null) {
    return 'N/A';
  }
  return value.toStringAsFixed(1);
}

String _formatFileSize(double bytes) {
  if (bytes <= 0) {
    return '0 B';
  }
  if (bytes < 1024) {
    return '${bytes.toStringAsFixed(0)} B';
  }
  if (bytes < 1024 * 1024) {
    return '${(bytes / 1024).toStringAsFixed(1)} KB';
  }
  if (bytes < 1024 * 1024 * 1024) {
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
  return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
}

String _formatDate(DateTime date) {
  final year = date.year.toString().padLeft(4, '0');
  final month = date.month.toString().padLeft(2, '0');
  final day = date.day.toString().padLeft(2, '0');
  return '$year-$month-$day';
}

DateTime? _parseDate(String? input) {
  if (input == null || input.trim().isEmpty) {
    return null;
  }
  final parsed = DateTime.tryParse(input.trim());
  return parsed;
}
