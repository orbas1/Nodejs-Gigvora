import 'package:flutter/material.dart';

import '../../../theme/widgets.dart';

class CompanyRegisterScreen extends StatefulWidget {
  const CompanyRegisterScreen({super.key});

  @override
  State<CompanyRegisterScreen> createState() => _CompanyRegisterScreenState();
}

class _CompanyRegisterScreenState extends State<CompanyRegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _companyController = TextEditingController();
  final _websiteController = TextEditingController();
  final _focusController = TextEditingController();
  final _contactNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _teamSizeController = TextEditingController();
  final _locationController = TextEditingController();

  String _type = 'company';

  static const List<String> _pillars = [
    'Publish roles, gigs, and launchpad challenges with beautiful employer branding.',
    'Manage inbound talent pipelines with collaborative scoring and tags.',
    'Co-create private groups and showcase company culture to the Gigvora community.',
  ];

  @override
  void dispose() {
    _companyController.dispose();
    _websiteController.dispose();
    _focusController.dispose();
    _contactNameController.dispose();
    _emailController.dispose();
    _teamSizeController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }
    final label = _type == 'company' ? 'Company' : 'Agency';
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$label registration submitted. Our partnerships team will be in touch.')),
    );
    _formKey.currentState?.reset();
    _companyController.clear();
    _websiteController.clear();
    _focusController.clear();
    _contactNameController.clear();
    _emailController.clear();
    _teamSizeController.clear();
    _locationController.clear();
  }

  @override
  Widget build(BuildContext context) {
    final typeLabel = _type == 'company' ? 'Company' : 'Agency';
    return GigvoraScaffold(
      title: 'Partner with Gigvora',
      subtitle: 'Build your $typeLabel hub',
      body: SingleChildScrollView(
        child: Column(
          children: [
            GigvoraCard(
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Organisation details',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                        ),
                        SegmentedButton<String>(
                          segments: const [
                            ButtonSegment(value: 'company', label: Text('Company')),
                            ButtonSegment(value: 'agency', label: Text('Agency')),
                          ],
                          selected: <String>{_type},
                          onSelectionChanged: (value) {
                            setState(() {
                              _type = value.first;
                            });
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _companyController,
                      decoration: InputDecoration(labelText: '$typeLabel name'),
                      textCapitalization: TextCapitalization.words,
                      validator: (value) => value == null || value.trim().isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _websiteController,
                      decoration: const InputDecoration(labelText: 'Website', hintText: 'https://'),
                      keyboardType: TextInputType.url,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _focusController,
                      decoration: const InputDecoration(labelText: 'Focus area / mission'),
                      maxLines: 3,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _contactNameController,
                      decoration: const InputDecoration(labelText: 'Primary contact'),
                      textCapitalization: TextCapitalization.words,
                      validator: (value) => value == null || value.trim().isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _emailController,
                      decoration: const InputDecoration(labelText: 'Contact email'),
                      keyboardType: TextInputType.emailAddress,
                      validator: (value) =>
                          value != null && value.contains('@') ? null : 'Enter a valid email address',
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _teamSizeController,
                      decoration: const InputDecoration(labelText: 'Team size'),
                      keyboardType: TextInputType.number,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _locationController,
                      decoration: const InputDecoration(labelText: 'HQ location'),
                      textCapitalization: TextCapitalization.words,
                    ),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: _submit,
                      child: Text('Launch $typeLabel hub'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            GigvoraCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Why partners love Gigvora',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 16),
                  ..._pillars.map(
                    (item) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.bolt, color: Color(0xFF2563EB), size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              item,
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      'Our concierge crew helps craft your first listings, migrate applicants, and launch branded campaigns that mirror the Gigvora aesthetic.',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
