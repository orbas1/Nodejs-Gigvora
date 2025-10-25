class SupportArticle {
  const SupportArticle({
    required this.id,
    required this.title,
    required this.summary,
    required this.url,
    this.tags = const <String>[],
    this.readTimeMinutes = 4,
  });

  final String id;
  final String title;
  final String summary;
  final String url;
  final List<String> tags;
  final int readTimeMinutes;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'summary': summary,
      'url': url,
      'tags': tags,
      'readTimeMinutes': readTimeMinutes,
    };
  }

  factory SupportArticle.fromJson(Map<String, dynamic> json) {
    return SupportArticle(
      id: (json['id'] as String? ?? '').trim(),
      title: (json['title'] as String? ?? '').trim(),
      summary: (json['summary'] as String? ?? '').trim(),
      url: (json['url'] as String? ?? '').trim(),
      tags: (json['tags'] as List<dynamic>? ?? const [])
          .whereType<String>()
          .map((tag) => tag.trim())
          .where((tag) => tag.isNotEmpty)
          .toList(growable: false),
      readTimeMinutes: json['readTimeMinutes'] is int
          ? json['readTimeMinutes'] as int
          : int.tryParse('${json['readTimeMinutes']}') ?? 4,
    );
  }
}

class SupportIncident {
  const SupportIncident({
    required this.id,
    required this.title,
    required this.status,
    required this.severity,
    required this.summary,
    required this.openedAt,
    this.nextUpdateAt,
    this.impactedSurfaces = const <String>[],
  });

  final String id;
  final String title;
  final String status;
  final String severity;
  final String summary;
  final DateTime openedAt;
  final DateTime? nextUpdateAt;
  final List<String> impactedSurfaces;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'status': status,
      'severity': severity,
      'summary': summary,
      'openedAt': openedAt.toIso8601String(),
      'nextUpdateAt': nextUpdateAt?.toIso8601String(),
      'impactedSurfaces': impactedSurfaces,
    };
  }

  factory SupportIncident.fromJson(Map<String, dynamic> json) {
    return SupportIncident(
      id: (json['id'] as String? ?? '').trim(),
      title: (json['title'] as String? ?? '').trim(),
      status: (json['status'] as String? ?? 'investigating').trim(),
      severity: (json['severity'] as String? ?? 'low').trim(),
      summary: (json['summary'] as String? ?? '').trim(),
      openedAt: DateTime.tryParse(json['openedAt'] as String? ?? '') ?? DateTime.now(),
      nextUpdateAt: DateTime.tryParse(json['nextUpdateAt'] as String? ?? ''),
      impactedSurfaces: (json['impactedSurfaces'] as List<dynamic>? ?? const [])
          .whereType<String>()
          .map((surface) => surface.trim())
          .where((surface) => surface.isNotEmpty)
          .toList(growable: false),
    );
  }
}

class SupportMessage {
  const SupportMessage({
    required this.id,
    required this.author,
    required this.role,
    required this.body,
    required this.createdAt,
    this.fromSupport = false,
  });

  final String id;
  final String author;
  final String role;
  final String body;
  final DateTime createdAt;
  final bool fromSupport;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'author': author,
      'role': role,
      'body': body,
      'createdAt': createdAt.toIso8601String(),
      'fromSupport': fromSupport,
    };
  }

  factory SupportMessage.fromJson(Map<String, dynamic> json) {
    return SupportMessage(
      id: (json['id'] as String? ?? '').trim(),
      author: (json['author'] as String? ?? '').trim(),
      role: (json['role'] as String? ?? '').trim(),
      body: (json['body'] as String? ?? '').trim(),
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      fromSupport: json['fromSupport'] == true,
    );
  }
}

class SupportTicket {
  const SupportTicket({
    required this.id,
    required this.subject,
    required this.category,
    required this.priority,
    required this.status,
    required this.summary,
    required this.createdAt,
    required this.updatedAt,
    this.escalated = false,
    this.messages = const <SupportMessage>[],
    this.attachments = const <String>[],
  });

