import 'package:flutter/material.dart';
import '../../../theme/widgets.dart';

class CompanyRegisterScreen extends StatelessWidget {
  const CompanyRegisterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return GigvoraScaffold(
      title: 'Company & Agency onboarding',
      subtitle: 'Launch your talent hub',
      body: ListView(
        children: [
          TextFormField(decoration: const InputDecoration(labelText: 'Organization name')),
          const SizedBox(height: 16),
          TextFormField(decoration: const InputDecoration(labelText: 'Website URL')),
          const SizedBox(height: 16),
          TextFormField(decoration: const InputDecoration(labelText: 'Focus area / mission'), maxLines: 3),
          const SizedBox(height: 16),
          TextFormField(decoration: const InputDecoration(labelText: 'Primary contact name')),
          const SizedBox(height: 16),
          TextFormField(decoration: const InputDecoration(labelText: 'Contact email')),
          const SizedBox(height: 16),
          TextFormField(decoration: const InputDecoration(labelText: 'Team size')),
          const SizedBox(height: 16),
          TextFormField(decoration: const InputDecoration(labelText: 'HQ location')),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Hub submitted. We will reach out soon.')),
            ),
            child: const Text('Submit application'),
          ),
        ],
      ),
    );
  }
}
