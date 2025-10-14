import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../auth/application/session_controller.dart';
import '../data/auth_repository.dart';
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

  Future<void> _submitCredentials() async {
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
          GoRouter.of(context).go('/home');
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

  Future<void> _verifyCode() async {
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
        GoRouter.of(context).go('/home');
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

  Future<void> _resendCode() async {
    if (_challenge == null) {
      return;
    }
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
        _info = 'New code sent to ${challenge.maskedDestination}.';
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

  Future<void> _signInWithGoogle() async {
    setState(() {
      _loading = true;
      _error = null;
      _info = null;
    });
    try {
      final googleSignIn = GoogleSignIn(scopes: const ['email']);
      final account = await googleSignIn.signIn();
      final auth = await account?.authentication;
      final idToken = auth?.idToken;
      if (idToken == null) {
        throw Exception('Google sign-in cancelled.');
      }
      final repository = ref.read(authRepositoryProvider);
      final session = await repository.loginWithGoogle(idToken);
      ref.read(sessionControllerProvider.notifier).login(session.userSession);
      if (mounted) {
        GoRouter.of(context).go('/home');
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

  @override
  Widget build(BuildContext context) {
    final waitingForCode = _challenge != null;
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
            if (!waitingForCode)
              TextFormField(
                controller: _passwordController,
                decoration: const InputDecoration(labelText: 'Password'),
                obscureText: true,
                validator: (value) => value != null && value.length >= 8 ? null : 'Minimum 8 characters',
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
                      ? _verifyCode
                      : _submitCredentials,
              child: Text(waitingForCode ? 'Verify & sign in' : 'Request 2FA code'),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: _loading ? null : _signInWithGoogle,
              child: const Text('Continue with Google'),
            ),
            if (waitingForCode) ...[
              const SizedBox(height: 12),
              TextButton(
                onPressed: _loading ? null : _resendCode,
                child: const Text('Resend code'),
              ),
            ],
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