  final String id;
  final String subject;
  final String category;
  final String priority;
  final String status;
  final String summary;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool escalated;
  final List<SupportMessage> messages;
  final List<String> attachments;

  SupportTicket copyWith({
    String? subject,
    String? category,
    String? priority,
    String? status,
    String? summary,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? escalated,
    List<SupportMessage>? messages,
    List<String>? attachments,
  }) {
    return SupportTicket(
      id: id,
      subject: subject ?? this.subject,
      category: category ?? this.category,
      priority: priority ?? this.priority,
      status: status ?? this.status,
      summary: summary ?? this.summary,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      escalated: escalated ?? this.escalated,
      messages: messages ?? this.messages,
      attachments: attachments ?? this.attachments,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'subject': subject,
      'category': category,
      'priority': priority,
      'status': status,
      'summary': summary,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'escalated': escalated,
      'messages': messages.map((message) => message.toJson()).toList(growable: false),
      'attachments': attachments,
    };
  }

  factory SupportTicket.fromJson(Map<String, dynamic> json) {
    return SupportTicket(
      id: (json['id'] as String? ?? '').trim(),
      subject: (json['subject'] as String? ?? '').trim(),
      category: (json['category'] as String? ?? '').trim(),
      priority: (json['priority'] as String? ?? 'normal').trim(),
      status: (json['status'] as String? ?? 'open').trim(),
      summary: (json['summary'] as String? ?? '').trim(),
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      updatedAt: DateTime.tryParse(json['updatedAt'] as String? ?? '') ?? DateTime.now(),
      escalated: json['escalated'] == true,
      messages: (json['messages'] as List<dynamic>? ?? const [])
          .whereType<Map>()
          .map((entry) => SupportMessage.fromJson(Map<String, dynamic>.from(entry)))
          .toList(growable: false),
      attachments: (json['attachments'] as List<dynamic>? ?? const [])
          .whereType<String>()
          .map((entry) => entry.trim())
          .where((entry) => entry.isNotEmpty)
          .toList(growable: false),
    );
  }
}

class SupportSnapshot {
  const SupportSnapshot({
    required this.openTickets,
    required this.recentTickets,
    required this.articles,
    required this.firstResponseMinutes,
    required this.satisfactionScore,
    this.incidents = const <SupportIncident>[],
  });

  final List<SupportTicket> openTickets;
  final List<SupportTicket> recentTickets;
  final List<SupportArticle> articles;
  final int firstResponseMinutes;
  final double satisfactionScore;
  final List<SupportIncident> incidents;

  SupportSnapshot copyWith({
    List<SupportTicket>? openTickets,
    List<SupportTicket>? recentTickets,
    List<SupportArticle>? articles,
    int? firstResponseMinutes,
    double? satisfactionScore,
    List<SupportIncident>? incidents,
  }) {
    return SupportSnapshot(
      openTickets: openTickets ?? this.openTickets,
      recentTickets: recentTickets ?? this.recentTickets,
      articles: articles ?? this.articles,
      firstResponseMinutes: firstResponseMinutes ?? this.firstResponseMinutes,
      satisfactionScore: satisfactionScore ?? this.satisfactionScore,
      incidents: incidents ?? this.incidents,
    );
  }
}

class SupportTicketDraft {
  const SupportTicketDraft({
    required this.subject,
    required this.category,
    required this.priority,
    required this.summary,
    this.attachments = const <String>[],
  });

  final String subject;
  final String category;
  final String priority;
  final String summary;
  final List<String> attachments;

  Map<String, dynamic> toJson() {
    return {
      'subject': subject,
      'category': category,
      'priority': priority,
      'summary': summary,
      'attachments': attachments,
    };
  }
}

class SupportMessageDraft {
  const SupportMessageDraft({
    required this.author,
    required this.role,
    required this.body,
    this.fromSupport = false,
  });

  final String author;
  final String role;
  final String body;
  final bool fromSupport;

  SupportMessage toMessage() {
    return SupportMessage(
      id: 'msg-${DateTime.now().microsecondsSinceEpoch}',
      author: author,
      role: role,
      body: body,
      createdAt: DateTime.now(),
      fromSupport: fromSupport,
    );
  }
}
