import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/providers.dart';
import '../../../theme/widgets.dart';

class PrivacyRequest {
  const PrivacyRequest({
    required this.id,
    required this.type,
    required this.description,
    required this.status,
    required this.submittedAt,
    this.expectedCompletion,
  });

  final String id;
  final String type;
  final String description;
  final String status;
  final DateTime submittedAt;
  final DateTime? expectedCompletion;

  PrivacyRequest copyWith({
    String? type,
    String? description,
    String? status,
    DateTime? submittedAt,
    DateTime? expectedCompletion,
  }) {
    return PrivacyRequest(
      id: id,
      type: type ?? this.type,
      description: description ?? this.description,
      status: status ?? this.status,
      submittedAt: submittedAt ?? this.submittedAt,
      expectedCompletion: expectedCompletion ?? this.expectedCompletion,
    );
  }
}

class PrivacyPolicyScreen extends ConsumerStatefulWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  ConsumerState<PrivacyPolicyScreen> createState() => _PrivacyPolicyScreenState();
}

class _PrivacyPolicyScreenState extends ConsumerState<PrivacyPolicyScreen> {
  final Map<String, bool> _preferences = <String, bool>{
    'productUpdates': true,
    'mentorDigest': false,
    'marketInsights': true,
    'aiMatching': true,
  };

  final List<PrivacyRequest> _seedRequests = <PrivacyRequest>[
    PrivacyRequest(
      id: 'privacy-1',
      type: 'Access',
      description: 'Requesting copy of all mentoring session transcripts for internal audit.',
      status: 'In progress',
      submittedAt: DateTime.now().subtract(const Duration(days: 4)),
      expectedCompletion: DateTime.now().add(const Duration(days: 10)),
    ),
    PrivacyRequest(
      id: 'privacy-2',
      type: 'Deletion',
      description: 'Remove closed gig contract data from archive for GDPR compliance.',
      status: 'Completed',
      submittedAt: DateTime.now().subtract(const Duration(days: 32)),
      expectedCompletion: DateTime.now().subtract(const Duration(days: 21)),
    ),
  ];

  late List<PrivacyRequest> _requests;

