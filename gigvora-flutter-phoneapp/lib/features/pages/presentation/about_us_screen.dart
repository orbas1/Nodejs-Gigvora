import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/providers.dart';
import '../../../theme/widgets.dart';

class AboutTeamMember {
  const AboutTeamMember({
    required this.name,
    required this.role,
    required this.bio,
    required this.focus,
    this.avatar,
    this.links = const <String, String>{},
  });

  final String name;
  final String role;
  final String bio;
  final String focus;
  final String? avatar;
  final Map<String, String> links;
}

class CompanyMilestone {
  const CompanyMilestone({
    required this.title,
    required this.description,
    required this.date,
    required this.impactMetric,
  });

  final String title;
  final String description;
  final DateTime date;
  final String impactMetric;
}

class PartnerInquiry {
  const PartnerInquiry({
    required this.id,
    required this.organization,
    required this.contactName,
    required this.email,
    required this.focus,
    required this.status,
    required this.notes,
    required this.createdAt,
    this.followUp,
  });

  final String id;
  final String organization;
  final String contactName;
  final String email;
  final String focus;
  final String status;
  final String notes;
  final DateTime createdAt;
  final DateTime? followUp;

  PartnerInquiry copyWith({
    String? organization,
    String? contactName,
    String? email,
    String? focus,
    String? status,
    String? notes,
    DateTime? createdAt,
    DateTime? followUp,
  }) {
    return PartnerInquiry(
      id: id,
      organization: organization ?? this.organization,
      contactName: contactName ?? this.contactName,
      email: email ?? this.email,
      focus: focus ?? this.focus,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      followUp: followUp ?? this.followUp,
    );
  }
}

class AboutUsScreen extends ConsumerStatefulWidget {
  const AboutUsScreen({super.key});

  @override
  ConsumerState<AboutUsScreen> createState() => _AboutUsScreenState();
}

class _AboutUsScreenState extends ConsumerState<AboutUsScreen> {
  final List<AboutTeamMember> _team = const <AboutTeamMember>[
    AboutTeamMember(
      name: 'Tayo Adekunle',
      role: 'Founder & CEO',
      focus: 'Marketplace expansion',
      bio:
          'Former operator at two unicorn marketplaces with a passion for equitable work. Tayo leads product vision, partnerships, and our growth guild.',
      avatar: 'https://avatars.githubusercontent.com/u/61609106?v=4',
      links: {'LinkedIn': 'https://www.linkedin.com/in/tayoadekunle'},
    ),
    AboutTeamMember(
      name: 'Aurora Leung',
      role: 'Chief Product Officer',
      focus: 'Talent intelligence',
      bio:
          'Aurora crafts the end-to-end candidate experience from onboarding flows to AI-matched gigs. She previously scaled creation tools at a top design platform.',
      avatar: 'https://avatars.githubusercontent.com/u/45947339?v=4',
      links: {'Portfolio': 'https://auroraleung.design'},
    ),
    AboutTeamMember(
      name: 'Diego Alvarez',
      role: 'VP Engineering',
      focus: 'Realtime collaboration',
      bio:
          'Diego specialises in resilient, distributed systems. His team powers chat, live CRM sync, and workflow automation across Gigvora.',
      avatar: 'https://avatars.githubusercontent.com/u/79076541?v=4',
      links: {'GitHub': 'https://github.com/diego-gigvora'},
    ),
  ];

  final List<CompanyMilestone> _milestones = <CompanyMilestone>[
    CompanyMilestone(
      title: 'Gigvora was founded',
      description: 'Incorporated with the mission of modernising how independent talent collaborates with companies globally.',
      date: DateTime(2021, 4, 18),
      impactMetric: 'Seed partners 12',
    ),
    CompanyMilestone(
      title: 'Launch of Explorer',
      description:
          'Released the Explorer hub enabling curated opportunities, learning pathways, and mentor discovery in a single mobile experience.',
      date: DateTime(2022, 9, 12),
      impactMetric: 'Monthly actives 48k',
    ),
    CompanyMilestone(
      title: 'Mentorship marketplace GA',
      description: 'Opened the mentorship marketplace with booking, scheduling, and revenue share for top operators.',
      date: DateTime(2023, 6, 5),
      impactMetric: 'Mentors onboarded 640',
    ),
    CompanyMilestone(
      title: 'Series A + global expansion',
      description: 'Secured funding to scale to LATAM, North America, and EMEA with localised compliance playbooks.',
      date: DateTime(2024, 2, 20),
      impactMetric: 'Companies hiring 1.2k',
    ),
  ];

