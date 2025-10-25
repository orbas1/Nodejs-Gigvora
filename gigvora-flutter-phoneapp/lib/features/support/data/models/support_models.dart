class SupportResourceLink {
  const SupportResourceLink({
    required this.label,
    required this.url,
  });

  final String label;
  final String url;

  factory SupportResourceLink.fromJson(Map<String, dynamic> json) {
    return SupportResourceLink(
      label: (json['label'] as String? ?? json['title'] as String? ?? '').trim(),
      url: (json['url'] as String? ?? '').trim(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      'url': url,
    };
  }
}

class SupportArticle {
  const SupportArticle({
    required this.slug,
    required this.title,
    required this.summary,
    required this.category,
    required this.url,
    this.tags = const <String>[],
    this.resourceLinks = const <SupportResourceLink>[],
    this.readTimeMinutes = 4,
    this.lastReviewedAt,
  });

  final String slug;
  final String title;
  final String summary;
  final String category;
  final String url;
  final List<String> tags;
  final List<SupportResourceLink> resourceLinks;
  final int readTimeMinutes;
  final DateTime? lastReviewedAt;

  factory SupportArticle.fromJson(Map<String, dynamic> json) {
    final rawTags = json['tags'];
    final rawLinks = json['resourceLinks'];
    final tags = <String>[];
    if (rawTags is List) {
      for (final entry in rawTags) {
        if (entry is String && entry.trim().isNotEmpty) {
          tags.add(entry.trim());
        }
      }
    }
    final links = <SupportResourceLink>[];
    if (rawLinks is List) {
      for (final entry in rawLinks) {
        if (entry is Map<String, dynamic>) {
          final link = SupportResourceLink.fromJson(entry);
          if (link.label.isNotEmpty && link.url.isNotEmpty) {
            links.add(link);
          }
        } else if (entry is Map) {
          final link = SupportResourceLink.fromJson(Map<String, dynamic>.from(entry));
          if (link.label.isNotEmpty && link.url.isNotEmpty) {
            links.add(link);
          }
        }
      }
    }

    return SupportArticle(
      slug: (json['slug'] as String? ?? json['id'] as String? ?? '').trim(),
      title: (json['title'] as String? ?? '').trim(),
      summary: (json['summary'] as String? ?? '').trim(),
      category: (json['category'] as String? ?? 'general').trim(),
      url: (json['url'] as String? ?? '').trim(),
      tags: List<String>.unmodifiable(tags),
      resourceLinks: List<SupportResourceLink>.unmodifiable(links),
      readTimeMinutes: json['readTimeMinutes'] is int
          ? json['readTimeMinutes'] as int
          : int.tryParse('${json['readTimeMinutes']}') ?? 4,
      lastReviewedAt: json['lastReviewedAt'] != null
          ? DateTime.tryParse('${json['lastReviewedAt']}')
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'slug': slug,
      'title': title,
      'summary': summary,
      'category': category,
      'url': url,
      'tags': tags,
      'resourceLinks': resourceLinks.map((link) => link.toJson()).toList(growable: false),
      'readTimeMinutes': readTimeMinutes,
      'lastReviewedAt': lastReviewedAt?.toIso8601String(),
    };
  }

  SupportArticle copyWith({
    String? slug,
    String? title,
    String? summary,
    String? category,
    String? url,
    List<String>? tags,
    List<SupportResourceLink>? resourceLinks,
    int? readTimeMinutes,
    DateTime? lastReviewedAt,
  }) {
    return SupportArticle(
      slug: slug ?? this.slug,
      title: title ?? this.title,
      summary: summary ?? this.summary,
      category: category ?? this.category,
      url: url ?? this.url,
      tags: tags ?? this.tags,
      resourceLinks: resourceLinks ?? this.resourceLinks,
      readTimeMinutes: readTimeMinutes ?? this.readTimeMinutes,
      lastReviewedAt: lastReviewedAt ?? this.lastReviewedAt,
    );
  }
}

class SupportMessageAttachment {
  const SupportMessageAttachment({
    required this.label,
    this.url,
    this.mimeType,
    this.fileSize,
  });

  final String label;
  final String? url;
  final String? mimeType;
  final int? fileSize;

  factory SupportMessageAttachment.fromJson(Map<String, dynamic> json) {
    final fileName = (json['fileName'] as String? ?? '').trim();
    final url = (json['url'] as String? ?? json['publicUrl'] as String? ?? '').trim();
    return SupportMessageAttachment(
      label: fileName.isNotEmpty ? fileName : (json['storageKey'] as String? ?? '').trim(),
      url: url.isNotEmpty ? url : null,
      mimeType: (json['mimeType'] as String?)?.trim(),
      fileSize: json['fileSize'] is num ? (json['fileSize'] as num).toInt() : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      if (url != null) 'url': url,
      if (mimeType != null) 'mimeType': mimeType,
      if (fileSize != null) 'fileSize': fileSize,
    };
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
    this.attachments = const <SupportMessageAttachment>[],
  });

  final String id;
  final String author;
  final String role;
  final String body;
  final DateTime createdAt;
  final bool fromSupport;
  final List<SupportMessageAttachment> attachments;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'author': author,
      'role': role,
      'body': body,
      'createdAt': createdAt.toIso8601String(),
      'fromSupport': fromSupport,
      'attachments': attachments.map((attachment) => attachment.toJson()).toList(growable: false),
    };
  }

  factory SupportMessage.fromJson(Map<String, dynamic> json) {
    final sender = json['sender'];
    String author = (json['author'] as String? ?? '').trim();
    String role = (json['role'] as String? ?? '').trim();
    bool fromSupport = json['fromSupport'] == true;
    if (sender is Map) {
      final senderMap = Map<String, dynamic>.from(sender);
      final firstName = (senderMap['firstName'] as String? ?? '').trim();
      final lastName = (senderMap['lastName'] as String? ?? '').trim();
      final email = (senderMap['email'] as String? ?? '').trim();
      if (author.isEmpty) {
        author = [firstName, lastName].where((value) => value.isNotEmpty).join(' ').trim();
      }
      if (author.isEmpty && email.isNotEmpty) {
        author = email;
      }
      final userType = (senderMap['userType'] as String? ?? '').trim();
      if (role.isEmpty && userType.isNotEmpty) {
        role = userType;
      }
      if (!fromSupport) {
        fromSupport = senderMap['isFreelancer'] != true && (userType.isNotEmpty ? userType != 'user' : true);
      }
    }

    final rawAttachments = json['attachments'];
    final attachments = <SupportMessageAttachment>[];
    if (rawAttachments is List) {
      for (final entry in rawAttachments) {
        if (entry is Map<String, dynamic>) {
          attachments.add(SupportMessageAttachment.fromJson(entry));
        } else if (entry is Map) {
          attachments.add(SupportMessageAttachment.fromJson(Map<String, dynamic>.from(entry)));
        }
      }
    }

    return SupportMessage(
      id: (json['id'] as String? ?? '').trim(),
      author: author.isNotEmpty ? author : 'Gigvora member',
      role: role.isNotEmpty ? role : 'member',
      body: (json['body'] as String? ?? '').trim(),
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      fromSupport: fromSupport,
      attachments: List<SupportMessageAttachment>.unmodifiable(attachments),
    );
  }
}

