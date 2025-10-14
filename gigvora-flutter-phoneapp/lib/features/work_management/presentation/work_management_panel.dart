import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../theme/widgets.dart';
import '../application/work_management_controller.dart';
import '../data/models/work_management_overview.dart';

class ProjectOption {
  const ProjectOption({required this.id, required this.label});

  final int id;
  final String label;
}

class WorkManagementPanel extends ConsumerStatefulWidget {
  const WorkManagementPanel({
    super.key,
    required this.initialProjectId,
    this.projectOptions = const <ProjectOption>[],
    this.readOnly = false,
    this.accessMessage,
  });

  final int initialProjectId;
  final List<ProjectOption> projectOptions;
  final bool readOnly;
  final String? accessMessage;

  @override
  ConsumerState<WorkManagementPanel> createState() => _WorkManagementPanelState();
}

class _WorkManagementPanelState extends ConsumerState<WorkManagementPanel> {
  late int _projectId;
  late TextEditingController _projectIdController;

  final _sprintFormKey = GlobalKey<FormState>();
  final _sprintNameController = TextEditingController();
  final _sprintGoalController = TextEditingController();
  final _sprintStartController = TextEditingController();
  final _sprintEndController = TextEditingController();
  final _velocityController = TextEditingController();

  final _taskFormKey = GlobalKey<FormState>();
  final _taskTitleController = TextEditingController();
  String? _taskSprintId;
  String _taskStatus = 'backlog';
  String _taskPriority = 'medium';
  final _taskStoryPointsController = TextEditingController();
  final _taskDueDateController = TextEditingController();
  final _taskAssigneeController = TextEditingController();

  final _timeFormKey = GlobalKey<FormState>();
  String? _timeTaskId;
  final _timeUserIdController = TextEditingController();
  final _timeMinutesController = TextEditingController();
  final _timeRateController = TextEditingController();
  bool _timeBillable = true;
  final _timeNotesController = TextEditingController();

  final _riskFormKey = GlobalKey<FormState>();
  final _riskTitleController = TextEditingController();
  String? _riskSprintId;
  String? _riskTaskId;
  String _riskImpact = 'medium';
  String _riskStatus = 'open';
  final _riskProbabilityController = TextEditingController();
  final _riskSeverityController = TextEditingController();
  final _riskOwnerController = TextEditingController();
  final _riskMitigationController = TextEditingController();

  final _changeFormKey = GlobalKey<FormState>();
  final _changeTitleController = TextEditingController();
  String? _changeSprintId;
  final _changeRequestedByController = TextEditingController();
  final _changeUrlController = TextEditingController();
  final _changeDescriptionController = TextEditingController();

  bool _creatingSprint = false;
  bool _creatingTask = false;
  bool _loggingTime = false;
  bool _registeringRisk = false;
  bool _submittingChange = false;

  @override
  void initState() {
    super.initState();
    _projectId = widget.initialProjectId > 0 ? widget.initialProjectId : 1;
    _projectIdController = TextEditingController(text: '$_projectId');
  }

  @override
  void dispose() {
    _projectIdController.dispose();
    _sprintNameController.dispose();
    _sprintGoalController.dispose();
    _sprintStartController.dispose();
    _sprintEndController.dispose();
    _velocityController.dispose();
    _taskTitleController.dispose();
    _taskStoryPointsController.dispose();
    _taskDueDateController.dispose();
    _taskAssigneeController.dispose();
    _timeUserIdController.dispose();
    _timeMinutesController.dispose();
    _timeRateController.dispose();
    _timeNotesController.dispose();
    _riskTitleController.dispose();
    _riskProbabilityController.dispose();
    _riskSeverityController.dispose();
    _riskOwnerController.dispose();
    _riskMitigationController.dispose();
    _changeTitleController.dispose();
    _changeRequestedByController.dispose();
    _changeUrlController.dispose();
    _changeDescriptionController.dispose();
    super.dispose();
  }

  void _updateProjectId(int value) {
    if (value <= 0) {
      return;
    }
    setState(() {
      _projectId = value;
      _projectIdController.text = '$value';
    });
  }

  void _showSnack(String message, {bool error = false}) {
    if (!mounted) return;
    final theme = Theme.of(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white),
        ),
        backgroundColor: error ? theme.colorScheme.error : theme.colorScheme.primary,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  bool get _interactionLocked => widget.readOnly;

  Future<void> _submitSprint(WorkManagementController controller) async {
    if (_interactionLocked) {
      _showSnack('You do not have permission to modify this workspace.', error: true);
      return;
    }
    if (!_sprintFormKey.currentState!.validate()) {
      return;
    }
    setState(() => _creatingSprint = true);
    try {
      final draft = WorkSprintDraft(
        name: _sprintNameController.text.trim(),
        goal: _sprintGoalController.text.trim().isEmpty ? null : _sprintGoalController.text.trim(),
        startDate: _parseDate(_sprintStartController.text.trim()),
        endDate: _parseDate(_sprintEndController.text.trim()),
        velocityTarget: _parseDouble(_velocityController.text.trim()),
      );
      await controller.createSprint(draft);
      _sprintFormKey.currentState!.reset();
      _sprintNameController.clear();
      _sprintGoalController.clear();
      _sprintStartController.clear();
      _sprintEndController.clear();
      _velocityController.clear();
      _showSnack('Sprint created successfully.');
    } catch (error) {
      _showSnack('Unable to create sprint: $error', error: true);
    } finally {
      if (mounted) {
        setState(() => _creatingSprint = false);
      }
    }
  }

