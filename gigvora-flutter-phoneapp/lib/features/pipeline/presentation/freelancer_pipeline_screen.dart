import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:intl/intl.dart';

import '../../../theme/widgets.dart';
import '../application/freelancer_pipeline_controller.dart';
import '../data/models/freelancer_pipeline_dashboard.dart';

class FreelancerPipelineScreen extends ConsumerStatefulWidget {
  const FreelancerPipelineScreen({super.key});

  @override
  ConsumerState<FreelancerPipelineScreen> createState() => _FreelancerPipelineScreenState();
}

class _FreelancerPipelineScreenState extends ConsumerState<FreelancerPipelineScreen> {
  final _dealFormKey = GlobalKey<FormState>();
  final _dealTitleController = TextEditingController();
  final _dealClientController = TextEditingController();
  final _dealValueController = TextEditingController();
  final _dealIndustryController = TextEditingController();
  final _dealTierController = TextEditingController();
  final _dealCampaignController = TextEditingController();
  int? _dealStageId;
  DateTime? _dealCloseDate;

  final _followUpFormKey = GlobalKey<FormState>();
  int? _followUpDealId;
  DateTime? _followUpDueAt;
  final _followUpChannel = ValueNotifier<String>('email');
  final _followUpNoteController = TextEditingController();

  final _campaignFormKey = GlobalKey<FormState>();
  final _campaignNameController = TextEditingController();
  final _campaignGoalController = TextEditingController();
  String _campaignStatus = 'Planning';
  DateTime? _campaignLaunchDate;

