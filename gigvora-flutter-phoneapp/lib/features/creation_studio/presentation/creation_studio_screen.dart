import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../theme/widgets.dart';
import '../application/creation_studio_controller.dart';
import '../data/models/creation_brief.dart';

class CreationStudioScreen extends ConsumerStatefulWidget {
  const CreationStudioScreen({super.key});

  @override
  ConsumerState<CreationStudioScreen> createState() => _CreationStudioScreenState();
}

class _CreationStudioScreenState extends ConsumerState<CreationStudioScreen> {
  late final TextEditingController _titleController;
  late final TextEditingController _summaryController;
  late final TextEditingController _audienceController;
  late final TextEditingController _objectiveController;
  late final TextEditingController _attachmentController;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController();
    _summaryController = TextEditingController();
    _audienceController = TextEditingController();
    _objectiveController = TextEditingController();
    _attachmentController = TextEditingController();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _summaryController.dispose();
    _audienceController.dispose();
    _objectiveController.dispose();
    _attachmentController.dispose();
    super.dispose();
  }

  void _syncControllers(CreationStudioForm form) {
    if (_titleController.text != form.title) {
      _titleController.text = form.title;
    }
    if (_summaryController.text != form.summary) {
      _summaryController.text = form.summary;
    }
    if (_audienceController.text != form.audience) {
      _audienceController.text = form.audience;
    }
    if (_objectiveController.text != form.objective) {
      _objectiveController.text = form.objective;
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(creationStudioControllerProvider);
    final controller = ref.read(creationStudioControllerProvider.notifier);
    _syncControllers(state.form);

    void handleContinue() {
      if (state.step == 0) {
        if (state.form.kind == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Select a template to continue.')),
          );
          return;
        }
        controller.nextStep();
      } else if (state.step == 1) {
        if (!state.form.isComplete) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Complete the required fields before continuing.')),
          );
          return;
        }
        controller.nextStep();
      }
    }

    void handleCancel() {
      if (state.step == 0) {
        controller.startNew();
      } else {
        controller.previousStep();
      }
    }

    Future<void> saveDraft() async {
      try {
        await controller.saveDraft();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Draft saved to the creation studio.')),
        );
      } catch (error) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to save draft. $error')),
        );
      }
    }

    Future<void> publishDraft() async {
      try {
        await controller.publishDraft();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Brief published across your workspaces.')),
        );
      } catch (error) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to publish draft. $error')),
        );
      }
    }

    return GigvoraScaffold(
      title: 'Creation studio',
      subtitle: 'Blueprints for documents, gigs, and opportunities',
      actions: [
        IconButton(
          tooltip: 'Refresh briefs',
          onPressed: () => controller.load(forceRefresh: true),
          icon: const Icon(Icons.refresh),
        ),
      ],
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (state.error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: _StudioErrorBanner(error: state.error!),
              ),
            Stepper(
              currentStep: state.step,
              onStepCancel: handleCancel,
              onStepContinue: handleContinue,
              onStepTapped: (index) {
                if (index < state.step) {
                  controller.previousStep();
                } else if (index > state.step) {
                  handleContinue();
                }
              },
              controlsBuilder: (context, details) {
                if (state.step == 2) {
                  return Wrap(
                    spacing: 12,
                    children: [
                      FilledButton.icon(
                        onPressed: state.saving ? null : saveDraft,
                        icon: state.saving
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.save_outlined),
                        label: Text(state.editing == null ? 'Save draft' : 'Save changes'),
                      ),
                      FilledButton.tonalIcon(
                        onPressed: state.publishing ? null : publishDraft,
                        icon: state.publishing
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.rocket_launch),
                        label: Text(state.publishing ? 'Publishing…' : 'Publish'),
                      ),
                      OutlinedButton(
                        onPressed: controller.startNew,
                        child: const Text('Start new'),
                      ),
                    ],
                  );
                }
                return Row(
                  children: [
                    FilledButton(
                      onPressed: details.onStepContinue,
                      child: const Text('Continue'),
                    ),
                    const SizedBox(width: 12),
                    OutlinedButton(
                      onPressed: details.onStepCancel,
                      child: const Text('Back'),
                    ),
                  ],
                );
              },
              steps: [
                Step(
                  isActive: state.step >= 0,
                  title: const Text('Select template'),
                  state: state.step > 0 ? StepState.complete : StepState.indexed,
                  content: _TemplatePicker(
                    selected: state.form.kind,
                    onSelected: controller.selectKind,
                  ),
                ),
                Step(
                  isActive: state.step >= 1,
                  title: const Text('Compose details'),
                  state: state.step > 1 ? StepState.complete : StepState.indexed,
                  content: _DetailsForm(
                    titleController: _titleController,
                    summaryController: _summaryController,
                    audienceController: _audienceController,
                    objectiveController: _objectiveController,
                    attachmentController: _attachmentController,
                    form: state.form,
                    onChanged: controller.updateForm,
                    onAddAttachment: controller.addAttachment,
                    onRemoveAttachment: controller.removeAttachment,
                  ),
                ),
                Step(
                  isActive: state.step >= 2,
                  title: const Text('Review & launch'),
                  state: state.step == 2 ? StepState.editing : StepState.indexed,
                  content: _ReviewPanel(form: state.form, editing: state.editing),
                ),
              ],
            ),
            const SizedBox(height: 24),
            _ExistingBriefsList(
              briefs: state.briefs,
              onEdit: controller.editBrief,
              onPublish: (brief) {
                controller.editBrief(brief);
                controller.nextStep();
              },
              onDelete: (brief) async {
                final confirmed = await showDialog<bool>(
                  context: context,
                  builder: (dialogContext) {
                    return AlertDialog(
                      title: const Text('Delete brief'),
                      content: Text('Remove ${brief.title}? This cannot be undone.'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.of(dialogContext).pop(false),
                          child: const Text('Cancel'),
                        ),
                        FilledButton.tonal(
                          onPressed: () => Navigator.of(dialogContext).pop(true),
                          child: const Text('Delete'),
                        ),
                      ],
                    );
                  },
                );
                if (confirmed == true) {
                  await controller.deleteBrief(brief);
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _TemplatePicker extends StatelessWidget {
  const _TemplatePicker({required this.selected, required this.onSelected});

  final CreationKind? selected;
  final ValueChanged<CreationKind> onSelected;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 16,
      runSpacing: 16,
      children: CreationKind.values
          .map(
            (kind) => GestureDetector(
              onTap: () => onSelected(kind),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 180,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: selected == kind
                      ? Theme.of(context).colorScheme.primaryContainer
                      : Theme.of(context).colorScheme.surfaceVariant,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: selected == kind
                        ? Theme.of(context).colorScheme.primary
                        : Theme.of(context).colorScheme.outlineVariant,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(kind.label, style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Text(
                      kind.description,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ),
          )
          .toList(growable: false),
    );
  }
}

class _DetailsForm extends StatelessWidget {
  const _DetailsForm({
    required this.titleController,
    required this.summaryController,
    required this.audienceController,
    required this.objectiveController,
    required this.attachmentController,
    required this.form,
    required this.onChanged,
    required this.onAddAttachment,
    required this.onRemoveAttachment,
  });

  final TextEditingController titleController;
  final TextEditingController summaryController;
  final TextEditingController audienceController;
  final TextEditingController objectiveController;
  final TextEditingController attachmentController;
  final CreationStudioForm form;
  final void Function({String? title, String? summary, String? audience, String? objective, List<String>? attachments})
      onChanged;
  final void Function(String value) onAddAttachment;
  final void Function(String value) onRemoveAttachment;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextFormField(
          controller: titleController,
          decoration: const InputDecoration(labelText: 'Title', hintText: 'E.g. Product design CV v4'),
          onChanged: (value) => onChanged(title: value),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: summaryController,
          maxLines: 4,
          decoration: const InputDecoration(
            labelText: 'Summary',
            hintText: 'Key value proposition, achievements, or offer description.',
          ),
          onChanged: (value) => onChanged(summary: value),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: audienceController,
          decoration: const InputDecoration(labelText: 'Target audience'),
          onChanged: (value) => onChanged(audience: value),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: objectiveController,
          maxLines: 3,
          decoration: const InputDecoration(
            labelText: 'Objective',
            hintText: 'What outcome should this brief achieve?',
          ),
          onChanged: (value) => onChanged(objective: value),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: attachmentController,
          decoration: InputDecoration(
            labelText: 'Add attachment link',
            suffixIcon: IconButton(
              icon: const Icon(Icons.add_link),
              onPressed: () {
                onAddAttachment(attachmentController.text);
                attachmentController.clear();
              },
            ),
          ),
          onSubmitted: (value) {
            onAddAttachment(value);
            attachmentController.clear();
          },
        ),
        const SizedBox(height: 12),
        if (form.attachments.isNotEmpty)
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: form.attachments
                .map(
                  (attachment) => Chip(
                    label: Text(attachment),
                    deleteIcon: const Icon(Icons.close),
                    onDeleted: () => onRemoveAttachment(attachment),
                  ),
                )
                .toList(),
          ),
        if (form.attachments.isEmpty)
          Text(
            'Attach portfolio links, documents, or media URLs to enrich the brief.',
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
      ],
    );
  }
}

