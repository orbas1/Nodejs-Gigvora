import 'dart:collection';

class CvDocumentVersion {
  const CvDocumentVersion({
    required this.versionNumber,
    this.summary,
    this.metrics = const <String, dynamic>{},
  });

  factory CvDocumentVersion.fromJson(Map<String, dynamic> json) {
    return CvDocumentVersion(
      versionNumber: json['versionNumber'] is num ? (json['versionNumber'] as num).toInt() : 1,
      summary: json['summary'] as String?,
      metrics: Map<String, dynamic>.from(json['metrics'] as Map? ?? const <String, dynamic>{}),
    );
  }

  final int versionNumber;
  final String? summary;
  final Map<String, dynamic> metrics;
}

class CvDocument {
  CvDocument({
    required this.id,
    required this.title,
    required this.status,
    this.roleTag,
    this.geographyTag,
    List<String>? tags,
    Map<String, dynamic>? metadata,
    this.latestVersion,
    this.updatedAt,
  })  : tags = UnmodifiableListView(tags ?? const <String>[]),
        metadata = UnmodifiableMapView(metadata ?? const <String, dynamic>{});

  factory CvDocument.fromJson(Map<String, dynamic> json) {
    final latestVersion = json['latestVersion'] as Map<String, dynamic>?;
    final rawTags = json['tags'];
    List<String> tags = const <String>[];
    if (rawTags is List) {
      tags = rawTags.whereType<String>().map((tag) => tag.trim()).where((tag) => tag.isNotEmpty).toList();
    }
    final metadata = json['metadata'] as Map<String, dynamic>? ?? const <String, dynamic>{};
    return CvDocument(
      id: json['id'] is num ? (json['id'] as num).toInt() : 0,
      title: json['title'] as String? ?? 'Untitled CV',
      status: json['status'] as String? ?? 'draft',
      roleTag: json['roleTag'] as String?,
      geographyTag: json['geographyTag'] as String?,
      tags: tags,
      metadata: metadata,
      latestVersion: latestVersion != null ? CvDocumentVersion.fromJson(latestVersion) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt'] as String) : null,
    );
  }

  final int id;
  final String title;
  final String status;
  final String? roleTag;
  final String? geographyTag;
  final UnmodifiableListView<String> tags;
  final UnmodifiableMapView<String, dynamic> metadata;
  final CvDocumentVersion? latestVersion;
  final DateTime? updatedAt;

  bool get isBaseline => metadata['isBaseline'] == true;
}

class CvWorkspaceSummary {
  const CvWorkspaceSummary({
    required this.totalDocuments,
    required this.totalVersions,
    required this.aiAssistedCount,
    this.lastUpdatedAt,
  });

  factory CvWorkspaceSummary.fromJson(Map<String, dynamic> json) {
    return CvWorkspaceSummary(
      totalDocuments: json['totalDocuments'] is num ? (json['totalDocuments'] as num).toInt() : 0,
      totalVersions: json['totalVersions'] is num ? (json['totalVersions'] as num).toInt() : 0,
      aiAssistedCount: json['aiAssistedCount'] is num ? (json['aiAssistedCount'] as num).toInt() : 0,
      lastUpdatedAt: json['lastUpdatedAt'] != null ? DateTime.tryParse(json['lastUpdatedAt'] as String) : null,
    );
  }

  final int totalDocuments;
  final int totalVersions;
  final int aiAssistedCount;
  final DateTime? lastUpdatedAt;
}

class CvWorkspaceSnapshot {
  CvWorkspaceSnapshot({
    required this.summary,
    this.baseline,
    List<CvDocument>? variants,
  }) : variants = UnmodifiableListView(variants ?? const <CvDocument>[]);

  factory CvWorkspaceSnapshot.fromJson(Map<String, dynamic> json) {
    final summaryJson = json['summary'] as Map<String, dynamic>? ?? const <String, dynamic>{};
    final baselineJson = json['baseline'] as Map<String, dynamic>?;
    final variantsJson = json['variants'] as List<dynamic>? ?? const <dynamic>[];
    return CvWorkspaceSnapshot(
      summary: CvWorkspaceSummary.fromJson(summaryJson),
      baseline: baselineJson != null ? CvDocument.fromJson(baselineJson) : null,
      variants: variantsJson
          .whereType<Map<String, dynamic>>()
          .map(CvDocument.fromJson)
          .toList(growable: false),
    );
  }

  final CvWorkspaceSummary summary;
  final CvDocument? baseline;
  final UnmodifiableListView<CvDocument> variants;
}

class CvDocumentDraft {
  CvDocumentDraft({
    required this.title,
    this.roleTag,
    this.geographyTag,
    this.persona,
    this.impact,
    this.summary,
    this.content,
    this.tags = const <String>[],
    this.isBaseline = false,
    this.metadata,
    this.file,
  });

  final String title;
  final String? roleTag;
  final String? geographyTag;
  final String? persona;
  final String? impact;
  final String? summary;
  final String? content;
  final List<String> tags;
  final bool isBaseline;
  final Map<String, dynamic>? metadata;
  final CvFileAttachment? file;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'title': title,
      if (roleTag != null && roleTag!.isNotEmpty) 'roleTag': roleTag,
      if (geographyTag != null && geographyTag!.isNotEmpty) 'geographyTag': geographyTag,
      if (persona != null && persona!.isNotEmpty) 'persona': persona,
      if (impact != null && impact!.isNotEmpty) 'impact': impact,
      if (summary != null && summary!.isNotEmpty) 'summary': summary,
      if (content != null && content!.isNotEmpty) 'content': content,
      if (tags.isNotEmpty) 'tags': tags,
      'isBaseline': isBaseline,
      if (metadata != null && metadata!.isNotEmpty) 'metadata': metadata,
      if (file != null) 'file': file!.toJson(),
    };
  }
}

class CvVersionUpload {
  CvVersionUpload({
    this.summary,
    this.setAsBaseline = true,
    this.file,
  });

  final String? summary;
  final bool setAsBaseline;
  final CvFileAttachment? file;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      if (summary != null && summary!.isNotEmpty) 'summary': summary,
      'setAsBaseline': setAsBaseline,
      if (file != null) 'file': file!.toJson(),
    };
  }
}

class CvFileAttachment {
  CvFileAttachment({
    required this.fileName,
    required this.mimeType,
    required this.size,
    required this.base64,
  });

  final String fileName;
  final String mimeType;
  final int size;
  final String base64;

  Map<String, dynamic> toJson() => <String, dynamic>{
        'fileName': fileName,
        'mimeType': mimeType,
        'size': size,
        'base64': base64,
      };
}