  final List<PartnerInquiry> _seedInquiries = <PartnerInquiry>[
    PartnerInquiry(
      id: 'inquiry-1',
      organization: 'Nova Robotics',
      contactName: 'Priya Patel',
      email: 'priya@novarobotics.ai',
      focus: 'Enterprise upskilling programme',
      status: 'In review',
      notes: 'Requested mentor-led AI curriculum for 250 engineers across three hubs.',
      createdAt: DateTime.now().subtract(const Duration(days: 6)),
      followUp: DateTime.now().add(const Duration(days: 8)),
    ),
    PartnerInquiry(
      id: 'inquiry-2',
      organization: 'Atlas Studios',
      contactName: 'Jordan Miller',
      email: 'jmiller@atlasstudios.com',
      focus: 'Creative talent residency',
      status: 'Active',
      notes: 'Pilot residency for film and motion designers. Needs custom onboarding for contractors.',
      createdAt: DateTime.now().subtract(const Duration(days: 2)),
      followUp: DateTime.now().add(const Duration(days: 2)),
    ),
  ];

  late final List<PartnerInquiry> _inquiries;

  @override
  void initState() {
    super.initState();
    _inquiries = List<PartnerInquiry>.from(_seedInquiries);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(analyticsServiceProvider).track(
        'mobile_about_opened',
        context: const {'surface': 'about_us'},
        metadata: const {'source': 'mobile_app'},
      );
    });
  }

  Future<void> _refresh() async {
    await Future<void>.delayed(const Duration(milliseconds: 350));
    await ref.read(analyticsServiceProvider).track(
      'mobile_about_refreshed',
      context: {'openInquiries': _inquiries.length},
    );
    if (!mounted) return;
    setState(() {
      _inquiries = List<PartnerInquiry>.from(_inquiries);
    });
  }

  Future<void> _openInquirySheet({PartnerInquiry? inquiry}) async {
    final isEditing = inquiry != null;
    final organizationController = TextEditingController(text: inquiry?.organization ?? '');
    final contactController = TextEditingController(text: inquiry?.contactName ?? '');
    final emailController = TextEditingController(text: inquiry?.email ?? '');
    final focusController = TextEditingController(text: inquiry?.focus ?? '');
    final notesController = TextEditingController(text: inquiry?.notes ?? '');
    String status = inquiry?.status ?? 'In review';
    DateTime? followUp = inquiry?.followUp;
    final formKey = GlobalKey<FormState>();

    final result = await showModalBottomSheet<PartnerInquiry>(
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
                          isEditing ? 'Update partnership lead' : 'Log partnership lead',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        IconButton(
                          onPressed: () => Navigator.of(context).pop(),
                          icon: const Icon(Icons.close),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: organizationController,
                      decoration: const InputDecoration(labelText: 'Organisation name'),
                      validator: (value) =>
                          value == null || value.trim().isEmpty ? 'Organisation is required' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: contactController,
                      decoration: const InputDecoration(labelText: 'Primary contact'),
                      validator: (value) =>
                          value == null || value.trim().isEmpty ? 'Contact name is required' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: emailController,
                      decoration: const InputDecoration(labelText: 'Email'),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Email is required';
                        }
                        if (!value.contains('@')) {
                          return 'Enter a valid email';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: focusController,
                      decoration: const InputDecoration(labelText: 'Focus area'),
                      validator: (value) =>
                          value == null || value.trim().isEmpty ? 'Focus area is required' : null,
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: status,
                      decoration: const InputDecoration(labelText: 'Status'),
                      items: const [
                        DropdownMenuItem(value: 'In review', child: Text('In review')),
                        DropdownMenuItem(value: 'Active', child: Text('Active')),
                        DropdownMenuItem(value: 'Won', child: Text('Won')),
                        DropdownMenuItem(value: 'Closed', child: Text('Closed')),
                      ],
                      onChanged: (value) => status = value ?? status,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: notesController,
                      maxLines: 4,
                      decoration: const InputDecoration(labelText: 'Notes & next steps'),
                    ),
                    const SizedBox(height: 12),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.calendar_month),
                      title: Text(
                        followUp == null
                            ? 'Add follow-up reminder'
                            : 'Follow-up ${DateFormat('MMM d, yyyy').format(followUp)}',
                      ),
                      trailing: TextButton(
                        onPressed: () async {
                          final now = DateTime.now();
                          final picked = await showDatePicker(
                            context: context,
                            initialDate: followUp ?? now.add(const Duration(days: 3)),
                            firstDate: now,
                            lastDate: now.add(const Duration(days: 365)),
                          );
                          if (picked != null) {
                            followUp = picked;
                          }
                        },
                        child: Text(followUp == null ? 'Schedule' : 'Update'),
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
                          final inquiryResult = PartnerInquiry(
                            id: inquiry?.id ?? 'inquiry-${DateTime.now().microsecondsSinceEpoch}',
                            organization: organizationController.text.trim(),
                            contactName: contactController.text.trim(),
                            email: emailController.text.trim(),
                            focus: focusController.text.trim(),
                            status: status,
                            notes: notesController.text.trim(),
                            createdAt: inquiry?.createdAt ?? DateTime.now(),
                            followUp: followUp,
                          );
                          Navigator.of(context).pop(inquiryResult);
                        },
                        child: Text(isEditing ? 'Save changes' : 'Create lead'),
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

    organizationController.dispose();
    contactController.dispose();
    emailController.dispose();
    focusController.dispose();
    notesController.dispose();

    if (result == null || !mounted) return;

    setState(() {
      final existingIndex = _inquiries.indexWhere((element) => element.id == result.id);
      if (existingIndex >= 0) {
        _inquiries[existingIndex] = result;
      } else {
        _inquiries.insert(0, result);
      }
    });

    await ref.read(analyticsServiceProvider).track(
      'mobile_about_inquiry_saved',
      context: {'status': result.status},
    );
  }

  void _deleteInquiry(String id) {
    setState(() {
      _inquiries.removeWhere((element) => element.id == id);
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return GigvoraScaffold(
      title: 'About Gigvora',
      subtitle: 'How we connect opportunity, mentorship, and community',
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openInquirySheet(),
        icon: const Icon(Icons.handshake_outlined),
        label: const Text('Log partnership lead'),
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            GigvoraCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Our mission', style: theme.textTheme.titleLarge),
                  const SizedBox(height: 12),
                  Text(
                    'We are building the most trusted launchpad for ambitious talent and innovative companies. Gigvora unifies job discovery, mentorship, payments, and compliance so teams can co-create impactful work anywhere.',
                    style: theme.textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: const [
                      _MetricPill(icon: Icons.public, label: 'Talent across 60+ countries'),
                      _MetricPill(icon: Icons.bolt, label: 'Hiring cycle reduced by 47%'),
                      _MetricPill(icon: Icons.favorite, label: 'NPS 73 with mentors & clients'),
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
                  Text('Operating principles', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 12),
                  const _ValueTile(
                    icon: Icons.layers_outlined,
                    title: 'Integrated journeys',
                    description:
                        'Work, learning, and payments live together. Our teams ship cross-functional experiences that feel choreographed.',
                  ),
                  const Divider(height: 32),
                  const _ValueTile(
                    icon: Icons.verified_user_outlined,
                    title: 'Safety by design',
                    description:
                        'Compliance, privacy, and trust tooling are core features. Every release reviews SOC 2 controls and inclusive defaults.',
                  ),
                  const Divider(height: 32),
                  const _ValueTile(
                    icon: Icons.diversity_3,
                    title: 'Community-first',
                    description:
                        'We support cross-border careers with curated mentorship, learning pods, and localised playbooks for each market.',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            GigvoraCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Leadership', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 12),
                  ..._team.map(
                    (member) => Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: _TeamMemberTile(member: member),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            GigvoraCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Milestones', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 12),
                  ..._milestones.map(
                    (milestone) => _MilestoneTile(milestone: milestone),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            GigvoraCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Partnership pipeline', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 12),
                  if (_inquiries.isEmpty)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('No logged leads yet', style: theme.textTheme.titleMedium),
                        const SizedBox(height: 8),
                        Text(
                          'Tap “Log partnership lead” to capture inbound interest or new programmes you are working on.',
                          style: theme.textTheme.bodyMedium,
                        ),
                      ],
                    )
                  else
                    ..._inquiries.map(
                      (inquiry) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Dismissible(
                          key: ValueKey(inquiry.id),
                          background: Container(
                            decoration: BoxDecoration(
                              color: colorScheme.error.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            alignment: Alignment.centerLeft,
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            child: Icon(Icons.delete, color: colorScheme.error),
                          ),
                          direction: DismissDirection.startToEnd,
                          onDismissed: (_) => _deleteInquiry(inquiry.id),
                          child: _InquiryTile(
                            inquiry: inquiry,
                            onEdit: () => _openInquirySheet(inquiry: inquiry),
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

class _MetricPill extends StatelessWidget {
  const _MetricPill({required this.icon, required this.label});

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

class _ValueTile extends StatelessWidget {
  const _ValueTile({
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

class _TeamMemberTile extends StatelessWidget {
  const _TeamMemberTile({required this.member});

  final AboutTeamMember member;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        CircleAvatar(
          radius: 32,
          backgroundImage: member.avatar != null ? NetworkImage(member.avatar!) : null,
          child: member.avatar == null
              ? Text(member.name.split(' ').map((part) => part.characters.first).take(2).join())
              : null,
        ),
        const SizedBox(width: 16),
        Expanded(
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
                        Text(member.name, style: theme.textTheme.titleMedium),
                        const SizedBox(height: 4),
                        Text(member.role, style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.primary)),
                      ],
                    ),
                  ),
                  Chip(label: Text(member.focus)),
                ],
              ),
              const SizedBox(height: 8),
              Text(member.bio, style: theme.textTheme.bodyMedium),
              if (member.links.isNotEmpty) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: member.links.entries
                      .map(
                        (entry) => ActionChip(
                          label: Text(entry.key),
                          avatar: const Icon(Icons.open_in_new, size: 18),
                          onPressed: () {
                            final uri = Uri.tryParse(entry.value);
                            if (uri != null) {
                              launchUrl(uri, mode: LaunchMode.externalApplication);
                            }
                          },
                        ),
                      )
                      .toList(),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _MilestoneTile extends StatelessWidget {
  const _MilestoneTile({required this.milestone});

  final CompanyMilestone milestone;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: theme.colorScheme.primary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
        ),
        alignment: Alignment.center,
        child: Text(DateFormat('y').format(milestone.date), style: theme.textTheme.titleMedium),
      ),
      title: Text(milestone.title),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 4),
          Text(milestone.description),
          const SizedBox(height: 8),
          Text(milestone.impactMetric, style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _InquiryTile extends StatelessWidget {
  const _InquiryTile({required this.inquiry, required this.onEdit});

  final PartnerInquiry inquiry;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final formatter = DateFormat('MMM d, yyyy');
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.35),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(inquiry.organization, style: theme.textTheme.titleMedium),
              ),
              Chip(
                label: Text(inquiry.status),
                backgroundColor: theme.colorScheme.primary.withOpacity(0.12),
                labelStyle: theme.textTheme.labelMedium?.copyWith(color: theme.colorScheme.primary),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text('Contact: ${inquiry.contactName} • ${inquiry.email}'),
          const SizedBox(height: 8),
          Text('Focus: ${inquiry.focus}', style: theme.textTheme.bodyMedium),
          const SizedBox(height: 8),
          Text(inquiry.notes, style: theme.textTheme.bodySmall),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Logged ${formatter.format(inquiry.createdAt)}'
                  '${inquiry.followUp != null ? ' • Follow-up ${formatter.format(inquiry.followUp!)}' : ''}',
                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                ),
              ),
              TextButton.icon(
                onPressed: onEdit,
                icon: const Icon(Icons.edit_outlined),
                label: const Text('Update'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
