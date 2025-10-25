import 'package:flutter/material.dart';

class GigvoraFilterOption<T> {
  const GigvoraFilterOption({
    required this.value,
    required this.label,
    this.tooltip,
  });

  final T value;
  final String label;
  final String? tooltip;
}

class GigvoraFilterGroup<T> extends StatelessWidget {
  const GigvoraFilterGroup({
    super.key,
    required this.options,
    required this.onSelected,
    this.selectedValue,
    this.label,
    this.enabled = true,
    this.showCheckmark = false,
    this.spacing = 12,
    this.runSpacing = 12,
    this.dense = false,
    this.wrapAlignment = WrapAlignment.start,
  });

  final List<GigvoraFilterOption<T>> options;
  final T? selectedValue;
  final ValueChanged<T> onSelected;
  final String? label;
  final bool enabled;
  final bool showCheckmark;
  final double spacing;
  final double runSpacing;
  final bool dense;
  final WrapAlignment wrapAlignment;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final chips = options.map((option) {
      final isSelected = selectedValue != null && option.value == selectedValue;
      Widget chip = ChoiceChip(
        label: Text(option.label),
        labelPadding: dense
            ? const EdgeInsets.symmetric(horizontal: 10, vertical: 2)
            : const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        showCheckmark: showCheckmark,
        selected: isSelected,
        selectedColor: theme.colorScheme.primaryContainer,
        backgroundColor: theme.colorScheme.surfaceVariant.withOpacity(0.6),
        labelStyle: theme.textTheme.labelLarge?.copyWith(
          fontWeight: FontWeight.w600,
          color: isSelected
              ? theme.colorScheme.onPrimaryContainer
              : theme.colorScheme.onSurfaceVariant,
        ),
        side: BorderSide(
          color: isSelected
              ? theme.colorScheme.primary.withOpacity(0.45)
              : theme.dividerColor.withOpacity(0.8),
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        onSelected: enabled ? (_) => onSelected(option.value) : null,
      );
      if (option.tooltip != null && option.tooltip!.trim().isNotEmpty) {
        chip = Tooltip(message: option.tooltip!, child: chip);
      }
      return chip;
    }).toList(growable: false);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Text(
            label!,
            style: theme.textTheme.labelMedium?.copyWith(
              fontWeight: FontWeight.w700,
              color: theme.colorScheme.onSurfaceVariant,
              letterSpacing: 0.2,
            ),
          ),
          const SizedBox(height: 6),
        ],
        Wrap(
          alignment: wrapAlignment,
          spacing: spacing,
          runSpacing: runSpacing,
          children: chips,
        ),
      ],
    );
  }
}
