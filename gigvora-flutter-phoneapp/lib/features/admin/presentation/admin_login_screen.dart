import 'package:flutter/material.dart';
import '../../../theme/widgets.dart';

class AdminLoginScreen extends StatelessWidget {
  const AdminLoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return GigvoraScaffold(
      title: 'Admin Console',
      subtitle: 'Restricted access',
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextFormField(decoration: const InputDecoration(labelText: 'Admin email')),
          const SizedBox(height: 16),
          TextFormField(decoration: const InputDecoration(labelText: 'Password'), obscureText: true),
          const SizedBox(height: 24),
          ElevatedButton(onPressed: () {}, child: const Text('Continue to 2FA')),
          const SizedBox(height: 12),
          Text('Need help? Contact ops@gigvora.com', style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}
