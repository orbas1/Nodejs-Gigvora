import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:gigvora_mobile/router/app_routes.dart';

import '../../../core/authorization.dart';
import '../../../core/providers.dart';
import '../../../features/auth/application/session_controller.dart';
import '../../../theme/widgets.dart';
import '../application/project_creation_controller.dart';
import '../data/models/project_creation_request.dart';

const List<String> _projectCategories = <String>[
  'Product & UX Research',
  'Brand & Creative',
  'Engineering',
  'Growth & Marketing',
  'Operations',
  'People & Culture',
  'Finance & Legal',
  'Advisory & Mentorship',
];

const List<String> _skillSuggestions = <String>[
  'Design systems',
  'React',
  'Node.js',
  'Product strategy',
  'Figma',
  'Data storytelling',
  'Automation',
  'Market research',
];

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
  late final TextEditingController _hourlyRateController;
  late final TextEditingController _weeklyCapController;
  late final TextEditingController _skillInputController;
  late final TextEditingController _categoryInputController;
  late final TextEditingController _searchSkillInputController;
  late final TextEditingController _talentQueryController;
  late final TextEditingController _talentLocationController;
  late final TextEditingController _talentStartController;
  late final TextEditingController _talentBudgetController;
  late final TextEditingController _talentQuoteMessageController;
  late final TextEditingController _talentQuoteDueDateController;

  String _status = 'planning';
  bool _autoAssignEnabled = true;
  Map<String, double> _weights = Map<String, double>.from(kDefaultProjectWeights);
  bool _navigatedOnSuccess = false;
  String _engagementType = 'fixed';
  String _billingCadence = 'milestone';
  String _paymentTrigger = 'upon_acceptance';
  bool _requireClockIn = true;
  bool _requireClockOut = true;
  bool _captureScreenshots = true;
  bool _idleDetection = true;
  bool _allowManualAdjustments = false;
  String _timezoneLock = 'project';
  late List<_TaskDraft> _tasks;
  late List<_GoalDraft> _goals;
  late List<_AllocationDraft> _allocations;
  late List<_InviteDraft> _invites;
  final List<String> _skills = <String>[];
  final List<String> _categories = <String>['Operations'];
  final List<String> _searchSkills = <String>[];

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
    _hourlyRateController = TextEditingController();
    _weeklyCapController = TextEditingController(text: '30');
    _skillInputController = TextEditingController();
    _categoryInputController = TextEditingController();
    _searchSkillInputController = TextEditingController();
    _talentQueryController = TextEditingController();
    _talentLocationController = TextEditingController();
    _talentStartController = TextEditingController();
    _talentBudgetController = TextEditingController();
    _talentQuoteMessageController = TextEditingController();
    _talentQuoteDueDateController = TextEditingController();
    _tasks = <_TaskDraft>[_TaskDraft()];
    _goals = <_GoalDraft>[_GoalDraft()];
    _allocations = <_AllocationDraft>[
      _AllocationDraft(currency: _budgetCurrencyController.text),
    ];
    _invites = <_InviteDraft>[_InviteDraft()];
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
    _hourlyRateController.dispose();
    _weeklyCapController.dispose();
    _skillInputController.dispose();
    _categoryInputController.dispose();
    _searchSkillInputController.dispose();
    _talentQueryController.dispose();
    _talentLocationController.dispose();
    _talentStartController.dispose();
    _talentBudgetController.dispose();
    _talentQuoteMessageController.dispose();
    _talentQuoteDueDateController.dispose();
    for (final task in _tasks) {
      task.dispose();
    }
    for (final goal in _goals) {
      goal.dispose();
    }
    for (final allocation in _allocations) {
      allocation.dispose();
    }
    for (final invite in _invites) {
      invite.dispose();
    }
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

  double get _allocationPercentageTotal {
    return _allocations.fold<double>(0, (sum, allocation) {
      final value = double.tryParse(allocation.percentage.text.trim());
      return sum + (value?.isFinite == true ? value! : 0);
    });
  }

  double get _allocationAmountTotal {
    return _allocations.fold<double>(0, (sum, allocation) {
      final value = double.tryParse(allocation.amount.text.trim());
      return sum + (value?.isFinite == true ? value! : 0);
    });
  }

  double get _budgetAmountValue => _parseDouble(_budgetAmountController.text) ?? 0;

  bool get _isPercentageBalanced => (_allocationPercentageTotal - 100).abs() <= 0.5;

  String _formatNumber(double value) {
    if (value == value.roundToDouble()) {
      return value.toStringAsFixed(0);
    }
    return value.toStringAsFixed(2);
  }

  void _addTask() {
    setState(() => _tasks.add(_TaskDraft()));
  }

  void _removeTask(int index) {
    if (_tasks.length <= 1) return;
    final removed = _tasks.removeAt(index);
    removed.dispose();
    setState(() {});
  }

  void _addGoal() {
    setState(() => _goals.add(_GoalDraft()));
  }

  void _removeGoal(int index) {
    if (_goals.length <= 1) return;
    final removed = _goals.removeAt(index);
    removed.dispose();
    setState(() {});
  }

  void _addAllocation() {
    setState(() =>
        _allocations.add(_AllocationDraft(currency: _budgetCurrencyController.text.trim())));
  }

  void _removeAllocation(int index) {
    if (_allocations.length <= 1) return;
    final removed = _allocations.removeAt(index);
    removed.dispose();
    setState(() {});
  }

  void _addInvite() {
    setState(() => _invites.add(_InviteDraft()));
  }

  void _removeInvite(int index) {
    if (_invites.length <= 1) return;
    final removed = _invites.removeAt(index);
    removed.dispose();
    setState(() {});
  }

  void _addSkill(String value) {
    final normalized = value.trim();
    if (normalized.isEmpty) return;
    if (_skills.any((skill) => skill.toLowerCase() == normalized.toLowerCase())) {
      _skillInputController.clear();
      return;
    }
    setState(() {
      _skills.add(normalized);
      _skillInputController.clear();
    });
  }

  void _removeSkill(String value) {
    setState(() => _skills.remove(value));
  }

  void _toggleCategory(String category) {
    setState(() {
      if (_categories.contains(category)) {
        _categories.remove(category);
      } else {
        _categories.add(category);
      }
    });
  }

  void _addCategory(String value) {
    final normalized = value.trim();
    if (normalized.isEmpty) return;
    if (_categories.any((item) => item.toLowerCase() == normalized.toLowerCase())) {
      _categoryInputController.clear();
      return;
    }
    setState(() {
      _categories.add(normalized);
      _categoryInputController.clear();
    });
  }

  void _addSearchSkill(String value) {
    final normalized = value.trim();
    if (normalized.isEmpty) return;
    if (_searchSkills.any((item) => item.toLowerCase() == normalized.toLowerCase())) {
      _searchSkillInputController.clear();
      return;
    }
    setState(() {
      _searchSkills.add(normalized);
      _searchSkillInputController.clear();
    });
  }

  void _removeSearchSkill(String value) {
    setState(() => _searchSkills.remove(value));
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

    final engagementModel = <String, dynamic>{
      'type': _engagementType,
      'billingCadence': _billingCadence,
      'paymentTrigger': _paymentTrigger,
    };
    if (_engagementType == 'hourly') {
      engagementModel['hourly'] = <String, dynamic>{
        'rate': _parseDouble(_hourlyRateController.text) ?? 0,
        'weeklyHourCap': _parseInt(_weeklyCapController.text),
        'currency': _budgetCurrencyController.text.trim(),
      };
    } else {
      engagementModel['fixed'] = <String, dynamic>{
        'totalBudget': _parseDouble(_budgetAmountController.text),
        'currency': _budgetCurrencyController.text.trim(),
      };
    }

    final timeTracking = <String, dynamic>{
      'requireClockIn': _requireClockIn,
      'requireClockOut': _requireClockOut,
      'captureScreenshots': _captureScreenshots,
      'idleDetection': _idleDetection,
      'allowManualAdjustments': _allowManualAdjustments,
      'timezoneLock': _timezoneLock,
    };

    final tasks = _tasks
        .map((task) => task.toJson())
        .where((task) => (task['title'] as String?)?.isNotEmpty ?? false)
        .toList();
    final goals = _goals
        .map((goal) => goal.toJson())
        .where((goal) =>
            (goal['name'] as String?)?.isNotEmpty ?? false || (goal['metric'] as String?)?.isNotEmpty ?? false)
        .toList();
    final deliveryPlan = <String, dynamic>{};
    if (tasks.isNotEmpty) {
      deliveryPlan['tasks'] = tasks;
    }
    if (goals.isNotEmpty) {
      deliveryPlan['goals'] = goals;
    }

    final allocations = _allocations
        .map((allocation) => allocation.toJson())
        .where((allocation) => (allocation['contributor'] as String?)?.isNotEmpty ?? false)
        .toList();
    Map<String, dynamic>? budgetPlan;
    if (allocations.isNotEmpty) {
      final percentageTotal = allocations.fold<double>(0, (sum, item) {
        final value = item['percentage'] as double?;
        return sum + (value ?? 0);
      });
      final amountTotal = allocations.fold<double>(0, (sum, item) {
        final value = item['amount'] as double?;
        return sum + (value ?? 0);
      });
      budgetPlan = <String, dynamic>{
        'currency': _budgetCurrencyController.text.trim(),
        'allocations': allocations,
        'totals': <String, dynamic>{
          'percentage': double.parse(percentageTotal.toStringAsFixed(2)),
          'amount': double.parse(amountTotal.toStringAsFixed(2)),
        },
      };
    }

    final invites = _invites
        .map((invite) => invite.toJson())
        .where((invite) => (invite['email'] as String?)?.isNotEmpty ?? false)
        .toList();

    final searchConfig = <String, dynamic>{
      'query': _talentQueryController.text.trim(),
      'location': _talentLocationController.text.trim(),
      'skills': List<String>.from(_searchSkills),
      'preferredStart': _talentStartController.text.trim(),
    };
    final quoteRequest = <String, dynamic>{
      'message': _talentQuoteMessageController.text.trim(),
      'dueDate': _talentQuoteDueDateController.text.trim(),
      'budgetCeiling': _parseDouble(_talentBudgetController.text),
    }..removeWhere((key, value) {
        if (value == null) return true;
        if (value is String) return value.isEmpty;
        return false;
      });
    if (quoteRequest.isNotEmpty) {
      searchConfig['quoteRequest'] = quoteRequest;
    }
    searchConfig.removeWhere((key, value) {
      if (value == null) return true;
      if (value is String) return value.isEmpty;
      if (value is List && value.isEmpty) return true;
      return false;
    });

    Map<String, dynamic>? talentSourcing;
    if (invites.isNotEmpty || searchConfig.isNotEmpty) {
      talentSourcing = <String, dynamic>{
        if (invites.isNotEmpty) 'invites': invites,
        if (searchConfig.isNotEmpty) 'search': searchConfig,
      };
    }

    final deliveryPlanPayload = deliveryPlan.isEmpty ? null : deliveryPlan;

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
      engagementModel: engagementModel,
      timeTracking: timeTracking,
      deliveryPlan: deliveryPlanPayload,
      budgetPlan: budgetPlan,
      skills: List<String>.from(_skills),
      categories: List<String>.from(_categories),
      talentSourcing: talentSourcing,
      securityControls: const <String, dynamic>{
        'enforceTwoFactor': true,
        'roleAccess': ['agency', 'company', 'operations', 'admin'],
        'auditTrail': true,
      },
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
          context.go(AppRoute.projects.path);
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

    final formSections = <Widget>[
      _buildProjectDetailsCard(theme),
      const SizedBox(height: 24),
      _buildEngagementModelCard(theme),
      const SizedBox(height: 24),
      _buildTimeTrackingCard(theme),
      const SizedBox(height: 24),
      _buildDeliveryPlanCard(theme),
      const SizedBox(height: 24),
      _buildBudgetCard(theme),
      const SizedBox(height: 24),
      _buildSkillsCard(theme),
      const SizedBox(height: 24),
      _buildTalentSourcingCard(theme),
      const SizedBox(height: 24),
      _buildAutoAssignCard(theme),
    ];

    if (state.error != null) {
      formSections.addAll([
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
      ]);
    }

    if (state.success) {
      formSections.addAll([
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
      ]);
    }

    formSections.addAll([
      const SizedBox(height: 24),
      Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          TextButton(
            onPressed: state.submitting
                ? null
                : () {
                    ref.read(projectCreationControllerProvider.notifier).reset();
                    context.go(AppRoute.projects.path);
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
    ]);

    return GigvoraScaffold(
      title: 'Launch a collaborative project',
      subtitle:
          'Define your scope, capture investment signals, and activate auto-assign so emerging freelancers rotate through premium briefs.',
      body: Form(
        key: _formKey,
        child: ListView(
          children: formSections,
        ),
      ),
    );

  }
}

  Widget _buildProjectDetailsCard(ThemeData theme) {
    return GigvoraCard(
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
            validator: (value) => value == null || value.trim().isEmpty
                ? 'Please enter a project title.'
                : null,
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
            validator: (value) => value == null || value.trim().isEmpty
                ? 'Please describe the initiative.'
                : null,
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
    );
  }

  Widget _buildEngagementModelCard(ThemeData theme) {
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Engagement model & billing', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(
            'Define how collaborators engage with your programme. Hourly projects inherit time tracking guardrails, while fixed price work emphasises milestone delivery.',
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 12),
          RadioListTile<String>(
            value: 'fixed',
            groupValue: _engagementType,
            onChanged: (value) => setState(() => _engagementType = value ?? 'fixed'),
            title: const Text('Fixed price'),
            subtitle: const Text('Milestone-based billing with structured hand-offs.'),
            contentPadding: EdgeInsets.zero,
          ),
          RadioListTile<String>(
            value: 'hourly',
            groupValue: _engagementType,
            onChanged: (value) => setState(() => _engagementType = value ?? 'hourly'),
            title: const Text('Hourly'),
            subtitle: const Text('Capture actual time with screenshot evidence and caps.'),
            contentPadding: EdgeInsets.zero,
          ),
          const SizedBox(height: 12),
          if (_engagementType == 'hourly') ...[
            TextFormField(
              controller: _hourlyRateController,
              decoration: InputDecoration(
                labelText: 'Hourly rate (${_budgetCurrencyController.text})',
                hintText: '75',
              ),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _weeklyCapController,
              decoration: const InputDecoration(
                labelText: 'Weekly hour cap',
                hintText: '30',
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 16),
          ] else
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: theme.colorScheme.secondary.withOpacity(0.12),
              ),
              child: Text(
                'Fixed price engagements rely on milestone clarity. Use the delivery plan to outline sequencing.',
                style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
              ),
            ),
          DropdownButtonFormField<String>(
            value: _billingCadence,
            decoration: const InputDecoration(labelText: 'Billing cadence'),
            items: const [
              DropdownMenuItem(value: 'milestone', child: Text('Milestone releases')),
              DropdownMenuItem(value: 'biweekly', child: Text('Bi-weekly')),
              DropdownMenuItem(value: 'monthly', child: Text('Monthly')),
              DropdownMenuItem(value: 'completion', child: Text('On completion')),
            ],
            onChanged: (value) => setState(() => _billingCadence = value ?? 'milestone'),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            value: _paymentTrigger,
            decoration: const InputDecoration(labelText: 'Payment trigger'),
            items: const [
              DropdownMenuItem(value: 'upon_acceptance', child: Text('Upon deliverable acceptance')),
              DropdownMenuItem(value: 'upon_submission', child: Text('Upon deliverable submission')),
              DropdownMenuItem(value: 'net15', child: Text('Net 15')),
              DropdownMenuItem(value: 'net30', child: Text('Net 30')),
            ],
            onChanged: (value) => setState(() => _paymentTrigger = value ?? 'upon_acceptance'),
          ),
        ],
      ),
    );
  }

  Widget _buildTimeTrackingCard(ThemeData theme) {
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Time tracking & compliance', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Require clock-in before work'),
            subtitle: const Text('Ensure collaborators start a timer session before work begins.'),
            value: _requireClockIn,
            onChanged: (value) => setState(() => _requireClockIn = value),
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Clock-out attestation'),
            subtitle: const Text('Capture end-of-session attestations for enterprise audit trails.'),
            value: _requireClockOut,
            onChanged: (value) => setState(() => _requireClockOut = value),
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Screenshot evidence'),
            subtitle: const Text('Capture randomised proof for regulated engagements.'),
            value: _captureScreenshots,
            onChanged: (value) => setState(() => _captureScreenshots = value),
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Idle detection'),
            subtitle: const Text('Auto-pause timers when no activity is detected for three minutes.'),
            value: _idleDetection,
            onChanged: (value) => setState(() => _idleDetection = value),
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Allow manual adjustments'),
            subtitle: const Text('Permit operators to amend timesheets with audit trails.'),
            value: _allowManualAdjustments,
            onChanged: (value) => setState(() => _allowManualAdjustments = value),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _timezoneLock,
            decoration: const InputDecoration(labelText: 'Timezone control'),
            items: const [
              DropdownMenuItem(value: 'project', child: Text('Lock to project timezone')),
              DropdownMenuItem(value: 'freelancer', child: Text('Freelancer local timezone')),
              DropdownMenuItem(value: 'utc', child: Text('UTC coordination')),
            ],
            onChanged: (value) => setState(() => _timezoneLock = value ?? 'project'),
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              color: theme.colorScheme.surfaceVariant.withOpacity(0.2),
            ),
            child: Text(
              'Timesheet approvals roll into finance operations with dual authorisation. Controls above ensure enterprise-level evidence for regulated programmes.',
              style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDeliveryPlanCard(ThemeData theme) {
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Delivery plan — tasks & goals', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(
            'Capture rituals, ownership, and success metrics to align everyone on execution.',
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          ..._tasks.asMap().entries.map((entry) {
            final index = entry.key;
            final task = entry.value;
            return Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: theme.colorScheme.surfaceVariant.withOpacity(0.3),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Task ${index + 1}', style: theme.textTheme.labelLarge),
                      if (_tasks.length > 1)
                        IconButton(
                          icon: const Icon(Icons.delete_outline),
                          tooltip: 'Remove task',
                          onPressed: () => _removeTask(index),
                        ),
                    ],
                  ),
                  TextFormField(
                    controller: task.title,
                    decoration: const InputDecoration(labelText: 'Task title'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: task.owner,
                    decoration: const InputDecoration(labelText: 'Owner'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: task.dueDate,
                    decoration: const InputDecoration(labelText: 'Due date'),
                    keyboardType: TextInputType.datetime,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: task.hours,
                    decoration: const InputDecoration(labelText: 'Hours estimate'),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: task.notes,
                    decoration: const InputDecoration(labelText: 'Notes / definition of done'),
                    maxLines: 2,
                  ),
                ],
              ),
            );
          }),
          Align(
            alignment: Alignment.centerLeft,
            child: OutlinedButton.icon(
              onPressed: _addTask,
              icon: const Icon(Icons.add),
              label: const Text('Add task'),
            ),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Project goals', style: theme.textTheme.labelLarge),
              OutlinedButton.icon(
                onPressed: _addGoal,
                icon: const Icon(Icons.flag_outlined),
                label: const Text('Add goal'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ..._goals.asMap().entries.map((entry) {
            final index = entry.key;
            final goal = entry.value;
            return Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: theme.colorScheme.surfaceVariant.withOpacity(0.3),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextFormField(
                    controller: goal.name,
                    decoration: const InputDecoration(labelText: 'Goal name'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: goal.metric,
                    decoration: const InputDecoration(labelText: 'Metric / KPI'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: goal.target,
                    decoration: const InputDecoration(labelText: 'Target'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: goal.timeframe,
                    decoration: const InputDecoration(labelText: 'Timeframe'),
                  ),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () => _removeGoal(index),
                      child: const Text('Remove'),
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

  Widget _buildBudgetCard(ThemeData theme) {
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Budget distribution & payout readiness', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              Chip(
                label: Text('Allocated ${_formatNumber(_allocationPercentageTotal)}%'),
                backgroundColor: _isPercentageBalanced
                    ? theme.colorScheme.secondary.withOpacity(0.15)
                    : theme.colorScheme.error.withOpacity(0.15),
              ),
              Chip(
                label:
                    Text('${_budgetCurrencyController.text} ${_formatNumber(_allocationAmountTotal)}'),
              ),
              if (!_isPercentageBalanced)
                Chip(
                  avatar: Icon(Icons.info_outline, color: theme.colorScheme.onSurfaceVariant),
                  label: const Text('Align allocations to total 100%'),
                ),
            ],
          ),
          const SizedBox(height: 16),
          ..._allocations.asMap().entries.map((entry) {
            final index = entry.key;
            final allocation = entry.value;
            return Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: theme.colorScheme.surfaceVariant.withOpacity(0.25),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextFormField(
                    controller: allocation.contributor,
                    decoration: const InputDecoration(labelText: 'Contributor name'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: allocation.role,
                    decoration: const InputDecoration(labelText: 'Role / function'),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: allocation.percentage,
                          decoration: const InputDecoration(labelText: 'Allocation %'),
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: allocation.amount,
                          decoration: const InputDecoration(labelText: 'Amount'),
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: allocation.currency,
                    decoration: const InputDecoration(labelText: 'Currency'),
                    textCapitalization: TextCapitalization.characters,
                  ),
                  if (_allocations.length > 1)
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () => _removeAllocation(index),
                        child: const Text('Remove'),
                      ),
                    ),
                ],
              ),
            );
          }),
          Align(
            alignment: Alignment.centerLeft,
            child: OutlinedButton.icon(
              onPressed: _addAllocation,
              icon: const Icon(Icons.add_chart),
              label: const Text('Add allocation'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSkillsCard(ThemeData theme) {
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Skills, categories & taxonomy', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          TextFormField(
            controller: _skillInputController,
            decoration: InputDecoration(
              labelText: 'Add skill',
              suffixIcon: IconButton(
                icon: const Icon(Icons.add),
                onPressed: () => _addSkill(_skillInputController.text),
              ),
            ),
            onFieldSubmitted: _addSkill,
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final skill in _skills)
                InputChip(
                  label: Text(skill),
                  onDeleted: () => _removeSkill(skill),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: _skillSuggestions
                .map((skill) => ActionChip(
                      label: Text(skill),
                      onPressed: () => _addSkill(skill),
                    ))
                .toList(),
          ),
          const SizedBox(height: 20),
          Text('Project categories', style: theme.textTheme.labelLarge),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: _projectCategories
                .map((category) => FilterChip(
                      label: Text(category),
                      selected: _categories.contains(category),
                      onSelected: (_) => _toggleCategory(category),
                    ))
                .toList(),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _categoryInputController,
            decoration: InputDecoration(
              labelText: 'Custom category',
              suffixIcon: IconButton(
                icon: const Icon(Icons.add),
                onPressed: () => _addCategory(_categoryInputController.text),
              ),
            ),
            onFieldSubmitted: _addCategory,
          ),
        ],
      ),
    );
  }

  Widget _buildTalentSourcingCard(ThemeData theme) {
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Talent sourcing & invites', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          ..._invites.asMap().entries.map((entry) {
            final index = entry.key;
            final invite = entry.value;
            return Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: theme.colorScheme.surfaceVariant.withOpacity(0.3),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Invite ${index + 1}', style: theme.textTheme.labelLarge),
                      if (_invites.length > 1)
                        IconButton(
                          icon: const Icon(Icons.delete_outline),
                          onPressed: () => _removeInvite(index),
                        ),
                    ],
                  ),
                  TextFormField(
                    controller: invite.name,
                    decoration: const InputDecoration(labelText: 'Name'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: invite.email,
                    decoration: const InputDecoration(labelText: 'Email'),
                    keyboardType: TextInputType.emailAddress,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: invite.role,
                    decoration: const InputDecoration(labelText: 'Role'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: invite.message,
                    decoration: const InputDecoration(labelText: 'Invite message'),
                    maxLines: 2,
                  ),
                ],
              ),
            );
          }),
          Align(
            alignment: Alignment.centerLeft,
            child: OutlinedButton.icon(
              onPressed: _addInvite,
              icon: const Icon(Icons.mail_outline),
              label: const Text('Add invite'),
            ),
          ),
          const SizedBox(height: 24),
          Text('Freelancer discovery', style: theme.textTheme.labelLarge),
          const SizedBox(height: 8),
          TextFormField(
            controller: _talentQueryController,
            decoration: const InputDecoration(
              labelText: 'Search query',
              hintText: 'Brand strategist fintech',
            ),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _talentLocationController,
            decoration: const InputDecoration(
              labelText: 'Preferred location / timezone',
              hintText: 'Remote • GMT+1',
            ),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _talentStartController,
            decoration: const InputDecoration(labelText: 'Preferred start date'),
            keyboardType: TextInputType.datetime,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _talentBudgetController,
            decoration: const InputDecoration(
              labelText: 'Budget ceiling',
              hintText: '5000',
            ),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _talentQuoteMessageController,
            decoration: const InputDecoration(
              labelText: 'Quote request message',
              hintText: 'Share context, deliverables, and success criteria.',
            ),
            maxLines: 3,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _talentQuoteDueDateController,
            decoration: const InputDecoration(labelText: 'Quote due date'),
            keyboardType: TextInputType.datetime,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _searchSkillInputController,
            decoration: InputDecoration(
              labelText: 'Add search skill',
              suffixIcon: IconButton(
                icon: const Icon(Icons.add),
                onPressed: () => _addSearchSkill(_searchSkillInputController.text),
              ),
            ),
            onFieldSubmitted: _addSearchSkill,
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final skill in _searchSkills)
                InputChip(
                  label: Text(skill),
                  onDeleted: () => _removeSearchSkill(skill),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: _skillSuggestions
                .map((skill) => ActionChip(
                      label: Text(skill),
                      onPressed: () => _addSearchSkill(skill),
                    ))
                .toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildAutoAssignCard(ThemeData theme) {
    return GigvoraCard(
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
                      Text(
                        'Total ${_formatPercent(_weightsTotal)}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
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
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
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
                    style: theme.textTheme.labelLarge?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
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
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
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
    );
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

class _TaskDraft {
  _TaskDraft()
      : title = TextEditingController(),
        owner = TextEditingController(),
        dueDate = TextEditingController(),
        hours = TextEditingController(),
        notes = TextEditingController();

  final TextEditingController title;
  final TextEditingController owner;
  final TextEditingController dueDate;
  final TextEditingController hours;
  final TextEditingController notes;

  Map<String, dynamic> toJson() {
    final hoursValue = double.tryParse(hours.text.trim());
    return <String, dynamic>{
      'title': title.text.trim(),
      'owner': owner.text.trim(),
      'dueDate': dueDate.text.trim(),
      'hoursEstimate': hoursValue?.isFinite == true ? hoursValue : null,
      'notes': notes.text.trim(),
    };
  }

  void dispose() {
    title.dispose();
    owner.dispose();
    dueDate.dispose();
    hours.dispose();
    notes.dispose();
  }
}

class _GoalDraft {
  _GoalDraft()
      : name = TextEditingController(),
        metric = TextEditingController(),
        target = TextEditingController(),
        timeframe = TextEditingController();

  final TextEditingController name;
  final TextEditingController metric;
  final TextEditingController target;
  final TextEditingController timeframe;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'name': name.text.trim(),
      'metric': metric.text.trim(),
      'target': target.text.trim(),
      'timeframe': timeframe.text.trim(),
    };
  }

  void dispose() {
    name.dispose();
    metric.dispose();
    target.dispose();
    timeframe.dispose();
  }
}

class _AllocationDraft {
  _AllocationDraft({String? currency})
      : contributor = TextEditingController(),
        role = TextEditingController(),
        percentage = TextEditingController(),
        amount = TextEditingController(),
        currency = TextEditingController(text: currency ?? 'USD');

  final TextEditingController contributor;
  final TextEditingController role;
  final TextEditingController percentage;
  final TextEditingController amount;
  final TextEditingController currency;

  Map<String, dynamic> toJson() {
    final percentageValue = double.tryParse(percentage.text.trim());
    final amountValue = double.tryParse(amount.text.trim());
    return <String, dynamic>{
      'contributor': contributor.text.trim(),
      'role': role.text.trim(),
      'percentage': percentageValue?.isFinite == true ? percentageValue : null,
      'amount': amountValue?.isFinite == true ? amountValue : null,
      'currency': currency.text.trim(),
    };
  }

  void dispose() {
    contributor.dispose();
    role.dispose();
    percentage.dispose();
    amount.dispose();
    currency.dispose();
  }
}

class _InviteDraft {
  _InviteDraft()
      : name = TextEditingController(),
        email = TextEditingController(),
        role = TextEditingController(),
        message = TextEditingController();

  final TextEditingController name;
  final TextEditingController email;
  final TextEditingController role;
  final TextEditingController message;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'name': name.text.trim(),
      'email': email.text.trim(),
      'role': role.text.trim(),
      'message': message.text.trim(),
    };
  }

  void dispose() {
    name.dispose();
    email.dispose();
    role.dispose();
    message.dispose();
  }
}

const Map<String, String> _weightLabels = <String, String>{
  'recency': 'Last assignment recency',
  'rating': 'Quality rating',
  'completionQuality': 'Completion rate',
  'earningsBalance': 'Earnings balance',
  'inclusion': 'New freelancer boost',
};