  @override
  void initState() {
    super.initState();
    _requests = List<PrivacyRequest>.from(_seedRequests);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(analyticsServiceProvider).track(
        'mobile_privacy_opened',
        context: const {'surface': 'privacy_policy'},
        metadata: const {'source': 'mobile_app'},
      );
    });
  }

  Future<void> _refresh() async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    await ref.read(analyticsServiceProvider).track(
      'mobile_privacy_refreshed',
      context: {'requests': _requests.length},
    );
    if (!mounted) return;
    setState(() {
      _requests = List<PrivacyRequest>.from(_requests);
    });
  }

  void _togglePreference(String key, bool value) {
    setState(() {
      _preferences[key] = value;
    });
    ref.read(analyticsServiceProvider).track(
      'mobile_privacy_preference_toggled',
      context: {'preference': key, 'value': value},
    );
  }

  Future<void> _openRequestSheet({PrivacyRequest? request}) async {
    final isEditing = request != null;
    final type = ValueNotifier<String>(request?.type ?? 'Access');
    final descriptionController = TextEditingController(text: request?.description ?? '');
    final status = ValueNotifier<String>(request?.status ?? 'In review');
    DateTime? expectedCompletion = request?.expectedCompletion;
    final formKey = GlobalKey<FormState>();

    final result = await showModalBottomSheet<PrivacyRequest>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 24,
            right: 24,
            top: 24,
          ),
          child: Material(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            child: Form(
              key: formKey,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          isEditing ? 'Update privacy request' : 'Submit privacy request',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        IconButton(
                          onPressed: () => Navigator.of(context).pop(),
                          icon: const Icon(Icons.close),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    ValueListenableBuilder<String>(
                      valueListenable: type,
                      builder: (context, value, _) {
                        return DropdownButtonFormField<String>(
                          value: value,
                          decoration: const InputDecoration(labelText: 'Request type'),
                          items: const [
                            DropdownMenuItem(value: 'Access', child: Text('Access your data')),
                            DropdownMenuItem(value: 'Rectification', child: Text('Correct inaccurate data')),
                            DropdownMenuItem(value: 'Deletion', child: Text('Delete personal data')),
                            DropdownMenuItem(value: 'Restriction', child: Text('Restrict processing')),
                            DropdownMenuItem(value: 'Portability', child: Text('Transfer data to you')),
                          ],
                          onChanged: (selection) => type.value = selection ?? value,
                        );
                      },
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: descriptionController,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        labelText: 'Describe your request',
                        hintText: 'Include accounts, date ranges, or identifiers to speed things up',
                      ),
                      validator: (value) =>
                          value == null || value.trim().isEmpty ? 'Description is required' : null,
                    ),
                    const SizedBox(height: 12),
                    ValueListenableBuilder<String>(
                      valueListenable: status,
                      builder: (context, value, _) {
                        return DropdownButtonFormField<String>(
                          value: value,
                          decoration: const InputDecoration(labelText: 'Status'),
                          items: const [
                            DropdownMenuItem(value: 'In review', child: Text('In review')),
                            DropdownMenuItem(value: 'In progress', child: Text('In progress')),
                            DropdownMenuItem(value: 'Completed', child: Text('Completed')),
                          ],
                          onChanged: (selection) => status.value = selection ?? value,
                        );
                      },
                    ),
                    const SizedBox(height: 12),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.event_available_outlined),
                      title: Text(
                        expectedCompletion == null
                            ? 'Target completion date'
                            : 'Completes ${DateFormat('MMM d, yyyy').format(expectedCompletion)}',
                      ),
                      trailing: TextButton(
                        onPressed: () async {
                          final now = DateTime.now();
                          final picked = await showDatePicker(
                            context: context,
                            initialDate: expectedCompletion ?? now.add(const Duration(days: 7)),
                            firstDate: now,
                            lastDate: now.add(const Duration(days: 365)),
                          );
                          if (picked != null) {
                            expectedCompletion = picked;
                          }
                        },
                        child: Text(expectedCompletion == null ? 'Schedule' : 'Update'),
                      ),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: () {
                          if (!formKey.currentState!.validate()) {
                            return;
                          }
                          final generated = PrivacyRequest(
                            id: request?.id ?? 'privacy-${DateTime.now().microsecondsSinceEpoch}',
                            type: type.value,
                            description: descriptionController.text.trim(),
                            status: status.value,
                            submittedAt: request?.submittedAt ?? DateTime.now(),
                            expectedCompletion: expectedCompletion,
                          );
                          Navigator.of(context).pop(generated);
                        },
                        child: Text(isEditing ? 'Save changes' : 'Submit request'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );

    descriptionController.dispose();
    type.dispose();
    status.dispose();

    if (result == null || !mounted) {
      return;
    }

    setState(() {
      final existingIndex = _requests.indexWhere((element) => element.id == result.id);
      if (existingIndex >= 0) {
        _requests[existingIndex] = result;
      } else {
        _requests.insert(0, result);
      }
    });

    await ref.read(analyticsServiceProvider).track(
      'mobile_privacy_request_saved',
      context: {'type': result.type, 'status': result.status},
    );
  }

  void _updateRequestStatus(PrivacyRequest request, String status) {
    setState(() {
      final index = _requests.indexWhere((element) => element.id == request.id);
      if (index >= 0) {
        _requests[index] = request.copyWith(status: status);
      }
    });
    ref.read(analyticsServiceProvider).track(
      'mobile_privacy_request_status_updated',
      context: {'status': status},
    );
  }

  void _deleteRequest(String id) {
    setState(() {
      _requests.removeWhere((element) => element.id == id);
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final formatter = DateFormat('MMM d, yyyy');

    return GigvoraScaffold(
      title: 'Privacy & data use',
      subtitle: 'Control how Gigvora processes and protects your information',
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openRequestSheet(),
        icon: const Icon(Icons.privacy_tip_outlined),
        label: const Text('Privacy request'),
      ),
      actions: [
        IconButton(
          tooltip: 'Download privacy whitepaper',
          onPressed: () async {
            final uri = Uri.parse('https://gigvora.com/legal/privacy-whitepaper.pdf');
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          },
          icon: const Icon(Icons.download_outlined),
        ),
      ],
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            GigvoraCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('How we use your data', style: theme.textTheme.titleLarge),
                  const SizedBox(height: 12),
                  Text(
                    'Gigvora collects profile information, activity events, and payment metadata to deliver tailored job matches, mentorship recommendations, and compliance reporting. We never sell personal data and only share with vetted processors under DPAs.',
                    style: theme.textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: const [
                      _PolicyBadge(icon: Icons.security, label: 'SOC 2 Type II certified'),
                      _PolicyBadge(icon: Icons.gavel, label: 'GDPR & LGPD aligned'),
                      _PolicyBadge(icon: Icons.manage_history, label: '90-day audit trails'),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            GigvoraCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Your rights', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 12),
                  const _RightRow(
                    icon: Icons.folder_shared,
                    title: 'Access',
                    description: 'Request a copy of your data including contracts, invoices, and mentor recordings.',
                  ),
                  const Divider(height: 32),
                  const _RightRow(
                    icon: Icons.auto_fix_high,
                    title: 'Rectify',
                    description: 'Update inaccurate profile details, payment information, or compliance documentation.',
                  ),
                  const Divider(height: 32),
                  const _RightRow(
                    icon: Icons.delete_outline,
                    title: 'Delete',
                    description: 'Ask us to erase data that is no longer needed for active contracts or regulatory requirements.',
                  ),
                  const Divider(height: 32),
                  const _RightRow(
                    icon: Icons.shield_moon_outlined,
                    title: 'Restrict',
                    description: 'Pause processing while disputes or audits are underway.',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            GigvoraCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Communication preferences', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 12),
                  SwitchListTile.adaptive(
                    value: _preferences['productUpdates']!,
                    title: const Text('Product updates'),
                    subtitle: const Text('Feature announcements, release notes, and roadmap webinars.'),
                    onChanged: (value) => _togglePreference('productUpdates', value),
                  ),
                  SwitchListTile.adaptive(
                    value: _preferences['mentorDigest']!,
                    title: const Text('Mentor digest'),
                    subtitle: const Text('Bi-weekly highlights from mentors, workshops, and office hours.'),
                    onChanged: (value) => _togglePreference('mentorDigest', value),
                  ),
                  SwitchListTile.adaptive(
                    value: _preferences['marketInsights']!,
                    title: const Text('Market insights'),
                    subtitle: const Text('Compensation trends, hiring signals, and macro updates.'),
                    onChanged: (value) => _togglePreference('marketInsights', value),
                  ),
                  SwitchListTile.adaptive(
                    value: _preferences['aiMatching']!,
                    title: const Text('AI matching & profiling'),
                    subtitle: const Text('Allow our AI systems to enrich your profile for better matches.'),
                    onChanged: (value) => _togglePreference('aiMatching', value),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      ElevatedButton.icon(
                        onPressed: () async {
                          final uri = Uri.parse('mailto:privacy@gigvora.com');
                          await launchUrl(uri, mode: LaunchMode.externalApplication);
                        },
                        icon: const Icon(Icons.mail_outline),
                        label: const Text('Email privacy team'),
                      ),
                      const SizedBox(width: 12),
                      OutlinedButton.icon(
                        onPressed: () async {
                          final uri = Uri.parse('https://status.gigvora.com/compliance');
                          await launchUrl(uri, mode: LaunchMode.externalApplication);
                        },
                        icon: const Icon(Icons.analytics_outlined),
                        label: const Text('View compliance status'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            GigvoraCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Request history', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 12),
                  if (_requests.isEmpty)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('No active privacy requests', style: theme.textTheme.titleMedium),
                        const SizedBox(height: 8),
                        Text(
                          'Use the “Privacy request” button to initiate a new request. Our compliance team will respond within 24 hours.',
                          style: theme.textTheme.bodyMedium,
                        ),
                      ],
                    )
                  else
                    ..._requests.map(
                      (request) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: colorScheme.surfaceVariant.withOpacity(0.35),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text('${request.type} request', style: theme.textTheme.titleMedium),
                                  ),
                                  PopupMenuButton<String>(
                                    tooltip: 'Update status',
                                    onSelected: (status) => _updateRequestStatus(request, status),
                                    itemBuilder: (context) => const [
                                      PopupMenuItem(value: 'In review', child: Text('Mark as in review')),
                                      PopupMenuItem(value: 'In progress', child: Text('Mark as in progress')),
                                      PopupMenuItem(value: 'Completed', child: Text('Mark as completed')),
                                    ],
                                    child: Chip(
                                      label: Text(request.status),
                                      backgroundColor: colorScheme.primary.withOpacity(0.12),
                                      labelStyle:
                                          theme.textTheme.labelMedium?.copyWith(color: colorScheme.primary),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(request.description),
                              const SizedBox(height: 8),
                              Text(
                                'Submitted ${formatter.format(request.submittedAt)}'
                                '${request.expectedCompletion != null ? ' • Target ${formatter.format(request.expectedCompletion!)}' : ''}',
                                style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  TextButton.icon(
                                    onPressed: () => _openRequestSheet(request: request),
                                    icon: const Icon(Icons.edit_outlined),
                                    label: const Text('Edit'),
                                  ),
                                  const SizedBox(width: 8),
                                  TextButton.icon(
                                    onPressed: () => _deleteRequest(request.id),
                                    icon: const Icon(Icons.delete_outline),
                                    label: const Text('Remove'),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _PolicyBadge extends StatelessWidget {
  const _PolicyBadge({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: colorScheme.primary.withOpacity(0.08),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: colorScheme.primary),
          const SizedBox(width: 8),
          Text(
            label,
            style: Theme.of(context)
                .textTheme
                .labelLarge
                ?.copyWith(color: colorScheme.primary, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _RightRow extends StatelessWidget {
  const _RightRow({
    required this.icon,
    required this.title,
    required this.description,
  });

  final IconData icon;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: theme.colorScheme.secondary.withOpacity(0.12),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Icon(icon, color: theme.colorScheme.secondary),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Text(description, style: theme.textTheme.bodyMedium),
            ],
          ),
        ),
      ],
    );
  }
}