class SupportCasePerson {
  const SupportCasePerson({
    required this.id,
    required this.name,
    this.email,
    this.userType,
  });

  final int? id;
  final String name;
  final String? email;
  final String? userType;

  factory SupportCasePerson.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const SupportCasePerson(id: null, name: '');
    }
    final firstName = (json['firstName'] as String? ?? '').trim();
    final lastName = (json['lastName'] as String? ?? '').trim();
    final email = (json['email'] as String? ?? '').trim();
    final name = [firstName, lastName].where((value) => value.isNotEmpty).join(' ').trim();
    return SupportCasePerson(
      id: json['id'] is num ? (json['id'] as num).toInt() : null,
      name: name.isNotEmpty ? name : (email.isNotEmpty ? email : 'Gigvora specialist'),
      email: email.isNotEmpty ? email : null,
      userType: (json['userType'] as String? ?? '').trim(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'userType': userType,
    };
  }
}

class SupportCaseLinkedOrder {
  const SupportCaseLinkedOrder({
    required this.reference,
    this.amount,
    this.currencyCode,
    this.status,
    this.gigTitle,
    this.clientName,
  });

  final String? reference;
  final double? amount;
  final String? currencyCode;
  final String? status;
  final String? gigTitle;
  final String? clientName;

  factory SupportCaseLinkedOrder.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const SupportCaseLinkedOrder(reference: null);
    }
    return SupportCaseLinkedOrder(
      reference: (json['reference'] as String? ?? '').trim().isNotEmpty
          ? (json['reference'] as String).trim()
          : null,
      amount: json['amount'] is num
          ? (json['amount'] as num).toDouble()
          : json['orderAmount'] is num
              ? (json['orderAmount'] as num).toDouble()
              : null,
      currencyCode: (json['currencyCode'] as String? ?? '').trim().isNotEmpty
          ? (json['currencyCode'] as String).trim().toUpperCase()
          : null,
      status: (json['status'] as String? ?? '').trim(),
      gigTitle: (json['gigTitle'] as String? ?? '').trim(),
      clientName: (json['clientName'] as String? ?? '').trim(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'reference': reference,
      'amount': amount,
      'currencyCode': currencyCode,
      'status': status,
      'gigTitle': gigTitle,
      'clientName': clientName,
    };
  }
}