  @override
  void dispose() {
    _dealTitleController.dispose();
    _dealClientController.dispose();
    _dealValueController.dispose();
    _dealIndustryController.dispose();
    _dealTierController.dispose();
    _dealCampaignController.dispose();
    _followUpChannel.dispose();
    _followUpNoteController.dispose();
    _campaignNameController.dispose();
    _campaignGoalController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(freelancerPipelineControllerProvider);
    final controller = ref.read(freelancerPipelineControllerProvider.notifier);
    final dashboard = state.data ?? FreelancerPipelineDashboard.empty();
    final columns = dashboard.columnsForActiveView();

    if (_dealStageId == null && dashboard.stages.isNotEmpty) {
      _dealStageId = dashboard.stages.first.id;
    }
    if (_followUpDealId == null && dashboard.deals.isNotEmpty) {
      _followUpDealId = dashboard.deals.first.id;
    }

    return GigvoraScaffold(
      title: 'Pipeline CRM',
      subtitle: 'Freelancer relationship mission control',
      actions: [
        IconButton(
          tooltip: 'Refresh pipeline',
          onPressed: () => controller.refresh(),
          icon: const Icon(Icons.refresh),
        ),
      ],
      body: RefreshIndicator(
        onRefresh: controller.refresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            if (state.fromCache && !state.loading)
              const _StatusBanner(
                message: 'Showing cached CRM data. Pull to refresh when connectivity returns.',
                icon: Icons.offline_pin,
                background: Color(0xFFE0F2FE),
                foreground: Color(0xFF0B6BCB),
              ),
            if (state.error != null && !state.loading)
              _StatusBanner(
                message: 'Unable to sync the latest CRM metrics. ${state.error}',
                icon: Icons.error_outline,
                background: const Color(0xFFFEE2E2),
                foreground: const Color(0xFFB91C1C),
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
            _SummaryGrid(summary: dashboard.summary),
            const SizedBox(height: 24),
            _ViewSelector(
              activeView: dashboard.activeView,
              views: dashboard.views,
              onChanged: (view) => controller.setView(view),
            ),
            const SizedBox(height: 16),
            _PipelineBoard(
              columns: columns,
              stages: dashboard.stages,
              onMoveDeal: controller.moveDeal,
            ),
            const SizedBox(height: 24),
            _DealForm(
              formKey: _dealFormKey,
              titleController: _dealTitleController,
              clientController: _dealClientController,
              valueController: _dealValueController,
              industryController: _dealIndustryController,
              tierController: _dealTierController,
              stageId: _dealStageId,
              onStageChanged: (value) => setState(() => _dealStageId = value),
              stages: dashboard.stages,
              campaignController: _dealCampaignController,
              onPickCloseDate: () => _pickDateTime(context, initial: _dealCloseDate).then((value) {
                if (value != null) {
                  setState(() => _dealCloseDate = value);
                }
              }),
              closeDate: _dealCloseDate,
              onClearCloseDate: () => setState(() => _dealCloseDate = null),
              onSubmit: () async {
                if (!(_dealFormKey.currentState?.validate() ?? false)) return;
                if (_dealStageId == null) return;
                final value = double.tryParse(_dealValueController.text.replaceAll(',', '')) ?? 0;
                final campaignName = _dealCampaignController.text.trim();
                await controller.createDeal(
                  title: _dealTitleController.text.trim(),
                  clientName: _dealClientController.text.trim(),
                  pipelineValue: value,
                  stageId: _dealStageId!,
                  industry: _dealIndustryController.text.trim().isEmpty
                      ? null
                      : _dealIndustryController.text.trim(),
                  retainerTier:
                      _dealTierController.text.trim().isEmpty ? null : _dealTierController.text.trim(),
                  expectedCloseDate: _dealCloseDate,
                  campaignName: campaignName.isEmpty ? null : campaignName,
                );
                _dealFormKey.currentState?.reset();
                setState(() {
                  _dealCloseDate = null;
                });
                _dealTitleController.clear();
                _dealClientController.clear();
                _dealValueController.clear();
                _dealIndustryController.clear();
                _dealTierController.clear();
                _dealCampaignController.clear();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Deal added to pipeline.')),
                  );
                }
              },
            ),
            const SizedBox(height: 24),
            _FollowUpForm(
              formKey: _followUpFormKey,
              deals: dashboard.deals,
              selectedDealId: _followUpDealId,
              onDealChanged: (value) => setState(() => _followUpDealId = value),
              dueAt: _followUpDueAt,
              onPickDueDate: () => _pickDateTime(context, initial: _followUpDueAt).then((value) {
                if (value != null) {
                  setState(() => _followUpDueAt = value);
                }
              }),
              channel: _followUpChannel,
              noteController: _followUpNoteController,
              onSubmit: () async {
                if (!(_followUpFormKey.currentState?.validate() ?? false)) return;
                if (_followUpDealId == null || _followUpDueAt == null) return;
                await controller.scheduleFollowUp(
                  dealId: _followUpDealId!,
                  dueAt: _followUpDueAt!,
                  channel: _followUpChannel.value,
                  note: _followUpNoteController.text.trim().isEmpty
                      ? null
                      : _followUpNoteController.text.trim(),
                );
                _followUpFormKey.currentState?.reset();
                setState(() => _followUpDueAt = null);
                _followUpNoteController.clear();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Follow-up scheduled.')),
                  );
                }
              },
            ),
            const SizedBox(height: 24),
            _CampaignForm(
              formKey: _campaignFormKey,
              nameController: _campaignNameController,
              goalController: _campaignGoalController,
              status: _campaignStatus,
              onStatusChanged: (value) => setState(() => _campaignStatus = value ?? _campaignStatus),
              launchDate: _campaignLaunchDate,
              onPickLaunchDate: () => _pickDateTime(context, initial: _campaignLaunchDate).then((value) {
                if (value != null) {
                  setState(() => _campaignLaunchDate = value);
                }
              }),
              onSubmit: () async {
                if (!(_campaignFormKey.currentState?.validate() ?? false)) return;
                await controller.createCampaign(
                  name: _campaignNameController.text.trim(),
                  status: _campaignStatus,
                  launchDate: _campaignLaunchDate,
                  description: _campaignGoalController.text.trim().isEmpty
                      ? null
                      : _campaignGoalController.text.trim(),
                  metrics: _campaignGoalController.text.trim().isEmpty
                      ? null
                      : {'goal': _campaignGoalController.text.trim()},
                );
                _campaignFormKey.currentState?.reset();
                setState(() => _campaignLaunchDate = null);
                _campaignNameController.clear();
                _campaignGoalController.clear();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Campaign recorded.')),
                  );
                }
              },
            ),
            const SizedBox(height: 24),
            _FollowUpList(
              followUps: dashboard.followUps,
              deals: dashboard.deals,
              onComplete: controller.completeFollowUp,
            ),
            const SizedBox(height: 24),
            _CampaignList(campaigns: dashboard.campaigns),
            const SizedBox(height: 24),
            _TemplateList(
              templates: dashboard.templates,
              onSelect: (template) => controller.trackProposalGenerated(template.id),
            ),
            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }

  Future<DateTime?> _pickDateTime(BuildContext context, {DateTime? initial}) async {
    final now = DateTime.now();
    final initialDate = initial ?? now.add(const Duration(days: 1));
    final pickedDate = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: now.subtract(const Duration(days: 1)),
      lastDate: now.add(const Duration(days: 365)),
    );
    if (pickedDate == null) return null;
    final pickedTime = await showTimePicker(
      context: context,
      initialTime: const TimeOfDay(hour: 9, minute: 0),
    );
    if (pickedTime == null) {
      return DateTime(pickedDate.year, pickedDate.month, pickedDate.day);
    }
    return DateTime(pickedDate.year, pickedDate.month, pickedDate.day, pickedTime.hour, pickedTime.minute);
  }
}

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({
    required this.message,
    required this.icon,
    required this.background,
    required this.foreground,
  });

  final String message;
  final IconData icon;
  final Color background;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: foreground),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: foreground, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryGrid extends StatelessWidget {
  const _SummaryGrid({required this.summary});

  final PipelineSummary summary;

  @override
  Widget build(BuildContext context) {
    final cards = [
      _SummaryTile(label: 'Open deals', value: summary.openDeals.toString(), icon: Icons.dynamic_feed_outlined),
      _SummaryTile(label: 'Won deals', value: summary.wonDeals.toString(), icon: Icons.emoji_events_outlined),
      _SummaryTile(label: 'Lost deals', value: summary.lostDeals.toString(), icon: Icons.block_outlined),
      _SummaryTile(
        label: 'Pipeline value',
        value: currencyFormatter(summary.pipelineValue),
        icon: Icons.stacked_bar_chart,
      ),
      _SummaryTile(
        label: 'Weighted pipeline',
        value: currencyFormatter(summary.weightedPipelineValue),
        icon: Icons.trending_up,
      ),
      _SummaryTile(
        label: 'Follow-ups (14d)',
        value: summary.followUpsDue.toString(),
        icon: Icons.pending_actions_outlined,
      ),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final spacing = 12.0;
        final minTileWidth = 260.0;
        final maxWidth = constraints.hasBoundedWidth
            ? constraints.maxWidth
            : MediaQuery.of(context).size.width;
        final crossAxisCount = math.max(1, (maxWidth / minTileWidth).floor());
        final tileWidth = crossAxisCount == 1
            ? maxWidth
            : (maxWidth - spacing * (crossAxisCount - 1)) / crossAxisCount;
        final cardWidth = math.max(220.0, math.min(tileWidth, maxWidth));

        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: cards
              .map(
                (card) => SizedBox(
                  width: cardWidth,
                  child: card,
                ),
              )
              .toList(growable: false),
        );
      },
    );
  }
}

