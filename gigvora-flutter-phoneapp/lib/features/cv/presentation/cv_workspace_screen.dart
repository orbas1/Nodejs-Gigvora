import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/providers.dart';
import '../../../theme/widgets.dart';
import '../../auth/application/session_controller.dart';
import '../application/cv_workspace_providers.dart';
import '../data/cv_document_repository.dart';
import '../data/models/cv_workspace_snapshot.dart';

class CvWorkspaceScreen extends ConsumerStatefulWidget {
  const CvWorkspaceScreen({super.key});

  @override
  ConsumerState<CvWorkspaceScreen> createState() => _CvWorkspaceScreenState();
}

class _CvWorkspaceScreenState extends ConsumerState<CvWorkspaceScreen> {
  final _baselineFormKey = GlobalKey<FormState>();
  final _uploadFormKey = GlobalKey<FormState>();

  late final TextEditingController _titleController;
  late final TextEditingController _roleController;
  late final TextEditingController _geographyController;
  late final TextEditingController _personaController;
  late final TextEditingController _impactController;
  late final TextEditingController _summaryController;
  late final TextEditingController _contentController;
  late final TextEditingController _tagsController;
  late final TextEditingController _uploadSummaryController;

  PlatformFile? _baselineFile;
  PlatformFile? _uploadFile;
  bool _creating = false;
  bool _uploading = false;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController();
    _roleController = TextEditingController();
    _geographyController = TextEditingController();
    _personaController = TextEditingController();
    _impactController = TextEditingController();
    _summaryController = TextEditingController();
    _contentController = TextEditingController();
    _tagsController = TextEditingController();
    _uploadSummaryController = TextEditingController();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _roleController.dispose();
    _geographyController.dispose();
    _personaController.dispose();
    _impactController.dispose();
    _summaryController.dispose();
    _contentController.dispose();
    _tagsController.dispose();
    _uploadSummaryController.dispose();
    super.dispose();
  }

  Future<void> _pickBaselineFile() async {
    final result = await FilePicker.platform.pickFiles(
      withData: true,
      type: FileType.custom,
      allowedExtensions: const ['pdf', 'doc', 'docx', 'rtf'],
    );
    if (!mounted) return;
    final file = result != null && result.files.isNotEmpty ? result.files.first : null;
    setState(() => _baselineFile = file);
  }

  Future<void> _pickUploadFile() async {
    final result = await FilePicker.platform.pickFiles(
      withData: true,
      type: FileType.custom,
      allowedExtensions: const ['pdf', 'doc', 'docx', 'rtf'],
    );
    if (!mounted) return;
    final file = result != null && result.files.isNotEmpty ? result.files.first : null;
    setState(() => _uploadFile = file);
  }

  List<String> _parseTags() {
    return _tagsController.text
        .split(',')
        .map((value) => value.trim())
        .where((value) => value.isNotEmpty)
        .toList(growable: false);
  }

  void _showMessage(String message, {bool error = false}) {
    final theme = Theme.of(context);
    final color = error ? theme.colorScheme.error : theme.colorScheme.primary;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
      ),
    );
  }

  Future<void> _submitBaseline(int userId, CvWorkspaceSnapshot workspace) async {
    if (_creating) return;
    if (!_baselineFormKey.currentState!.validate()) {
      return;
    }
    final headers = ref.read(membershipHeadersProvider);
    final repository = ref.read(cvDocumentRepositoryProvider);

    setState(() => _creating = true);
    try {
      CvFileAttachment? attachment;
      if (_baselineFile != null) {
        final bytes = _baselineFile!.bytes;
        if (bytes != null) {
          attachment = CvFileAttachment(
            fileName: _baselineFile!.name,
            mimeType: _baselineFile!.extension == null
                ? 'application/octet-stream'
                : 'application/${_baselineFile!.extension}',
            size: _baselineFile!.size,
            base64: base64Encode(bytes),
          );
        }
      }
      final draft = CvDocumentDraft(
        title: _titleController.text.trim(),
        roleTag: _roleController.text.trim().isEmpty ? null : _roleController.text.trim(),
        geographyTag: _geographyController.text.trim().isEmpty ? null : _geographyController.text.trim(),
        persona: _personaController.text.trim().isEmpty ? null : _personaController.text.trim(),
        impact: _impactController.text.trim().isEmpty ? null : _impactController.text.trim(),
        summary: _summaryController.text.trim().isEmpty ? null : _summaryController.text.trim(),
        content: _contentController.text.trim().isEmpty ? null : _contentController.text.trim(),
        tags: _parseTags(),
        isBaseline: workspace.baseline == null,
        metadata: workspace.baseline != null ? <String, dynamic>{'variantOf': workspace.baseline!.id} : null,
        file: attachment,
      );
      await repository.createDocument(userId, draft, headers: headers);
      _showMessage('CV document secured inside your workspace.');
      ref.invalidate(cvWorkspaceProvider(userId));
      setState(() {
        _titleController.clear();
        _roleController.clear();
        _geographyController.clear();
        _personaController.clear();
        _impactController.clear();
        _summaryController.clear();
        _contentController.clear();
        _tagsController.clear();
        _baselineFile = null;
      });
    } catch (error) {
      _showMessage('Unable to save CV: $error', error: true);
    } finally {
      if (mounted) {
        setState(() => _creating = false);
      }
    }
  }

  Future<void> _submitUpload(int userId, CvWorkspaceSnapshot workspace) async {
    final baseline = workspace.baseline;
    if (baseline == null) {
      _showMessage('Create your baseline CV before uploading new versions.', error: true);
      return;
    }
    if (_uploading) return;
    if (!_uploadFormKey.currentState!.validate()) {
      return;
    }
    if (_uploadFile == null || _uploadFile!.bytes == null) {
      _showMessage('Select a CV file to upload.', error: true);
      return;
    }
    final headers = ref.read(membershipHeadersProvider);
    final repository = ref.read(cvDocumentRepositoryProvider);

    setState(() => _uploading = true);
    try {
      final attachment = CvFileAttachment(
        fileName: _uploadFile!.name,
        mimeType: _uploadFile!.extension == null
            ? 'application/octet-stream'
            : 'application/${_uploadFile!.extension}',
        size: _uploadFile!.size,
        base64: base64Encode(_uploadFile!.bytes!),
      );
      final upload = CvVersionUpload(
        summary: _uploadSummaryController.text.trim().isEmpty
            ? null
            : _uploadSummaryController.text.trim(),
        setAsBaseline: true,
        file: attachment,
      );
      final document = await repository.uploadVersion(
        userId,
        baseline.id,
        upload,
        headers: headers,
      );
      _showMessage('Version v${document.latestVersion?.versionNumber ?? ''} ready for recruiters.');
      ref.invalidate(cvWorkspaceProvider(userId));
      setState(() {
        _uploadFile = null;
        _uploadSummaryController.clear();
      });
    } catch (error) {
      _showMessage('Unable to upload CV version: $error', error: true);
    } finally {
      if (mounted) {
        setState(() => _uploading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final sessionState = ref.watch(sessionControllerProvider);
    final session = sessionState.session;
    if (session == null) {
      return const GigvoraScaffold(
        title: 'CV workspace',
        subtitle: 'Secure resume operations',
        body: Center(child: Text('Sign in to manage your CV workspace.')),
      );
    }
    final userId = session.actorId ?? session.userId ?? session.id ?? 0;
    final workspaceAsync = ref.watch(cvWorkspaceProvider(userId));

    return GigvoraScaffold(
      title: 'CV workspace',
      subtitle: 'Enterprise CV creation, variants, and secure recruiter delivery.',
      body: workspaceAsync.when(
        data: (snapshot) => RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(cvWorkspaceProvider(userId));
            await ref.read(cvWorkspaceProvider(userId).future);
          },
          child: ListView(
            padding: EdgeInsets.zero,
            children: [
              _SummaryCard(snapshot: snapshot),
              const SizedBox(height: 24),
              _BaselineForm(
                formKey: _baselineFormKey,
                isCreating: _creating,
                hasBaseline: snapshot.baseline != null,
                baselineFile: _baselineFile,
                onPickFile: _pickBaselineFile,
                onSubmit: () => _submitBaseline(userId, snapshot),
                titleController: _titleController,
                roleController: _roleController,
                geographyController: _geographyController,
                personaController: _personaController,
                impactController: _impactController,
                summaryController: _summaryController,
                contentController: _contentController,
                tagsController: _tagsController,
              ),
              const SizedBox(height: 24),
              _UploadForm(
                formKey: _uploadFormKey,
                isUploading: _uploading,
                baseline: snapshot.baseline,
                uploadFile: _uploadFile,
                onPickFile: _pickUploadFile,
                uploadSummaryController: _uploadSummaryController,
                onSubmit: () => _submitUpload(userId, snapshot),
              ),
              if (snapshot.variants.isNotEmpty) ...[
                const SizedBox(height: 24),
                _VariantList(variants: snapshot.variants),
              ],
            ],
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: Colors.redAccent, size: 40),
              const SizedBox(height: 12),
              Text(
                'Unable to load CV workspace',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(
                '$error',
                style: Theme.of(context).textTheme.bodySmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.refresh(cvWorkspaceProvider(userId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.snapshot});

  final CvWorkspaceSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final summary = snapshot.summary;
    final dateFormatter = DateFormat.yMMMd();
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Document studio health', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          Wrap(
            spacing: 16,
            runSpacing: 12,
            children: [
              _MetricTile(label: 'Documents', value: summary.totalDocuments.toString()),
              _MetricTile(label: 'Tracked versions', value: summary.totalVersions.toString()),
              _MetricTile(label: 'AI assisted', value: summary.aiAssistedCount.toString()),
              _MetricTile(
                label: 'Last update',
                value: summary.lastUpdatedAt != null
                    ? dateFormatter.format(summary.lastUpdatedAt!)
                    : 'Recent',
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (snapshot.baseline != null)
            Text(
              'Baseline • ${snapshot.baseline!.title}',
              style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
            )
          else
            Text(
              'Baseline pending — create your first CV to unlock variants and recruiter analytics.',
              style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
        ],
      ),
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withOpacity(0.08),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: theme.textTheme.labelMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
          const SizedBox(height: 6),
          Text(value, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}

class _BaselineForm extends StatelessWidget {
  const _BaselineForm({
    required this.formKey,
    required this.isCreating,
    required this.hasBaseline,
    required this.baselineFile,
    required this.onPickFile,
    required this.onSubmit,
    required this.titleController,
    required this.roleController,
    required this.geographyController,
    required this.personaController,
    required this.impactController,
    required this.summaryController,
    required this.contentController,
    required this.tagsController,
  });

  final GlobalKey<FormState> formKey;
  final bool isCreating;
  final bool hasBaseline;
  final PlatformFile? baselineFile;
  final VoidCallback onPickFile;
  final VoidCallback onSubmit;
  final TextEditingController titleController;
  final TextEditingController roleController;
  final TextEditingController geographyController;
  final TextEditingController personaController;
  final TextEditingController impactController;
  final TextEditingController summaryController;
  final TextEditingController contentController;
  final TextEditingController tagsController;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Form(
        key: formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              hasBaseline ? 'Create targeted CV variants' : 'Create your baseline CV',
              style: theme.textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              hasBaseline
                  ? 'Launch variants with contextual positioning, AI scoring, and recruiter-ready tagging.'
                  : 'Craft your enterprise baseline CV with persona clarity, quantified impact, and watermark-ready files.',
              style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: titleController,
              decoration: const InputDecoration(labelText: 'Document title'),
              validator: (value) => value == null || value.trim().isEmpty ? 'Title is required' : null,
              enabled: !isCreating,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: roleController,
                    decoration: const InputDecoration(labelText: 'Role focus'),
                    enabled: !isCreating,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: geographyController,
                    decoration: const InputDecoration(labelText: 'Geography'),
                    enabled: !isCreating,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: personaController,
              decoration: const InputDecoration(labelText: 'Persona narrative'),
              enabled: !isCreating,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: impactController,
              decoration: const InputDecoration(labelText: 'Quantified impact'),
              enabled: !isCreating,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: summaryController,
              decoration: const InputDecoration(labelText: 'Executive summary'),
              maxLines: 3,
              enabled: !isCreating,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: contentController,
              decoration: const InputDecoration(labelText: 'Detailed content (optional)'),
              maxLines: 4,
              enabled: !isCreating,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: tagsController,
              decoration: const InputDecoration(labelText: 'Tags (comma separated)'),
              enabled: !isCreating,
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: isCreating ? null : onPickFile,
              icon: const Icon(Icons.upload_file),
              label: Text(baselineFile != null
                  ? 'Attached ${baselineFile!.name} (${(baselineFile!.size / 1024).toStringAsFixed(1)} KB)'
                  : 'Attach CV file'),
            ),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerLeft,
              child: ElevatedButton(
                onPressed: isCreating ? null : onSubmit,
                child: Text(isCreating
                    ? 'Saving…'
                    : hasBaseline
                        ? 'Create variant'
                        : 'Create baseline CV'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _UploadForm extends StatelessWidget {
  const _UploadForm({
    required this.formKey,
    required this.isUploading,
    required this.baseline,
    required this.uploadFile,
    required this.onPickFile,
    required this.uploadSummaryController,
    required this.onSubmit,
  });

  final GlobalKey<FormState> formKey;
  final bool isUploading;
  final CvDocument? baseline;
  final PlatformFile? uploadFile;
  final VoidCallback onPickFile;
  final TextEditingController uploadSummaryController;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: theme.colorScheme.primary.withOpacity(0.2)),
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.surface,
            theme.colorScheme.primary.withOpacity(0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      padding: const EdgeInsets.all(24),
      child: Form(
        key: formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Upload and promote a new CV version', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              'Deliver the latest narrative to recruiters with watermarking and analytics intact.',
              style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: isUploading ? null : onPickFile,
              icon: const Icon(Icons.upload_rounded),
              label: Text(uploadFile != null
                  ? 'Attached ${uploadFile!.name} (${(uploadFile!.size / 1024).toStringAsFixed(1)} KB)'
                  : 'Select CV file'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: uploadSummaryController,
              decoration: const InputDecoration(labelText: 'Version summary'),
              maxLines: 3,
              validator: (value) => value == null || value.trim().isEmpty
                  ? 'Provide a short summary for reviewers.'
                  : null,
              enabled: !isUploading,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: isUploading ? null : onSubmit,
              child: Text(isUploading ? 'Uploading…' : 'Upload version & set baseline'),
            ),
            if (baseline != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  'Current baseline v${baseline!.latestVersion?.versionNumber ?? 1}',
                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _VariantList extends StatelessWidget {
  const _VariantList({required this.variants});

  final List<CvDocument> variants;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Variants in play', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          ...variants.map(
            (variant) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.description_outlined, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          variant.title,
                          style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'v${variant.latestVersion?.versionNumber ?? 1} • ${variant.roleTag ?? 'Generalist'} • ${variant.geographyTag ?? 'Global'}',
                          style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                        ),
                      ],
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
}
