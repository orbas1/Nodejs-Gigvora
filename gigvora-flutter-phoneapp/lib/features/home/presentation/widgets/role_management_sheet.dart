import 'package:flutter/material.dart';

import '../../data/models/role_membership.dart';

class RoleManagementSheet extends StatefulWidget {
  const RoleManagementSheet({
    required this.onSubmit,
    this.initial,
    super.key,
  });

  final RoleMembership? initial;
  final Future<void> Function(RoleMembershipDraft draft) onSubmit;

  @override
  State<RoleManagementSheet> createState() => _RoleManagementSheetState();
}

class _RoleManagementSheetState extends State<RoleManagementSheet> {
  late final TextEditingController _roleController;
  late final TextEditingController _labelController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _permissionsController;
  late bool _primary;
  final _formKey = GlobalKey<FormState>();
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _roleController = TextEditingController(text: widget.initial?.role ?? '');
    _labelController = TextEditingController(text: widget.initial?.label ?? '');
    _descriptionController = TextEditingController(text: widget.initial?.description ?? '');
    _permissionsController = TextEditingController(
      text: widget.initial?.permissions.join(', ') ?? '',
    );
    _primary = widget.initial?.isPrimary ?? false;
  }

  @override
  void dispose() {
    _roleController.dispose();
    _labelController.dispose();
    _descriptionController.dispose();
    _permissionsController.dispose();
    super.dispose();
  }

  List<String> _parsePermissions() {
    return _permissionsController.text
        .split(',')
        .map((value) => value.trim())
        .where((value) => value.isNotEmpty)
        .toList(growable: false);
  }

  Future<void> _handleSubmit() async {
    if (_submitting) {
      return;
    }
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() => _submitting = true);
    final description = _descriptionController.text.trim();
    final draft = RoleMembershipDraft(
      role: _roleController.text.trim().toLowerCase(),
      label: _labelController.text.trim(),
      description: description.isEmpty ? null : description,
      permissions: _parsePermissions(),
      primary: _primary,
    );
    try {
      await widget.onSubmit(draft);
      if (!mounted) return;
      Navigator.of(context).maybePop();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("We couldn't save that role. ${error.toString()}"),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 36),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  widget.initial == null ? 'Add workspace role' : 'Update workspace role',
                  style: theme.textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                Text(
                  'Roles determine the dashboards, analytics, and permissions that appear across Gigvora.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 20),
                TextFormField(
                  controller: _roleController,
                  decoration: const InputDecoration(
                    labelText: 'Role identifier',
                    helperText: 'Use lowercase letters. Example: freelancer, mentor, admin.',
                  ),
                  textCapitalization: TextCapitalization.none,
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Role identifier is required';
                    }
                    if (!RegExp(r'^[a-z_]+$').hasMatch(value.trim())) {
                      return 'Only lowercase letters and underscores are allowed.';
                    }
                    return null;
                  },
                  readOnly: widget.initial != null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _labelController,
                  decoration: const InputDecoration(
                    labelText: 'Role label',
                    helperText: 'Shown across the dashboard and navigation.',
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Provide a name for this role';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _descriptionController,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Description',
                    helperText: 'Optional. Helps teammates understand when to use this role.',
                  ),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _permissionsController,
                  decoration: const InputDecoration(
                    labelText: 'Permissions',
                    helperText: 'Comma separated. Example: projects.manage, finance.read',
                  ),
                ),
                const SizedBox(height: 12),
                SwitchListTile.adaptive(
                  value: _primary,
                  onChanged: (value) => setState(() => _primary = value),
                  title: const Text('Mark as primary workspace'),
                  subtitle: const Text('Primary roles appear first and unlock deeper analytics.'),
                ),
                const SizedBox(height: 20),
                FilledButton.icon(
                  onPressed: _submitting ? null : _handleSubmit,
                  icon: _submitting
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.check),
                  label: Text(widget.initial == null ? 'Create role' : 'Save changes'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
