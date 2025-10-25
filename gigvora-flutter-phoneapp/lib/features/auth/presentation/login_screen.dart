import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:gigvora_mobile/router/app_routes.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../auth/application/session_controller.dart';
import '../data/auth_repository.dart';
import '../domain/auth_token_store.dart';
import '../../../theme/widgets.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _InlineStatus extends StatelessWidget {
  const _InlineStatus({required this.message, required this.success});

  final String message;
  final bool success;

  @override
  Widget build(BuildContext context) {
    final color = success ? const Color(0xFF047857) : const Color(0xFFB91C1C);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: success ? const Color(0xFFD1FAE5) : const Color(0xFFFEE2E2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(success ? Icons.check_circle_outline : Icons.error_outline, color: color, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: color),
            ),
          ),
        ],
      ),
    );
  }
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
        await AuthTokenStore.persist(
          accessToken: result.session!.accessToken,
          refreshToken: result.session!.refreshToken,
        );
        ref.read(sessionControllerProvider.notifier).login(result.session!.userSession);
        if (mounted) {
          GoRouter.of(context).go(AppRoute.home.path);
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
      await AuthTokenStore.persist(
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      );
      ref.read(sessionControllerProvider.notifier).login(session.userSession);
      if (mounted) {
        GoRouter.of(context).go(AppRoute.home.path);
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

  Future<void> _openPasswordResetSheet() async {
    final emailController = TextEditingController(text: _emailController.text.trim());
    final tokenController = TextEditingController();
    final passwordController = TextEditingController();
    final confirmController = TextEditingController();
    bool requestSent = false;
    bool submitting = false;
    String? feedback;
    String? errorMessage;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 24,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: StatefulBuilder(
            builder: (context, setSheetState) {
              Future<void> sendReset() async {
                setSheetState(() {
                  submitting = true;
                  feedback = null;
                  errorMessage = null;
                });
                try {
                  final email = emailController.text.trim();
                  if (email.isEmpty || !email.contains('@')) {
                    throw Exception('Enter the email address linked to your Gigvora account.');
                  }
                  await ref.read(authRepositoryProvider).requestPasswordReset(email);
                  setSheetState(() {
                    requestSent = true;
                    feedback = 'Check $email for a six-digit reset code.';
                  });
                } catch (error) {
                  setSheetState(() {
                    errorMessage = error.toString();
                  });
                } finally {
                  setSheetState(() {
                    submitting = false;
                  });
                }
              }

              Future<void> updatePassword() async {
                setSheetState(() {
                  submitting = true;
                  feedback = null;
                  errorMessage = null;
                });
                try {
                  if (passwordController.text != confirmController.text) {
                    throw Exception('Passwords do not match.');
                  }
                  if (passwordController.text.length < 12) {
                    throw Exception('Use at least 12 characters to keep your workspace secure.');
                  }
                  await ref.read(authRepositoryProvider).confirmPasswordReset(
                        token: tokenController.text.trim(),
                        password: passwordController.text,
                      );
                  if (!mounted) return;
                  setState(() {
                    _info = 'Password updated. Sign in with your new credentials.';
                    _error = null;
                  });
                  Navigator.of(context).pop();
                } catch (error) {
                  setSheetState(() {
                    errorMessage = error.toString();
                  });
                } finally {
                  setSheetState(() {
                    submitting = false;
                  });
                }
              }

              return Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Reset password',
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    requestSent
                        ? 'Enter the reset code from your email and choose a new password.'
                        : 'We will send a reset code to your account email address.',
                    style: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: emailController,
                    enabled: !requestSent,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'Email address',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  if (requestSent) ...[
                    const SizedBox(height: 16),
                    TextField(
                      controller: tokenController,
                      decoration: const InputDecoration(
                        labelText: 'Reset code',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: passwordController,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: 'New password',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: confirmController,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: 'Confirm password',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ],
                  if (feedback != null) ...[
                    const SizedBox(height: 12),
                    _InlineStatus(message: feedback!, success: true),
                  ],
                  if (errorMessage != null) ...[
                    const SizedBox(height: 12),
                    _InlineStatus(message: errorMessage!, success: false),
                  ],
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: submitting
                          ? null
                          : requestSent
                              ? updatePassword
                              : sendReset,
                      child: submitting
                          ? const SizedBox(
                              height: 16,
                              width: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(requestSent ? 'Update password' : 'Send reset code'),
                    ),
                  ),
                ],
              );
            },
          ),
        );
      },
    );

    emailController.dispose();
    tokenController.dispose();
    passwordController.dispose();
    confirmController.dispose();
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
      await AuthTokenStore.persist(
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      );
      ref.read(sessionControllerProvider.notifier).login(session.userSession);
      if (mounted) {
        GoRouter.of(context).go(AppRoute.home.path);
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
      useAppDrawer: true,
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
            if (!waitingForCode) ...[
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton(
                  onPressed: _loading ? null : _openPasswordResetSheet,
                  child: const Text('Forgot password?'),
                ),
              ),
            ],
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