class _SummaryTile extends StatelessWidget {
  const _SummaryTile({required this.label, required this.value, required this.icon});

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colorScheme.surfaceVariant.withOpacity(0.6)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 18, offset: const Offset(0, 12)),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: colorScheme.primary),
          const SizedBox(height: 12),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: colorScheme.onSurfaceVariant, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _ViewSelector extends StatelessWidget {
  const _ViewSelector({
    required this.activeView,
    required this.views,
    required this.onChanged,
  });

  final String activeView;
  final List<PipelineViewDefinition> views;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final options = views.isEmpty
        ? const <DropdownMenuItem<String>>[]
        : views
            .map(
              (view) => DropdownMenuItem<String>(
                value: view.key,
                child: Text(view.label),
              ),
            )
            .toList(growable: false);

    final description = views.isEmpty
        ? 'Segment deals to unlock relationship insight.'
        : views.firstWhere((view) => view.key == activeView, orElse: () => views.first).description;

    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Group deals by',
                style: TextStyle(fontSize: 12, letterSpacing: 0.6, fontWeight: FontWeight.w700, color: Colors.black54),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: views.isEmpty ? null : activeView,
                items: options,
                onChanged: views.isEmpty ? null : onChanged,
                decoration: const InputDecoration(border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(16)))),
              ),
            ],
          ),
        ),
        if (description.isNotEmpty)
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(left: 12),
              child: Text(
                description,
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
            ),
          ),
      ],
    );
  }
}

