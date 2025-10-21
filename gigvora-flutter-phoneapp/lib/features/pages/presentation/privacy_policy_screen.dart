import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../theme/widgets.dart';

class PrivacyPolicyScreen extends StatefulWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  State<PrivacyPolicyScreen> createState() => _PrivacyPolicyScreenState();
}

class _PrivacyPolicyScreenState extends State<PrivacyPolicyScreen> {
  bool _marketingOptIn = true;
  bool _researchConsent = false;
  final List<_PrivacyRequest> _requests = [];

  Future<void> _openRequestSheet() async {
    final result = await showModalBottomSheet<_PrivacyRequest>(
      context: context,
      isScrollControlled: true,
      builder: (context) => const _PrivacyRequestSheet(),
    );
    if (result != null && mounted) {
      setState(() => _requests.insert(0, result));
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('We\'ve logged your request (${result.type}). Expect an update soon.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return GigvoraScaffold(
      title: 'Privacy & data controls',
      subtitle: 'Understand how Gigvora uses your data and manage consent.',
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openRequestSheet,
        icon: const Icon(Icons.verified_user_outlined),
        label: const Text('New request'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          _SummaryCard(),
          const SizedBox(height: 24),
          _ConsentSection(
            marketingOptIn: _marketingOptIn,
            researchConsent: _researchConsent,
            onMarketingChanged: (value) => setState(() => _marketingOptIn = value),
            onResearchChanged: (value) => setState(() => _researchConsent = value),
          ),
          const SizedBox(height: 24),
          _RequestHistorySection(requests: _requests),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Text(
            'Your data powers curated gigs, secure messaging, and compliance workflows. We store it in the EU and review access',
          ),
          SizedBox(height: 12),
          Text('You can control marketing, research participation, and submit formal GDPR/CCPA requests below.'),
        ],
      ),
    );
  }
}

class _ConsentSection extends StatelessWidget {
  const _ConsentSection({
    required this.marketingOptIn,
    required this.researchConsent,
    required this.onMarketingChanged,
    required this.onResearchChanged,
  });

  final bool marketingOptIn;
  final bool researchConsent;
  final ValueChanged<bool> onMarketingChanged;
  final ValueChanged<bool> onResearchChanged;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Consents & preferences', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            value: marketingOptIn,
            title: const Text('Product and opportunity updates'),
            subtitle: const Text('Receive newsletters, release notes, and curated opportunities.'),
            onChanged: onMarketingChanged,
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            value: researchConsent,
            title: const Text('Participate in research studies'),
            subtitle: const Text('Allow Gigvora to invite you to usability tests and beta programs.'),
            onChanged: onResearchChanged,
          ),
        ],
      ),
    );
  }
}

class _RequestHistorySection extends StatelessWidget {
  const _RequestHistorySection({required this.requests});

  final List<_PrivacyRequest> requests;

  @override
  Widget build(BuildContext context) {
    if (requests.isEmpty) {
      return GigvoraCard(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text('Privacy request history', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            SizedBox(height: 12),
            Text('No open requests. Submit a data export or deletion request any time.'),
          ],
        ),
      );
    }

    final formatter = DateFormat.yMMMd().add_Hm();
    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Privacy request history', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          ...requests.map((request) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.security_outlined),
                title: Text('${request.type} • ${request.status}'),
                subtitle: Text('${request.summary}\n${formatter.format(request.createdAt)}'),
              )),
        ],
      ),
    );
  }
}

class _PrivacyRequestSheet extends StatefulWidget {
  const _PrivacyRequestSheet();

  @override
  State<_PrivacyRequestSheet> createState() => _PrivacyRequestSheetState();
}

class _PrivacyRequestSheetState extends State<_PrivacyRequestSheet> {
  final _formKey = GlobalKey<FormState>();
  String _type = 'Data export';
  late final TextEditingController _summaryController;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _summaryController = TextEditingController();
  }

  @override
  void dispose() {
    _summaryController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() => _submitting = true);
    final request = _PrivacyRequest(
      type: _type,
      summary: _summaryController.text.trim(),
      status: 'Pending',
      createdAt: DateTime.now(),
    );
    if (!mounted) return;
    Navigator.of(context).pop(request);
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
              Text('Submit a privacy request', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _type,
                decoration: const InputDecoration(labelText: 'Request type'),
                items: const [
                  DropdownMenuItem(value: 'Data export', child: Text('Data export (Art. 15)')),
                  DropdownMenuItem(value: 'Data deletion', child: Text('Data deletion (Art. 17)')),
                  DropdownMenuItem(value: 'Consent withdrawal', child: Text('Withdraw consent')), 
                ],
                onChanged: (value) => setState(() => _type = value ?? _type),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _summaryController,
                decoration: const InputDecoration(labelText: 'Describe your request'),
                maxLines: 4,
                validator: (value) => value == null || value.trim().isEmpty ? 'Provide context' : null,
              ),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: _submitting ? null : _submit,
                icon: _submitting
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.check),
                label: Text(_submitting ? 'Submitting...' : 'Submit'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PrivacyRequest {
  const _PrivacyRequest({
    required this.type,
    required this.summary,
    required this.status,
    required this.createdAt,
  });

  final String type;
  final String summary;
  final String status;
  final DateTime createdAt;
}
