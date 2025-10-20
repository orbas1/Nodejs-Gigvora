class ProfileUpdateRequest {
  const ProfileUpdateRequest({
    this.fullName,
    this.headline,
    this.bio,
    this.location,
    this.focusAreas,
    this.acceptingVolunteers,
    this.acceptingLaunchpad,
    this.availabilityStatus,
  });

  final String? fullName;
  final String? headline;
  final String? bio;
  final String? location;
  final List<String>? focusAreas;
  final bool? acceptingVolunteers;
  final bool? acceptingLaunchpad;
  final String? availabilityStatus;

  Map<String, dynamic> toJson() {
    return {
      if (fullName != null) 'fullName': fullName,
      if (headline != null) 'headline': headline,
      if (bio != null) 'bio': bio,
      if (location != null) 'location': location,
      if (focusAreas != null) 'focusAreas': focusAreas,
      if (acceptingVolunteers != null) 'acceptingVolunteers': acceptingVolunteers,
      if (acceptingLaunchpad != null) 'acceptingLaunchpad': acceptingLaunchpad,
      if (availabilityStatus != null) 'availabilityStatus': availabilityStatus,
    };
  }
}

class ProfileExperienceDraft {
  const ProfileExperienceDraft({
    required this.title,
    required this.organisation,
    required this.startDate,
    this.endDate,
    this.summary,
    this.achievements = const <String>[],
  });

  final String title;
  final String organisation;
  final DateTime startDate;
  final DateTime? endDate;
  final String? summary;
  final List<String> achievements;

  Map<String, dynamic> toJson() {
    return {
      'title': title.trim(),
      'organisation': organisation.trim(),
      'startDate': startDate.toIso8601String(),
      if (endDate != null) 'endDate': endDate!.toIso8601String(),
      if (summary != null && summary!.trim().isNotEmpty) 'summary': summary!.trim(),
      if (achievements.isNotEmpty) 'achievements': achievements,
    };
  }
}
