import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../theme/widgets.dart';

class AboutUsScreen extends StatefulWidget {
  const AboutUsScreen({super.key});

  @override
  State<AboutUsScreen> createState() => _AboutUsScreenState();
}

class _AboutUsScreenState extends State<AboutUsScreen> {
  final List<_TeamMember> _team = const [
    _TeamMember(
      name: 'Tayo Adekunle',
      role: 'Founder & CEO',
      blurb: 'Marketplace operator focused on equitable access to meaningful work.',
    ),
    _TeamMember(
      name: 'Aurora Leung',
      role: 'Chief Product Officer',
      blurb: 'Builds cross-platform experiences that delight independent talent.',
    ),
    _TeamMember(
      name: 'Diego Alvarez',
      role: 'VP Engineering',
      blurb: 'Leads realtime collaboration, compliance, and integrations.',
    ),
  ];

  final List<_Milestone> _milestones = const [
    _Milestone(title: 'Gigvora founded', description: 'Incorporated to help talent co-create with companies.', date: 'Apr 2021'),
    _Milestone(title: 'Explorer launched', description: 'Curated gigs, mentors, and launchpads shipped to beta users.', date: 'Sep 2022'),
    _Milestone(title: 'Mentorship marketplace', description: 'Opened booking platform with revenue share for mentors.', date: 'Jun 2023'),
    _Milestone(title: 'Series A & expansion', description: 'Scaled to LATAM, North America, and EMEA operations.', date: 'Feb 2024'),
  ];

  final List<_PartnerInquiry> _inquiries = [];

  Future<void> _openPartnerSheet() async {
    final result = await showModalBottomSheet<_PartnerInquiry>(
      context: context,
      isScrollControlled: true,
      builder: (context) => const _PartnerInquirySheet(),
    );
    if (result != null && mounted) {
      setState(() => _inquiries.insert(0, result));
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Thanks ${result.contactName}, we\'ll get back to you within one business day.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return GigvoraScaffold(
      title: 'About Gigvora',
      subtitle: 'We unlock modern work for builders, operators, and companies globally.',
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openPartnerSheet,
        icon: const Icon(Icons.handshake_outlined),
        label: const Text('Partner with us'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          _MissionSection(openPartnerSheet: _openPartnerSheet),
          const SizedBox(height: 24),
          _TeamSection(team: _team),
          const SizedBox(height: 24),
          _MilestoneSection(milestones: _milestones),
          const SizedBox(height: 24),
          _PartnerPipelineSection(inquiries: _inquiries),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

class _MissionSection extends StatelessWidget {
  const _MissionSection({required this.openPartnerSheet});

  final VoidCallback openPartnerSheet;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Our mission', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          const Text(
            'Gigvora is a community of product leaders, independent operators, and companies building better futures of work.'
            ' We match teams with talent, power launchpads, and provide mentorship that accelerates careers.',
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            children: const [
              Chip(label: Text('Marketplace operations')),
              Chip(label: Text('Mentorship')),
              Chip(label: Text('Future of work')),
            ],
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: openPartnerSheet,
            icon: const Icon(Icons.handshake_outlined),
            label: const Text('Discuss partnerships'),
          ),
        ],
      ),
    );
  }
}

class _TeamSection extends StatelessWidget {
  const _TeamSection({required this.team});

  final List<_TeamMember> team;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Leadership team', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 16),
          ...team.map((member) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(child: Text(member.name[0])),
                title: Text(member.name),
                subtitle: Text('${member.role}\n${member.blurb}'),
              )),
        ],
      ),
    );
  }
}

class _MilestoneSection extends StatelessWidget {
  const _MilestoneSection({required this.milestones});

  final List<_Milestone> milestones;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Milestones', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 16),
          ...milestones.map((milestone) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.flag_outlined),
                title: Text(milestone.title),
                subtitle: Text('${milestone.description}\n${milestone.date}'),
              )),
        ],
      ),
    );
  }
}

class _PartnerPipelineSection extends StatelessWidget {
  const _PartnerPipelineSection({required this.inquiries});

  final List<_PartnerInquiry> inquiries;

  @override
  Widget build(BuildContext context) {
    if (inquiries.isEmpty) {
      return GigvoraCard(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Partnership pipeline', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            const Text('No open partnership leads yet. Tap the button to start a conversation with our team.'),
          ],
        ),
      );
    }

    final formatter = DateFormat.yMMMd();
    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Partnership pipeline', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          ...inquiries.map((inquiry) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.business_center_outlined),
                title: Text(inquiry.organization),
                subtitle: Text('${inquiry.contactName} • ${inquiry.email}\nFocus: ${inquiry.focus}'),
                trailing: Text(formatter.format(inquiry.createdAt)),
              )),
        ],
      ),
    );
  }
}

class _PartnerInquirySheet extends StatefulWidget {
  const _PartnerInquirySheet();

  @override
  State<_PartnerInquirySheet> createState() => _PartnerInquirySheetState();
}

class _PartnerInquirySheetState extends State<_PartnerInquirySheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _organizationController;
  late final TextEditingController _contactController;
  late final TextEditingController _emailController;
  late final TextEditingController _focusController;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _organizationController = TextEditingController();
    _contactController = TextEditingController();
    _emailController = TextEditingController();
    _focusController = TextEditingController();
  }

  @override
  void dispose() {
    _organizationController.dispose();
    _contactController.dispose();
    _emailController.dispose();
    _focusController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() => _submitting = true);
    final inquiry = _PartnerInquiry(
      organization: _organizationController.text.trim(),
      contactName: _contactController.text.trim(),
      email: _emailController.text.trim(),
      focus: _focusController.text.trim(),
      createdAt: DateTime.now(),
    );
    if (!mounted) return;
    Navigator.of(context).pop(inquiry);
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
              Text('Partner with Gigvora', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              TextFormField(
                controller: _organizationController,
                decoration: const InputDecoration(labelText: 'Organization'),
                validator: (value) => value == null || value.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _contactController,
                decoration: const InputDecoration(labelText: 'Contact name'),
                validator: (value) => value == null || value.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'Email'),
                keyboardType: TextInputType.emailAddress,
                validator: (value) => value == null || value.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _focusController,
                decoration: const InputDecoration(labelText: 'What should we explore together?'),
                maxLines: 3,
                validator: (value) => value == null || value.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: _submitting ? null : _submit,
                icon: _submitting
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.send),
                label: Text(_submitting ? 'Sending...' : 'Submit inquiry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TeamMember {
  const _TeamMember({required this.name, required this.role, required this.blurb});

  final String name;
  final String role;
  final String blurb;
}

class _Milestone {
  const _Milestone({required this.title, required this.description, required this.date});

  final String title;
  final String description;
  final String date;
}

class _PartnerInquiry {
  const _PartnerInquiry({
    required this.organization,
    required this.contactName,
    required this.email,
    required this.focus,
    required this.createdAt,
  });

  final String organization;
  final String contactName;
  final String email;
  final String focus;
  final DateTime createdAt;
}