  Future<void> _submitTask(WorkManagementController controller) async {
    if (_interactionLocked) {
      _showSnack('You do not have permission to modify this workspace.', error: true);
      return;
    }
    if (!_taskFormKey.currentState!.validate()) {
      return;
    }
    setState(() => _creatingTask = true);
    try {
      final draft = WorkTaskDraft(
        title: _taskTitleController.text.trim(),
        sprintId: _taskSprintId == null || _taskSprintId!.isEmpty ? null : int.tryParse(_taskSprintId!),
        status: _taskStatus,
        priority: _taskPriority,
        storyPoints: _parseDouble(_taskStoryPointsController.text.trim()),
        dueDate: _parseDate(_taskDueDateController.text.trim()),
        assigneeId: int.tryParse(_taskAssigneeController.text.trim()),
        metadata: const {'source': 'mobile_app'},
      );
      await controller.createTask(draft);
      _taskFormKey.currentState!.reset();
      _taskTitleController.clear();
      _taskStoryPointsController.clear();
      _taskDueDateController.clear();
      _taskAssigneeController.clear();
      setState(() {
        _taskSprintId = null;
        _taskStatus = 'backlog';
        _taskPriority = 'medium';
      });
      _showSnack('Task added to the board.');
    } catch (error) {
      _showSnack('Unable to create task: $error', error: true);
    } finally {
      if (mounted) {
        setState(() => _creatingTask = false);
      }
    }
  }

  Future<void> _submitTimeEntry(WorkManagementController controller) async {
    if (_interactionLocked) {
      _showSnack('You do not have permission to modify this workspace.', error: true);
      return;
    }
    if (!_timeFormKey.currentState!.validate()) {
      return;
    }
    final taskId = int.tryParse(_timeTaskId ?? '');
    if (taskId == null) {
      _showSnack('Select a task before logging time.', error: true);
      return;
    }
    setState(() => _loggingTime = true);
    try {
      final draft = WorkTimeEntryDraft(
        userId: int.parse(_timeUserIdController.text.trim()),
        minutesSpent: int.tryParse(_timeMinutesController.text.trim()),
        billable: _timeBillable,
        hourlyRate: _parseDouble(_timeRateController.text.trim()),
        notes: _timeNotesController.text.trim().isEmpty ? null : _timeNotesController.text.trim(),
      );
      await controller.logTime(taskId, draft);
      _timeFormKey.currentState!.reset();
      _timeUserIdController.clear();
      _timeMinutesController.clear();
      _timeRateController.clear();
      _timeNotesController.clear();
      setState(() {
        _timeTaskId = null;
        _timeBillable = true;
      });
      _showSnack('Time entry recorded.');
    } catch (error) {
      _showSnack('Unable to log time: $error', error: true);
    } finally {
      if (mounted) {
        setState(() => _loggingTime = false);
      }
    }
  }

  Future<void> _submitRisk(WorkManagementController controller) async {
    if (_interactionLocked) {
      _showSnack('You do not have permission to modify this workspace.', error: true);
      return;
    }
    if (!_riskFormKey.currentState!.validate()) {
      return;
    }
    setState(() => _registeringRisk = true);
    try {
      final draft = WorkRiskDraft(
        title: _riskTitleController.text.trim(),
        sprintId: _riskSprintId == null || _riskSprintId!.isEmpty ? null : int.tryParse(_riskSprintId!),
        taskId: _riskTaskId == null || _riskTaskId!.isEmpty ? null : int.tryParse(_riskTaskId!),
        impact: _riskImpact,
        probability: _parseDouble(_riskProbabilityController.text.trim()),
        severityScore: _parseDouble(_riskSeverityController.text.trim()),
        status: _riskStatus,
        mitigationPlan:
            _riskMitigationController.text.trim().isEmpty ? null : _riskMitigationController.text.trim(),
        ownerId: int.tryParse(_riskOwnerController.text.trim()),
      );
      await controller.createRisk(draft);
      _riskFormKey.currentState!.reset();
      _riskTitleController.clear();
      _riskProbabilityController.clear();
      _riskSeverityController.clear();
      _riskOwnerController.clear();
      _riskMitigationController.clear();
      setState(() {
        _riskImpact = 'medium';
        _riskStatus = 'open';
        _riskSprintId = null;
        _riskTaskId = null;
      });
      _showSnack('Risk registered with the project office.');
    } catch (error) {
      _showSnack('Unable to register risk: $error', error: true);
    } finally {
      if (mounted) {
        setState(() => _registeringRisk = false);
      }
    }
  }

