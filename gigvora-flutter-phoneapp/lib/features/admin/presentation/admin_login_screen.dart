import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../../../theme/widgets.dart';
import '../../auth/application/session_controller.dart';
import '../../auth/data/auth_repository.dart';
import '../../auth/domain/auth_token_store.dart';
import '../../auth/domain/session.dart';

enum _AdminLoginStep { credentials, verification }

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

  _AdminLoginStep _step = _AdminLoginStep.credentials;
  TwoFactorChallenge? _challenge;
  bool _requestingCode = false;
  bool _verifyingCode = false;
  bool _resendingCode = false;
  int _resendCountdown = 0;
  Timer? _resendTimer;
  String? _error;
  String? _status;

  @override
  void dispose() {
    _resendTimer?.cancel();
    _emailController.dispose();
    _passwordController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  String _normaliseEmail(String value) => value.trim().toLowerCase();

  String _errorMessage(Object error) {
    if (error is ApiException) {
      switch (error.statusCode) {
        case 401:
          return 'We could not verify those credentials. Double-check the email and password.';
        case 403:
          return 'Your account does not have admin privileges. Contact the platform team for access.';
        case 429:
          return 'Too many attempts detected. Please wait a moment before trying again.';
        default:
          return error.message ?? 'Unexpected server response. Please try again.';
      }
    }
    return 'Something went wrong. Please try again.';
  }

  void _startResendTimer([int seconds = 60]) {
    _resendTimer?.cancel();
    setState(() => _resendCountdown = seconds);
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        if (_resendCountdown <= 1) {
          _resendCountdown = 0;
          timer.cancel();
        } else {
          _resendCountdown -= 1;
        }
      });
    });
  }

  Future<void> _submitCredentials() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    FocusScope.of(context).unfocus();
    setState(() {
      _error = null;
      _status = null;
      _requestingCode = true;
    });

    final repository = ref.read(authRepositoryProvider);
    final email = _normaliseEmail(_emailController.text);

    try {
      final result = await repository.login(email, _passwordController.text, admin: true);
      if (!mounted) return;

      if (result.requiresTwoFactor) {
        _codeController.clear();
        _challenge = result.challenge;
        _step = _AdminLoginStep.verification;
        _status = 'Secure 2FA code sent to $email. It expires in 10 minutes.';
        _startResendTimer();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Verification code dispatched. Check your secure inbox.')),
        );
      } else if (result.session != null) {
        await _completeLogin(result.session!);
      } else {
        setState(() => _error = 'Login response was incomplete. Please try again.');
      }
    } on ApiException catch (error) {
      setState(() => _error = _errorMessage(error));
    } catch (error) {
      setState(() => _error = _errorMessage(error));
    } finally {
      if (mounted) {
        setState(() => _requestingCode = false);
      }
    }
  }

  Future<void> _verifyCode() async {
    if (_challenge == null) {
      setState(() => _error = 'Request a secure code before verifying.');
      return;
    }
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    FocusScope.of(context).unfocus();
    setState(() {
      _error = null;
      _status = null;
      _verifyingCode = true;
    });

    final repository = ref.read(authRepositoryProvider);
    final email = _normaliseEmail(_emailController.text);

    try {
      final session = await repository.verifyTwoFactor(
        email: email,
        code: _codeController.text.trim(),
        tokenId: _challenge!.tokenId,
      );
      if (!mounted) return;
      await _completeLogin(session);
    } on ApiException catch (error) {
      setState(() => _error = _errorMessage(error));
    } catch (error) {
      setState(() => _error = _errorMessage(error));
    } finally {
      if (mounted) {
        setState(() => _verifyingCode = false);
      }
    }
  }

  Future<void> _resendCode() async {
    if (_challenge == null || _resendCountdown > 0) {
      return;
    }
    setState(() {
      _error = null;
      _status = null;
      _resendingCode = true;
    });
    final repository = ref.read(authRepositoryProvider);
    try {
      final challenge = await repository.resendTwoFactor(_challenge!.tokenId);
      if (!mounted) return;
      _challenge = challenge;
      _status = 'A new secure code was sent. It will expire shortly.';
      _codeController.clear();
      _startResendTimer();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('New verification code dispatched.')),
      );
    } on ApiException catch (error) {
      setState(() => _error = _errorMessage(error));
    } catch (error) {
      setState(() => _error = _errorMessage(error));
    } finally {
      if (mounted) {
        setState(() => _resendingCode = false);
      }
    }
  }

  Future<void> _completeLogin(AuthenticatedSession session) async {
    final userSession = session.userSession;
    final membershipSet = userSession.memberships
        .map((role) => role.toLowerCase())
        .toSet(growable: true);

    if (!membershipSet.contains('admin')) {
      throw ApiException(403, 'Admin role required.');
    }

    membershipSet.add('admin');

    await AuthTokenStore.persist(
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    );

    final dashboards = Map<String, RoleDashboard>.from(userSession.dashboards);
    dashboards.putIfAbsent('admin', () => _buildAdminDashboard(userSession.name));

    final adminSession = userSession.copyWith(
      memberships: membershipSet.toList(growable: false),
      activeMembership: 'admin',
      dashboards: dashboards,
      userType: 'admin',
    );

    ref.read(sessionControllerProvider.notifier).login(adminSession);

    if (!mounted) return;
    setState(() {
      _status = 'Verification successful. Redirecting to the control tower…';
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Security checks cleared. Welcome back.')),
    );

    GoRouter.of(context).go('/operations');
  }

  RoleDashboard _buildAdminDashboard(String adminName) {
    final name = adminName.isEmpty ? 'Admin' : adminName;
    return RoleDashboard(
      role: 'admin',
      heroTitle: 'Admin control tower',
      heroSubtitle: 'Monitor marketplace health, finances, and trust in real time.',
      metrics: const [
        DashboardMetric(label: 'Live incidents', value: '0', trend: 'All clear'),
        DashboardMetric(label: 'Escrow health', value: 'Green', trend: 'SLA 99%'),
        DashboardMetric(label: 'Support SLA', value: '96%', trend: 'On target'),
        DashboardMetric(label: 'Risk posture', value: 'Low', trend: 'Guards active'),
      ],
      sections: const [
        DashboardSection(
          title: 'Security & compliance',
          subtitle: 'Audit trails, anomaly detection, and incident playbooks on standby.',
          highlights: [
            'Privileged actions protected by enforced 2FA and device fingerprints.',
            'Realtime anomaly detection inspects every admin session.',
            'Escrow reconciliation completes under 90 seconds with automated alerts.',
          ],
          icon: Icons.shield_outlined,
        ),
        DashboardSection(
          title: 'Operational cadence',
          subtitle: 'Cross-functional telemetry keeps launch readiness on track.',
          highlights: [
            'Trust & safety, support, and finance signals converge into unified runbooks.',
            'PagerDuty and Slack integrations route high severity incidents instantly.',
            'Enterprise encryption protects collaboration across web and mobile.',
          ],
          icon: Icons.dashboard_customize_outlined,
        ),
      ],
      actions: [
        DashboardAction(
          label: 'Welcome back, $name',
          description: 'Review overnight audit logs and clear the priority queue.',
        ),
        const DashboardAction(
          label: 'Run incident readiness drill',
          description: 'Validate warm-standby plans and cross-team communication ladders.',
        ),
      ],
    );
  }

  String? _validateEmail(String? value) {
    if (value == null || value.trim().isEmpty || !value.contains('@')) {
      return 'Enter your Gigvora admin email';
    }
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.trim().length < 8) {
      return 'Minimum 8 characters required';
    }
    return null;
  }

  String? _validateCode(String? value) {
    if (value == null || value.trim().length != 6) {
      return 'Enter the 6-digit code from your inbox';
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final canResend =
        _step == _AdminLoginStep.verification && _resendCountdown == 0 && !_resendingCode && !_verifyingCode;

    return GigvoraScaffold(
      title: 'Admin Console',
      subtitle: 'Restricted access',
      body: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_error != null)
                Container(
                  width: double.infinity,
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.errorContainer,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _error!,
                    style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onErrorContainer),
                  ),
                ),
              if (_status != null)
                Container(
                  width: double.infinity,
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _status!,
                    style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onPrimaryContainer),
                  ),
                ),
              GigvoraCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Secure authentication', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 16),
                    if (_step == _AdminLoginStep.credentials) ...[
                      TextFormField(
                        controller: _emailController,
                        decoration: const InputDecoration(labelText: 'Admin email'),
                        keyboardType: TextInputType.emailAddress,
                        validator: _validateEmail,
                        enabled: !_requestingCode,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _passwordController,
                        decoration: const InputDecoration(labelText: 'Password'),
                        obscureText: true,
                        validator: _validatePassword,
                        enabled: !_requestingCode,
                      ),
                      const SizedBox(height: 24),
                      FilledButton(
                        onPressed: _requestingCode ? null : _submitCredentials,
                        child: Text(_requestingCode ? 'Requesting secure code…' : 'Request secure 2FA code'),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'We’ll email a one-time code and support authenticator apps soon.',
                        style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                      ),
                    ] else ...[
                      TextFormField(
                        controller: _emailController,
                        decoration: const InputDecoration(labelText: 'Admin email'),
                        readOnly: true,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _codeController,
                        decoration: const InputDecoration(labelText: 'Enter 6-digit 2FA code'),
                        keyboardType: TextInputType.number,
                        validator: _validateCode,
                        enabled: !_verifyingCode,
                      ),
                      const SizedBox(height: 24),
                      FilledButton(
                        onPressed: _verifyingCode ? null : _verifyCode,
                        child: Text(_verifyingCode ? 'Verifying code…' : 'Verify & enter console'),
                      ),
                      const SizedBox(height: 12),
                      TextButton(
                        onPressed: canResend ? _resendCode : null,
                        child: Text(
                          canResend
                              ? 'Resend secure code'
                              : _resendCountdown > 0
                                  ? 'Resend available in ${_resendCountdown}s'
                                  : 'Resend secure code',
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 24),
              GigvoraCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Enterprise-grade safeguards', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 12),
                    const _FeatureBullet(
                      icon: Icons.shield_moon_outlined,
                      text: 'Device fingerprinting, anomaly detection, and geo-fencing protect every admin session.',
                    ),
                    const _FeatureBullet(
                      icon: Icons.support_agent,
                      text: 'Operations, trust & safety, and finance telemetry are synchronised across web and mobile.',
                    ),
                    const _FeatureBullet(
                      icon: Icons.lock_clock,
                      text: 'Time-bound 2FA codes with tamper alerts keep the control tower launch-ready.',
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Need help? Contact ops@gigvora.com for immediate assistance.',
                      style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FeatureBullet extends StatelessWidget {
  const _FeatureBullet({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: theme.colorScheme.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
          ),
        ],
      ),
    );
  }
}