class SupportCaseLink {
  const SupportCaseLink({
    required this.type,
    this.reference,
    this.amount,
    this.currencyCode,
    this.gigTitle,
  });

  final String type;
  final String? reference;
  final double? amount;
  final String? currencyCode;
  final String? gigTitle;

  factory SupportCaseLink.fromJson(Map<String, dynamic> json) {
    return SupportCaseLink(
      type: (json['linkType'] as String? ?? json['type'] as String? ?? 'reference').trim(),
      reference: (json['reference'] as String? ?? '').trim().isNotEmpty
          ? (json['reference'] as String).trim()
          : null,
      amount: json['orderAmount'] is num ? (json['orderAmount'] as num).toDouble() : null,
      currencyCode: (json['currencyCode'] as String? ?? '').trim().toUpperCase(),
      gigTitle: (json['gigTitle'] as String? ?? '').trim(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'reference': reference,
      'amount': amount,
      'currencyCode': currencyCode,
      'gigTitle': gigTitle,
    };
  }
}

class SupportCase {
  const SupportCase({
    required this.id,
    required this.status,
    required this.priority,
    required this.title,
    required this.summary,
    required this.category,
    required this.escalatedAt,
    required this.updatedAt,
    this.firstResponseAt,
    this.resolvedAt,
    this.resolutionSummary,
    this.assignedAgent,
    this.escalatedBy,
    this.linkedOrder,
    this.messages = const <SupportMessage>[],
    this.links = const <SupportCaseLink>[],
  });

  final String id;
  final String status;
  final String priority;
  final String title;
  final String summary;
  final String category;
  final DateTime escalatedAt;
  final DateTime updatedAt;
  final DateTime? firstResponseAt;
  final DateTime? resolvedAt;
  final String? resolutionSummary;
  final SupportCasePerson? assignedAgent;
  final SupportCasePerson? escalatedBy;
  final SupportCaseLinkedOrder? linkedOrder;
  final List<SupportMessage> messages;
  final List<SupportCaseLink> links;