  Future<void> _submitChangeRequest(WorkManagementController controller) async {
    if (_interactionLocked) {
      _showSnack('You do not have permission to modify this workspace.', error: true);
      return;
    }
    if (!_changeFormKey.currentState!.validate()) {
      return;
    }
    setState(() => _submittingChange = true);
    try {
      final description = _changeDescriptionController.text.trim();
      final draft = WorkChangeRequestDraft(
        title: _changeTitleController.text.trim(),
        sprintId: _changeSprintId == null || _changeSprintId!.isEmpty ? null : int.tryParse(_changeSprintId!),
        description: description.isEmpty ? null : description,
        requestedById: int.tryParse(_changeRequestedByController.text.trim()),
        eSignDocumentUrl:
            _changeUrlController.text.trim().isEmpty ? null : _changeUrlController.text.trim(),
        changeImpact: description.isEmpty
            ? null
            : {
                'summary': description.length > 140 ? '${description.substring(0, 137)}…' : description,
              },
      );
      await controller.createChangeRequest(draft);
      _changeFormKey.currentState!.reset();
      _changeTitleController.clear();
      _changeRequestedByController.clear();
      _changeUrlController.clear();
      _changeDescriptionController.clear();
      setState(() {
        _changeSprintId = null;
      });
      _showSnack('Change request routed for approval.');
    } catch (error) {
      _showSnack('Unable to submit change request: $error', error: true);
    } finally {
      if (mounted) {
        setState(() => _submittingChange = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final controller = ref.watch(workManagementControllerProvider(_projectId));
    final notifier = ref.read(workManagementControllerProvider(_projectId).notifier);
    final overview = controller.data;
    final isLoading = controller.loading;
    final hasError = controller.hasError;

    final projectOptions = widget.projectOptions;
    final theme = Theme.of(context);

    final tasks = overview == null
        ? const <WorkTask>[]
        : <WorkTask>{
            ...overview.backlog,
            for (final sprint in overview.sprints) ...sprint.tasks,
          }.toList(growable: false);

    return GigvoraCard(
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
                    Text('Task & sprint manager', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(
                      'Launch sprints, orchestrate backlog health, and route approvals with enterprise telemetry.',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              IconButton(
                tooltip: 'Refresh overview',
                onPressed: () => notifier.refresh(),
                icon: isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.refresh),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              SizedBox(
                width: 220,
                child: DropdownButtonFormField<int>(
                  value: projectOptions.any((option) => option.id == _projectId) ? _projectId : null,
                  decoration: const InputDecoration(labelText: 'Select project'),
                  items: projectOptions
                      .map(
                        (option) => DropdownMenuItem<int>(
                          value: option.id,
                          child: Text(option.label, overflow: TextOverflow.ellipsis),
                        ),
                      )
                      .toList(growable: false),
                  onChanged: (value) {
                    if (value != null) {
                      _updateProjectId(value);
                    }
                  },
                ),
              ),
              SizedBox(
                width: 160,
                child: TextFormField(
                  controller: _projectIdController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Project ID'),
                  onFieldSubmitted: (value) {
                    final parsed = int.tryParse(value.trim());
                    if (parsed != null && parsed > 0) {
                      _updateProjectId(parsed);
                    }
                  },
                ),
              ),
              ElevatedButton.icon(
                onPressed: () {
                  final parsed = int.tryParse(_projectIdController.text.trim());
                  if (parsed != null && parsed > 0) {
                    _updateProjectId(parsed);
                  } else {
                    _showSnack('Enter a valid numeric project identifier.', error: true);
                  }
                },
                icon: const Icon(Icons.sync_alt),
                label: const Text('Load project'),
              ),
            ],
          ),
          if (widget.accessMessage != null) ...[
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.errorContainer,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                widget.accessMessage!,
                style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onErrorContainer),
              ),
            ),
          ],
          if (hasError)
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: theme.colorScheme.errorContainer,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  controller.error?.toString() ?? 'Unable to load work management data.',
                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onErrorContainer),
                ),
              ),
            ),
          if (overview != null) ...[
            const SizedBox(height: 16),
            _SummaryGrid(summary: overview.summary, backlogSummary: overview.backlogSummary),
            const SizedBox(height: 24),
            _FormsSection(
              sprintFormKey: _sprintFormKey,
              sprintNameController: _sprintNameController,
              sprintGoalController: _sprintGoalController,
              sprintStartController: _sprintStartController,
              sprintEndController: _sprintEndController,
              velocityController: _velocityController,
              creatingSprint: _creatingSprint,
              onSprintSubmit: () => _submitSprint(notifier),
              taskFormKey: _taskFormKey,
              taskTitleController: _taskTitleController,
              taskSprintId: _taskSprintId,
              onTaskSprintChanged: (value) => setState(() => _taskSprintId = value),
              taskStatus: _taskStatus,
              onTaskStatusChanged: (value) => setState(() => _taskStatus = value),
              taskPriority: _taskPriority,
              onTaskPriorityChanged: (value) => setState(() => _taskPriority = value),
              taskStoryPointsController: _taskStoryPointsController,
              taskDueDateController: _taskDueDateController,
              taskAssigneeController: _taskAssigneeController,
              creatingTask: _creatingTask,
              onTaskSubmit: () => _submitTask(notifier),
              timeFormKey: _timeFormKey,
              timeTaskId: _timeTaskId,
              onTimeTaskChanged: (value) => setState(() => _timeTaskId = value),
              timeUserIdController: _timeUserIdController,
              timeMinutesController: _timeMinutesController,
              timeRateController: _timeRateController,
              timeBillable: _timeBillable,
              onTimeBillableChanged: (value) => setState(() => _timeBillable = value),
              timeNotesController: _timeNotesController,
              loggingTime: _loggingTime,
              onTimeSubmit: () => _submitTimeEntry(notifier),
              riskFormKey: _riskFormKey,
              riskTitleController: _riskTitleController,
              riskSprintId: _riskSprintId,
              onRiskSprintChanged: (value) => setState(() => _riskSprintId = value),
              riskTaskId: _riskTaskId,
              onRiskTaskChanged: (value) => setState(() => _riskTaskId = value),
              riskImpact: _riskImpact,
              onRiskImpactChanged: (value) => setState(() => _riskImpact = value),
              riskStatus: _riskStatus,
              onRiskStatusChanged: (value) => setState(() => _riskStatus = value),
              riskProbabilityController: _riskProbabilityController,
              riskSeverityController: _riskSeverityController,
              riskOwnerController: _riskOwnerController,
              riskMitigationController: _riskMitigationController,
              registeringRisk: _registeringRisk,
              onRiskSubmit: () => _submitRisk(notifier),
              changeFormKey: _changeFormKey,
              changeTitleController: _changeTitleController,
              changeSprintId: _changeSprintId,
              onChangeSprintChanged: (value) => setState(() => _changeSprintId = value),
              changeRequestedByController: _changeRequestedByController,
              changeUrlController: _changeUrlController,
              changeDescriptionController: _changeDescriptionController,
              submittingChange: _submittingChange,
              onChangeSubmit: () => _submitChangeRequest(notifier),
              sprintOptions: overview.sprints,
              taskOptions: tasks,
              interactionLocked: _interactionLocked,
            ),
            const SizedBox(height: 24),
            _SprintsView(
              sprints: overview.sprints,
              readOnly: widget.readOnly,
              onApproveChange: (changeId) => notifier.approveChangeRequest(changeId),
            ),
            const SizedBox(height: 24),
            _BacklogView(tasks: overview.backlog),
            const SizedBox(height: 24),
            _RisksView(risks: overview.risks),
            const SizedBox(height: 24),
            _ChangeRequestsView(
              requests: overview.changeRequests,
              readOnly: widget.readOnly,
              onApprove: (id) => notifier.approveChangeRequest(id),
            ),
          ] else if (isLoading) ...[
            const SizedBox(height: 32),
            const Center(child: CircularProgressIndicator()),
          ],
        ],
      ),
    );
  }

  DateTime? _parseDate(String value) {
    if (value.isEmpty) return null;
    return DateTime.tryParse(value);
  }

  double? _parseDouble(String value) {
    if (value.isEmpty) return null;
    return double.tryParse(value);
  }
}

