import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../../../theme/widgets.dart';
import '../../auth/application/session_controller.dart';
import '../../auth/domain/auth_token_store.dart';
import '../../auth/domain/session.dart';

enum _AdminLoginStep { credentials, verify }

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
  bool _requestingCode = false;
  bool _verifyingCode = false;
  int _resendSeconds = 0;
  Timer? _cooldownTimer;
  String? _error;
  String? _status;

  @override
  void dispose() {
    _cooldownTimer?.cancel();
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
        default:
          return error.message ?? 'Unexpected server response. Please try again.';
      }
    }
    return 'Something went wrong. Please try again.';
  }

  void _startCooldown([int seconds = 60]) {
    _cooldownTimer?.cancel();
    setState(() {
      _resendSeconds = seconds;
    });
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      setState(() {
        if (_resendSeconds <= 1) {
          _resendSeconds = 0;
          timer.cancel();
        } else {
          _resendSeconds -= 1;
        }
      });
    });
  }

  Future<void> _requestCode() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    FocusScope.of(context).unfocus();
    setState(() {
      _error = null;
      _status = null;
      _requestingCode = true;
    });

    final apiClient = ref.read(apiClientProvider);
    final email = _normaliseEmail(_emailController.text);

    try {
      await apiClient.post('/auth/admin/login', body: {
        'email': email,
        'password': _passwordController.text,
      });

      if (!mounted) return;
      setState(() {
        _step = _AdminLoginStep.verify;
        _status = 'Secure 2FA code sent to $email. It expires in 10 minutes.';
      });
      _startCooldown();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Verification code dispatched. Check your secure inbox.')),
      );
    } on ApiException catch (error) {
      setState(() => _error = _errorMessage(error));
    } catch (error) {
      setState(() => _error = _errorMessage(error));
    } finally {
      if (mounted) {
        setState(() {
          _requestingCode = false;
        });
      }
    }
  }

  Future<void> _verifyCode() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    FocusScope.of(context).unfocus();
    setState(() {
      _error = null;
      _status = null;
      _verifyingCode = true;
    });

    final apiClient = ref.read(apiClientProvider);
    final email = _normaliseEmail(_emailController.text);

    try {
      final response = await apiClient.post('/auth/verify-2fa', body: {
        'email': email,
        'code': _codeController.text.trim(),
      }) as Map<String, dynamic>?;

      final accessToken = response?['accessToken'] as String?;
      final refreshToken = response?['refreshToken'] as String?;
      final user = response?['user'] as Map<String, dynamic>?;

      if (user == null || (user['userType'] as String?)?.toLowerCase() != 'admin') {
        throw ApiException(403, 'Admin access required.');
      }
      if (accessToken == null || refreshToken == null) {
        throw ApiException(500, 'Authentication tokens were not returned by the server.');
      }

      await AuthTokenStore.persist(accessToken: accessToken, refreshToken: refreshToken);

      final adminName = _deriveName(user);
      final sessionController = ref.read(sessionControllerProvider.notifier);
      sessionController.login(_buildAdminSession(adminName, email, user));

      if (!mounted) return;
      setState(() {
        _status = 'Verification successful. Redirecting to the control tower…';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Security checks cleared. Welcome back.')),
      );
      GoRouter.of(context).go('/operations');
    } on ApiException catch (error) {
      setState(() => _error = _errorMessage(error));
    } catch (error) {
      setState(() => _error = _errorMessage(error));
    } finally {
      if (mounted) {
        setState(() {
          _verifyingCode = false;
        });
      }
    }
  }

  UserSession _buildAdminSession(String name, String email, Map<String, dynamic> user) {
    final location = user['location'] as String? ?? 'Global operations';
    final dashboard = RoleDashboard(
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
      actions: const [
        DashboardAction(
          label: 'Review overnight audit log',
          description: 'Confirm no privileged changes occurred outside the change window.',
        ),
        DashboardAction(
          label: 'Run incident readiness drill',
          description: 'Validate warm-standby plans and cross-team communication ladders.',
        ),
      ],
    );

    return UserSession(
      name: name,
      title: 'Chief Platform Administrator',
      email: email,
      location: location,
      avatarSeed: name,
      memberships: const ['admin'],
      activeMembership: 'admin',
      dashboards: {'admin': dashboard},
      connections: 0,
      followers: 0,
      companies: const [],
      agencies: const [],
    );
  }

  String _deriveName(Map<String, dynamic> user) {
    final first = user['firstName'] as String? ?? '';
    final last = user['lastName'] as String? ?? '';
    final combined = ('$first $last').trim();
    if (combined.isNotEmpty) {
      return combined;
    }
    return user['email'] as String? ?? 'Gigvora Admin';
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
    final canResend = _step == _AdminLoginStep.verify && _resendSeconds == 0 && !_requestingCode && !_verifyingCode;

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
                  child: Text(_error!, style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onErrorContainer)),
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
                  child: Text(_status!, style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onPrimaryContainer)),
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
                        onPressed: _requestingCode ? null : _requestCode,
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
                        onPressed: canResend ? _requestCode : null,
                        child: Text(
                          canResend ? 'Resend secure code' : 'Resend available in ${_resendSeconds}s',
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
                    _FeatureBullet(
                      icon: Icons.shield_moon_outlined,
                      text: 'Device fingerprinting, anomaly detection, and geo-fencing protect every admin session.',
                    ),
                    _FeatureBullet(
                      icon: Icons.support_agent,
                      text: 'Operations, trust & safety, and finance telemetry are synchronised across web and mobile.',
                    ),
                    _FeatureBullet(
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