  bool get isOpen => !{'resolved', 'closed'}.contains(status.toLowerCase());

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'status': status,
      'priority': priority,
      'title': title,
      'summary': summary,
      'category': category,
      'escalatedAt': escalatedAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'firstResponseAt': firstResponseAt?.toIso8601String(),
      'resolvedAt': resolvedAt?.toIso8601String(),
      'resolutionSummary': resolutionSummary,
      'assignedAgent': assignedAgent?.toJson(),
      'escalatedBy': escalatedBy?.toJson(),
      'linkedOrder': linkedOrder?.toJson(),
      'messages': messages.map((message) => message.toJson()).toList(growable: false),
      'links': links.map((link) => link.toJson()).toList(growable: false),
    };
  }

  factory SupportCase.fromJson(Map<String, dynamic> json) {
    final metadata = <String, dynamic>{};
    if (json['metadata'] is Map<String, dynamic>) {
      metadata.addAll(json['metadata'] as Map<String, dynamic>);
    } else if (json['metadata'] is Map) {
      metadata.addAll(Map<String, dynamic>.from(json['metadata'] as Map));
    }

    final thread = json['thread'];
    String subject = (metadata['subject'] as String? ?? '').trim();
    String channel = (metadata['category'] as String? ?? '').trim();
    if (thread is Map) {
      final threadMap = Map<String, dynamic>.from(thread);
      if (subject.isEmpty) {
        subject = (threadMap['subject'] as String? ?? '').trim();
      }
      if (channel.isEmpty) {
        channel = (threadMap['channelType'] as String? ?? '').trim();
      }
    }

    subject = subject.isNotEmpty ? subject : (json['reason'] as String? ?? '').trim();
    if (subject.isEmpty) {
      subject = 'Support case #${json['id']}';
    }

    final summary = (json['resolutionSummary'] as String? ?? json['reason'] as String? ?? '').trim();
    final status = (json['status'] as String? ?? 'triage').trim();
    final priority = (json['priority'] as String? ?? 'medium').trim();
    final category = channel.isNotEmpty
        ? channel
        : (metadata['topic'] as String? ?? 'General').toString();

    final rawTranscript = json['transcript'];
    final messages = <SupportMessage>[];
    if (rawTranscript is List) {
      for (final entry in rawTranscript) {
        if (entry is Map<String, dynamic>) {
          messages.add(SupportMessage.fromJson(entry));
        } else if (entry is Map) {
          messages.add(SupportMessage.fromJson(Map<String, dynamic>.from(entry)));
        }
      }
    }

    final rawLinks = json['links'];
    final links = <SupportCaseLink>[];
    if (rawLinks is List) {
      for (final entry in rawLinks) {
        if (entry is Map<String, dynamic>) {
          links.add(SupportCaseLink.fromJson(entry));
        } else if (entry is Map) {
          links.add(SupportCaseLink.fromJson(Map<String, dynamic>.from(entry)));
        }
      }
    }

    return SupportCase(
      id: '${json['id']}',
      status: status,
      priority: priority,
      title: subject,
      summary: summary.isNotEmpty ? summary : 'Support specialists are reviewing this case.',
      category: category.isNotEmpty ? category : 'General',
      escalatedAt: DateTime.tryParse('${json['escalatedAt']}') ?? DateTime.now(),
      updatedAt: DateTime.tryParse('${json['updatedAt']}') ?? DateTime.now(),
      firstResponseAt: json['firstResponseAt'] != null
          ? DateTime.tryParse('${json['firstResponseAt']}')
          : null,
      resolvedAt:
          json['resolvedAt'] != null ? DateTime.tryParse('${json['resolvedAt']}') : null,
      resolutionSummary: summary.isNotEmpty ? summary : null,
      assignedAgent: json['assignedAgent'] is Map
          ? SupportCasePerson.fromJson(Map<String, dynamic>.from(json['assignedAgent'] as Map))
          : null,
      escalatedBy: json['escalatedByUser'] is Map
          ? SupportCasePerson.fromJson(Map<String, dynamic>.from(json['escalatedByUser'] as Map))
          : null,
      linkedOrder: json['linkedOrder'] != null
          ? SupportCaseLinkedOrder.fromJson(
              json['linkedOrder'] is Map<String, dynamic>
                  ? json['linkedOrder'] as Map<String, dynamic>
                  : Map<String, dynamic>.from(json['linkedOrder'] as Map),
            )
          : null,
      messages: List<SupportMessage>.unmodifiable(messages),
      links: List<SupportCaseLink>.unmodifiable(links),
    );
  }

  SupportCase copyWith({
    String? status,
    String? priority,
    String? title,
    String? summary,
    String? category,
    DateTime? escalatedAt,
    DateTime? updatedAt,
    DateTime? firstResponseAt,
    DateTime? resolvedAt,
    String? resolutionSummary,
    SupportCasePerson? assignedAgent,
    SupportCasePerson? escalatedBy,
    SupportCaseLinkedOrder? linkedOrder,
    List<SupportMessage>? messages,
    List<SupportCaseLink>? links,
  }) {
    return SupportCase(
      id: id,
      status: status ?? this.status,
      priority: priority ?? this.priority,
      title: title ?? this.title,
      summary: summary ?? this.summary,
      category: category ?? this.category,
      escalatedAt: escalatedAt ?? this.escalatedAt,
      updatedAt: updatedAt ?? this.updatedAt,
      firstResponseAt: firstResponseAt ?? this.firstResponseAt,
      resolvedAt: resolvedAt ?? this.resolvedAt,
      resolutionSummary: resolutionSummary ?? this.resolutionSummary,
      assignedAgent: assignedAgent ?? this.assignedAgent,
      escalatedBy: escalatedBy ?? this.escalatedBy,
      linkedOrder: linkedOrder ?? this.linkedOrder,
      messages: messages ?? this.messages,
      links: links ?? this.links,
    );
  }
}

