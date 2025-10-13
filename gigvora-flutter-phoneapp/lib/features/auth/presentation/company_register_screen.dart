import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../theme/widgets.dart';
import '../data/auth_repository.dart';

class CompanyRegisterScreen extends ConsumerStatefulWidget {
  const CompanyRegisterScreen({super.key});

  @override
  ConsumerState<CompanyRegisterScreen> createState() => _CompanyRegisterScreenState();
}

class _CompanyRegisterScreenState extends ConsumerState<CompanyRegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _companyController = TextEditingController();
  final _websiteController = TextEditingController();
  final _focusController = TextEditingController();
  final _contactNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _teamSizeController = TextEditingController();
  final _locationController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  String _type = 'company';
  bool _twoFactorEnabled = true;
  bool _loading = false;
  String? _error;
  String? _info;

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
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }
    if (_passwordController.text != _confirmPasswordController.text) {
      setState(() {
        _error = 'Passwords do not match.';
      });
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
      _info = null;
    });

    final parts = _contactNameController.text.trim().split(' ');
    final firstName = parts.isNotEmpty ? parts.first : _contactNameController.text.trim();
    final lastName = parts.length > 1 ? parts.sublist(1).join(' ') : 'Operations';

    final repository = ref.read(authRepositoryProvider);
    final future = _type == 'company'
        ? repository.registerCompanyAccount(
            companyName: _companyController.text.trim(),
            firstName: firstName,
            lastName: lastName,
            email: _emailController.text.trim(),
            password: _passwordController.text,
            website: _websiteController.text.trim(),
            focusArea: _focusController.text.trim(),
            location: _locationController.text.trim(),
            twoFactorEnabled: _twoFactorEnabled,
          )
        : repository.registerAgencyAccount(
            agencyName: _companyController.text.trim(),
            firstName: firstName,
            lastName: lastName,
            email: _emailController.text.trim(),
            password: _passwordController.text,
            website: _websiteController.text.trim(),
            focusArea: _focusController.text.trim(),
            location: _locationController.text.trim(),
            twoFactorEnabled: _twoFactorEnabled,
          );

    future.then((_) {
      final label = _type == 'company' ? 'Company' : 'Agency';
      setState(() {
        _info = '$label hub created. Check your inbox to complete onboarding.';
      });
      _formKey.currentState?.reset();
      _companyController.clear();
      _websiteController.clear();
      _focusController.clear();
      _contactNameController.clear();
      _emailController.clear();
      _teamSizeController.clear();
      _locationController.clear();
      _passwordController.clear();
      _confirmPasswordController.clear();
      _twoFactorEnabled = true;
    }).catchError((error) {
      setState(() {
        _error = error.toString();
      });
    }).whenComplete(() {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    });
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
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _passwordController,
                      decoration: const InputDecoration(labelText: 'Admin password'),
                      obscureText: true,
                      validator: (value) => value != null && value.length >= 12
                          ? null
                          : 'Use at least 12 characters',
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _confirmPasswordController,
                      decoration: const InputDecoration(labelText: 'Confirm password'),
                      obscureText: true,
                      validator: (value) => value == _passwordController.text
                          ? null
                          : 'Passwords must match',
                    ),
                    const SizedBox(height: 16),
                    SwitchListTile(
                      title: const Text('Require 2FA for admin access'),
                      subtitle: const Text('Security parity across web and mobile dashboards.'),
                      value: _twoFactorEnabled,
                      onChanged: (value) {
                        setState(() {
                          _twoFactorEnabled = value;
                        });
                      },
                    ),
                    const SizedBox(height: 24),
                    if (_error != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Text(
                          _error!,
                          style: const TextStyle(color: Color(0xFFB91C1C)),
                        ),
                      ),
                    if (_info != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Text(
                          _info!,
                          style: const TextStyle(color: Color(0xFF047857)),
                        ),
                      ),
                    FilledButton(
                      onPressed: _loading ? null : _submit,
                      child: _loading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text('Launch $typeLabel hub'),
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
