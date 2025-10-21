import 'package:collection/collection.dart';

enum JobApplicationStatus {
  draft('Draft'),
  submitted('Submitted'),
  interviewing('Interviewing'),
  offer('Offer extended'),
  rejected('Rejected'),
  withdrawn('Withdrawn');

  const JobApplicationStatus(this.label);

  final String label;

  static JobApplicationStatus parse(String? raw) {
    if (raw == null) {
      return JobApplicationStatus.draft;
    }
    final normalised = raw.trim().toLowerCase();
    return JobApplicationStatus.values.firstWhere(
      (status) => status.name == normalised,
      orElse: () {
        switch (normalised) {
          case 'submitted':
            return JobApplicationStatus.submitted;
          case 'interviewing':
          case 'interview':
            return JobApplicationStatus.interviewing;
          case 'offer':
            return JobApplicationStatus.offer;
          case 'rejected':
          case 'reject':
            return JobApplicationStatus.rejected;
          case 'withdrawn':
            return JobApplicationStatus.withdrawn;
          default:
            return JobApplicationStatus.draft;
        }
      },
    );
  }
}

class InterviewStep {
  const InterviewStep({
    required this.id,
    required this.label,
    required this.startsAt,
    this.format,
    this.host,
    this.notes,
  });

  final String id;
  final String label;
  final DateTime startsAt;
  final String? format;
  final String? host;
  final String? notes;

  InterviewStep copyWith({
    String? id,
    String? label,
    DateTime? startsAt,
    String? format,
    String? host,
    String? notes,
  }) {
    return InterviewStep(
      id: id ?? this.id,
      label: label ?? this.label,
      startsAt: startsAt ?? this.startsAt,
      format: format ?? this.format,
      host: host ?? this.host,
      notes: notes ?? this.notes,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'label': label,
      'startsAt': startsAt.toIso8601String(),
      if (format != null && format!.isNotEmpty) 'format': format,
      if (host != null && host!.isNotEmpty) 'host': host,
      if (notes != null && notes!.isNotEmpty) 'notes': notes,
    };
  }

  factory InterviewStep.fromJson(Map<String, dynamic> json) {
    return InterviewStep(
      id: (json['id'] as String? ?? '').trim().isEmpty
          ? 'interview-${DateTime.now().microsecondsSinceEpoch}'
          : (json['id'] as String).trim(),
      label: (json['label'] as String? ?? 'Interview').trim(),
      startsAt: DateTime.tryParse(json['startsAt'] as String? ?? '') ?? DateTime.now(),
      format: (json['format'] as String?)?.trim(),
      host: (json['host'] as String?)?.trim(),
      notes: (json['notes'] as String?)?.trim(),
    );
  }
}

class JobApplicationRecord {
  const JobApplicationRecord({
    required this.id,
    required this.jobId,
    required this.applicantName,
    required this.email,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.resumeUrl,
    this.portfolioUrl,
    this.coverLetter,
    this.phone,
    this.interviews = const <InterviewStep>[],
  });

  final String id;
  final String jobId;
  final String applicantName;
  final String email;
  final JobApplicationStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? resumeUrl;
  final String? portfolioUrl;
  final String? coverLetter;
  final String? phone;
  final List<InterviewStep> interviews;

  bool get hasUpcomingInterview => interviews.any((step) => step.startsAt.isAfter(DateTime.now()));

  JobApplicationRecord copyWith({
    String? id,
    String? jobId,
    String? applicantName,
    String? email,
    JobApplicationStatus? status,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? resumeUrl,
    String? portfolioUrl,
    String? coverLetter,
    String? phone,
    List<InterviewStep>? interviews,
  }) {
    return JobApplicationRecord(
      id: id ?? this.id,
      jobId: jobId ?? this.jobId,
      applicantName: applicantName ?? this.applicantName,
      email: email ?? this.email,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      resumeUrl: resumeUrl ?? this.resumeUrl,
      portfolioUrl: portfolioUrl ?? this.portfolioUrl,
      coverLetter: coverLetter ?? this.coverLetter,
      phone: phone ?? this.phone,
      interviews: interviews ?? this.interviews,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'jobId': jobId,
      'applicantName': applicantName,
      'email': email,
      'status': status.name,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      if (resumeUrl != null && resumeUrl!.isNotEmpty) 'resumeUrl': resumeUrl,
      if (portfolioUrl != null && portfolioUrl!.isNotEmpty) 'portfolioUrl': portfolioUrl,
      if (coverLetter != null && coverLetter!.isNotEmpty) 'coverLetter': coverLetter,
      if (phone != null && phone!.isNotEmpty) 'phone': phone,
      if (interviews.isNotEmpty)
        'interviews': interviews.map((step) => step.toJson()).toList(growable: false),
    };
  }

  factory JobApplicationRecord.fromJson(Map<String, dynamic> json) {
    final interviews = (json['interviews'] as List<dynamic>? ?? const [])
        .whereType<Map>()
        .map((raw) => InterviewStep.fromJson(Map<String, dynamic>.from(raw as Map)))
        .toList(growable: false);
    return JobApplicationRecord(
      id: (json['id'] as String? ?? '').trim(),
      jobId: (json['jobId'] as String? ?? '').trim(),
      applicantName: (json['applicantName'] as String? ?? 'Candidate').trim(),
      email: (json['email'] as String? ?? '').trim(),
      status: JobApplicationStatus.parse(json['status'] as String?),
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      updatedAt: DateTime.tryParse(json['updatedAt'] as String? ?? '') ?? DateTime.now(),
      resumeUrl: (json['resumeUrl'] as String?)?.trim(),
      portfolioUrl: (json['portfolioUrl'] as String?)?.trim(),
      coverLetter: (json['coverLetter'] as String?)?.trim(),
      phone: (json['phone'] as String?)?.trim(),
      interviews: interviews,
    );
  }
}

class JobApplicationDraft {
  const JobApplicationDraft({
    required this.applicantName,
    required this.email,
    this.resumeUrl,
    this.portfolioUrl,
    this.coverLetter,
    this.phone,
  });

  final String applicantName;
  final String email;
  final String? resumeUrl;
  final String? portfolioUrl;
  final String? coverLetter;
  final String? phone;

  bool get isValid => applicantName.trim().isNotEmpty && email.trim().isNotEmpty;
}

extension JobApplicationRecordListX on List<JobApplicationRecord> {
  List<JobApplicationRecord> sortedByMostRecent() {
    final copy = [...this];
    copy.sortBy<DateTime>((record) => record.updatedAt, compare: (a, b) => b.compareTo(a));
    return List<JobApplicationRecord>.unmodifiable(copy);
  }
}