class SupportIncident {
  const SupportIncident({
    required this.id,
    required this.summary,
    required this.status,
    required this.priority,
    required this.openedAt,
    required this.updatedAt,
    this.stage,
    this.linkedOrder,
  });

  final String id;
  final String summary;
  final String status;
  final String priority;
  final DateTime openedAt;
  final DateTime updatedAt;
  final String? stage;
  final SupportCaseLinkedOrder? linkedOrder;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'summary': summary,
      'status': status,
      'priority': priority,
      'openedAt': openedAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'stage': stage,
      'linkedOrder': linkedOrder?.toJson(),
    };
  }

  factory SupportIncident.fromJson(Map<String, dynamic> json) {
    final linkedOrder = json['linkedOrder'] ?? json['transaction'];
    return SupportIncident(
      id: '${json['id']}',
      summary: (json['summary'] as String? ?? '').trim().isNotEmpty
          ? (json['summary'] as String).trim()
          : 'Dispute under review',
      status: (json['status'] as String? ?? 'open').trim(),
      priority: (json['priority'] as String? ?? 'normal').trim(),
      openedAt: DateTime.tryParse('${json['openedAt']}') ?? DateTime.now(),
      updatedAt: DateTime.tryParse('${json['updatedAt']}') ??
          DateTime.tryParse('${json['resolvedAt']}') ??
          DateTime.now(),
      stage: (json['stage'] as String? ?? '').trim().isNotEmpty
          ? (json['stage'] as String).trim()
          : null,
      linkedOrder: linkedOrder is Map<String, dynamic>
          ? SupportCaseLinkedOrder.fromJson(linkedOrder)
          : linkedOrder is Map
              ? SupportCaseLinkedOrder.fromJson(Map<String, dynamic>.from(linkedOrder))
              : null,
    );
  }
}

class SupportDeskMetrics {
  const SupportDeskMetrics({
    required this.openSupportCases,
    required this.openDisputes,
    required this.csatScore,
    required this.csatResponses,
    this.averageFirstResponseMinutes,
    this.averageResolutionMinutes,
    this.csatTrailing30DayScore,
    this.csatResponseRate,
  });

  final int openSupportCases;
  final int openDisputes;
  final double csatScore;
  final int csatResponses;
  final double? averageFirstResponseMinutes;
  final double? averageResolutionMinutes;
  final double? csatTrailing30DayScore;
  final double? csatResponseRate;

  Map<String, dynamic> toJson() {
    return {
      'openSupportCases': openSupportCases,
      'openDisputes': openDisputes,
      'csatScore': csatScore,
      'csatResponses': csatResponses,
      'averageFirstResponseMinutes': averageFirstResponseMinutes,
      'averageResolutionMinutes': averageResolutionMinutes,
      'csatTrailing30DayScore': csatTrailing30DayScore,
      'csatResponseRate': csatResponseRate,
    };
  }

  factory SupportDeskMetrics.fromJson(Map<String, dynamic> json) {
    return SupportDeskMetrics(
      openSupportCases: json['openSupportCases'] is num ? (json['openSupportCases'] as num).toInt() : 0,
      openDisputes: json['openDisputes'] is num ? (json['openDisputes'] as num).toInt() : 0,
      csatScore: json['csatScore'] is num ? (json['csatScore'] as num).toDouble() : 0,
      csatResponses: json['csatResponses'] is num ? (json['csatResponses'] as num).toInt() : 0,
      averageFirstResponseMinutes: json['averageFirstResponseMinutes'] is num
          ? (json['averageFirstResponseMinutes'] as num).toDouble()
          : null,
      averageResolutionMinutes: json['averageResolutionMinutes'] is num
          ? (json['averageResolutionMinutes'] as num).toDouble()
          : null,
      csatTrailing30DayScore: json['csatTrailing30DayScore'] is num
          ? (json['csatTrailing30DayScore'] as num).toDouble()
          : null,
      csatResponseRate: json['csatResponseRate'] is num
          ? (json['csatResponseRate'] as num).toDouble()
          : null,
    );
  }

