import 'package:flutter/material.dart';

import '../../../theme/widgets.dart';
import '../data/models/opportunity.dart';
import 'jobs_sections.dart';
import 'opportunity_list.dart';

class JobsScreen extends StatelessWidget {
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
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: GigvoraScaffold(
        title: 'Jobs',
        subtitle: 'Long-term roles across the Gigvora network',
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: Theme.of(context)
                      .colorScheme
                      .outlineVariant
                      .withOpacity(0.4),
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
                  OpportunityListView(
                    category: OpportunityCategory.job,
                    ctaLabel: 'Apply now',
                    searchPlaceholder: 'Search by title, location, or keywords',
                    emptyDefaultMessage:
                        'Jobs curated from trusted teams will appear here as we sync the marketplace.',
                    emptySearchMessage:
                        'No jobs matched your filters yet. Try broadening your search.',
                  ),
                  JobApplicationsPanel(applications: _applications),
                  JobInterviewsPanel(interviews: _interviews),
                  JobsManagementPanel(jobs: _managedJobs),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
