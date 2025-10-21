import 'dart:math';

enum JobApplicationStatus {
  draft('Draft', 'Draft saved locally'),
  submitted('Submitted', 'Application sent to employer'),
  interviewing('Interviewing', 'Currently in the interview process'),
  offer('Offer', 'Offer under review'),
  rejected('Rejected', 'Application declined'),
  withdrawn('Withdrawn', 'Application withdrawn by candidate');

  const JobApplicationStatus(this.label, this.helper);

  final String label;
  final String helper;

  static JobApplicationStatus parse(String? value) {
    if (value == null) {
      return JobApplicationStatus.draft;
    }
    final normalised = value.trim().toLowerCase();
    return JobApplicationStatus.values.firstWhere(
      (status) => status.name == normalised,
      orElse: () {
        switch (normalised) {
          case 'submitted':
            return JobApplicationStatus.submitted;
          case 'interview':
          case 'interviewing':
            return JobApplicationStatus.interviewing;
          case 'offer':
            return JobApplicationStatus.offer;
          case 'reject':
          case 'rejected':
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
    required this.endsAt,
    required this.format,
    this.host,
    this.location,
    this.notes,
    this.videoUrl,
  });

  final String id;
  final String label;
  final DateTime startsAt;
  final DateTime endsAt;
  final String format;
  final String? host;
  final String? location;
  final String? notes;
  final String? videoUrl;

  factory InterviewStep.fromJson(Map<String, dynamic> json) {
    final id = (json['id'] as String? ?? '').trim();
    final label = (json['label'] as String? ?? '').trim();
    final format = (json['format'] as String? ?? '').trim();
    final host = (json['host'] as String?)?.trim();
    final location = (json['location'] as String?)?.trim();
    final notes = (json['notes'] as String?)?.trim();
    final videoUrl = (json['videoUrl'] as String?)?.trim();
    return InterviewStep(
      id: id.isEmpty ? _generateInterviewId(label) : id,
      label: label.isEmpty ? 'Interview step' : label,
      startsAt: DateTime.tryParse(json['startsAt'] as String? ?? '') ?? DateTime.now(),
      endsAt: DateTime.tryParse(json['endsAt'] as String? ?? '') ??
          DateTime.now().add(const Duration(hours: 1)),
      format: format.isEmpty ? 'Virtual' : format,
      host: host?.isEmpty ?? true ? null : host,
      location: location?.isEmpty ?? true ? null : location,
      notes: notes?.isEmpty ?? true ? null : notes,
      videoUrl: videoUrl?.isEmpty ?? true ? null : videoUrl,
    );
  }

  InterviewStep copyWith({
    String? id,
    String? label,
    DateTime? startsAt,
    DateTime? endsAt,
    String? format,
    String? host,
    String? location,
    String? notes,
    String? videoUrl,
  }) {
    return InterviewStep(
      id: id ?? this.id,
      label: label ?? this.label,
      startsAt: startsAt ?? this.startsAt,
      endsAt: endsAt ?? this.endsAt,
      format: format ?? this.format,
      host: host ?? this.host,
      location: location ?? this.location,
      notes: notes ?? this.notes,
      videoUrl: videoUrl ?? this.videoUrl,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'label': label,
      'startsAt': startsAt.toIso8601String(),
      'endsAt': endsAt.toIso8601String(),
      'format': format,
      if (host != null && host!.isNotEmpty) 'host': host,
      if (location != null && location!.isNotEmpty) 'location': location,
      if (notes != null && notes!.isNotEmpty) 'notes': notes,
      if (videoUrl != null && videoUrl!.isNotEmpty) 'videoUrl': videoUrl,
    };
  }
}

class JobApplicationRecord {
  const JobApplicationRecord({
    required this.id,
    required this.jobId,
    required this.role,
    required this.company,
    required this.status,
    required this.submittedAt,
    required this.updatedAt,
    this.coverLetter,
    this.resumeUrl,
    this.portfolioUrl,
    this.recruiterEmail,
    this.salaryExpectation,
    this.notes,
    this.locationPreference,
    this.remotePreference,
    this.interviews = const <InterviewStep>[],
    this.attachments = const <String>[],
  });

  final String id;
  final String jobId;
  final String role;
  final String company;
  final JobApplicationStatus status;
  final DateTime submittedAt;
  final DateTime updatedAt;
  final String? coverLetter;
  final String? resumeUrl;
  final String? portfolioUrl;
  final String? recruiterEmail;
  final String? salaryExpectation;
  final String? notes;
  final String? locationPreference;
  final bool? remotePreference;
  final List<InterviewStep> interviews;
  final List<String> attachments;

  bool get isClosed => status == JobApplicationStatus.offer || status == JobApplicationStatus.rejected;

  JobApplicationRecord copyWith({
    String? id,
    String? jobId,
    String? role,
    String? company,
    JobApplicationStatus? status,
    DateTime? submittedAt,
    DateTime? updatedAt,
    String? coverLetter,
    String? resumeUrl,
    String? portfolioUrl,
    String? recruiterEmail,
    String? salaryExpectation,
    String? notes,
    String? locationPreference,
    bool? remotePreference,
    List<InterviewStep>? interviews,
    List<String>? attachments,
  }) {
    return JobApplicationRecord(
      id: id ?? this.id,
      jobId: jobId ?? this.jobId,
      role: role ?? this.role,
      company: company ?? this.company,
      status: status ?? this.status,
      submittedAt: submittedAt ?? this.submittedAt,
      updatedAt: updatedAt ?? this.updatedAt,
      coverLetter: coverLetter ?? this.coverLetter,
      resumeUrl: resumeUrl ?? this.resumeUrl,
      portfolioUrl: portfolioUrl ?? this.portfolioUrl,
      recruiterEmail: recruiterEmail ?? this.recruiterEmail,
      salaryExpectation: salaryExpectation ?? this.salaryExpectation,
      notes: notes ?? this.notes,
      locationPreference: locationPreference ?? this.locationPreference,
      remotePreference: remotePreference ?? this.remotePreference,
      interviews: interviews ?? this.interviews,
      attachments: attachments ?? this.attachments,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'jobId': jobId,
      'role': role,
      'company': company,
      'status': status.name,
      'submittedAt': submittedAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      if (coverLetter != null && coverLetter!.isNotEmpty) 'coverLetter': coverLetter,
      if (resumeUrl != null && resumeUrl!.isNotEmpty) 'resumeUrl': resumeUrl,
      if (portfolioUrl != null && portfolioUrl!.isNotEmpty) 'portfolioUrl': portfolioUrl,
      if (recruiterEmail != null && recruiterEmail!.isNotEmpty) 'recruiterEmail': recruiterEmail,
      if (salaryExpectation != null && salaryExpectation!.isNotEmpty) 'salaryExpectation': salaryExpectation,
      if (notes != null && notes!.isNotEmpty) 'notes': notes,
      if (locationPreference != null && locationPreference!.isNotEmpty) 'locationPreference': locationPreference,
      if (remotePreference != null) 'remotePreference': remotePreference,
      if (attachments.isNotEmpty) 'attachments': attachments,
      if (interviews.isNotEmpty) 'interviews': interviews.map((step) => step.toJson()).toList(growable: false),
    };
  }

  factory JobApplicationRecord.fromJson(Map<String, dynamic> json) {
    final attachments = (json['attachments'] as List<dynamic>? ?? const [])
        .whereType<String>()
        .map((item) => item.trim())
        .where((item) => item.isNotEmpty)
        .toList(growable: false);

    final interviews = (json['interviews'] as List<dynamic>? ?? const [])
        .whereType<Map>()
        .map((entry) => InterviewStep.fromJson(Map<String, dynamic>.from(entry)))
        .toList(growable: false);

    return JobApplicationRecord(
      id: (json['id'] as String? ?? '').trim(),
      jobId: (json['jobId'] as String? ?? '').trim(),
      role: (json['role'] as String? ?? '').trim(),
      company: (json['company'] as String? ?? '').trim(),
      status: JobApplicationStatus.parse(json['status'] as String?),
      submittedAt: DateTime.tryParse(json['submittedAt'] as String? ?? '') ?? DateTime.now(),
      updatedAt: DateTime.tryParse(json['updatedAt'] as String? ?? '') ?? DateTime.now(),
      coverLetter: (json['coverLetter'] as String?)?.trim(),
      resumeUrl: (json['resumeUrl'] as String?)?.trim(),
      portfolioUrl: (json['portfolioUrl'] as String?)?.trim(),
      recruiterEmail: (json['recruiterEmail'] as String?)?.trim(),
      salaryExpectation: (json['salaryExpectation'] as String?)?.trim(),
      notes: (json['notes'] as String?)?.trim(),
      locationPreference: (json['locationPreference'] as String?)?.trim(),
      remotePreference: json['remotePreference'] is bool ? json['remotePreference'] as bool : null,
      interviews: interviews,
      attachments: attachments,
    );
  }
}

class JobApplicationDraft {
  const JobApplicationDraft({
    required this.role,
    required this.company,
    this.coverLetter,
    this.resumeUrl,
    this.portfolioUrl,
    this.recruiterEmail,
    this.salaryExpectation,
    this.notes,
    this.locationPreference,
    this.remotePreference,
    this.attachments = const <String>[],
  });

  final String role;
  final String company;
  final String? coverLetter;
  final String? resumeUrl;
  final String? portfolioUrl;
  final String? recruiterEmail;
  final String? salaryExpectation;
  final String? notes;
  final String? locationPreference;
  final bool? remotePreference;
  final List<String> attachments;

  Map<String, dynamic> toJson() {
    return {
      'role': role,
      'company': company,
      if (coverLetter != null && coverLetter!.isNotEmpty) 'coverLetter': coverLetter,
      if (resumeUrl != null && resumeUrl!.isNotEmpty) 'resumeUrl': resumeUrl,
      if (portfolioUrl != null && portfolioUrl!.isNotEmpty) 'portfolioUrl': portfolioUrl,
      if (recruiterEmail != null && recruiterEmail!.isNotEmpty) 'recruiterEmail': recruiterEmail,
      if (salaryExpectation != null && salaryExpectation!.isNotEmpty) 'salaryExpectation': salaryExpectation,
      if (notes != null && notes!.isNotEmpty) 'notes': notes,
      if (locationPreference != null && locationPreference!.isNotEmpty) 'locationPreference': locationPreference,
      if (remotePreference != null) 'remotePreference': remotePreference,
      if (attachments.isNotEmpty) 'attachments': attachments,
    };
  }
}

String _generateInterviewId(String label) {
  final sanitized = label.replaceAll(RegExp(r'\s+'), '-').toLowerCase();
  final random = Random().nextInt(999999).toString().padLeft(6, '0');
  return '$sanitized-$random';
}
