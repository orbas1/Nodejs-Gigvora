import 'package:equatable/equatable.dart';

class NotificationPreferences extends Equatable {
  const NotificationPreferences({
    this.pushAnnouncements = true,
    this.emailDigests = true,
    this.smsEscalations = false,
    this.weeklyReportDay = 'monday',
  });

  factory NotificationPreferences.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const NotificationPreferences();
    }
    return NotificationPreferences(
      pushAnnouncements: json['pushAnnouncements'] as bool? ?? true,
      emailDigests: json['emailDigests'] as bool? ?? true,
      smsEscalations: json['smsEscalations'] as bool? ?? false,
      weeklyReportDay: json['weeklyReportDay'] as String? ?? 'monday',
    );
  }

  final bool pushAnnouncements;
  final bool emailDigests;
  final bool smsEscalations;
  final String weeklyReportDay;

  NotificationPreferences copyWith({
    bool? pushAnnouncements,
    bool? emailDigests,
    bool? smsEscalations,
    String? weeklyReportDay,
  }) {
    return NotificationPreferences(
      pushAnnouncements: pushAnnouncements ?? this.pushAnnouncements,
      emailDigests: emailDigests ?? this.emailDigests,
      smsEscalations: smsEscalations ?? this.smsEscalations,
      weeklyReportDay: weeklyReportDay ?? this.weeklyReportDay,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'pushAnnouncements': pushAnnouncements,
      'emailDigests': emailDigests,
      'smsEscalations': smsEscalations,
      'weeklyReportDay': weeklyReportDay,
    };
  }

  @override
  List<Object?> get props => [pushAnnouncements, emailDigests, smsEscalations, weeklyReportDay];
}

class SecurityPreferences extends Equatable {
  const SecurityPreferences({
    this.twoFactorEnabled = true,
    this.biometricUnlock = false,
    this.sessionTimeoutMinutes = 30,
    this.loginAlerts = true,
  });

  factory SecurityPreferences.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const SecurityPreferences();
    }
    return SecurityPreferences(
      twoFactorEnabled: json['twoFactorEnabled'] as bool? ?? true,
      biometricUnlock: json['biometricUnlock'] as bool? ?? false,
      sessionTimeoutMinutes: json['sessionTimeoutMinutes'] is num
          ? (json['sessionTimeoutMinutes'] as num).toInt()
          : 30,
      loginAlerts: json['loginAlerts'] as bool? ?? true,
    );
  }

  final bool twoFactorEnabled;
  final bool biometricUnlock;
  final int sessionTimeoutMinutes;
  final bool loginAlerts;

  SecurityPreferences copyWith({
    bool? twoFactorEnabled,
    bool? biometricUnlock,
    int? sessionTimeoutMinutes,
    bool? loginAlerts,
  }) {
    return SecurityPreferences(
      twoFactorEnabled: twoFactorEnabled ?? this.twoFactorEnabled,
      biometricUnlock: biometricUnlock ?? this.biometricUnlock,
      sessionTimeoutMinutes: sessionTimeoutMinutes ?? this.sessionTimeoutMinutes,
      loginAlerts: loginAlerts ?? this.loginAlerts,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'twoFactorEnabled': twoFactorEnabled,
      'biometricUnlock': biometricUnlock,
      'sessionTimeoutMinutes': sessionTimeoutMinutes,
      'loginAlerts': loginAlerts,
    };
  }

  @override
  List<Object?> get props => [twoFactorEnabled, biometricUnlock, sessionTimeoutMinutes, loginAlerts];
}

class PrivacyPreferences extends Equatable {
  const PrivacyPreferences({
    this.profileDiscoverable = true,
    this.showAvailability = true,
    this.shareEngagementMetrics = false,
    this.allowDirectMessages = true,
  });

  factory PrivacyPreferences.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const PrivacyPreferences();
    }
    return PrivacyPreferences(
      profileDiscoverable: json['profileDiscoverable'] as bool? ?? true,
      showAvailability: json['showAvailability'] as bool? ?? true,
      shareEngagementMetrics: json['shareEngagementMetrics'] as bool? ?? false,
      allowDirectMessages: json['allowDirectMessages'] as bool? ?? true,
    );
  }

  final bool profileDiscoverable;
  final bool showAvailability;
  final bool shareEngagementMetrics;
  final bool allowDirectMessages;

  PrivacyPreferences copyWith({
    bool? profileDiscoverable,
    bool? showAvailability,
    bool? shareEngagementMetrics,
    bool? allowDirectMessages,
  }) {
    return PrivacyPreferences(
      profileDiscoverable: profileDiscoverable ?? this.profileDiscoverable,
      showAvailability: showAvailability ?? this.showAvailability,
      shareEngagementMetrics: shareEngagementMetrics ?? this.shareEngagementMetrics,
      allowDirectMessages: allowDirectMessages ?? this.allowDirectMessages,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'profileDiscoverable': profileDiscoverable,
      'showAvailability': showAvailability,
      'shareEngagementMetrics': shareEngagementMetrics,
      'allowDirectMessages': allowDirectMessages,
    };
  }

  @override
  List<Object?> get props => [profileDiscoverable, showAvailability, shareEngagementMetrics, allowDirectMessages];
}

