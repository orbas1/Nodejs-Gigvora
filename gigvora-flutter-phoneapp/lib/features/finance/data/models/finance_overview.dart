import 'package:collection/collection.dart';

import '../../../services/data/models/dispute_case.dart';

class FinanceSummary {
  const FinanceSummary({
    required this.currency,
    required this.inEscrow,
    required this.pendingRelease,
    required this.disputeHold,
    required this.releasedThisWeek,
    required this.netCashFlow7d,
    required this.forecast30d,
  });

  final String currency;
  final double inEscrow;
  final double pendingRelease;
  final double disputeHold;
  final double releasedThisWeek;
  final double netCashFlow7d;
  final double forecast30d;

  factory FinanceSummary.fromJson(Map<String, dynamic> json) {
    double toDouble(dynamic value) {
      if (value is num) return value.toDouble();
      if (value is String) {
        final parsed = double.tryParse(value);
        if (parsed != null) return parsed;
      }
      return 0;
    }

    return FinanceSummary(
      currency: json['currency'] as String? ?? 'USD',
      inEscrow: toDouble(json['inEscrow'] ?? json['totalInEscrow']),
      pendingRelease: toDouble(json['pendingRelease'] ?? json['pendingReleases']),
      disputeHold: toDouble(json['disputeHold'] ?? json['hold'] ?? json['disputeOnHold']),
      releasedThisWeek: toDouble(json['releasedThisWeek'] ?? json['releasedLast7Days']),
      netCashFlow7d: toDouble(json['netCashFlow7d'] ?? json['netOutflow7d']),
      forecast30d: toDouble(json['forecast30d'] ?? json['forecastedReleases30d']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'currency': currency,
      'inEscrow': inEscrow,
      'pendingRelease': pendingRelease,
      'disputeHold': disputeHold,
      'releasedThisWeek': releasedThisWeek,
      'netCashFlow7d': netCashFlow7d,
      'forecast30d': forecast30d,
    };
  }
}

class FinanceAutomationSignals {
  const FinanceAutomationSignals({
    required this.autoReleaseRate,
    required this.manualReviewRate,
    required this.disputeRate,
    required this.averageClearanceHours,
    required this.flaggedTransactions,
  });

  final double autoReleaseRate;
  final double manualReviewRate;
  final double disputeRate;
  final double averageClearanceHours;
  final int flaggedTransactions;

