import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../theme/widgets.dart';
import '../../auth/application/session_controller.dart';
import '../application/gig_purchase_controller.dart';
import '../data/models/gig_package.dart';

class GigPurchaseScreen extends ConsumerWidget {
  const GigPurchaseScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionState = ref.watch(sessionControllerProvider);
    final controller = ref.read(gigPurchaseControllerProvider.notifier);
    final packagesState = ref.watch(gigPurchaseControllerProvider);
    final packages = packagesState.data ?? const <GigPackage>[];
    final router = GoRouter.of(context);

    final destinations = [
      const GigvoraNavigationDestination(
        label: 'Home',
        icon: Icon(Icons.home_outlined),
        selectedIcon: Icon(Icons.home),
        route: '/home',
      ),
      const GigvoraNavigationDestination(
        label: 'Calendar',
        icon: Icon(Icons.event_available_outlined),
        selectedIcon: Icon(Icons.event_available),
        route: '/calendar',
      ),
      const GigvoraNavigationDestination(
        label: 'Purchase',
        icon: Icon(Icons.shopping_bag_outlined),
        selectedIcon: Icon(Icons.shopping_bag),
        route: '/gigs/purchase',
      ),
      const GigvoraNavigationDestination(
        label: 'Profile',
        icon: Icon(Icons.person_outline),
        selectedIcon: Icon(Icons.person),
        route: '/profile',
      ),
    ];

    return GigvoraScaffold(
      title: 'Gig purchase',
      subtitle: 'Secure your next delivery sprint',
      actions: [
        IconButton(
          tooltip: 'Refresh packages',
          onPressed: controller.refresh,
          icon: const Icon(Icons.refresh),
        ),
      ],
      navigationDestinations: destinations,
      selectedDestination: 2,
      onDestinationSelected: (index) {
        final destination = destinations[index];
        if (destination.route != null && router.location != destination.route) {
          context.go(destination.route!);
        }
      },
      drawer: _GigPurchaseMenu(controller: controller, packages: packages),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (packagesState.fromCache)
            const _StatusBanner(
              icon: Icons.offline_bolt,
              message: 'Offline first: loading cached gig packages while we contact the marketplace edge.',
              background: Color(0xFFFEF3C7),
              foreground: Color(0xFFB45309),
            ),
          if (packagesState.hasError)
            _StatusBanner(
              icon: Icons.error_outline,
              message: 'Purchase catalogue is unavailable. Pull to refresh to try again.',
              background: const Color(0xFFFEE2E2),
              foreground: Theme.of(context).colorScheme.error,
            ),
          const SizedBox(height: 16),
          Expanded(
            child: RefreshIndicator(
              onRefresh: controller.refresh,
              child: packages.isEmpty
                  ? ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: const [
                        _EmptyPackages(),
                      ],
                    )
                  : ListView.separated(
                      physics: const AlwaysScrollableScrollPhysics(),
                      itemCount: packages.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 20),
                      itemBuilder: (context, index) {
                        final package = packages[index];
                        return _GigPackageCard(
                          package: package,
                          onEdit: () => _openEditor(context, controller, package: package),
                          onPurchase: () => _openPurchase(context, controller, package),
                          onDelete: sessionState.session?.memberships.contains('admin') ?? false
                              ? () => controller.deletePackage(package)
                              : null,
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
      floatingActionButton: sessionState.session?.memberships.contains('admin') ?? false
          ? FloatingActionButton.extended(
              onPressed: () => _openEditor(context, controller),
              icon: const Icon(Icons.add_business),
              label: const Text('New package'),
            )
          : null,
    );
  }

  Future<void> _openEditor(BuildContext context, GigPurchaseController controller,
      {GigPackage? package}) async {
    final draft = await showModalBottomSheet<GigPackage>(
      context: context,
      isScrollControlled: true,
      builder: (context) => _GigPackageSheet(package: package),
    );
    if (draft == null) {
      return;
    }
    await controller.upsertPackage(draft);
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(package == null ? 'Package created.' : 'Package updated.')),
    );
  }

  Future<void> _openPurchase(
    BuildContext context,
    GigPurchaseController controller,
    GigPackage package,
  ) async {
    final result = await showModalBottomSheet<_PurchaseRequest>(
      context: context,
      isScrollControlled: true,
      builder: (context) => _PurchaseSheet(package: package),
    );
    if (result == null) return;
    try {
      final receipt = await controller.purchase(
        package: package,
        buyerName: result.name,
        email: result.email,
        paymentMethod: result.paymentMethod,
        notes: result.notes,
        coupon: result.coupon,
      );
      if (!context.mounted) return;
      showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Purchase confirmed'),
          content: Text('Order ${receipt['orderId']} is now ${receipt['status']}. A receipt has been emailed to ${result.email}.'),
          actions: [
            FilledButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Close'),
            ),
          ],
        ),
      );
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unable to submit order. $error')),
      );
    }
  }
}

