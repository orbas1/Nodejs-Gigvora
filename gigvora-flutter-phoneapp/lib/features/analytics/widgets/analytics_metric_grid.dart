import 'package:flutter/material.dart';

import '../../../theme/widgets.dart';
import '../utils/formatters.dart';

class AnalyticsDatum {
  const AnalyticsDatum({
    required this.label,
    required this.value,
    this.caption,
    this.delta,
    this.trend,
    this.icon,
    this.onTap,
  });

  final String label;
  final String value;
  final String? caption;
  final String? delta;
  final AnalyticsTrend? trend;
  final IconData? icon;
  final VoidCallback? onTap;
}

enum AnalyticsMetricVariant { tonal, gradient }

class AnalyticsMetricGrid extends StatelessWidget {
  const AnalyticsMetricGrid({
    required this.metrics,
    this.variant = AnalyticsMetricVariant.tonal,
    this.spacing = 16,
    this.runSpacing = 16,
    super.key,
  });

  final List<AnalyticsDatum> metrics;
  final AnalyticsMetricVariant variant;
  final double spacing;
  final double runSpacing;

  @override
  Widget build(BuildContext context) {
    if (metrics.isEmpty) {
      return const SizedBox.shrink();
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final maxWidth = constraints.maxWidth;
        int columns = 1;
        if (maxWidth >= 900) {
          columns = 3;
        } else if (maxWidth >= 560) {
          columns = 2;
        }
        final tileWidth = (maxWidth - (spacing * (columns - 1))) / columns;

        return Wrap(
          spacing: spacing,
          runSpacing: runSpacing,
          children: metrics
              .map(
                (metric) => SizedBox(
                  width: tileWidth,
                  child: _AnalyticsMetricCard(
                    metric: metric,
                    variant: variant,
                  ),
                ),
              )
              .toList(),
        );
      },
    );
  }
}

class _AnalyticsMetricCard extends StatelessWidget {
  const _AnalyticsMetricCard({required this.metric, required this.variant});

  final AnalyticsDatum metric;
  final AnalyticsMetricVariant variant;

  @override
  Widget build(BuildContext context) {
    final labelStyle = _labelStyle(context);
    final valueStyle = _valueStyle(context);
    final captionStyle = _captionStyle(context);
    final deltaStyle = _deltaStyle(context);

    Widget content = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (metric.icon != null) ...[
              Icon(metric.icon, size: 18, color: labelStyle?.color),
              const SizedBox(width: 8),
            ],
            Expanded(
              child: Text(
                metric.label.toUpperCase(),
                style: labelStyle,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Text(
          metric.value,
          style: valueStyle,
        ),
        if (metric.delta != null) ...[
          const SizedBox(height: 8),
          Text(
            metric.delta!,
            style: deltaStyle?.copyWith(
              color: analyticsTrendColor(
                context,
                metric.trend,
                inverse: variant == AnalyticsMetricVariant.gradient,
              ),
            ),
          ),
        ],
        if (metric.caption != null) ...[
          const SizedBox(height: 8),
          Text(
            metric.caption!,
            style: captionStyle,
          ),
        ],
      ],
    );

    if (metric.onTap != null) {
      content = InkWell(
        onTap: metric.onTap,
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.all(4),
          child: content,
        ),
      );
    }

    switch (variant) {
      case AnalyticsMetricVariant.gradient:
        final theme = Theme.of(context);
        return Container(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF0F172A), Color(0xFF1D4ED8)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.16),
                blurRadius: 20,
                offset: const Offset(0, 12),
              ),
            ],
          ),
          padding: const EdgeInsets.all(20),
          child: DefaultTextStyle(
            style: theme.textTheme.bodyMedium!.copyWith(color: Colors.white),
            child: content,
          ),
        );
      case AnalyticsMetricVariant.tonal:
        return GigvoraCard(child: content);
    }
  }

  TextStyle? _labelStyle(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    switch (variant) {
      case AnalyticsMetricVariant.gradient:
        return textTheme.labelSmall?.copyWith(
          color: Colors.white70,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.6,
        );
      case AnalyticsMetricVariant.tonal:
        return textTheme.labelSmall?.copyWith(
          color: Theme.of(context).colorScheme.onSurfaceVariant,
          letterSpacing: 0.6,
        );
    }
  }

  TextStyle? _valueStyle(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    switch (variant) {
      case AnalyticsMetricVariant.gradient:
        return textTheme.headlineSmall?.copyWith(
          color: Colors.white,
          fontWeight: FontWeight.w700,
        );
      case AnalyticsMetricVariant.tonal:
        return textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold);
    }
  }

  TextStyle? _captionStyle(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    switch (variant) {
      case AnalyticsMetricVariant.gradient:
        return textTheme.bodySmall?.copyWith(color: Colors.white70);
      case AnalyticsMetricVariant.tonal:
        return textTheme.bodySmall?.copyWith(
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        );
    }
  }

  TextStyle? _deltaStyle(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    switch (variant) {
      case AnalyticsMetricVariant.gradient:
        return textTheme.bodySmall?.copyWith(
          fontWeight: FontWeight.w600,
          color: Colors.white70,
        );
      case AnalyticsMetricVariant.tonal:
        return textTheme.bodySmall?.copyWith(
          fontWeight: FontWeight.w600,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        );
    }
  }
}