class _ReviewPanel extends StatelessWidget {
  const _ReviewPanel({required this.form, required this.editing});

  final CreationStudioForm form;
  final CreationBrief? editing;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final metadata = <String, dynamic>{
      'Audience': form.audience.isEmpty ? 'General network' : form.audience,
      'Objective': form.objective.isEmpty ? 'Not specified' : form.objective,
      'Attachments': form.attachments.isEmpty ? 'None linked' : '${form.attachments.length} references',
    };
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GigvoraCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(form.kind?.label ?? 'Select a template', style: theme.textTheme.titleMedium),
              const SizedBox(height: 12),
              Text(
                form.title.isEmpty ? 'Title will appear here.' : form.title,
                style: theme.textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text(
                form.summary.isEmpty ? 'Your summary will be rendered here once added.' : form.summary,
                style: theme.textTheme.bodyLarge,
              ),
              const SizedBox(height: 16),
              ...metadata.entries.map(
                (entry) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 110,
                        child: Text(
                          entry.key,
                          style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          '${entry.value}',
                          style: theme.textTheme.bodySmall,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        if (form.attachments.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text('Attachments', style: theme.textTheme.titleSmall),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: form.attachments
                .map((item) => Chip(
                      label: Text(item),
                      avatar: const Icon(Icons.link, size: 16),
                    ))
                .toList(),
          ),
        ],
        if (editing != null) ...[
          const SizedBox(height: 12),
          Text('Editing existing brief', style: theme.textTheme.labelLarge),
          Text(
            'Currently editing ${editing!.title} • ${editing!.status.toUpperCase()}',
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
        ],
      ],
    );
  }
}