class _PipelineBoard extends StatelessWidget {
  const _PipelineBoard({
    required this.columns,
    required this.stages,
    required this.onMoveDeal,
  });

  final List<PipelineColumn> columns;
  final List<PipelineStage> stages;
  final Future<void> Function(int dealId, int stageId) onMoveDeal;

  @override
  Widget build(BuildContext context) {
    if (columns.isEmpty) {
      return Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.6)),
        ),
        padding: const EdgeInsets.all(24),
        child: const Text('No deals in the pipeline yet. Add an opportunity to unlock the board.'),
      );
    }

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: columns.map((column) {
          return Container(
            width: 260,
            margin: const EdgeInsets.only(right: 12),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.6)),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 18, offset: const Offset(0, 10)),
              ],
            ),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        column.label,
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w700),
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(currencyFormatter(column.totalValue),
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w700)),
                        Text('Weighted ${currencyFormatter(column.weightedValue)}',
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                if (column.deals.isEmpty)
                  Container(
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: const Text('No deals here yet.'),
                  )
                else
                  Column(
                    children: column.deals
                        .map(
                          (deal) => Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.surface,
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.5),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  deal.title,
                                  style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  deal.clientName,
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        currencyFormatter(deal.pipelineValue),
                                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                              color: const Color(0xFF047857),
                                              fontWeight: FontWeight.w700,
                                            ),
                                      ),
                                    ),
                                    Text('${deal.winProbability}% confidence',
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodySmall
                                            ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                                  ],
                                ),
                                if (deal.industry.isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 8),
                                    child: Text('Industry · ${deal.industry}',
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodySmall
                                            ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                                  ),
                                if (deal.retainerTier.isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 4),
                                    child: Text('Tier · ${deal.retainerTier}',
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodySmall
                                            ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                                  ),
                                if (deal.expectedCloseDate != null)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 4),
                                    child: Text(
                                      'Close ${formatRelativeTime(deal.expectedCloseDate!)}',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                                    ),
                                  ),
                                const SizedBox(height: 12),
                                DropdownButtonFormField<int>(
                                  value: deal.stageId,
                                  decoration: const InputDecoration(
                                    labelText: 'Move to stage',
                                    border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
                                  ),
                                  items: stages
                                      .map(
                                        (stage) => DropdownMenuItem<int>(
                                          value: stage.id,
                                          child: Text(stage.name),
                                        ),
                                      )
                                      .toList(growable: false),
                                  onChanged: (value) {
                                    if (value == null || value == deal.stageId) return;
                                    onMoveDeal(deal.id, value);
                                  },
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
        }).toList(growable: false),
      ),
    );
  }
}

