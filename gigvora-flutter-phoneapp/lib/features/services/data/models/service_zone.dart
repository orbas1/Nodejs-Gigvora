class ServiceZone {
  const ServiceZone({
    required this.id,
    required this.name,
    required this.region,
    required this.coveragePercentage,
    required this.availableServices,
    required this.connectedProviders,
    required this.lastSynced,
    this.slaCommitment,
    this.escalationContact,
  });

  final String id;
  final String name;
  final String region;
  final double coveragePercentage;
  final List<String> availableServices;
  final List<String> connectedProviders;
  final DateTime lastSynced;
  final String? slaCommitment;
  final String? escalationContact;

  factory ServiceZone.fromJson(Map<String, dynamic> json) {
    return ServiceZone(
      id: json['id'] as String? ?? 'unknown-zone',
      name: json['name'] as String? ?? 'Unnamed zone',
      region: json['region'] as String? ?? 'Unknown region',
      coveragePercentage: (json['coveragePercentage'] as num?)?.toDouble() ?? 0,
      availableServices: (json['availableServices'] as List?)?.cast<String>() ?? const <String>[],
      connectedProviders: (json['connectedProviders'] as List?)?.cast<String>() ?? const <String>[],
      lastSynced: DateTime.tryParse(json['lastSynced'] as String? ?? '') ?? DateTime.now(),
      slaCommitment: json['slaCommitment'] as String?,
      escalationContact: json['escalationContact'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'region': region,
      'coveragePercentage': coveragePercentage,
      'availableServices': availableServices,
      'connectedProviders': connectedProviders,
      'lastSynced': lastSynced.toIso8601String(),
      'slaCommitment': slaCommitment,
      'escalationContact': escalationContact,
    };
  }
}