  SupportDeskMetrics copyWith({
    int? openSupportCases,
    int? openDisputes,
    double? csatScore,
    int? csatResponses,
    double? averageFirstResponseMinutes,
    double? averageResolutionMinutes,
    double? csatTrailing30DayScore,
    double? csatResponseRate,
  }) {
    return SupportDeskMetrics(
      openSupportCases: openSupportCases ?? this.openSupportCases,
      openDisputes: openDisputes ?? this.openDisputes,
      csatScore: csatScore ?? this.csatScore,
      csatResponses: csatResponses ?? this.csatResponses,
      averageFirstResponseMinutes:
          averageFirstResponseMinutes ?? this.averageFirstResponseMinutes,
      averageResolutionMinutes:
          averageResolutionMinutes ?? this.averageResolutionMinutes,
      csatTrailing30DayScore:
          csatTrailing30DayScore ?? this.csatTrailing30DayScore,
      csatResponseRate: csatResponseRate ?? this.csatResponseRate,
    );
  }
}

class SupportDeskSnapshot {
  const SupportDeskSnapshot({
    required this.refreshedAt,
    required this.metrics,
    required this.cases,
    required this.incidents,
    required this.knowledgeBase,
  });

  final DateTime refreshedAt;
  final SupportDeskMetrics metrics;
  final List<SupportCase> cases;
  final List<SupportIncident> incidents;
  final List<SupportArticle> knowledgeBase;

  Map<String, dynamic> toJson() {
    return {
      'refreshedAt': refreshedAt.toIso8601String(),
      'metrics': metrics.toJson(),
      'supportCases': cases.map((supportCase) => supportCase.toJson()).toList(growable: false),
      'disputes': incidents.map((incident) => incident.toJson()).toList(growable: false),
      'knowledgeBase': knowledgeBase.map((article) => article.toJson()).toList(growable: false),
    };
  }

  factory SupportDeskSnapshot.fromJson(Map<String, dynamic> json) {
    final cases = <SupportCase>[];
    final rawCases = json['supportCases'] ?? json['cases'];
    if (rawCases is List) {
      for (final entry in rawCases) {
        if (entry is Map<String, dynamic>) {
          cases.add(SupportCase.fromJson(entry));
        } else if (entry is Map) {
          cases.add(SupportCase.fromJson(Map<String, dynamic>.from(entry)));
        }
      }
    }

    final incidents = <SupportIncident>[];
    final rawIncidents = json['disputes'] ?? json['incidents'];
    if (rawIncidents is List) {
      for (final entry in rawIncidents) {
        if (entry is Map<String, dynamic>) {
          incidents.add(SupportIncident.fromJson(entry));
        } else if (entry is Map) {
          incidents.add(SupportIncident.fromJson(Map<String, dynamic>.from(entry)));
        }
      }
    }

    final articles = <SupportArticle>[];
    final rawArticles = json['knowledgeBase'] ?? json['articles'];
    if (rawArticles is List) {
      for (final entry in rawArticles) {
        if (entry is Map<String, dynamic>) {
          articles.add(SupportArticle.fromJson(entry));
        } else if (entry is Map) {
          articles.add(SupportArticle.fromJson(Map<String, dynamic>.from(entry)));
        }
      }
    }

    return SupportDeskSnapshot(
      refreshedAt: DateTime.tryParse('${json['refreshedAt']}') ?? DateTime.now(),
      metrics: json['metrics'] is Map<String, dynamic>
          ? SupportDeskMetrics.fromJson(json['metrics'] as Map<String, dynamic>)
          : SupportDeskMetrics.fromJson(const {'openSupportCases': 0, 'openDisputes': 0, 'csatScore': 0, 'csatResponses': 0}),
      cases: List<SupportCase>.unmodifiable(cases),
      incidents: List<SupportIncident>.unmodifiable(incidents),
      knowledgeBase: List<SupportArticle>.unmodifiable(articles),
    );
  }

