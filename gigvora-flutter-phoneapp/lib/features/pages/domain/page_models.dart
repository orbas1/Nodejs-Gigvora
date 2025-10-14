import 'package:collection/collection.dart';

class PageProfile {
  const PageProfile({
    required this.id,
    required this.name,
    required this.headline,
    required this.blueprint,
    required this.status,
    required this.followers,
    required this.engagementScore,
    required this.conversionRate,
    required this.updatedAt,
    this.audience = const <String>[],
    this.admins = const <String>[],
    this.nextEvent,
  });

  final String id;
  final String name;
  final String headline;
  final String blueprint;
  final String status;
  final int followers;
  final int engagementScore;
  final double conversionRate;
  final DateTime updatedAt;
  final List<String> audience;
  final List<String> admins;
  final DateTime? nextEvent;

  bool get isPublished => status == 'published';

  PageProfile copyWith({
    String? name,
    String? headline,
    String? blueprint,
    String? status,
    int? followers,
    int? engagementScore,
    double? conversionRate,
    DateTime? updatedAt,
    List<String>? audience,
    List<String>? admins,
    DateTime? nextEvent,
  }) {
    return PageProfile(
      id: id,
      name: name ?? this.name,
      headline: headline ?? this.headline,
      blueprint: blueprint ?? this.blueprint,
      status: status ?? this.status,
      followers: followers ?? this.followers,
      engagementScore: engagementScore ?? this.engagementScore,
      conversionRate: conversionRate ?? this.conversionRate,
      updatedAt: updatedAt ?? this.updatedAt,
      audience: audience ?? List<String>.from(this.audience),
      admins: admins ?? List<String>.from(this.admins),
      nextEvent: nextEvent ?? this.nextEvent,
    );
  }

  @override
  String toString() =>
      'PageProfile(name: $name, status: $status, followers: $followers, conversion: $conversionRate)';

  @override
  bool operator ==(Object other) {
    return other is PageProfile &&
        other.id == id &&
        other.name == name &&
        other.status == status &&
        const ListEquality<String>().equals(other.audience, audience) &&
        const ListEquality<String>().equals(other.admins, admins);
  }

  @override
  int get hashCode =>
      Object.hash(id, name, status, const ListEquality<String>().hash(audience), const ListEquality<String>().hash(admins));
}

class PageDraft {
  const PageDraft({
    required this.name,
    required this.headline,
    required this.blueprint,
    required this.audience,
    required this.visibility,
  });

  final String name;
  final String headline;
  final String blueprint;
  final List<String> audience;
  final String visibility;
}

class PageStudioState {
  const PageStudioState({
    this.published = const <PageProfile>[],
    this.drafts = const <PageProfile>[],
    this.loading = false,
    this.saving = false,
    this.errorMessage,
    this.lastSynced,
  });

  final List<PageProfile> published;
  final List<PageProfile> drafts;
  final bool loading;
  final bool saving;
  final String? errorMessage;
  final DateTime? lastSynced;

  PageStudioState copyWith({
    List<PageProfile>? published,
    List<PageProfile>? drafts,
    bool? loading,
    bool? saving,
    String? errorMessage,
    DateTime? lastSynced,
  }) {
    return PageStudioState(
      published: published ?? this.published,
      drafts: drafts ?? this.drafts,
      loading: loading ?? this.loading,
      saving: saving ?? this.saving,
      errorMessage: errorMessage,
      lastSynced: lastSynced ?? this.lastSynced,
    );
  }
}
