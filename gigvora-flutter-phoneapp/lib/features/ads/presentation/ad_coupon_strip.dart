import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../providers.dart';
import '../data/models/ad_coupon.dart';
import '../data/models/ad_placement.dart';

class AdCouponStrip extends ConsumerWidget {
  const AdCouponStrip({required this.surface, super.key});

  final String surface;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final placementsAsync = ref.watch(adPlacementsProvider(surface));
    final theme = Theme.of(context);

    return placementsAsync.when(
      data: (result) {
        final placements = result.data;
        final offers = _buildOffers(placements);
        if (offers.isEmpty) {
          return const SizedBox.shrink();
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Featured offers',
              style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 12),
            ...offers.map((offer) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _CouponCard(offer: offer),
                )),
            if (result.fromCache)
              Text(
                result.error != null
                    ? 'Showing cached incentives while we reconnect…'
                    : 'Refreshing offers…',
                style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.secondary),
              ),
            if (result.error != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  'We couldn\'t reach the ad server: ${result.error}',
                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.error),
                ),
              ),
          ],
        );
      },
      loading: () => _LoadingState(theme: theme),
      error: (error, stackTrace) => _ErrorState(message: '$error'),
    );
  }

  List<_AdOffer> _buildOffers(List<AdPlacement> placements) {
    return placements
        .expand((placement) {
          final creative = placement.creative;
          final creativeHeadline = _valueOrNull(creative?.headline);
          final creativeSubheadline = _valueOrNull(creative?.subheadline);
          final creativeCta = _valueOrNull(creative?.callToAction);
          final creativeCtaUrl = _valueOrNull(creative?.ctaUrl);

          return placement.coupons.map((coupon) {
            final couponHeadline = creativeHeadline ?? _valueOrNull(coupon.name) ?? placement.surface;
            final description =
                _valueOrNull(coupon.description) ?? creativeSubheadline ?? _valueOrNull(placement.position) ?? '';
            final cta = creativeCta ?? 'Redeem now';
            final ctaUrl = _sanitizeUrl(creativeCtaUrl ?? coupon.termsUrl);
            final termsUrl = _sanitizeUrl(coupon.termsUrl);

            return _AdOffer(
              code: coupon.code,
              headline: couponHeadline.isNotEmpty ? couponHeadline : placement.surface,
              description: description,
              discountLabel: _formatDiscount(coupon),
              lifecycleStatus: coupon.lifecycleStatus,
              isActive: coupon.isActive,
              surface: placement.surface,
              position: placement.position,
              startAt: coupon.startAt ?? placement.startAt,
              endAt: coupon.endAt ?? placement.endAt,
              callToAction: cta,
              ctaUrl: ctaUrl,
              termsUrl: termsUrl.isEmpty ? null : termsUrl,
            );
          });
        })
        .where((offer) => offer.code.isNotEmpty)
        .toList()
      ..sort((a, b) {
        if (a.isActive != b.isActive) {
          return a.isActive ? -1 : 1;
        }
        if (a.startAt != null && b.startAt != null) {
          return a.startAt!.compareTo(b.startAt!);
        }
        return a.code.compareTo(b.code);
      });
  }

  String _formatDiscount(AdCoupon coupon) {
    if (coupon.discountType == 'fixed_amount') {
      return 'Save ' + String.fromCharCode(36) + coupon.discountValue.toStringAsFixed(0);
    }
    return 'Save ${coupon.discountValue.toStringAsFixed(0)}%';
  }

  String? _valueOrNull(String? value) {
    if (value == null) {
      return null;
    }
    final trimmed = value.trim();
    return trimmed.isEmpty ? null : trimmed;
  }

  String _sanitizeUrl(String? url) {
    if (url == null) {
      return '';
    }
    final trimmed = url.trim();
    if (trimmed.isEmpty) {
      return '';
    }
    Uri? parsed = Uri.tryParse(trimmed);
    if (parsed == null) {
      return '';
    }
    if (!parsed.hasScheme) {
      parsed = Uri.tryParse('https://$trimmed');
    }
    if (parsed == null) {
      return '';
    }
    if (parsed.scheme != 'https' && parsed.scheme != 'http') {
      return '';
    }
    return parsed.toString();
  }
}

class _AdOffer {
  const _AdOffer({
    required this.code,
    required this.headline,
    required this.description,
    required this.discountLabel,
    required this.lifecycleStatus,
    required this.isActive,
    required this.surface,
    required this.position,
    required this.startAt,
    required this.endAt,
    required this.callToAction,
    required this.ctaUrl,
    required this.termsUrl,
  });

  final String code;
  final String headline;
  final String description;
  final String discountLabel;
  final String lifecycleStatus;
  final bool isActive;
  final String surface;
  final String position;
  final DateTime? startAt;
  final DateTime? endAt;
  final String callToAction;
  final String ctaUrl;
  final String? termsUrl;
}

class _CouponCard extends StatelessWidget {
  const _CouponCard({required this.offer});

  final _AdOffer offer;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final backgroundColor = offer.isActive
        ? colorScheme.primaryContainer.withOpacity(0.3)
        : colorScheme.surfaceVariant.withOpacity(0.4);

    return Container(
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: offer.isActive ? colorScheme.primary.withOpacity(0.4) : colorScheme.outlineVariant,
        ),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: colorScheme.primary,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  offer.discountLabel,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: colorScheme.onPrimary,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
              Text(
                offer.code,
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: colorScheme.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            offer.headline,
            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
          if (offer.description.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                offer.description,
                style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
              ),
            ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                offer.surface,
                style: theme.textTheme.labelSmall?.copyWith(color: colorScheme.onSurfaceVariant),
              ),
              Text(
                _formatWindow(),
                style: theme.textTheme.labelSmall?.copyWith(color: colorScheme.onSurfaceVariant),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: offer.ctaUrl.isEmpty
                ? null
                : () async {
                    await _launchUrl(offer.ctaUrl, context);
                  },
            child: Text(offer.callToAction.toUpperCase()),
          ),
          if (offer.termsUrl != null && offer.termsUrl!.isNotEmpty)
            TextButton(
              onPressed: () async {
                await _launchUrl(offer.termsUrl!, context);
              },
              child: const Text('Terms & conditions'),
            ),
        ],
      ),
    );
  }

  String _formatWindow() {
    if (offer.startAt == null && offer.endAt == null) {
      return 'Always on';
    }
    final start = offer.startAt != null
        ? '${offer.startAt!.month}/${offer.startAt!.day}'
        : 'Now';
    final end = offer.endAt != null ? '${offer.endAt!.month}/${offer.endAt!.day}' : 'Open';
    return '$start → $end';
  }
}

Future<void> _launchUrl(String url, BuildContext context) async {
  final uri = Uri.tryParse(url);
  if (uri == null) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Unable to open link: $url')),
    );
    return;
  }
  if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Could not launch ${uri.toString()}')),
    );
  }
}

class _LoadingState extends StatelessWidget {
  const _LoadingState({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.4),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(theme.colorScheme.primary),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            'Loading offers…',
            style: theme.textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.errorContainer.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        message,
        style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onErrorContainer),
      ),
    );
  }
}
