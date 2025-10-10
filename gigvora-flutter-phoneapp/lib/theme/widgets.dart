import 'package:flutter/material.dart';

class GigvoraScaffold extends StatelessWidget {
  const GigvoraScaffold({
    required this.title,
    this.subtitle,
    required this.body,
    this.actions,
    super.key,
  });

  final String title;
  final String? subtitle;
  final Widget body;
  final List<Widget>? actions;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleLarge),
            if (subtitle != null)
              Text(
                subtitle!,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white70),
              ),
          ],
        ),
        actions: actions,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: body,
        ),
      ),
      backgroundColor: Theme.of(context).colorScheme.background,
    );
  }
}

class GigvoraCard extends StatelessWidget {
  const GigvoraCard({required this.child, super.key});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0x11000000),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0x22FFFFFF)),
      ),
      padding: const EdgeInsets.all(20),
      child: child,
    );
  }
}