class _ExistingBriefsList extends StatelessWidget {
  const _ExistingBriefsList({
    required this.briefs,
    required this.onEdit,
    required this.onPublish,
    required this.onDelete,
  });

  final List<CreationBrief> briefs;
  final ValueChanged<CreationBrief> onEdit;
  final ValueChanged<CreationBrief> onPublish;
  final ValueChanged<CreationBrief> onDelete;

  @override
  Widget build(BuildContext context) {
    if (briefs.isEmpty) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Recent drafts', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(
            'Drafts you save will appear here, ready for editing or publishing.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Recent drafts', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        ...briefs.map(
          (brief) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: GigvoraCard(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(brief.title, style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 4),
                        Text(
                          '${brief.kind.label} • ${brief.status.toUpperCase()} • Updated ${formatRelativeTime(brief.updatedAt)}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        if (brief.summary.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text(
                            brief.summary,
                            style: Theme.of(context).textTheme.bodyMedium,
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      FilledButton.tonal(
                        onPressed: () => onPublish(brief),
                        child: const Text('Open in wizard'),
                      ),
                      TextButton(
                        onPressed: () => onDelete(brief),
                        child: const Text('Delete'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _StudioErrorBanner extends StatelessWidget {
  const _StudioErrorBanner({required this.error});

  final Object error;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colorScheme.errorContainer,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: colorScheme.onErrorContainer),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Creation studio experienced an issue: $error',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: colorScheme.onErrorContainer),
            ),
          ),
        ],
      ),
    );
  }
}