class _SummaryGrid extends StatelessWidget {
  const _SummaryGrid({
    required this.summary,
    required this.backlogSummary,
  });

  final WorkSummary summary;
  final WorkBacklogSummary backlogSummary;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        _SummaryCard(
          label: 'Active sprints',
          value: '${summary.activeSprints}/${summary.totalSprints}',
          color: theme.colorScheme.primary,
        ),
        _SummaryCard(
          label: 'Backlog ready',
          value: '${backlogSummary.readyForPlanning}',
          color: theme.colorScheme.secondary,
        ),
        _SummaryCard(
          label: 'Open risks',
          value: '${summary.openRisks}',
          color: theme.colorScheme.tertiary,
        ),
        _SummaryCard(
          label: 'Pending approvals',
          value: '${summary.pendingApprovals}',
          color: theme.colorScheme.error,
        ),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: 160,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withOpacity(0.24)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: theme.textTheme.labelSmall?.copyWith(color: color.withOpacity(0.9))),
          const SizedBox(height: 8),
          Text(value, style: theme.textTheme.titleLarge?.copyWith(color: color.darken())),
        ],
      ),
    );
  }
}

extension on Color {
  Color darken([double amount = .12]) {
    final hsl = HSLColor.fromColor(this);
    final hslDark = hsl.withLightness((hsl.lightness - amount).clamp(0.0, 1.0));
    return hslDark.toColor();
  }
}

