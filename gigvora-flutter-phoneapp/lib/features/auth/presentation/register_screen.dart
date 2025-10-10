import 'package:flutter/material.dart';
import '../../../theme/widgets.dart';

class RegisterScreen extends StatelessWidget {
  const RegisterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return GigvoraScaffold(
      title: 'Join Gigvora',
      subtitle: 'Freelancer & professional signup',
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextFormField(decoration: const InputDecoration(labelText: 'First name')),
            const SizedBox(height: 16),
            TextFormField(decoration: const InputDecoration(labelText: 'Last name')),
            const SizedBox(height: 16),
            TextFormField(decoration: const InputDecoration(labelText: 'Email')),
            const SizedBox(height: 16),
            TextFormField(decoration: const InputDecoration(labelText: 'Location')),
            const SizedBox(height: 16),
            TextFormField(decoration: const InputDecoration(labelText: 'Age'), keyboardType: TextInputType.number),
            const SizedBox(height: 16),
            TextFormField(decoration: const InputDecoration(labelText: 'Password'), obscureText: true),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Profile created. Complete 2FA to continue.')),
              ),
              child: const Text('Create profile'),
            ),
          ],
        ),
      ),
    );
  }
}
