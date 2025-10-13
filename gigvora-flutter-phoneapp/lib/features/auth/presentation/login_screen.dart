import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/application/session_controller.dart';
import '../../../theme/widgets.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _codeController = TextEditingController();
  bool _twoFactorRequested = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  void _handleSubmit() {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    if (_twoFactorRequested) {
      ref.read(sessionControllerProvider.notifier).loginDemo();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Welcome back! Personalising your dashboards...')),
      );
      GoRouter.of(context).go('/home');
      return;
    }

    setState(() {
      _twoFactorRequested = true;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('2FA code sent to email. Enter it below to continue.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GigvoraScaffold(
      title: 'Sign in',
      subtitle: 'Access the Gigvora network',
      body: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextFormField(
              controller: _emailController,
              decoration: const InputDecoration(labelText: 'Email address'),
              keyboardType: TextInputType.emailAddress,
              validator: (value) => value != null && value.contains('@') ? null : 'Enter a valid email',
            ),
            const SizedBox(height: 16),
            if (!_twoFactorRequested)
              TextFormField(
                controller: _passwordController,
                decoration: const InputDecoration(labelText: 'Password'),
                obscureText: true,
                validator: (value) => value != null && value.length >= 8 ? null : 'Minimum 8 characters',
              ),
            if (_twoFactorRequested) ...[
              TextFormField(
                controller: _passwordController,
                readOnly: true,
                decoration: const InputDecoration(labelText: 'Password'),
                obscureText: true,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _codeController,
                decoration: const InputDecoration(labelText: 'Enter 6-digit 2FA code'),
                keyboardType: TextInputType.number,
                validator: (value) => value != null && value.trim().length == 6
                    ? null
                    : 'Enter the 6-digit code from your inbox',
              ),
            ],
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _handleSubmit,
              child: Text(_twoFactorRequested ? 'Verify & sign in' : 'Request 2FA code'),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Google Authenticator support is coming soon.')),
                );
              },
              child: const Text('Use Google Authenticator'),
            ),
          ],
        ),
      ),
    );
  }
}
