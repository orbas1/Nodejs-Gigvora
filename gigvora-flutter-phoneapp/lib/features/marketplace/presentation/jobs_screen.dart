import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../theme/widgets.dart';
import '../application/opportunity_controller.dart';
import '../data/models/opportunity.dart';
import 'jobs_sections.dart';
import 'opportunity_list.dart';

enum _RemoteFilter { any, remote, onsite }

class JobsScreen extends ConsumerStatefulWidget {
  const JobsScreen({super.key});

  static final List<JobApplication> _applications = [
    JobApplication(
      id: 'application-1',
      role: 'Senior Flutter Engineer',
      company: 'Aurora Labs',
      stage: JobApplicationStage.interview,
      submittedAt: DateTime.utc(2024, 4, 2, 14, 0),
      lastUpdated: DateTime.utc(2024, 5, 11, 10, 30),
      nextStep: 'Prepare the system design workshop scheduled for May 22.',
      requiresAction: true,
    ),
    JobApplication(
      id: 'application-2',
      role: 'Product Design Lead',
      company: 'Orbit Studio',
      stage: JobApplicationStage.reviewing,
      submittedAt: DateTime.utc(2024, 3, 18, 9, 15),
      lastUpdated: DateTime.utc(2024, 4, 28, 17, 45),
      nextStep: 'Hiring team reviewing case study.',
    ),
    JobApplication(
      id: 'application-3',
      role: 'Head of Operations',
      company: 'Northwind Collective',
      stage: JobApplicationStage.offer,
      submittedAt: DateTime.utc(2024, 2, 12, 11, 30),
      lastUpdated: DateTime.utc(2024, 5, 2, 16, 5),
    ),
  ];

  static final List<JobInterview> _interviews = [
    JobInterview(
      id: 'interview-1',
      role: 'Senior Flutter Engineer',
      company: 'Aurora Labs',
      stage: 'Technical interview',
      scheduledAt: DateTime.utc(2024, 5, 22, 16, 30),
      format: InterviewFormat.virtual,
      host: 'Priya Patel',
      prepNotes: '45-minute pair programming session focused on Riverpod and offline-first patterns.',
    ),
    JobInterview(
      id: 'interview-2',
      role: 'Product Design Lead',
      company: 'Orbit Studio',
      stage: 'Portfolio review',
      scheduledAt: DateTime.utc(2024, 5, 27, 19, 0),
      format: InterviewFormat.inPerson,
      host: 'Daniel Ruiz',
      location: 'Orbit Studio HQ, San Francisco',
      prepNotes: 'Bring printed artifacts that highlight cross-functional collaboration.',
    ),
  ];

  static final List<ManagedJob> _managedJobs = [
    ManagedJob(
      id: 'managed-1',
      title: 'Product Marketing Manager',
      team: 'Marketing · Remote across EMEA',
      status: 'Accepting candidates',
      pipelineStage: '5 interviews in progress',
      totalApplicants: 38,
      lastActivity: DateTime.utc(2024, 5, 12, 13, 45),
      highlight: 'Two candidates advanced to the final storytelling workshop.',
    ),
    ManagedJob(
      id: 'managed-2',
      title: 'Platform Engineer',
      team: 'Core Engineering · Hybrid in Austin',
      status: 'Sourcing paused',
      pipelineStage: 'Awaiting leadership sign-off',
      totalApplicants: 21,
      lastActivity: DateTime.utc(2024, 5, 9, 8, 15),
      highlight: 'Send weekly update to the hiring team once roadmap replan is complete.',
    ),
  ];

