import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../theme/widgets.dart';
import '../../auth/application/session_controller.dart';
import '../../auth/data/auth_repository.dart';

class AdminLoginScreen extends ConsumerStatefulWidget {
  const AdminLoginScreen({super.key});

  @override
  ConsumerState<AdminLoginScreen> createState() => _AdminLoginScreenState();
}

class _AdminLoginScreenState extends ConsumerState<AdminLoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _codeController = TextEditingController();
  TwoFactorChallenge? _challenge;
  bool _loading = false;
  String? _error;
  String? _info;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
      _info = null;
    });
    try {
      final repository = ref.read(authRepositoryProvider);
      final result = await repository.login(
        _emailController.text.trim(),
        _passwordController.text,
        admin: true,
      );
      if (result.requiresTwoFactor) {
        setState(() {
          _challenge = result.challenge;
          _info = 'Verification code sent to ${result.challenge?.maskedDestination}.';
        });
        return;
      }
      if (result.session != null) {
        ref.read(sessionControllerProvider.notifier).login(result.session!.userSession);
        if (mounted) {
          GoRouter.of(context).go('/dashboard/admin');
        }
      }
    } catch (error) {
      setState(() {
        _error = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _verify() async {
    if (_challenge == null) {
      return;
    }
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
      _info = null;
    });
    try {
      final repository = ref.read(authRepositoryProvider);
      final session = await repository.verifyTwoFactor(
        email: _emailController.text.trim(),
        code: _codeController.text.trim(),
        tokenId: _challenge!.tokenId,
      );
      ref.read(sessionControllerProvider.notifier).login(session.userSession);
      if (mounted) {
        GoRouter.of(context).go('/dashboard/admin');
      }
    } catch (error) {
      setState(() {
        _error = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _resend() async {
    if (_challenge == null) return;
    setState(() {
      _loading = true;
      _error = null;
      _info = null;
    });
    try {
      final repository = ref.read(authRepositoryProvider);
      final challenge = await repository.resendTwoFactor(_challenge!.tokenId);
      setState(() {
        _challenge = challenge;
        _codeController.clear();
        _info = 'New verification code sent to ${challenge.maskedDestination}.';
      });
    } catch (error) {
      setState(() {
        _error = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final waitingForCode = _challenge != null;
    return GigvoraScaffold(
      title: 'Admin Console',
      subtitle: 'Restricted access',
      body: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextFormField(
              controller: _emailController,
              decoration: const InputDecoration(labelText: 'Admin email'),
              keyboardType: TextInputType.emailAddress,
              validator: (value) => value != null && value.contains('@') ? null : 'Enter a valid email',
            ),
            const SizedBox(height: 16),
            if (!waitingForCode)
              TextFormField(
                controller: _passwordController,
                decoration: const InputDecoration(labelText: 'Password'),
                obscureText: true,
                validator: (value) => value != null && value.length >= 12 ? null : 'Minimum 12 characters',
              ),
            if (waitingForCode) ...[
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
              onPressed: _loading
                  ? null
                  : waitingForCode
                      ? _verify
                      : _submit,
              child: Text(waitingForCode ? 'Verify & sign in' : 'Continue to 2FA'),
            ),
            const SizedBox(height: 12),
            Text('Need help? Contact ops@gigvora.com', style: Theme.of(context).textTheme.bodySmall),
            if (waitingForCode)
              TextButton(
                onPressed: _loading ? null : _resend,
                child: const Text('Resend code'),
              ),
            if (_loading) ...[
              const SizedBox(height: 16),
              const Center(child: CircularProgressIndicator()),
            ],
          ],
        ),
      ),
    );
  }
}