class _FormsSection extends StatelessWidget {
  const _FormsSection({
    required this.sprintFormKey,
    required this.sprintNameController,
    required this.sprintGoalController,
    required this.sprintStartController,
    required this.sprintEndController,
    required this.velocityController,
    required this.creatingSprint,
    required this.onSprintSubmit,
    required this.taskFormKey,
    required this.taskTitleController,
    required this.taskSprintId,
    required this.onTaskSprintChanged,
    required this.taskStatus,
    required this.onTaskStatusChanged,
    required this.taskPriority,
    required this.onTaskPriorityChanged,
    required this.taskStoryPointsController,
    required this.taskDueDateController,
    required this.taskAssigneeController,
    required this.creatingTask,
    required this.onTaskSubmit,
    required this.timeFormKey,
    required this.timeTaskId,
    required this.onTimeTaskChanged,
    required this.timeUserIdController,
    required this.timeMinutesController,
    required this.timeRateController,
    required this.timeBillable,
    required this.onTimeBillableChanged,
    required this.timeNotesController,
    required this.loggingTime,
    required this.onTimeSubmit,
    required this.riskFormKey,
    required this.riskTitleController,
    required this.riskSprintId,
    required this.onRiskSprintChanged,
    required this.riskTaskId,
    required this.onRiskTaskChanged,
    required this.riskImpact,
    required this.onRiskImpactChanged,
    required this.riskStatus,
    required this.onRiskStatusChanged,
    required this.riskProbabilityController,
    required this.riskSeverityController,
    required this.riskOwnerController,
    required this.riskMitigationController,
    required this.registeringRisk,
    required this.onRiskSubmit,
    required this.changeFormKey,
    required this.changeTitleController,
    required this.changeSprintId,
    required this.onChangeSprintChanged,
    required this.changeRequestedByController,
    required this.changeUrlController,
    required this.changeDescriptionController,
    required this.submittingChange,
    required this.onChangeSubmit,
    required this.sprintOptions,
    required this.taskOptions,
    required this.interactionLocked,
  });

  final GlobalKey<FormState> sprintFormKey;
  final TextEditingController sprintNameController;
  final TextEditingController sprintGoalController;
  final TextEditingController sprintStartController;
  final TextEditingController sprintEndController;
  final TextEditingController velocityController;
  final bool creatingSprint;
  final VoidCallback onSprintSubmit;

  final GlobalKey<FormState> taskFormKey;
  final TextEditingController taskTitleController;
  final String? taskSprintId;
  final ValueChanged<String?> onTaskSprintChanged;
  final String taskStatus;
  final ValueChanged<String> onTaskStatusChanged;
  final String taskPriority;
  final ValueChanged<String> onTaskPriorityChanged;
  final TextEditingController taskStoryPointsController;
  final TextEditingController taskDueDateController;
  final TextEditingController taskAssigneeController;
  final bool creatingTask;
  final VoidCallback onTaskSubmit;

  final GlobalKey<FormState> timeFormKey;
  final String? timeTaskId;
  final ValueChanged<String?> onTimeTaskChanged;
  final TextEditingController timeUserIdController;
  final TextEditingController timeMinutesController;
  final TextEditingController timeRateController;
  final bool timeBillable;
  final ValueChanged<bool> onTimeBillableChanged;
  final TextEditingController timeNotesController;
  final bool loggingTime;
  final VoidCallback onTimeSubmit;

  final GlobalKey<FormState> riskFormKey;
  final TextEditingController riskTitleController;
  final String? riskSprintId;
  final ValueChanged<String?> onRiskSprintChanged;
  final String? riskTaskId;
  final ValueChanged<String?> onRiskTaskChanged;
  final String riskImpact;
  final ValueChanged<String> onRiskImpactChanged;
  final String riskStatus;
  final ValueChanged<String> onRiskStatusChanged;
  final TextEditingController riskProbabilityController;
  final TextEditingController riskSeverityController;
  final TextEditingController riskOwnerController;
  final TextEditingController riskMitigationController;
  final bool registeringRisk;
  final VoidCallback onRiskSubmit;

  final GlobalKey<FormState> changeFormKey;
  final TextEditingController changeTitleController;
  final String? changeSprintId;
  final ValueChanged<String?> onChangeSprintChanged;
  final TextEditingController changeRequestedByController;
  final TextEditingController changeUrlController;
  final TextEditingController changeDescriptionController;
  final bool submittingChange;
  final VoidCallback onChangeSubmit;