  @override
  ConsumerState<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends ConsumerState<JobsScreen> {
  final Set<String> _employmentTypes = {'Full-time'};
  _RemoteFilter _remoteFilter = _RemoteFilter.any;
  String _freshness = '30d';
  String _sort = 'default';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final controller = ref.read(opportunityControllerProvider(OpportunityCategory.job).notifier);
      controller.setIncludeFacets(true);
      controller.updateFilters(_buildFilters());
      controller.updateSort(_sort == 'default' ? null : _sort);
    });
  }

  Map<String, dynamic> _buildFilters() {
    final filters = <String, dynamic>{};
    if (_employmentTypes.isNotEmpty) {
      filters['employmentTypes'] = _employmentTypes.toList();
    }
    if (_remoteFilter == _RemoteFilter.remote) {
      filters['isRemote'] = true;
    } else if (_remoteFilter == _RemoteFilter.onsite) {
      filters['isRemote'] = false;
    }
    filters['updatedWithin'] = _freshness;
    return filters;
  }

  void _toggleEmploymentType(String value) {
    setState(() {
      if (_employmentTypes.contains(value)) {
        _employmentTypes.remove(value);
      } else {
        _employmentTypes.add(value);
      }
    });
    ref.read(opportunityControllerProvider(OpportunityCategory.job).notifier).updateFilters(_buildFilters());
  }

  void _setRemoteFilter(_RemoteFilter value) {
    setState(() {
      _remoteFilter = value;
    });
    ref.read(opportunityControllerProvider(OpportunityCategory.job).notifier).updateFilters(_buildFilters());
  }

  void _setFreshness(String value) {
    setState(() {
      _freshness = value;
    });
    ref.read(opportunityControllerProvider(OpportunityCategory.job).notifier).updateFilters(_buildFilters());
  }

  void _setSort(String value) {
    setState(() {
      _sort = value;
    });
    ref.read(opportunityControllerProvider(OpportunityCategory.job).notifier).updateSort(value == 'default' ? null : value);
  }

  void _resetFilters() {
    setState(() {
      _employmentTypes
        ..clear()
        ..add('Full-time');
      _remoteFilter = _RemoteFilter.any;
      _freshness = '30d';
      _sort = 'default';
    });
    final controller = ref.read(opportunityControllerProvider(OpportunityCategory.job).notifier);
    controller.updateFilters(_buildFilters());
    controller.updateSort(null);
  }

  int _remoteCount(OpportunityPage? page) {
    final facets = page?.facets;
    final facet = facets != null && facets['isRemote'] is Map ? facets['isRemote'] as Map : null;
    if (facet != null) {
      final trueKey = facet.entries.firstWhere(
        (entry) => entry.key.toString().toLowerCase() == 'true',
        orElse: () => MapEntry('true', 0),
      );
      final value = trueKey.value;
      if (value is num) {
        return value.toInt();
      }
      if (value is String) {
        return int.tryParse(value) ?? 0;
      }
    }
    final items = page?.items ?? const <OpportunitySummary>[];
    return items.where((item) => item.isRemote == true).length;
  }

  int _recentCount(OpportunityPage? page) {
    final facets = page?.facets;
    if (facets != null && facets['updatedAtDate'] is Map) {
      final map = facets['updatedAtDate'] as Map;
      final value = map['7d'];
      if (value is num) return value.toInt();
      if (value is String) return int.tryParse(value) ?? 0;
    }
    final items = page?.items ?? const <OpportunitySummary>[];
    final threshold = DateTime.now().subtract(const Duration(days: 7));
    return items
        .where((item) => item.updatedAt.isAfter(threshold))
        .length;
  }

  String? _topEmploymentType(OpportunityPage? page) {
    final facets = page?.facets;
    if (facets != null && facets['employmentType'] is Map) {
      final map = (facets['employmentType'] as Map).map((key, value) => MapEntry('$key', value));
      if (map.isNotEmpty) {
        final sorted = map.entries.toList()
          ..sort((a, b) => (b.value as num).compareTo(a.value as num));
        return sorted.first.key;
      }
    }
    final items = page?.items ?? const <OpportunitySummary>[];
    if (items.isEmpty) return null;
    final counts = <String, int>{};
    for (final item in items) {
      final type = item.employmentType;
      if (type == null) continue;
      counts[type] = (counts[type] ?? 0) + 1;
    }
    if (counts.isEmpty) return null;
    final sorted = counts.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
    return sorted.first.key;
  }

  @override
  Widget build(BuildContext context) {
    final jobState = ref.watch(opportunityControllerProvider(OpportunityCategory.job));
    final page = jobState.data;
    final items = page?.items ?? const <OpportunitySummary>[];
    final totalJobs = page?.total ?? items.length;
    final remoteCount = _remoteCount(page);
    final recentCount = _recentCount(page);
    final topType = _topEmploymentType(page);

    return DefaultTabController(
      length: 4,
      child: GigvoraScaffold(
        title: 'Jobs',
        subtitle: 'Long-term roles across the Gigvora network',
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Wrap(
              spacing: 16,
              runSpacing: 16,
              children: [
                _MetricCard(
                  title: 'Open opportunities',
                  value: totalJobs.toString(),
                  subtitle: 'Marketplace roles currently live.',
                ),
                _MetricCard(
                  title: 'Remote friendly',
                  value: '${totalJobs == 0 ? 0 : ((remoteCount / totalJobs) * 100).round()}%',
                  subtitle: '$remoteCount remote-first listings.',
                ),
                _MetricCard(
                  title: 'Updated this week',
                  value: recentCount.toString(),
                  subtitle: topType != null ? '$topType roles refreshed recently.' : 'Fresh opportunities in the last 7 days.',
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: Theme.of(context).colorScheme.outlineVariant.withOpacity(0.4),
                ),
              ),
              child: TabBar(
                isScrollable: true,
                labelColor: Theme.of(context).colorScheme.primary,
                indicatorColor: Theme.of(context).colorScheme.primary,
                dividerColor: Colors.transparent,
                tabs: const [
                  Tab(text: 'Jobs board'),
                  Tab(text: 'Applications'),
                  Tab(text: 'Interviews'),
                  Tab(text: 'Manage jobs'),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: TabBarView(
                children: [
                  _buildBoardTab(context),
                  JobApplicationsPanel(applications: JobsScreen._applications),
                  JobInterviewsPanel(interviews: JobsScreen._interviews),
                  JobsManagementPanel(jobs: JobsScreen._managedJobs),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBoardTab(BuildContext context) {
    final filterChips = <Widget>[
      _FilterChip(
        label: 'Full-time',
        selected: _employmentTypes.contains('Full-time'),
        onSelected: () => _toggleEmploymentType('Full-time'),
      ),
      _FilterChip(
        label: 'Contract',
        selected: _employmentTypes.contains('Contract'),
        onSelected: () => _toggleEmploymentType('Contract'),
      ),
      _FilterChip(
        label: 'Contract-to-hire',
        selected: _employmentTypes.contains('Contract-to-hire'),
        onSelected: () => _toggleEmploymentType('Contract-to-hire'),
      ),
      _FilterChip(
        label: 'Part-time',
        selected: _employmentTypes.contains('Part-time'),
        onSelected: () => _toggleEmploymentType('Part-time'),
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GigvoraCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Filter and refine', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 16),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  ChoiceChip(
                    label: const Text('All work styles'),
                    selected: _remoteFilter == _RemoteFilter.any,
                    onSelected: (_) => _setRemoteFilter(_RemoteFilter.any),
                  ),
                  ChoiceChip(
                    label: const Text('Remote only'),
                    selected: _remoteFilter == _RemoteFilter.remote,
                    onSelected: (_) => _setRemoteFilter(_RemoteFilter.remote),
                  ),
                  ChoiceChip(
                    label: const Text('Onsite & hybrid'),
                    selected: _remoteFilter == _RemoteFilter.onsite,
                    onSelected: (_) => _setRemoteFilter(_RemoteFilter.onsite),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Wrap(spacing: 12, runSpacing: 12, children: filterChips),
              const SizedBox(height: 16),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  DropdownButton<String>(
                    value: _freshness,
                    items: const [
                      DropdownMenuItem(value: '24h', child: Text('Last 24 hours')),
                      DropdownMenuItem(value: '7d', child: Text('Last 7 days')),
                      DropdownMenuItem(value: '30d', child: Text('Last 30 days')),
                      DropdownMenuItem(value: '90d', child: Text('Last 90 days')),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        _setFreshness(value);
                      }
                    },
                  ),
                  DropdownButton<String>(
                    value: _sort,
                    items: const [
                      DropdownMenuItem(value: 'default', child: Text('Relevance')),
                      DropdownMenuItem(value: 'newest', child: Text('Newest')),
                      DropdownMenuItem(value: 'alphabetical', child: Text('A–Z')),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        _setSort(value);
                      }
                    },
                  ),
                  TextButton.icon(
                    onPressed: _resetFilters,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Reset filters'),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Expanded(
          child: OpportunityListView(
            category: OpportunityCategory.job,
            ctaLabel: 'Apply now',
            searchPlaceholder: 'Search by title, location, or keywords',
            emptyDefaultMessage:
                'Jobs curated from trusted teams will appear here as we sync the marketplace.',
            emptySearchMessage:
                'No jobs matched your filters yet. Try broadening your search.',
          ),
        ),
      ],
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({required this.title, required this.value, required this.subtitle});

  final String title;
  final String value;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 8),
          Text(value, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({required this.label, required this.selected, required this.onSelected});

  final String label;
  final bool selected;
  final VoidCallback onSelected;

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onSelected(),
    );
  }
}
