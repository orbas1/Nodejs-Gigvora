import 'package:flutter/material.dart';

class GigvoraAdMetric {
  const GigvoraAdMetric({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;
}

class GigvoraAd {
  const GigvoraAd({
    required this.id,
    required this.title,
    required this.description,
    required this.badge,
    required this.ctaLabel,
    this.route,
    this.metrics = const <GigvoraAdMetric>[],
  });

  final String id;
  final String title;
  final String description;
  final String badge;
  final String ctaLabel;
  final String? route;
  final List<GigvoraAdMetric> metrics;
}

class GigvoraBannerStat {
  const GigvoraBannerStat({
    required this.label,
    required this.value,
    this.helper,
  });

  final String label;
  final String value;
  final String? helper;
}

class GigvoraAdBannerData {
  const GigvoraAdBannerData({
    required this.title,
    required this.description,
    this.eyebrow,
    this.ctaLabel,
    this.ctaRoute,
    this.secondaryLabel,
    this.stats = const <GigvoraBannerStat>[],
  });

  final String? eyebrow;
  final String title;
  final String description;
  final String? ctaLabel;
  final String? ctaRoute;
  final String? secondaryLabel;
  final List<GigvoraBannerStat> stats;
}

class GigvoraAdBanner extends StatelessWidget {
  const GigvoraAdBanner({
    required this.data,
    this.margin,
    super.key,
  });

  final GigvoraAdBannerData data;
  final EdgeInsetsGeometry? margin;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Container(
      margin: margin,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(40),
        gradient: LinearGradient(
          colors: [
            colorScheme.primary,
            Color.lerp(colorScheme.primary, colorScheme.primaryContainer, 0.4) ?? colorScheme.primary,
            colorScheme.primaryContainer.withOpacity(0.9),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: colorScheme.primary.withOpacity(0.35),
            offset: const Offset(0, 24),
            blurRadius: 64,
          ),
        ],
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final isWide = constraints.maxWidth > 720;
          return Flex(
            direction: isWide ? Axis.horizontal : Axis.vertical,
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                flex: isWide ? 3 : 0,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (data.eyebrow != null)
                      Text(
                        data.eyebrow!,
                        style: theme.textTheme.labelSmall?.copyWith(
                          letterSpacing: 3,
                          fontWeight: FontWeight.w600,
                          color: Colors.white70,
                        ),
                      ),
                    const SizedBox(height: 12),
                    Text(
                      data.title,
                      style: theme.textTheme.headlineSmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      data.description,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withOpacity(0.9),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: [
                        if (data.ctaLabel != null)
                          ElevatedButton.icon(
                            onPressed: () => _handleCta(context, data.ctaRoute),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white.withOpacity(0.15),
                              foregroundColor: Colors.white,
                              shape: const StadiumBorder(),
                              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                            ),
                            icon: const Icon(Icons.north_east),
                            label: Text(data.ctaLabel!),
                          ),
                        if (data.secondaryLabel != null)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                            decoration: ShapeDecoration(
                              shape: const StadiumBorder(),
                              color: Colors.white.withOpacity(0.12),
                            ),
                            child: Text(
                              data.secondaryLabel!,
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: Colors.white.withOpacity(0.85),
                                letterSpacing: 1.5,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              if (data.stats.isNotEmpty)
                Padding(
                  padding: EdgeInsets.only(top: isWide ? 0 : 24, left: isWide ? 32 : 0),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      maxWidth: isWide ? constraints.maxWidth * 0.4 : constraints.maxWidth,
                    ),
                    child: Wrap(
                      spacing: 16,
                      runSpacing: 16,
                      children: data.stats
                          .map(
                            (stat) => _BannerStatCard(
                              stat: stat,
                              colorScheme: colorScheme,
                              theme: theme,
                            ),
                          )
                          .toList(),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  void _handleCta(BuildContext context, String? route) {
    if (route == null || route.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Your Gigvora strategist will follow up shortly.')),
      );
      return;
    }
    Navigator.of(context).pushNamed(route);
  }
}

class _BannerStatCard extends StatelessWidget {
  const _BannerStatCard({
    required this.stat,
    required this.colorScheme,
    required this.theme,
  });

  final GigvoraBannerStat stat;
  final ColorScheme colorScheme;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        color: Colors.white.withOpacity(0.12),
        border: Border.all(color: Colors.white.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            stat.label.toUpperCase(),
            style: theme.textTheme.labelSmall?.copyWith(
              color: Colors.white70,
              letterSpacing: 2.5,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            stat.value,
            style: theme.textTheme.titleLarge?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
          if (stat.helper != null) ...[
            const SizedBox(height: 4),
            Text(
              stat.helper!,
              style: theme.textTheme.bodySmall?.copyWith(color: Colors.white70),
            ),
          ],
        ],
      ),
    );
  }
}

class GigvoraAdGrid extends StatelessWidget {
  const GigvoraAdGrid({
    required this.ads,
    this.margin,
    super.key,
  });

  final List<GigvoraAd> ads;
  final EdgeInsetsGeometry? margin;

  @override
  Widget build(BuildContext context) {
    if (ads.isEmpty) {
      return const SizedBox.shrink();
    }

    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return LayoutBuilder(
      builder: (context, constraints) {
        final crossAxisCount = constraints.maxWidth > 1100
            ? 3
            : constraints.maxWidth > 720
                ? 2
                : 1;
        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: margin ?? EdgeInsets.zero,
          itemCount: ads.length,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            childAspectRatio: crossAxisCount == 1 ? 1.1 : 1.05,
          ),
          itemBuilder: (context, index) {
            final ad = ads[index];
            return Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(28),
                border: Border.all(color: colorScheme.outlineVariant.withOpacity(0.6)),
                color: theme.colorScheme.surface,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.06),
                    offset: const Offset(0, 18),
                    blurRadius: 40,
                  ),
                ],
              ),
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: ShapeDecoration(
                      shape: const StadiumBorder(),
                      color: colorScheme.primary.withOpacity(0.08),
                    ),
                    child: Text(
                      ad.badge.toUpperCase(),
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: colorScheme.primary,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 2,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    ad.title,
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Expanded(
                    child: Text(
                      ad.description,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (ad.metrics.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        color: colorScheme.surfaceVariant.withOpacity(0.35),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: ad.metrics
                            .map(
                              (metric) => Padding(
                                padding: const EdgeInsets.symmetric(vertical: 4),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      metric.label.toUpperCase(),
                                      style: theme.textTheme.labelSmall?.copyWith(
                                        fontWeight: FontWeight.w700,
                                        letterSpacing: 1.5,
                                        color: theme.colorScheme.onSurfaceVariant,
                                      ),
                                    ),
                                    Text(
                                      metric.value,
                                      style: theme.textTheme.bodyMedium?.copyWith(
                                        fontWeight: FontWeight.w600,
                                        color: theme.colorScheme.onSurface,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            )
                            .toList(),
                      ),
                    ),
                  const SizedBox(height: 16),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: ElevatedButton.icon(
                      onPressed: () => _handleAdTap(context, ad),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: colorScheme.primary,
                        foregroundColor: Colors.white,
                        shape: const StadiumBorder(),
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      ),
                      icon: const Icon(Icons.north_east),
                      label: Text(ad.ctaLabel),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _handleAdTap(BuildContext context, GigvoraAd ad) {
    if (ad.route == null || ad.route!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('We will align a strategist for ${ad.title.toLowerCase()} shortly.')),
      );
      return;
    }
    Navigator.of(context).pushNamed(ad.route!);
  }
}

const profileAdBanner = GigvoraAdBannerData(
  eyebrow: 'Gigvora Ads Network',
  title: 'Premium placement for trusted profiles',
  description:
      'Activate cross-network sponsorships, curated spotlights, and verified conversion funnels aligned with enterprise procurement teams.',
  ctaLabel: 'Book a placement design session',
  ctaRoute: '/launchpad',
  secondaryLabel: 'Verified advertisers only',
  stats: [
    GigvoraBannerStat(label: 'Audience reach', value: '120k+', helper: 'Monthly Explorer professionals'),
    GigvoraBannerStat(label: 'Avg. CTR', value: '4.7%', helper: 'Across profile placements'),
    GigvoraBannerStat(label: 'Conversion uplift', value: '+38%', helper: 'Versus organic profile views'),
    GigvoraBannerStat(label: 'Security posture', value: 'SOC 2 Type II', helper: 'Enterprise delivery grade'),
  ],
);

const pagesAdBanner = GigvoraAdBannerData(
  eyebrow: 'Gigvora Ads Network',
  title: 'Brand pages with native conversion intelligence',
  description:
      'Pair sponsored product modules with Explorer distribution to surface campaigns alongside curated industry groups.',
  ctaLabel: 'Design a brand journey',
  ctaRoute: '/contact/sales',
  secondaryLabel: 'Dedicated strategist',
  stats: [
    GigvoraBannerStat(label: 'Explorer coverage', value: '28 regions', helper: 'Localised distribution'),
    GigvoraBannerStat(label: 'Engagement rate', value: '3.9%', helper: 'Avg. across agency pages'),
    GigvoraBannerStat(label: 'Campaign velocity', value: '72 hrs', helper: 'From creative to live'),
  ],
);

const groupsAdBanner = GigvoraAdBannerData(
  eyebrow: 'Gigvora Ads Network',
  title: 'Community groups with precision sponsorships',
  description:
      'Orchestrate sponsor activations that respect governance rules while adding value to member rituals.',
  ctaLabel: 'Book community lab session',
  ctaRoute: '/community/partnerships',
  secondaryLabel: 'Sponsor governance playbook',
  stats: [
    GigvoraBannerStat(label: 'Member satisfaction', value: '92%', helper: 'Post-campaign surveys'),
    GigvoraBannerStat(label: 'Moderator SLA', value: '15m', helper: 'Average escalation time'),
    GigvoraBannerStat(label: 'Security events', value: '0 incidents', helper: 'Past 12 months'),
  ],
);

const profileAds = <GigvoraAd>[
  GigvoraAd(
    id: 'profile-spotlight',
    title: 'Executive spotlight takeovers',
    description: 'Deploy rotating hero banners across Launchpad cohorts with talent-to-mission storytelling.',
    badge: 'Spotlight',
    ctaLabel: 'Schedule storyboard review',
    route: '/ads/spotlight',
    metrics: [
      GigvoraAdMetric(label: 'Runtime', value: '14 days'),
      GigvoraAdMetric(label: 'CTR', value: '5.2%'),
    ],
  ),
  GigvoraAd(
    id: 'profile-streams',
    title: 'Interactive profile stream',
    description: 'Embed short-form video and credential reels directly into profile timelines with moderation routing.',
    badge: 'Immersive',
    ctaLabel: 'Pilot immersive slot',
    route: '/ads/streams',
    metrics: [
      GigvoraAdMetric(label: 'Avg. watch time', value: '2m 18s'),
      GigvoraAdMetric(label: 'Completion rate', value: '64%'),
    ],
  ),
  GigvoraAd(
    id: 'profile-trust',
    title: 'Trust layer accelerators',
    description: 'Inject third-party attestations, compliance scoring, and case-study sliders within the trust module.',
    badge: 'Trust',
    ctaLabel: 'Align compliance pack',
    route: '/trust-center',
    metrics: [
      GigvoraAdMetric(label: 'Audit SLA', value: '< 48h'),
      GigvoraAdMetric(label: 'Verified lifts', value: '31%'),
    ],
  ),
];

const pagesAds = <GigvoraAd>[
  GigvoraAd(
    id: 'pages-marquee',
    title: 'Explorer marquee modules',
    description: 'Pin your narrative to Explorer landing zones with adaptive geo-personalisation.',
    badge: 'Explorer',
    ctaLabel: 'Reserve marquee slot',
    route: '/ads/explorer-marquee',
    metrics: [
      GigvoraAdMetric(label: 'Reach', value: '68k avg.'),
      GigvoraAdMetric(label: 'Interaction', value: '3.4%'),
    ],
  ),
  GigvoraAd(
    id: 'pages-case-lab',
    title: 'Case lab carousel',
    description: 'Showcase rotating client proof with automated NDA gating and analytics.',
    badge: 'Proof',
    ctaLabel: 'Launch case carousel',
    route: '/ads/case-lab',
    metrics: [
      GigvoraAdMetric(label: 'Avg. dwell', value: '1m 45s'),
      GigvoraAdMetric(label: 'Lead quality', value: 'A-'),
    ],
  ),
  GigvoraAd(
    id: 'pages-live',
    title: 'Live events ticker',
    description: 'Integrate upcoming launches and webinars with RSVP funnels and Slack sync.',
    badge: 'Live',
    ctaLabel: 'Activate live ticker',
    route: '/ads/live-events',
    metrics: [
      GigvoraAdMetric(label: 'RSVP uplift', value: '+46%'),
      GigvoraAdMetric(label: 'Sync time', value: 'Instant'),
    ],
  ),
];

const groupsAds = <GigvoraAd>[
  GigvoraAd(
    id: 'groups-rituals',
    title: 'Ritual sponsor moments',
    description: 'Align ads to check-ins, showcases, and retros without disrupting group cadence.',
    badge: 'Ritual',
    ctaLabel: 'Map ritual touchpoints',
    route: '/ads/group-rituals',
    metrics: [
      GigvoraAdMetric(label: 'Satisfaction', value: '94%'),
      GigvoraAdMetric(label: 'Retention', value: '+22%'),
    ],
  ),
  GigvoraAd(
    id: 'groups-knowledge',
    title: 'Knowledge vault boosts',
    description: 'Sponsor curated knowledge drops with compliance-reviewed resources and auto-notifications.',
    badge: 'Knowledge',
    ctaLabel: 'Boost knowledge drops',
    route: '/ads/knowledge-vault',
    metrics: [
      GigvoraAdMetric(label: 'Downloads', value: '8.3k'),
      GigvoraAdMetric(label: 'Share rate', value: '2.6x'),
    ],
  ),
  GigvoraAd(
    id: 'groups-accelerator',
    title: 'Accelerator pods',
    description: 'Fund member challenges with integrated OKR tracking and investor syndicate visibility.',
    badge: 'Accelerator',
    ctaLabel: 'Fund a pod',
    route: '/ads/accelerator-pods',
    metrics: [
      GigvoraAdMetric(label: 'Funding cycle', value: '30 days'),
      GigvoraAdMetric(label: 'Pipeline', value: '17 warm intros'),
    ],
  ),
];
