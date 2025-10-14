import 'package:flutter/material.dart';

class UserDashboardSnapshot {
  const UserDashboardSnapshot({
    required this.generatedAt,
    required this.fromCache,
    required this.summary,
    required this.pipeline,
    required this.upcomingInterviews,
    required this.documentStudio,
    required this.nextActions,
    required this.focusDigest,
    required this.complianceAlerts,
  });

  final DateTime generatedAt;
  final bool fromCache;
  final UserDashboardSummary summary;
  final UserPipelineAutomation pipeline;
  final List<UserInterviewSchedule> upcomingInterviews;
  final DocumentStudioDigest documentStudio;
  final List<UserDashboardAction> nextActions;
  final FocusDigest focusDigest;
  final List<String> complianceAlerts;

  UserDashboardSnapshot copyWith({
    DateTime? generatedAt,
    bool? fromCache,
    UserDashboardSummary? summary,
    UserPipelineAutomation? pipeline,
    List<UserInterviewSchedule>? upcomingInterviews,
    DocumentStudioDigest? documentStudio,
    List<UserDashboardAction>? nextActions,
    FocusDigest? focusDigest,
    List<String>? complianceAlerts,
  }) {
    return UserDashboardSnapshot(
      generatedAt: generatedAt ?? this.generatedAt,
      fromCache: fromCache ?? this.fromCache,
      summary: summary ?? this.summary,
      pipeline: pipeline ?? this.pipeline,
      upcomingInterviews: upcomingInterviews ?? this.upcomingInterviews,
      documentStudio: documentStudio ?? this.documentStudio,
      nextActions: nextActions ?? this.nextActions,
      focusDigest: focusDigest ?? this.focusDigest,
      complianceAlerts: complianceAlerts ?? this.complianceAlerts,
    );
  }
}

class UserDashboardSummary {
  const UserDashboardSummary({
    required this.totalApplications,
    required this.activeApplications,
    required this.interviewsScheduled,
    required this.documentsUploaded,
    required this.offersNegotiating,
    required this.connections,
  });

  final int totalApplications;
  final int activeApplications;
  final int interviewsScheduled;
  final int documentsUploaded;
  final int offersNegotiating;
  final int connections;
}

class UserPipelineAutomation {
  const UserPipelineAutomation({
    required this.boardName,
    required this.completionRate,
    required this.stages,
    required this.reminders,
    required this.guardrails,
    required this.nextAudit,
  });

  final String boardName;
  final double completionRate;
  final List<UserPipelineStage> stages;
  final List<UserPipelineReminder> reminders;
  final List<String> guardrails;
  final DateTime? nextAudit;
}

class UserPipelineStage {
  const UserPipelineStage({
    required this.name,
    required this.count,
    required this.serviceLevelHealth,
  });

  final String name;
  final int count;
  final double serviceLevelHealth;
}

class UserPipelineReminder {
  const UserPipelineReminder({
    required this.label,
    required this.dueAt,
    required this.priority,
  });

  final String label;
  final DateTime dueAt;
  final ReminderPriority priority;
}

enum ReminderPriority { low, medium, high }

class UserInterviewSchedule {
  const UserInterviewSchedule({
    required this.role,
    required this.company,
    required this.scheduledAt,
    required this.stage,
    required this.panel,
    required this.location,
  });

  final String role;
  final String company;
  final DateTime scheduledAt;
  final String stage;
  final String panel;
  final String location;
}

class DocumentStudioDigest {
  const DocumentStudioDigest({
    required this.totalAssets,
    required this.templates,
    required this.portfolioProjects,
    required this.vendorDeliverables,
    required this.lastUpdatedBy,
    required this.highlights,
  });

  final int totalAssets;
  final int templates;
  final int portfolioProjects;
  final int vendorDeliverables;
  final String lastUpdatedBy;
  final List<String> highlights;
}

class UserDashboardAction {
  const UserDashboardAction({
    required this.label,
    required this.description,
    required this.icon,
    required this.accent,
  });

  final String label;
  final String description;
  final IconData icon;
  final Color accent;
}

class FocusDigest {
  const FocusDigest({
    required this.nextFocusBlock,
    required this.focusArea,
    required this.minutesReserved,
    required this.highlights,
  });

  final DateTime? nextFocusBlock;
  final String focusArea;
  final int minutesReserved;
  final List<String> highlights;
}