  SupportDeskSnapshot copyWith({
    DateTime? refreshedAt,
    SupportDeskMetrics? metrics,
    List<SupportCase>? cases,
    List<SupportIncident>? incidents,
    List<SupportArticle>? knowledgeBase,
  }) {
    return SupportDeskSnapshot(
      refreshedAt: refreshedAt ?? this.refreshedAt,
      metrics: metrics ?? this.metrics,
      cases: cases ?? this.cases,
      incidents: incidents ?? this.incidents,
      knowledgeBase: knowledgeBase ?? this.knowledgeBase,
    );
  }

  static SupportDeskSnapshot seed() {
    final now = DateTime.now();
    final metrics = SupportDeskMetrics(
      openSupportCases: 1,
      openDisputes: 1,
      csatScore: 4.8,
      csatResponses: 18,
      averageFirstResponseMinutes: 14,
      averageResolutionMinutes: 180,
      csatTrailing30DayScore: 4.7,
      csatResponseRate: 0.86,
    );

    final caseMessages = [
      SupportMessage(
        id: 'msg-seed-1',
        author: 'Gigvora Support',
        role: 'support_team',
        body: 'We\'re reviewing the attached scope and will follow up within the hour.',
        createdAt: now.subtract(const Duration(hours: 1, minutes: 20)),
        fromSupport: true,
      ),
      SupportMessage(
        id: 'msg-seed-2',
        author: 'You',
        role: 'freelancer',
        body: 'Thanks! I\'ve uploaded the milestone notes and revision timeline.',
        createdAt: now.subtract(const Duration(hours: 1)),
      ),
    ];

    final supportCase = SupportCase(
      id: 'seed-case-301',
      status: 'in_progress',
      priority: 'high',
      title: 'Client escalation on milestone delivery',
      summary:
          'Support is mediating a milestone dispute. We\'ll confirm the next steps once the review concludes.',
      category: 'Disputes',
      escalatedAt: now.subtract(const Duration(hours: 4)),
      updatedAt: now.subtract(const Duration(minutes: 45)),
      firstResponseAt: now.subtract(const Duration(hours: 3, minutes: 30)),
      assignedAgent: const SupportCasePerson(id: null, name: 'Jordan Lee', email: null, userType: 'support'),
      messages: List<SupportMessage>.unmodifiable(caseMessages),
      linkedOrder: const SupportCaseLinkedOrder(
        reference: 'ESCROW-555',
        amount: 950.50,
        currencyCode: 'USD',
        status: 'disputed',
        gigTitle: 'Brand workshop sprint',
        clientName: 'Acme Corp',
      ),
      links: const <SupportCaseLink>[],
    );

    final incident = SupportIncident(
      id: 'seed-incident-1',
      summary: 'Dispute awaiting artefact review',
      status: 'open',
      priority: 'high',
      openedAt: now.subtract(const Duration(hours: 5)),
      updatedAt: now.subtract(const Duration(hours: 2)),
      stage: 'intake',
      linkedOrder: const SupportCaseLinkedOrder(
        reference: 'ESCROW-555',
        amount: 950.50,
        currencyCode: 'USD',
        status: 'disputed',
        gigTitle: 'Brand workshop sprint',
      ),
    );

    final article = SupportArticle(
      slug: 'escalation-playbook',
      title: 'Mediation checklist for scope disputes',
      summary: 'Step-by-step checklist to prepare for mediation and reduce response cycles.',
      category: 'Workflow',
      url: 'https://support.gigvora.com/articles/mediation-checklist',
      tags: const ['disputes', 'operations'],
      resourceLinks: const [
        SupportResourceLink(
          label: 'Evidence template',
          url: 'https://support.gigvora.com/templates/evidence',
        ),
      ],
      readTimeMinutes: 4,
      lastReviewedAt: now.subtract(const Duration(days: 6)),
    );

    return SupportDeskSnapshot(
      refreshedAt: now,
      metrics: metrics,
      cases: [supportCase],
      incidents: [incident],
      knowledgeBase: [article],
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
    required this.body,
    required this.fromSupport,
  });

  final String body;
  final bool fromSupport;

  SupportMessage toMessage() {
    return SupportMessage(
      id: 'msg-${DateTime.now().microsecondsSinceEpoch}',
      author: fromSupport ? 'Gigvora Support' : 'You',
      role: fromSupport ? 'support_team' : 'member',
      body: body,
      createdAt: DateTime.now(),
      fromSupport: fromSupport,
    );
  }
}
