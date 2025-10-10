import 'package:flutter/material.dart';
import '../../../theme/widgets.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _twoFactorRequested = false;
  final _codeController = TextEditingController();

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
              validator: (value) => value != null && value.contains('@') ? null : 'Enter a valid email',
            ),
            const SizedBox(height: 16),
            if (!_twoFactorRequested)
              TextFormField(
                controller: _passwordController,
                decoration: const InputDecoration(labelText: 'Password'),
                obscureText: true,
                validator: (value) => value != null && value.length >= 6 ? null : 'Minimum 6 characters',
              ),
            if (_twoFactorRequested) ...[
              TextFormField(
                controller: _codeController,
                decoration: const InputDecoration(labelText: '2FA code'),
              ),
              const SizedBox(height: 16),
            ],
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                if (_formKey.currentState?.validate() ?? false) {
                  setState(() {
                    _twoFactorRequested = true;
                  });
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('2FA code sent to email.')),
                  );
                }
              },
              child: Text(_twoFactorRequested ? 'Verify 2FA' : 'Request 2FA code'),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Google Authenticator coming soon.')),
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