class _GigPackageCard extends StatelessWidget {
  const _GigPackageCard({
    required this.package,
    required this.onPurchase,
    required this.onEdit,
    this.onDelete,
  });

  final GigPackage package;
  final VoidCallback onPurchase;
  final VoidCallback onEdit;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Dismissible(
      key: ValueKey(package.id),
      enabled: onDelete != null,
      direction: DismissDirection.endToStart,
      background: Container(
        decoration: BoxDecoration(
          color: colorScheme.errorContainer,
          borderRadius: BorderRadius.circular(24),
        ),
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Icon(Icons.delete_outline, color: colorScheme.onErrorContainer),
      ),
      confirmDismiss: (_) async {
        if (onDelete == null) return false;
        final confirm = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Remove package'),
            content: Text('Archive ${package.name}? Active proposals will remain unaffected.'),
            actions: [
              TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancel')),
              FilledButton.tonal(
                onPressed: () => Navigator.of(context).pop(true),
                child: const Text('Archive'),
              ),
            ],
          ),
        );
        if (confirm == true) {
          onDelete?.call();
        }
        return confirm ?? false;
      },
      child: GigvoraCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    package.name,
                    style: Theme.of(context)
                        .textTheme
                        .titleLarge
                        ?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ),
                if (package.popular)
                  Chip(
                    avatar: Icon(Icons.trending_up, color: colorScheme.primary),
                    label: const Text('Popular'),
                  ),
                IconButton(
                  tooltip: 'Edit package',
                  onPressed: onEdit,
                  icon: const Icon(Icons.edit_outlined),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              package.description,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: package.deliverables
                  .map(
                    (deliverable) => Chip(
                      avatar: const Icon(Icons.check_circle_outline),
                      label: Text(deliverable),
                    ),
                  )
                  .toList(growable: false),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: colorScheme.primary.withOpacity(0.12),
                  foregroundColor: colorScheme.primary,
                  child: Text('£${package.price.toStringAsFixed(0)}'),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    '${package.deliveryDays} day delivery',
                    style: Theme.of(context)
                        .textTheme
                        .bodyLarge
                        ?.copyWith(fontWeight: FontWeight.w600),
                  ),
                ),
                FilledButton(
                  onPressed: onPurchase,
                  child: const Text('Purchase'),
                ),
              ],
            ),
            if (package.mediaPreview != null && package.mediaPreview!.isNotEmpty) ...[
              const SizedBox(height: 16),
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: AspectRatio(
                  aspectRatio: 16 / 9,
                  child: Image.network(
                    package.mediaPreview!,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, _) => Container(
                      color: colorScheme.surfaceVariant,
                      alignment: Alignment.center,
                      child: const Text('Preview unavailable'),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _EmptyPackages extends StatelessWidget {
  const _EmptyPackages();

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('No packages published yet', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text(
            'Create your first gig package to activate secure escrow, milestone billing, and automated references.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({
    required this.icon,
    required this.message,
    required this.background,
    required this.foreground,
  });

  final IconData icon;
  final String message;
  final Color background;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Icon(icon, color: foreground),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: foreground),
            ),
          ),
        ],
      ),
    );
  }
}

class _GigPackageSheet extends StatefulWidget {
  const _GigPackageSheet({this.package});

  final GigPackage? package;

  @override
  State<_GigPackageSheet> createState() => _GigPackageSheetState();
}

class _GigPackageSheetState extends State<_GigPackageSheet> {
  late final TextEditingController _nameController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _priceController;
  late final TextEditingController _deliveryController;
  late final TextEditingController _deliverablesController;
  late final TextEditingController _mediaController;
  bool _popular = false;

