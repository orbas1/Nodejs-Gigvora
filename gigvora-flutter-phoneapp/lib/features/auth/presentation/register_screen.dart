import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../theme/widgets.dart';
import '../data/auth_repository.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();
  final _ageController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  String _userType = 'user';
  bool _twoFactorEnabled = true;
  bool _loading = false;
  String? _error;
  String? _info;

  final List<String> _highlights = const [
    'Showcase your craft with a multimedia profile and featured wins.',
    'Unlock tailored feeds across jobs, gigs, projects, and volunteering.',
    'Build trusted connections with agencies, companies, and fellow talent.',
  ];

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _ageController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _submit() {
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

    ref
        .read(authRepositoryProvider)
        .registerUser(
          firstName: _firstNameController.text.trim(),
          lastName: _lastNameController.text.trim(),
          email: _emailController.text.trim(),
          password: _passwordController.text,
          address: _addressController.text.trim(),
          age: int.tryParse(_ageController.text.trim()),
          twoFactorEnabled: _twoFactorEnabled,
          userType: _userType,
        )
        .then((_) {
      setState(() {
        _info = 'Account created. Check your inbox for a verification code.';
      });
      _formKey.currentState?.reset();
      _firstNameController.clear();
      _lastNameController.clear();
      _emailController.clear();
      _addressController.clear();
      _ageController.clear();
      _passwordController.clear();
      _confirmPasswordController.clear();
      _userType = 'user';
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
    return GigvoraScaffold(
      title: 'Join Gigvora',
      subtitle: 'Freelancer & professional signup',
      useAppDrawer: true,
      body: SingleChildScrollView(
        child: Column(
          children: [
            GigvoraCard(
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Tell us about yourself',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _firstNameController,
                            decoration: const InputDecoration(labelText: 'First name'),
                            textCapitalization: TextCapitalization.words,
                            validator: (value) => value == null || value.trim().isEmpty ? 'Required' : null,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: TextFormField(
                            controller: _lastNameController,
                            decoration: const InputDecoration(labelText: 'Last name'),
                            textCapitalization: TextCapitalization.words,
                            validator: (value) => value == null || value.trim().isEmpty ? 'Required' : null,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _emailController,
                      decoration: const InputDecoration(labelText: 'Email address'),
                      keyboardType: TextInputType.emailAddress,
                      validator: (value) =>
                          value != null && value.contains('@') ? null : 'Enter a valid email address',
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _addressController,
                      decoration: const InputDecoration(labelText: 'City & country'),
                      textCapitalization: TextCapitalization.words,
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      value: _userType,
                      items: const [
                        DropdownMenuItem(value: 'user', child: Text('Career explorer')),
                        DropdownMenuItem(value: 'freelancer', child: Text('Freelancer')),
                        DropdownMenuItem(value: 'agency', child: Text('Agency')),
                      ],
                      onChanged: (value) {
                        if (value != null) {
                          setState(() {
                            _userType = value;
                          });
                        }
                      },
                      decoration: const InputDecoration(labelText: 'Account focus'),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _ageController,
                      decoration: const InputDecoration(labelText: 'Age'),
                      keyboardType: TextInputType.number,
                      validator: (value) {
                        if (value == null || value.isEmpty) return null;
                        final parsed = int.tryParse(value);
                        if (parsed == null || parsed < 16) {
                          return 'Minimum age is 16';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _passwordController,
                      decoration: const InputDecoration(labelText: 'Password'),
                      obscureText: true,
                      validator: (value) => value != null && value.length >= 8
                          ? null
                          : 'Use at least 8 characters',
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
                      title: const Text('Enable two-factor authentication'),
                      subtitle: const Text('We recommend keeping 2FA on for all Gigvora accounts.'),
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
                          : const Text('Create profile'),
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
                    'What you unlock',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 16),
                  ..._highlights.map(
                    (item) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.check_circle, color: Color(0xFF2563EB), size: 18),
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
                      'Create once, shine everywhere. Your Gigvora identity syncs with the mobile app and partner hubs so you can pitch, hire, and collaborate seamlessly.',
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