  factory FinanceAutomationSignals.fromJson(Map<String, dynamic> json) {
    double toDouble(dynamic value) {
      if (value is num) return value.toDouble();
      if (value is String) {
        final parsed = double.tryParse(value);
        if (parsed != null) return parsed;
      }
      return 0;
    }

    return FinanceAutomationSignals(
      autoReleaseRate: toDouble(json['autoReleaseRate'] ?? json['automationRate']),
      manualReviewRate: toDouble(json['manualReviewRate'] ?? json['manualRate']),
      disputeRate: toDouble(json['disputeRate'] ?? json['disputes']),
      averageClearanceHours: toDouble(json['averageClearanceHours'] ?? json['avgClearanceHours']),
      flaggedTransactions: (json['flaggedTransactions'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'autoReleaseRate': autoReleaseRate,
      'manualReviewRate': manualReviewRate,
      'disputeRate': disputeRate,
      'averageClearanceHours': averageClearanceHours,
      'flaggedTransactions': flaggedTransactions,
    };
  }
}

class FinanceAccountSummary {
  const FinanceAccountSummary({
    required this.id,
    required this.name,
    required this.institution,
    required this.balance,
    required this.currency,
    required this.safeguarding,
    required this.pendingTransfers,
    required this.status,
    required this.lastReconciledAt,
  });

  final String id;
  final String name;
  final String institution;
  final double balance;
  final String currency;
  final double safeguarding;
  final double pendingTransfers;
  final String status;
  final DateTime? lastReconciledAt;

  factory FinanceAccountSummary.fromJson(Map<String, dynamic> json) {
    double toDouble(dynamic value) {
      if (value is num) return value.toDouble();
      if (value is String) {
        final parsed = double.tryParse(value);
        if (parsed != null) return parsed;
      }
      return 0;
    }

    DateTime? toDate(dynamic value) {
      if (value is DateTime) return value;
      if (value is String) {
        return DateTime.tryParse(value);
      }
      return null;
    }

    return FinanceAccountSummary(
      id: json['id'] as String? ?? json['accountId'] as String? ?? json['name'] as String? ?? 'account',
      name: json['name'] as String? ?? json['label'] as String? ?? 'Escrow account',
      institution: json['institution'] as String? ?? json['bank'] as String? ?? 'Financial partner',
      balance: toDouble(json['balance'] ?? json['currentBalance']),
      currency: json['currency'] as String? ?? json['currencyCode'] as String? ?? 'USD',
      safeguarding: toDouble(json['safeguarding'] ?? json['safeguarded'] ?? json['safeguardingBalance']),
      pendingTransfers: toDouble(json['pendingTransfers'] ?? json['pending']),
      status: (json['status'] as String? ?? json['health'] as String? ?? 'healthy').toLowerCase(),
      lastReconciledAt: toDate(json['lastReconciledAt'] ?? json['lastReconciled']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'institution': institution,
      'balance': balance,
      'currency': currency,
      'safeguarding': safeguarding,
      'pendingTransfers': pendingTransfers,
      'status': status,
      'lastReconciledAt': lastReconciledAt?.toIso8601String(),
    };
  }
}

class FinanceRelease {
  const FinanceRelease({
    required this.id,
    required this.reference,
    required this.vendor,
    required this.milestone,
    required this.amount,
    required this.currency,
    required this.automation,
    required this.risk,
    required this.requiresEvidence,
    this.scheduledAt,
  });

  final String id;
  final String reference;
  final String vendor;
  final String milestone;
  final double amount;
  final String currency;
  final String automation;
  final String risk;
  final bool requiresEvidence;
  final DateTime? scheduledAt;

  factory FinanceRelease.fromJson(Map<String, dynamic> json) {
    double toDouble(dynamic value) {
      if (value is num) return value.toDouble();
      if (value is String) {
        final parsed = double.tryParse(value);
        if (parsed != null) return parsed;
      }
      return 0;
    }

    DateTime? toDate(dynamic value) {
      if (value is DateTime) return value;
      if (value is String) {
        return DateTime.tryParse(value);
      }
      return null;
    }

    return FinanceRelease(
      id: json['id'] as String? ?? json['reference'] as String? ?? 'release',
      reference: json['reference'] as String? ?? json['id'] as String? ?? 'escrow',
      vendor: json['vendor'] as String? ?? json['vendorName'] as String? ?? json['recipient'] as String? ?? 'Vendor',
      milestone: json['milestone'] as String? ?? json['milestoneLabel'] as String? ?? json['phase'] as String? ?? 'Milestone',
      amount: toDouble(json['amount'] ?? json['netAmount']),
      currency: json['currency'] as String? ?? json['currencyCode'] as String? ?? 'USD',
      automation: (json['automation'] as String? ?? json['automationTag'] as String? ?? 'manual').toLowerCase(),
      risk: (json['risk'] as String? ?? json['health'] as String? ?? 'on_track').toLowerCase(),
      requiresEvidence: (json['requiresEvidence'] ?? json['needsEvidence']) == true,
      scheduledAt: toDate(json['scheduledAt'] ?? json['scheduledReleaseAt'] ?? json['targetDate']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'reference': reference,
      'vendor': vendor,
      'milestone': milestone,
      'amount': amount,
      'currency': currency,
      'automation': automation,
      'risk': risk,
      'requiresEvidence': requiresEvidence,
      'scheduledAt': scheduledAt?.toIso8601String(),
    };
  }
}

class FinanceComplianceTask {
  const FinanceComplianceTask({
    required this.id,
    required this.title,
    required this.owner,
    required this.severity,
    required this.status,
    required this.tags,
    this.dueDate,
  });

  final String id;
  final String title;
  final String owner;
  final String severity;
  final String status;
  final List<String> tags;
  final DateTime? dueDate;

  factory FinanceComplianceTask.fromJson(Map<String, dynamic> json) {
    DateTime? toDate(dynamic value) {
      if (value is DateTime) return value;
      if (value is String) return DateTime.tryParse(value);
      return null;
    }

    List<String> toTags(dynamic value) {
      if (value is List) {
        return value.map((item) => '$item').toList(growable: false);
      }
      if (value is String) {
        return value.split(',').map((item) => item.trim()).where((item) => item.isNotEmpty).toList(growable: false);
      }
      return const <String>[];
    }

    return FinanceComplianceTask(
      id: json['id'] as String? ?? json['key'] as String? ?? 'task',
      title: json['title'] as String? ?? json['summary'] as String? ?? 'Compliance task',
      owner: json['owner'] as String? ?? json['assignee'] as String? ?? 'Finance ops',
      severity: (json['severity'] as String? ?? json['urgency'] as String? ?? 'medium').toLowerCase(),
      status: (json['status'] as String? ?? 'open').toLowerCase(),
      tags: toTags(json['tags'] ?? json['labels']),
      dueDate: toDate(json['dueDate'] ?? json['due'] ?? json['deadline']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'owner': owner,
      'severity': severity,
      'status': status,
      'tags': tags,
      'dueDate': dueDate?.toIso8601String(),
    };
  }
}

class FinanceCashflowBucket {
  const FinanceCashflowBucket({
    required this.id,
    required this.label,
    required this.inflow,
    required this.outflow,
    required this.net,
  });

  final String id;
  final String label;
  final double inflow;
  final double outflow;
  final double net;

  factory FinanceCashflowBucket.fromJson(Map<String, dynamic> json) {
    double toDouble(dynamic value) {
      if (value is num) return value.toDouble();
      if (value is String) {
        final parsed = double.tryParse(value);
        if (parsed != null) return parsed;
      }
      return 0;
    }

    return FinanceCashflowBucket(
      id: json['id'] as String? ?? json['label'] as String? ?? 'bucket',
      label: json['label'] as String? ?? json['period'] as String? ?? 'Period',
      inflow: toDouble(json['inflow'] ?? json['inflows']),
      outflow: toDouble(json['outflow'] ?? json['outflows']),
      net: toDouble(json['net']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'label': label,
      'inflow': inflow,
      'outflow': outflow,
      'net': net,
    };
  }
}

class FinanceOverview {
  const FinanceOverview({
    required this.summary,
    required this.automation,
    required this.accounts,
    required this.releases,
    required this.disputes,
    required this.complianceTasks,
    required this.cashflow,
  });

  final FinanceSummary summary;
  final FinanceAutomationSignals automation;
  final List<FinanceAccountSummary> accounts;
  final List<FinanceRelease> releases;
  final List<DisputeCase> disputes;
  final List<FinanceComplianceTask> complianceTasks;
  final List<FinanceCashflowBucket> cashflow;

  bool get isEmpty =>
      accounts.isEmpty && releases.isEmpty && disputes.isEmpty && complianceTasks.isEmpty && cashflow.isEmpty;

  factory FinanceOverview.fromJson(Map<String, dynamic> json) {
    FinanceAutomationSignals? automation;
    if (json['automation'] is Map<String, dynamic>) {
      automation = FinanceAutomationSignals.fromJson(json['automation'] as Map<String, dynamic>);
    }

    return FinanceOverview(
      summary: FinanceSummary.fromJson((json['summary'] as Map?)?.cast<String, dynamic>() ?? const <String, dynamic>{}),
      automation: automation ?? const FinanceAutomationSignals(
        autoReleaseRate: 0,
        manualReviewRate: 0,
        disputeRate: 0,
        averageClearanceHours: 0,
        flaggedTransactions: 0,
      ),
      accounts: (json['accounts'] as List?)
              ?.map((item) => FinanceAccountSummary.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false) ??
          const <FinanceAccountSummary>[],
      releases: (json['releaseQueue'] as List?)
              ?.map((item) => FinanceRelease.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false) ??
          const <FinanceRelease>[],
      disputes: (json['disputeQueue'] as List?)
              ?.map((item) => DisputeCase.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false) ??
          const <DisputeCase>[],
      complianceTasks: (json['complianceTasks'] as List?)
              ?.map((item) => FinanceComplianceTask.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false) ??
          const <FinanceComplianceTask>[],
      cashflow: (json['cashflow'] as List?)
              ?.map((item) => FinanceCashflowBucket.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false) ??
          const <FinanceCashflowBucket>[],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'summary': summary.toJson(),
      'automation': automation.toJson(),
      'accounts': accounts.map((account) => account.toJson()).toList(growable: false),
      'releaseQueue': releases.map((release) => release.toJson()).toList(growable: false),
      'disputeQueue': disputes.map((dispute) => dispute.toJson()).toList(growable: false),
      'complianceTasks': complianceTasks.map((task) => task.toJson()).toList(growable: false),
      'cashflow': cashflow.map((bucket) => bucket.toJson()).toList(growable: false),
    };
  }

  FinanceOverview copyWith({
    FinanceSummary? summary,
    FinanceAutomationSignals? automation,
    List<FinanceAccountSummary>? accounts,
    List<FinanceRelease>? releases,
    List<DisputeCase>? disputes,
    List<FinanceComplianceTask>? complianceTasks,
    List<FinanceCashflowBucket>? cashflow,
  }) {
    return FinanceOverview(
      summary: summary ?? this.summary,
      automation: automation ?? this.automation,
      accounts: accounts ?? this.accounts,
      releases: releases ?? this.releases,
      disputes: disputes ?? this.disputes,
      complianceTasks: complianceTasks ?? this.complianceTasks,
      cashflow: cashflow ?? this.cashflow,
    );
  }

  static FinanceOverview empty() {
    return FinanceOverview(
      summary: const FinanceSummary(
        currency: 'USD',
        inEscrow: 0,
        pendingRelease: 0,
        disputeHold: 0,
        releasedThisWeek: 0,
        netCashFlow7d: 0,
        forecast30d: 0,
      ),
      automation: const FinanceAutomationSignals(
        autoReleaseRate: 0,
        manualReviewRate: 0,
        disputeRate: 0,
        averageClearanceHours: 0,
        flaggedTransactions: 0,
      ),
      accounts: const <FinanceAccountSummary>[],
      releases: const <FinanceRelease>[],
      disputes: const <DisputeCase>[],
      complianceTasks: const <FinanceComplianceTask>[],
      cashflow: const <FinanceCashflowBucket>[],
    );
  }
}

extension FinanceOverviewExtensions on FinanceOverview {
  double get maxCashflowMagnitude {
    return cashflow
        .map((bucket) => [bucket.net.abs(), bucket.inflow.abs(), bucket.outflow.abs()].max ?? 0)
        .max ??
        0;
  }
}