  @override
  void initState() {
    super.initState();
    final package = widget.package;
    _nameController = TextEditingController(text: package?.name ?? '');
    _descriptionController = TextEditingController(text: package?.description ?? '');
    _priceController = TextEditingController(
      text: package != null ? package.price.toStringAsFixed(2) : '',
    );
    _deliveryController = TextEditingController(
      text: package != null ? package.deliveryDays.toString() : '5',
    );
    _deliverablesController = TextEditingController(
      text: package == null ? '' : package.deliverables.join(', '),
    );
    _mediaController = TextEditingController(text: package?.mediaPreview ?? '');
    _popular = package?.popular ?? false;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _deliveryController.dispose();
    _deliverablesController.dispose();
    _mediaController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(widget.package == null ? 'Create package' : 'Edit package',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Package name', prefixIcon: Icon(Icons.label_outline)),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _descriptionController,
              minLines: 3,
              maxLines: 5,
              decoration: const InputDecoration(
                labelText: 'Description',
                prefixIcon: Icon(Icons.description_outlined),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _priceController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Price (GBP)',
                prefixIcon: Icon(Icons.currency_pound),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _deliveryController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Delivery days',
                prefixIcon: Icon(Icons.timelapse),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _deliverablesController,
              decoration: const InputDecoration(
                labelText: 'Deliverables (comma separated)',
                prefixIcon: Icon(Icons.task_alt),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _mediaController,
              decoration: const InputDecoration(
                labelText: 'Media preview URL (optional)',
                prefixIcon: Icon(Icons.play_circle_outline),
              ),
            ),
            SwitchListTile.adaptive(
              value: _popular,
              onChanged: (value) => setState(() => _popular = value),
              title: const Text('Mark as featured'),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    onPressed: _save,
                    child: Text(widget.package == null ? 'Publish package' : 'Save changes'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _save() {
    final price = double.tryParse(_priceController.text.trim());
    final deliveryDays = int.tryParse(_deliveryController.text.trim());
    if (_nameController.text.trim().isEmpty || price == null || deliveryDays == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Name, price, and delivery window are required.')),
      );
      return;
    }
    final deliverables = _deliverablesController.text
        .split(',')
        .map((value) => value.trim())
        .where((value) => value.isNotEmpty)
        .toList(growable: false);
    final package = (widget.package ??
            GigPackage(
              id: DateTime.now().millisecondsSinceEpoch.toString(),
              name: _nameController.text.trim(),
              description: _descriptionController.text.trim(),
              price: price,
              deliveryDays: deliveryDays,
              deliverables: deliverables,
              popular: _popular,
              mediaPreview: _mediaController.text.trim(),
            ))
        .copyWith(
      name: _nameController.text.trim(),
      description: _descriptionController.text.trim(),
      price: price,
      deliveryDays: deliveryDays,
      deliverables: deliverables,
      popular: _popular,
      mediaPreview: _mediaController.text.trim().isEmpty ? null : _mediaController.text.trim(),
    );
    Navigator.of(context).pop(package);
  }
}

class _PurchaseRequest {
  const _PurchaseRequest({
    required this.name,
    required this.email,
    required this.paymentMethod,
    this.notes,
    this.coupon,
  });

  final String name;
  final String email;
  final String paymentMethod;
  final String? notes;
  final String? coupon;
}

class _PurchaseSheet extends StatefulWidget {
  const _PurchaseSheet({required this.package});

  final GigPackage package;

  @override
  State<_PurchaseSheet> createState() => _PurchaseSheetState();
}

class _PurchaseSheetState extends State<_PurchaseSheet> {
  late final TextEditingController _nameController;
  late final TextEditingController _emailController;
  late final TextEditingController _notesController;
  late final TextEditingController _couponController;
  String _paymentMethod = 'card';

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _emailController = TextEditingController();
    _notesController = TextEditingController();
    _couponController = TextEditingController();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _notesController.dispose();
    _couponController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Purchase ${widget.package.name}', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Buyer name', prefixIcon: Icon(Icons.person_outline)),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Contact email', prefixIcon: Icon(Icons.email_outlined)),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _paymentMethod,
              decoration: const InputDecoration(labelText: 'Payment method', prefixIcon: Icon(Icons.payment)),
              items: const [
                DropdownMenuItem(value: 'card', child: Text('Card (Stripe)')),
                DropdownMenuItem(value: 'wallet', child: Text('Gigvora Wallet')),
                DropdownMenuItem(value: 'wire', child: Text('Wire transfer')),
              ],
              onChanged: (value) => setState(() => _paymentMethod = value ?? 'card'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _couponController,
              decoration: const InputDecoration(labelText: 'Coupon code', prefixIcon: Icon(Icons.local_offer_outlined)),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _notesController,
              maxLines: 4,
              decoration: const InputDecoration(
                labelText: 'Project notes',
                prefixIcon: Icon(Icons.notes_outlined),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    onPressed: _submit,
                    child: const Text('Confirm purchase'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _submit() {
    if (_nameController.text.trim().isEmpty || _emailController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Name and email are required.')),
      );
      return;
    }
    Navigator.of(context).pop(
      _PurchaseRequest(
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        paymentMethod: _paymentMethod,
        notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
        coupon: _couponController.text.trim().isEmpty ? null : _couponController.text.trim(),
      ),
    );
  }
}

class _GigPurchaseMenu extends StatelessWidget {
  const _GigPurchaseMenu({required this.controller, required this.packages});

  final GigPurchaseController controller;
  final List<GigPackage> packages;

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            ListTile(
              leading: const Icon(Icons.analytics_outlined),
              title: const Text('Package insights'),
              subtitle: Text('${packages.length} live packages'),
            ),
            ListTile(
              leading: const Icon(Icons.file_present_outlined),
              title: const Text('Export catalogue'),
              onTap: () => _export(context),
            ),
            ListTile(
              leading: const Icon(Icons.sync_outlined),
              title: const Text('Force refresh from API'),
              onTap: () {
                Navigator.of(context).maybePop();
                controller.refresh();
              },
            ),
          ],
        ),
      ),
    );
  }

  void _export(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Export queued. You will receive a CSV download link shortly.')),
    );
  }
}