class _DealForm extends StatelessWidget {
  const _DealForm({
    required this.formKey,
    required this.titleController,
    required this.clientController,
    required this.valueController,
    required this.industryController,
    required this.tierController,
    required this.stageId,
    required this.onStageChanged,
    required this.stages,
    required this.campaignController,
    required this.closeDate,
    required this.onPickCloseDate,
    required this.onClearCloseDate,
    required this.onSubmit,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController titleController;
  final TextEditingController clientController;
  final TextEditingController valueController;
  final TextEditingController industryController;
  final TextEditingController tierController;
  final TextEditingController campaignController;
  final int? stageId;
  final ValueChanged<int?> onStageChanged;
  final List<PipelineStage> stages;
  final DateTime? closeDate;
  final VoidCallback onPickCloseDate;
  final VoidCallback onClearCloseDate;
  final Future<void> Function() onSubmit;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: Form(
        key: formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Add new relationship', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            TextFormField(
              controller: titleController,
              decoration: const InputDecoration(labelText: 'Opportunity title'),
              validator: (value) => value == null || value.trim().isEmpty ? 'Enter a title' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: clientController,
              decoration: const InputDecoration(labelText: 'Client or account'),
              validator: (value) => value == null || value.trim().isEmpty ? 'Enter the client name' : null,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<int>(
              value: stageId,
              items: stages
                  .map((stage) => DropdownMenuItem<int>(value: stage.id, child: Text(stage.name)))
                  .toList(growable: false),
              onChanged: onStageChanged,
              decoration: const InputDecoration(labelText: 'Stage'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: valueController,
              decoration: const InputDecoration(labelText: 'Deal value (USD)'),
              keyboardType: TextInputType.number,
              validator: (value) => value == null || value.trim().isEmpty ? 'Enter a value' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: industryController,
              decoration: const InputDecoration(labelText: 'Industry segment'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: tierController,
              decoration: const InputDecoration(labelText: 'Retainer tier / package'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: campaignController,
              decoration: InputDecoration(
                labelText: 'Campaign linkage (optional)',
                suffixIcon: IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: campaignController.clear,
                  tooltip: 'Clear campaign',
                ),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onPickCloseDate,
                    icon: const Icon(Icons.event_available),
                    label: Text(closeDate == null
                        ? 'Expected close date'
                        : 'Close ${formatRelativeTime(closeDate!)}'),
                  ),
                ),
                if (closeDate != null)
                  IconButton(
                    onPressed: onClearCloseDate,
                    icon: const Icon(Icons.clear),
                    tooltip: 'Clear close date',
                  ),
              ],
            ),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton(
                onPressed: onSubmit,
                style: ElevatedButton.styleFrom(shape: const StadiumBorder()),
                child: const Text('Add to pipeline'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FollowUpForm extends StatelessWidget {
  const _FollowUpForm({
    required this.formKey,
    required this.deals,
    required this.selectedDealId,
    required this.onDealChanged,
    required this.dueAt,
    required this.onPickDueDate,
    required this.channel,
    required this.noteController,
    required this.onSubmit,
  });

  final GlobalKey<FormState> formKey;
  final List<PipelineDeal> deals;
  final int? selectedDealId;
  final ValueChanged<int?> onDealChanged;
  final DateTime? dueAt;
  final VoidCallback onPickDueDate;
  final ValueNotifier<String> channel;
  final TextEditingController noteController;
  final Future<void> Function() onSubmit;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: Form(
        key: formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Schedule follow-up',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            DropdownButtonFormField<int>(
              value: selectedDealId,
              items: deals
                  .map((deal) => DropdownMenuItem<int>(value: deal.id, child: Text(deal.title)))
                  .toList(growable: false),
              onChanged: onDealChanged,
              decoration: const InputDecoration(labelText: 'Deal'),
              validator: (value) => value == null ? 'Select a deal' : null,
            ),
            const SizedBox(height: 12),
            ValueListenableBuilder<String>(
              valueListenable: channel,
              builder: (context, value, _) {
                return DropdownButtonFormField<String>(
                  value: value,
                  decoration: const InputDecoration(labelText: 'Channel'),
                  items: const [
                    DropdownMenuItem(value: 'email', child: Text('Email')),
                    DropdownMenuItem(value: 'call', child: Text('Call')),
                    DropdownMenuItem(value: 'meeting', child: Text('Meeting')),
                  ],
                  onChanged: (selected) => channel.value = selected ?? value,
                );
              },
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: onPickDueDate,
              icon: const Icon(Icons.schedule),
              label: Text(dueAt == null ? 'Pick due date' : formatRelativeTime(dueAt!)),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: noteController,
              maxLines: 2,
              decoration: const InputDecoration(labelText: 'Notes (optional)'),
            ),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton(
                onPressed: onSubmit,
                style: ElevatedButton.styleFrom(shape: const StadiumBorder()),
                child: const Text('Schedule follow-up'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CampaignForm extends StatelessWidget {
  const _CampaignForm({
    required this.formKey,
    required this.nameController,
    required this.goalController,
    required this.status,
    required this.onStatusChanged,
    required this.launchDate,
    required this.onPickLaunchDate,
    required this.onSubmit,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController nameController;
  final TextEditingController goalController;
  final String status;
  final ValueChanged<String?> onStatusChanged;
  final DateTime? launchDate;
  final VoidCallback onPickLaunchDate;
  final Future<void> Function() onSubmit;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: Form(
        key: formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Launch nurture campaign',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            TextFormField(
              controller: nameController,
              decoration: const InputDecoration(labelText: 'Campaign name'),
              validator: (value) => value == null || value.trim().isEmpty ? 'Enter a name' : null,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const [
                DropdownMenuItem(value: 'Planning', child: Text('Planning')),
                DropdownMenuItem(value: 'Active', child: Text('Active')),
                DropdownMenuItem(value: 'Paused', child: Text('Paused')),
              ],
              onChanged: onStatusChanged,
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: onPickLaunchDate,
              icon: const Icon(Icons.event),
              label: Text(launchDate == null ? 'Target launch date' : formatRelativeTime(launchDate!)),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: goalController,
              decoration: const InputDecoration(
                labelText: 'Headline goal or notes',
                helperText: 'Shared with collaborating campaigns to align storytelling.',
              ),
            ),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton(
                onPressed: onSubmit,
                style: ElevatedButton.styleFrom(shape: const StadiumBorder()),
                child: const Text('Record campaign'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FollowUpList extends StatelessWidget {
  const _FollowUpList({
    required this.followUps,
    required this.deals,
    required this.onComplete,
  });

  final List<PipelineFollowUp> followUps;
  final List<PipelineDeal> deals;
  final Future<void> Function(int followUpId) onComplete;

  @override
  Widget build(BuildContext context) {
    final pending = followUps.where((followUp) => followUp.status != 'completed').toList(growable: false);
    if (pending.isEmpty) {
      return GigvoraCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text('Follow-up queue', style: TextStyle(fontWeight: FontWeight.w700)),
            SizedBox(height: 8),
            Text('No open follow-ups. Nice work staying ahead!'),
          ],
        ),
      );
    }

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Follow-up queue', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          ...pending.map((followUp) {
            final deal = deals.where((deal) => deal.id == followUp.dealId);
            final dealTitle = deal.isNotEmpty ? deal.first.title : 'Deal ${followUp.dealId}';
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.2),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    dealTitle,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${followUp.subject} · ${followUp.channel.toUpperCase()}',
                    style: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Due ${formatRelativeTime(followUp.dueAt)}',
                    style: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                  ),
                  if (followUp.note != null && followUp.note!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Text(
                        followUp.note!,
                        style: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                      ),
                    ),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton.icon(
                      onPressed: () => onComplete(followUp.id),
                      icon: const Icon(Icons.check_circle_outline),
                      label: const Text('Mark complete'),
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

class _CampaignList extends StatelessWidget {
  const _CampaignList({required this.campaigns});

  final List<PipelineCampaign> campaigns;

  @override
  Widget build(BuildContext context) {
    if (campaigns.isEmpty) {
      return GigvoraCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text('Campaign performance', style: TextStyle(fontWeight: FontWeight.w700)),
            SizedBox(height: 8),
            Text('Launch nurture and upsell campaigns to keep the top of funnel warm.'),
          ],
        ),
      );
    }

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Campaign performance',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          ...campaigns.map((campaign) {
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.15),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          campaign.name,
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w700),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.black12),
                        ),
                        child: Text(
                          campaign.status,
                          style: Theme.of(context)
                              .textTheme
                              .labelSmall
                              ?.copyWith(fontWeight: FontWeight.w700, letterSpacing: 0.4),
                        ),
                      ),
                    ],
                  ),
                  if (campaign.targetService != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text('Target · ${campaign.targetService}',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                    ),
                  if (campaign.launchDate != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text('Launch ${formatRelativeTime(campaign.launchDate!)}',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                    ),
                  if (campaign.metrics.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: campaign.metrics.entries
                            .map(
                              (entry) => Chip(
                                label: Text('${entry.key}: ${entry.value}'),
                                backgroundColor: Colors.white,
                              ),
                            )
                            .toList(growable: false),
                      ),
                    ),
                  if (campaign.description != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(campaign.description!,
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                    ),
                ],
              ),
            );
          }).toList(growable: false),
        ],
      ),
    );
  }
}

class _TemplateList extends StatelessWidget {
  const _TemplateList({required this.templates, required this.onSelect});

  final List<PipelineProposalTemplate> templates;
  final ValueChanged<PipelineProposalTemplate> onSelect;

  @override
  Widget build(BuildContext context) {
    if (templates.isEmpty) {
      return const SizedBox.shrink();
    }
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Proposal templates',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          ...templates.map(
            (template) => ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(template.name, style: const TextStyle(fontWeight: FontWeight.w700)),
              subtitle: Text(template.description),
              trailing: Text('${currencyFormatter(template.amount)} · ${template.pricingType.toUpperCase()}'),
              onTap: () => onSelect(template),
            ),
          ),
        ],
      ),
    );
  }
}

final NumberFormat _compactCurrencyFormat = NumberFormat.compactCurrency(symbol: '\$');

String currencyFormatter(double value) {
  return _compactCurrencyFormat.format(value);
}
