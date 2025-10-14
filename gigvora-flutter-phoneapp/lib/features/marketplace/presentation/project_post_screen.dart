import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/authorization.dart';
import '../../../core/providers.dart';
import '../../../features/auth/application/session_controller.dart';
import '../../../theme/widgets.dart';
import '../application/project_creation_controller.dart';
import '../data/models/project_creation_request.dart';

class ProjectPostScreen extends ConsumerStatefulWidget {
  const ProjectPostScreen({super.key});

  @override
  ConsumerState<ProjectPostScreen> createState() => _ProjectPostScreenState();
}

class _ProjectPostScreenState extends ConsumerState<ProjectPostScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titleController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _locationController;
  late final TextEditingController _budgetAmountController;
  late final TextEditingController _budgetCurrencyController;
  late final TextEditingController _limitController;
  late final TextEditingController _expiresController;
  late final TextEditingController _fairnessController;

  String _status = 'planning';
  bool _autoAssignEnabled = true;
  Map<String, double> _weights = Map<String, double>.from(kDefaultProjectWeights);
  bool _navigatedOnSuccess = false;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController();
    _descriptionController = TextEditingController();
    _locationController = TextEditingController();
    _budgetAmountController = TextEditingController();
    _budgetCurrencyController = TextEditingController(text: 'USD');
    _limitController = TextEditingController(text: '6');
    _expiresController = TextEditingController(text: '240');
    _fairnessController = TextEditingController(text: '1');
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
    _budgetAmountController.dispose();
    _budgetCurrencyController.dispose();
    _limitController.dispose();
    _expiresController.dispose();
    _fairnessController.dispose();
    super.dispose();
  }

  Map<String, double> get _normalizedWeights {
    final request = ProjectCreationRequest(
      title: _titleController.text.isEmpty ? 'draft' : _titleController.text,
      description: _descriptionController.text.isEmpty ? 'draft' : _descriptionController.text,
      status: _status,
      autoAssignEnabled: _autoAssignEnabled,
      weights: _weights,
    );
    return request.normalizedWeights;
  }

  double get _weightsTotal => _weights.values.fold<double>(0, (sum, value) => sum + value);

  String _formatPercent(double value) => '${(value * 100).round()}%';

  int? _parseInt(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return null;
    return int.tryParse(trimmed);
  }

  double? _parseDouble(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return null;
    return double.tryParse(trimmed);
  }

  Future<void> _handleSubmit() async {
    final form = _formKey.currentState;
    if (form == null || !form.validate()) {
      return;
    }

    FocusScope.of(context).unfocus();

    final config = ref.read(appConfigProvider);
    final resolvedActorId = int.tryParse(
          '${config.featureFlags['demoUserId'] ?? config.featureFlags['demoUser'] ?? '1'}',
        ) ??
        1;

    final request = ProjectCreationRequest(
      title: _titleController.text,
      description: _descriptionController.text,
      status: _status,
      location: _locationController.text.trim().isEmpty ? null : _locationController.text.trim(),
      budgetAmount: _parseDouble(_budgetAmountController.text),
      budgetCurrency: _budgetCurrencyController.text.trim(),
      autoAssignEnabled: _autoAssignEnabled,
      limit: _parseInt(_limitController.text),
      expiresInMinutes: _parseInt(_expiresController.text),
      fairnessMaxAssignments: _parseInt(_fairnessController.text),
      weights: _weights,
      actorId: resolvedActorId,
    );

    await ref.read(projectCreationControllerProvider.notifier).submit(request);
  }

  @override
  Widget build(BuildContext context) {
    final sessionState = ref.watch(sessionControllerProvider);
    final access = evaluateProjectAccess(sessionState.session);
    if (!access.allowed) {
      return GigvoraScaffold(
        title: 'Launch a collaborative project',
        subtitle:
            'Define your scope, capture investment signals, and activate auto-assign so emerging freelancers rotate through premium briefs.',
        body: _ProjectCreationAccessDenied(reason: access.reason),
      );
    }

    ref.listen<ProjectCreationState>(projectCreationControllerProvider, (previous, next) {
      if (next.success && !_navigatedOnSuccess) {
        _navigatedOnSuccess = true;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Project created. Redirecting to projects…')),
        );
        unawaited(Future.delayed(const Duration(milliseconds: 1200), () {
          if (!mounted) return;
          context.go('/projects');
          ref.read(projectCreationControllerProvider.notifier).reset();
        }));
      } else if (next.error != null && next.error != previous?.error) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(next.error!)),
        );
      }
    });

    final state = ref.watch(projectCreationControllerProvider);
    final theme = Theme.of(context);

    return GigvoraScaffold(
      title: 'Launch a collaborative project',
      subtitle:
          'Define your scope, capture investment signals, and activate auto-assign so emerging freelancers rotate through premium briefs.',
      body: Form(
        key: _formKey,
        child: ListView(
          children: [
            GigvoraCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Project details', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _titleController,
                    decoration: const InputDecoration(
                      labelText: 'Project title',
                      hintText: 'Gigvora Analytics Accelerator',
                    ),
                    textCapitalization: TextCapitalization.sentences,
                    validator: (value) =>
                        value == null || value.trim().isEmpty ? 'Please enter a project title.' : null,
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: _status,
                    decoration: const InputDecoration(labelText: 'Status'),
                    items: const [
                      DropdownMenuItem(value: 'planning', child: Text('Planning')),
                      DropdownMenuItem(value: 'open', child: Text('Open')),
                      DropdownMenuItem(value: 'in_progress', child: Text('In progress')),
                  DropdownMenuItem(value: 'completed', child: Text('Completed')),
                ],
                onChanged: (value) {
                  if (value == null) return;
                  setState(() => _status = value);
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _descriptionController,
                    decoration: const InputDecoration(
                      labelText: 'Description',
                      hintText: 'Outline objectives, deliverables, rituals, and tooling.',
                    ),
                    maxLines: 4,
                    validator: (value) =>
                        value == null || value.trim().isEmpty ? 'Please describe the initiative.' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _locationController,
                    decoration: const InputDecoration(
                      labelText: 'Location / timezone',
                      hintText: 'Remote • GMT+1',
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _budgetAmountController,
                    decoration: const InputDecoration(
                      labelText: 'Budget amount',
                      hintText: '2500',
                    ),
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _budgetCurrencyController,
                    decoration: const InputDecoration(labelText: 'Currency'),
                    textCapitalization: TextCapitalization.characters,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            GigvoraCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Auto-assign matching', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 8),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Enable weighted auto-assign'),
                    subtitle: const Text(
                      'Fairness-first scoring rotates new freelancers while balancing recency, rating, and completion quality.',
                    ),
                    value: _autoAssignEnabled,
                    onChanged: (value) => setState(() => _autoAssignEnabled = value),
                  ),
                  if (_autoAssignEnabled) ...[
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _limitController,
                      decoration: const InputDecoration(labelText: 'Queue size'),
                      keyboardType: TextInputType.number,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _expiresController,
                      decoration: const InputDecoration(labelText: 'Response window (minutes)'),
                      keyboardType: TextInputType.number,
                    ),
                    const SizedBox(height: 16),
                    Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        color: theme.colorScheme.surfaceVariant.withOpacity(0.25),
                      ),
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Weighting', style: theme.textTheme.labelLarge),
                              Text('Total ${_formatPercent(_weightsTotal)}',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: theme.colorScheme.onSurfaceVariant,
                                  )),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ..._weights.entries.map((entry) {
                            final label = _weightLabels[entry.key] ?? entry.key;
                            final normalized = _normalizedWeights[entry.key] ?? 0;
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(label, style: theme.textTheme.bodyMedium),
                                      Text(
                                        _formatPercent(normalized),
                                        style: theme.textTheme.bodySmall
                                            ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                                      ),
                                    ],
                                  ),
                                  Slider(
                                    min: 0,
                                    max: 1,
                                    divisions: 20,
                                    value: entry.value.clamp(0, 1),
                                    label: _formatPercent(entry.value),
                                    onChanged: (value) => setState(() {
                                      _weights = Map<String, double>.from(_weights)
                                        ..[entry.key] = double.parse(value.toStringAsFixed(2));
                                    }),
                                  ),
                                ],
                              ),
                            );
                          }),
                          TextFormField(
                            controller: _fairnessController,
                            decoration: const InputDecoration(
                              labelText: 'Max assignments for priority slot',
                            ),
                            keyboardType: TextInputType.number,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: theme.colorScheme.primary.withOpacity(0.2)),
                        gradient: LinearGradient(
                          colors: [
                            theme.colorScheme.primary.withOpacity(0.1),
                            theme.colorScheme.surface,
                            theme.colorScheme.secondary.withOpacity(0.08),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Fairness preview',
                            style: theme.textTheme.labelLarge
                                ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'First slot reserves space for freelancers with ≤${_fairnessController.text.isEmpty ? '0' : _fairnessController.text} active assignments.',
                            style: theme.textTheme.bodySmall,
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 20,
                                backgroundColor: theme.colorScheme.primary.withOpacity(0.2),
                                child: Text(
                                  'N',
                                  style: theme.textTheme.titleMedium?.copyWith(
                                    color: theme.colorScheme.primary,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Nova Strategist', style: theme.textTheme.bodyMedium),
                                  Text(
                                    'Fairness boosted • 96% completion',
                                    style: theme.textTheme.bodySmall
                                        ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (state.error != null) ...[
              const SizedBox(height: 16),
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFFECDD3)),
                ),
                padding: const EdgeInsets.all(16),
                child: Text(
                  state.error!,
                  style: theme.textTheme.bodyMedium?.copyWith(color: const Color(0xFFB91C1C)),
                ),
              ),
            ],
            if (state.success) ...[
              const SizedBox(height: 16),
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFD1FAE5),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFA7F3D0)),
                ),
                padding: const EdgeInsets.all(16),
                child: Text(
                  'Project created successfully. Redirecting you back to the programmes view…',
                  style: theme.textTheme.bodyMedium?.copyWith(color: const Color(0xFF047857)),
                ),
              ),
            ],
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: state.submitting
                      ? null
                      : () {
                          ref.read(projectCreationControllerProvider.notifier).reset();
                          context.go('/projects');
                        },
                  child: const Text('Cancel'),
                ),
                const SizedBox(width: 12),
                ElevatedButton(
                  onPressed: state.submitting ? null : _handleSubmit,
                  child: Text(state.submitting ? 'Creating…' : 'Create project'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ProjectCreationAccessDenied extends StatelessWidget {
  const _ProjectCreationAccessDenied({this.reason});

  final String? reason;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        GigvoraCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Workspace access required',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 12),
              Text(
                reason ??
                    'Project creation is restricted to agency, company, operations, and admin leads. Request access from your workspace administrator to continue.',
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 20),
              Row(
                children: const [
                  Icon(Icons.mail_outline, size: 18),
                  SizedBox(width: 8),
                  SelectableText('operations@gigvora.com'),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

const Map<String, String> _weightLabels = <String, String>{
  'recency': 'Last assignment recency',
  'rating': 'Quality rating',
  'completionQuality': 'Completion rate',
  'earningsBalance': 'Earnings balance',
  'inclusion': 'New freelancer boost',
};