class WorkspacePreferences extends Equatable {
  const WorkspacePreferences({
    this.timezone = 'UTC',
    this.defaultLandingRoute = '/home',
    this.autoSyncCalendar = true,
    this.theme = 'blue',
  });

  factory WorkspacePreferences.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const WorkspacePreferences();
    }
    return WorkspacePreferences(
      timezone: json['timezone'] as String? ?? 'UTC',
      defaultLandingRoute: json['defaultLandingRoute'] as String? ?? '/home',
      autoSyncCalendar: json['autoSyncCalendar'] as bool? ?? true,
      theme: json['theme'] as String? ?? 'blue',
    );
  }

  final String timezone;
  final String defaultLandingRoute;
  final bool autoSyncCalendar;
  final String theme;

  WorkspacePreferences copyWith({
    String? timezone,
    String? defaultLandingRoute,
    bool? autoSyncCalendar,
    String? theme,
  }) {
    return WorkspacePreferences(
      timezone: timezone ?? this.timezone,
      defaultLandingRoute: defaultLandingRoute ?? this.defaultLandingRoute,
      autoSyncCalendar: autoSyncCalendar ?? this.autoSyncCalendar,
      theme: theme ?? this.theme,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'timezone': timezone,
      'defaultLandingRoute': defaultLandingRoute,
      'autoSyncCalendar': autoSyncCalendar,
      'theme': theme,
    };
  }

  @override
  List<Object?> get props => [timezone, defaultLandingRoute, autoSyncCalendar, theme];
}

class AccountSettings extends Equatable {
  const AccountSettings({
    this.notifications = const NotificationPreferences(),
    this.security = const SecurityPreferences(),
    this.privacy = const PrivacyPreferences(),
    this.workspace = const WorkspacePreferences(),
    this.updatedAt,
  });

  factory AccountSettings.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const AccountSettings();
    }
    return AccountSettings(
      notifications: NotificationPreferences.fromJson(
        json['notifications'] as Map<String, dynamic>?,
      ),
      security: SecurityPreferences.fromJson(
        json['security'] as Map<String, dynamic>?,
      ),
      privacy: PrivacyPreferences.fromJson(
        json['privacy'] as Map<String, dynamic>?,
      ),
      workspace: WorkspacePreferences.fromJson(
        json['workspace'] as Map<String, dynamic>?,
      ),
      updatedAt: json['updatedAt'] is String
          ? DateTime.tryParse(json['updatedAt'] as String)
          : null,
    );
  }

  final NotificationPreferences notifications;
  final SecurityPreferences security;
  final PrivacyPreferences privacy;
  final WorkspacePreferences workspace;
  final DateTime? updatedAt;

  AccountSettings copyWith({
    NotificationPreferences? notifications,
    SecurityPreferences? security,
    PrivacyPreferences? privacy,
    WorkspacePreferences? workspace,
    DateTime? updatedAt,
  }) {
    return AccountSettings(
      notifications: notifications ?? this.notifications,
      security: security ?? this.security,
      privacy: privacy ?? this.privacy,
      workspace: workspace ?? this.workspace,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'notifications': notifications.toJson(),
      'security': security.toJson(),
      'privacy': privacy.toJson(),
      'workspace': workspace.toJson(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  static AccountSettings demo() {
    return AccountSettings(
      notifications: const NotificationPreferences(
        pushAnnouncements: true,
        emailDigests: true,
        smsEscalations: false,
        weeklyReportDay: 'friday',
      ),
      security: const SecurityPreferences(
        twoFactorEnabled: true,
        biometricUnlock: true,
        sessionTimeoutMinutes: 20,
        loginAlerts: true,
      ),
      privacy: const PrivacyPreferences(
        profileDiscoverable: true,
        showAvailability: true,
        shareEngagementMetrics: false,
        allowDirectMessages: true,
      ),
      workspace: const WorkspacePreferences(
        timezone: 'Europe/Berlin',
        defaultLandingRoute: '/calendar',
        autoSyncCalendar: true,
        theme: 'blue',
      ),
      updatedAt: DateTime.now(),
    );
  }

  @override
  List<Object?> get props => [notifications, security, privacy, workspace, updatedAt];
}