  final List<WorkSprint> sprintOptions;
  final List<WorkTask> taskOptions;
  final bool interactionLocked;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ExpansionTile(
          title: const Text('Launch sprint'),
          subtitle: const Text('Set guardrails and capacity targets for the next cadence'),
          initiallyExpanded: false,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: AbsorbPointer(
                absorbing: interactionLocked,
                child: Opacity(
                  opacity: interactionLocked ? 0.6 : 1,
                  child: Form(
                    key: sprintFormKey,
                    child: Column(
                      children: [
                        TextFormField(
                          controller: sprintNameController,
                          decoration: const InputDecoration(labelText: 'Sprint name'),
                          validator: (value) => value == null || value.trim().isEmpty ? 'Enter a sprint name' : null,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: sprintGoalController,
                          decoration: const InputDecoration(labelText: 'Goal (optional)'),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: sprintStartController,
                          decoration: const InputDecoration(labelText: 'Start date (YYYY-MM-DD)'),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: sprintEndController,
                          decoration: const InputDecoration(labelText: 'End date (YYYY-MM-DD)'),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: velocityController,
                          decoration: const InputDecoration(labelText: 'Velocity target (pts)'),
                          keyboardType: TextInputType.number,
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: creatingSprint ? null : onSprintSubmit,
                            child:
                                Text(creatingSprint ? 'Saving sprint…' : 'Save sprint'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
        ExpansionTile(
          title: const Text('Add task'),
          subtitle: const Text('Delegate work and connect sprint backlogs'),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: AbsorbPointer(
                absorbing: interactionLocked,
                child: Opacity(
                  opacity: interactionLocked ? 0.6 : 1,
                  child: Form(
                    key: taskFormKey,
                    child: Column(
                      children: [
                        TextFormField(
                          controller: taskTitleController,
                          decoration: const InputDecoration(labelText: 'Task title'),
                          validator: (value) => value == null || value.trim().isEmpty ? 'Enter a task title' : null,
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          value: taskSprintId,
                          decoration: const InputDecoration(labelText: 'Sprint (optional)'),
                          items: <DropdownMenuItem<String>>[
                            const DropdownMenuItem(value: '', child: Text('Backlog')),
                            for (final sprint in sprintOptions)
                              DropdownMenuItem(
                                value: '${sprint.id}',
                                child: Text(sprint.name, overflow: TextOverflow.ellipsis),
                              ),
                          ],
                          onChanged: onTaskSprintChanged,
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          value: taskStatus,
                          decoration: const InputDecoration(labelText: 'Status'),
                          items: const [
                            DropdownMenuItem(value: 'backlog', child: Text('Backlog')),
                            DropdownMenuItem(value: 'ready', child: Text('Ready')),
                            DropdownMenuItem(value: 'in_progress', child: Text('In progress')),
                            DropdownMenuItem(value: 'review', child: Text('Review')),
                            DropdownMenuItem(value: 'blocked', child: Text('Blocked')),
                            DropdownMenuItem(value: 'done', child: Text('Done')),
                          ],
                          onChanged: (value) => onTaskStatusChanged(value ?? 'backlog'),
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          value: taskPriority,
                          decoration: const InputDecoration(labelText: 'Priority'),
                          items: const [
                            DropdownMenuItem(value: 'low', child: Text('Low')),
                            DropdownMenuItem(value: 'medium', child: Text('Medium')),
                            DropdownMenuItem(value: 'high', child: Text('High')),
                            DropdownMenuItem(value: 'critical', child: Text('Critical')),
                          ],
                          onChanged: (value) => onTaskPriorityChanged(value ?? 'medium'),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: taskStoryPointsController,
                          decoration: const InputDecoration(labelText: 'Story points'),
                          keyboardType: TextInputType.number,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: taskDueDateController,
                          decoration: const InputDecoration(labelText: 'Due date (YYYY-MM-DD)'),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: taskAssigneeController,
                          decoration: const InputDecoration(labelText: 'Assignee ID'),
                          keyboardType: TextInputType.number,
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: creatingTask ? null : onTaskSubmit,
                            child: Text(creatingTask ? 'Saving task…' : 'Add task'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
        ExpansionTile(
          title: const Text('Log time'),
          subtitle: const Text('Keep billable utilisation synced to your sprint ledger'),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: AbsorbPointer(
                absorbing: interactionLocked,
                child: Opacity(
                  opacity: interactionLocked ? 0.6 : 1,
                  child: Form(
                    key: timeFormKey,
                    child: Column(
                      children: [
                        DropdownButtonFormField<String>(
                          value: timeTaskId,
                          decoration: const InputDecoration(labelText: 'Task'),
                          items: [
                            const DropdownMenuItem(value: '', child: Text('Select task')),
                            for (final task in taskOptions)
                              DropdownMenuItem(
                                value: '${task.id}',
                                child: Text('#${task.id} · ${task.title}', overflow: TextOverflow.ellipsis),
                              ),
                          ],
                          validator: (value) => value == null || value.isEmpty ? 'Select a task' : null,
                          onChanged: onTimeTaskChanged,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: timeUserIdController,
                          decoration: const InputDecoration(labelText: 'User ID'),
                          keyboardType: TextInputType.number,
                          validator: (value) => value == null || value.trim().isEmpty ? 'Enter a user ID' : null,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: timeMinutesController,
                          decoration: const InputDecoration(labelText: 'Minutes spent'),
                          keyboardType: TextInputType.number,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: timeRateController,
                          decoration: const InputDecoration(labelText: 'Hourly rate'),
                          keyboardType: TextInputType.number,
                        ),
                        const SizedBox(height: 12),
                        SwitchListTile(
                          value: timeBillable,
                          onChanged: onTimeBillableChanged,
                          title: const Text('Billable time entry'),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: timeNotesController,
                          decoration: const InputDecoration(labelText: 'Notes (optional)'),
                          minLines: 2,
                          maxLines: 4,
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: loggingTime ? null : onTimeSubmit,
                            child: Text(loggingTime ? 'Recording time…' : 'Log time'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
        ExpansionTile(
          title: const Text('Register risk'),
          subtitle: const Text('Record mitigation plans and owners'),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: AbsorbPointer(
                absorbing: interactionLocked,
                child: Opacity(
                  opacity: interactionLocked ? 0.6 : 1,
                  child: Form(
                    key: riskFormKey,
                    child: Column(
                      children: [
                        TextFormField(
                          controller: riskTitleController,
                          decoration: const InputDecoration(labelText: 'Risk title'),
                          validator: (value) => value == null || value.trim().isEmpty ? 'Enter a risk title' : null,
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          value: riskImpact,
                          decoration: const InputDecoration(labelText: 'Impact'),
                          items: const [
                            DropdownMenuItem(value: 'low', child: Text('Low')),
                            DropdownMenuItem(value: 'medium', child: Text('Medium')),
                            DropdownMenuItem(value: 'high', child: Text('High')),
                            DropdownMenuItem(value: 'critical', child: Text('Critical')),
                          ],
                          onChanged: (value) => onRiskImpactChanged(value ?? 'medium'),
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          value: riskStatus,
                          decoration: const InputDecoration(labelText: 'Status'),
                          items: const [
                            DropdownMenuItem(value: 'open', child: Text('Open')),
                            DropdownMenuItem(value: 'mitigating', child: Text('Mitigating')),
                            DropdownMenuItem(value: 'resolved', child: Text('Resolved')),
                            DropdownMenuItem(value: 'closed', child: Text('Closed')),
                          ],
                          onChanged: (value) => onRiskStatusChanged(value ?? 'open'),
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          value: riskSprintId,
                          decoration: const InputDecoration(labelText: 'Sprint (optional)'),
                          items: [
                            const DropdownMenuItem(value: '', child: Text('Project level')),
                            for (final sprint in sprintOptions)
                              DropdownMenuItem(
                                value: '${sprint.id}',
                                child: Text(sprint.name, overflow: TextOverflow.ellipsis),
                              ),
                          ],
                          onChanged: onRiskSprintChanged,
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          value: riskTaskId,
                          decoration: const InputDecoration(labelText: 'Related task (optional)'),
                          items: [
                            const DropdownMenuItem(value: '', child: Text('None')),
                            for (final task in taskOptions)
                              DropdownMenuItem(
                                value: '${task.id}',
                                child: Text('#${task.id} · ${task.title}', overflow: TextOverflow.ellipsis),
                              ),
                          ],
                          onChanged: onRiskTaskChanged,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: riskProbabilityController,
                          decoration: const InputDecoration(labelText: 'Probability (0-1)'),
                          keyboardType: TextInputType.number,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: riskSeverityController,
                          decoration: const InputDecoration(labelText: 'Severity score'),
                          keyboardType: TextInputType.number,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: riskOwnerController,
                          decoration: const InputDecoration(labelText: 'Owner ID (optional)'),
                          keyboardType: TextInputType.number,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: riskMitigationController,
                          decoration: const InputDecoration(labelText: 'Mitigation plan'),
                          minLines: 2,
                          maxLines: 4,
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: registeringRisk ? null : onRiskSubmit,
                            child: Text(registeringRisk ? 'Registering risk…' : 'Register risk'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
        ExpansionTile(
          title: const Text('Submit change request'),
          subtitle: const Text('Route approvals and maintain e-sign audits'),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: AbsorbPointer(
                absorbing: interactionLocked,
                child: Opacity(
                  opacity: interactionLocked ? 0.6 : 1,
                  child: Form(
                    key: changeFormKey,
                    child: Column(
                      children: [
                        TextFormField(
                          controller: changeTitleController,
                          decoration: const InputDecoration(labelText: 'Change request title'),
                          validator: (value) => value == null || value.trim().isEmpty ? 'Enter a title' : null,
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          value: changeSprintId,
                          decoration: const InputDecoration(labelText: 'Sprint (optional)'),
                          items: [
                            const DropdownMenuItem(value: '', child: Text('Cross-sprint')),
                            for (final sprint in sprintOptions)
                              DropdownMenuItem(
                                value: '${sprint.id}',
                                child: Text(sprint.name, overflow: TextOverflow.ellipsis),
                              ),
                          ],
                          onChanged: onChangeSprintChanged,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: changeRequestedByController,
                          decoration: const InputDecoration(labelText: 'Requested by (user ID)'),
                          keyboardType: TextInputType.number,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: changeUrlController,
                          decoration: const InputDecoration(labelText: 'E-sign document URL'),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: changeDescriptionController,
                          decoration: const InputDecoration(labelText: 'Description & rationale'),
                          minLines: 3,
                          maxLines: 6,
                          validator: (value) => value == null || value.trim().isEmpty ? 'Provide a rationale' : null,
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: submittingChange ? null : onChangeSubmit,
                            child: Text(submittingChange ? 'Routing change…' : 'Submit change request'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _SprintsView extends StatelessWidget {
  const _SprintsView({
    required this.sprints,
    required this.readOnly,
    required this.onApproveChange,
  });

  final List<WorkSprint> sprints;
  final bool readOnly;
  final Future<void> Function(int changeRequestId) onApproveChange;

  @override
  Widget build(BuildContext context) {
    if (sprints.isEmpty) {
      return const SizedBox();
    }
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Sprint insights', style: theme.textTheme.titleMedium),
        const SizedBox(height: 12),
        Column(
          children: [
            for (final sprint in sprints)
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(18),
                  color: theme.colorScheme.surfaceVariant.withOpacity(0.35),
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
                              Text(sprint.name, style: theme.textTheme.titleMedium),
                              if (sprint.goal != null && sprint.goal!.isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(top: 4),
                                  child: Text(sprint.goal!, style: theme.textTheme.bodySmall),
                                ),
                            ],
                          ),
                        ),
                        Chip(label: Text(_humanise(sprint.status))),
                      ],
                    ),
                    const SizedBox(height: 12),
                    LinearProgressIndicator(
                      value: sprint.metrics.totalTasks == 0
                          ? 0
                          : sprint.metrics.completedTasks / sprint.metrics.totalTasks,
                      minHeight: 6,
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 16,
                      runSpacing: 12,
                      children: [
                        Text('${sprint.metrics.completedTasks}/${sprint.metrics.totalTasks} tasks complete'),
                        Text('${sprint.metrics.completedStoryPoints}/${sprint.metrics.totalStoryPoints} story points'),
                        Text('${sprint.metrics.timeSummary.totalHours.toStringAsFixed(1)}h tracked'),
                      ],
                    ),
                    if (sprint.changeRequests.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Change requests', style: theme.textTheme.titleSmall),
                            const SizedBox(height: 8),
                            for (final change in sprint.changeRequests)
                              ListTile(
                                contentPadding: EdgeInsets.zero,
                                title: Text(change.title),
                                subtitle: Text(_humanise(change.status)),
                                trailing: change.status == 'pending_approval' && !readOnly
                                    ? TextButton(
                                        onPressed: () => onApproveChange(change.id),
                                        child: const Text('Approve'),
                                      )
                                    : null,
                              ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class _BacklogView extends StatelessWidget {
  const _BacklogView({required this.tasks});

  final List<WorkTask> tasks;

  @override
  Widget build(BuildContext context) {
    if (tasks.isEmpty) {
      return const SizedBox();
    }
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Backlog', style: theme.textTheme.titleMedium),
        const SizedBox(height: 12),
        Column(
          children: [
            for (final task in tasks)
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(child: Text(task.priority.substring(0, 1).toUpperCase())),
                title: Text(task.title),
                subtitle: Text(_humanise(task.status)),
                trailing: task.storyPoints != null ? Text('${task.storyPoints} pts') : null,
              ),
          ],
        ),
      ],
    );
  }
}

class _RisksView extends StatelessWidget {
  const _RisksView({required this.risks});

  final List<WorkRisk> risks;

  @override
  Widget build(BuildContext context) {
    if (risks.isEmpty) {
      return const SizedBox();
    }
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Risks & mitigations', style: theme.textTheme.titleMedium),
        const SizedBox(height: 12),
        Column(
          children: [
            for (final risk in risks)
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: theme.colorScheme.errorContainer.withOpacity(0.35),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(risk.title, style: theme.textTheme.titleSmall),
                    const SizedBox(height: 4),
                    Text('Status: ${_humanise(risk.status)}'),
                    if (risk.mitigationPlan != null && risk.mitigationPlan!.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(risk.mitigationPlan!),
                      ),
                  ],
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class _ChangeRequestsView extends StatelessWidget {
  const _ChangeRequestsView({
    required this.requests,
    required this.readOnly,
    required this.onApprove,
  });

  final List<WorkChangeRequest> requests;
  final bool readOnly;
  final Future<void> Function(int id) onApprove;

  @override
  Widget build(BuildContext context) {
    if (requests.isEmpty) {
      return const SizedBox();
    }
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Change requests', style: theme.textTheme.titleMedium),
        const SizedBox(height: 12),
        Column(
          children: [
            for (final change in requests)
              Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  title: Text(change.title),
                  subtitle: Text(change.description ?? 'No description provided'),
                  trailing: change.status == 'pending_approval' && !readOnly
                      ? TextButton(
                          onPressed: () => onApprove(change.id),
                          child: const Text('Approve'),
                        )
                      : Text(_humanise(change.status)),
                ),
              ),
          ],
        ),
      ],
    );
  }
}

String _humanise(String value) {
  return value
      .split(RegExp(r'[_\s-]+'))
      .where((segment) => segment.isNotEmpty)
      .map((segment) => segment[0].toUpperCase() + segment.substring(1))
      .join(' ');
}
