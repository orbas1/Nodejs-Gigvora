import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../domain/session.dart';

class TwoFactorChallenge {
  const TwoFactorChallenge({
    required this.tokenId,
    required this.maskedDestination,
    this.expiresAt,
    this.debugCode,
  });

  factory TwoFactorChallenge.fromJson(Map<String, dynamic> json) {
    return TwoFactorChallenge(
      tokenId: json['tokenId'] as String,
      maskedDestination: json['maskedDestination'] as String? ?? '***',
      expiresAt: json['expiresAt'] is String ? DateTime.tryParse(json['expiresAt'] as String) : null,
      debugCode: json['debugCode'] as String?,
    );
  }

  final String tokenId;
  final String maskedDestination;
  final DateTime? expiresAt;
  final String? debugCode;
}

class AuthenticatedSession {
  const AuthenticatedSession({
    required this.userSession,
    required this.accessToken,
    required this.refreshToken,
    this.expiresAt,
  });

  factory AuthenticatedSession.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>? ?? const <String, dynamic>{};
    final memberships = List<String>.from(
      (user['memberships'] as List? ?? const <String>[]).cast<String>().where((value) => value.isNotEmpty),
    );
    if (memberships.isEmpty) {
      memberships.add(user['userType'] as String? ?? 'user');
    }
    final primaryDashboard = user['primaryDashboard'] as String? ?? memberships.first;

    return AuthenticatedSession(
      userSession: UserSession(
        name: user['name'] as String? ?? user['email'] as String? ?? 'Gigvora member',
        title: user['title'] as String? ?? 'Member',
        email: user['email'] as String? ?? 'member@gigvora.com',
        location: user['location'] as String? ?? 'Remote',
        memberships: memberships,
        activeMembership: primaryDashboard,
        dashboards: const <String, RoleDashboard>{},
        avatarSeed: user['avatarSeed'] as String?,
        connections: user['connections'] is num ? (user['connections'] as num).toInt() : 0,
        followers: user['followers'] is num ? (user['followers'] as num).toInt() : 0,
        companies: List<String>.from((user['companies'] as List? ?? const <String>[]).cast<String>()),
        agencies: List<String>.from((user['agencies'] as List? ?? const <String>[]).cast<String>()),
        accessToken: json['accessToken'] as String?,
        refreshToken: json['refreshToken'] as String?,
        tokenExpiresAt: json['expiresAt'] is String ? DateTime.tryParse(json['expiresAt'] as String) : null,
        twoFactorEnabled: user['twoFactorEnabled'] as bool? ?? true,
      ),
      accessToken: json['accessToken'] as String? ?? '',
      refreshToken: json['refreshToken'] as String? ?? '',
      expiresAt: json['expiresAt'] is String ? DateTime.tryParse(json['expiresAt'] as String) : null,
    );
  }

  final UserSession userSession;
  final String accessToken;
  final String refreshToken;
  final DateTime? expiresAt;
}

class LoginResult {
  const LoginResult._({
    required this.requiresTwoFactor,
    this.challenge,
    this.session,
  });

  factory LoginResult.challenge(TwoFactorChallenge challenge) =>
      LoginResult._(requiresTwoFactor: true, challenge: challenge);

  factory LoginResult.session(AuthenticatedSession session) =>
      LoginResult._(requiresTwoFactor: false, session: session);

  final bool requiresTwoFactor;
  final TwoFactorChallenge? challenge;
  final AuthenticatedSession? session;
}

class AuthRepository {
  AuthRepository(this._client);

  final ApiClient _client;

  Future<LoginResult> login(String email, String password, {bool admin = false}) async {
    final response = await _client.post(
      admin ? '/auth/admin/login' : '/auth/login',
      body: {'email': email, 'password': password},
    ) as Map<String, dynamic>;

    if (response['requiresTwoFactor'] == true) {
      return LoginResult.challenge(TwoFactorChallenge.fromJson(
        Map<String, dynamic>.from(response['challenge'] as Map),
      ));
    }

    return LoginResult.session(
      AuthenticatedSession.fromJson(Map<String, dynamic>.from(response['session'] as Map)),
    );
  }

  Future<AuthenticatedSession> verifyTwoFactor({
    required String email,
    required String code,
    required String tokenId,
  }) async {
    final response = await _client.post(
      '/auth/verify-2fa',
      body: {'email': email, 'code': code, 'tokenId': tokenId},
    ) as Map<String, dynamic>;

    return AuthenticatedSession.fromJson(Map<String, dynamic>.from(response['session'] as Map));
  }

  Future<TwoFactorChallenge> resendTwoFactor(String tokenId) async {
    final response = await _client.post(
      '/auth/two-factor/resend',
      body: {'tokenId': tokenId},
    ) as Map<String, dynamic>;
    return TwoFactorChallenge.fromJson(response);
  }

  Future<AuthenticatedSession> loginWithGoogle(String idToken) async {
    final response = await _client.post(
      '/auth/login/google',
      body: {'idToken': idToken},
    ) as Map<String, dynamic>;
    return AuthenticatedSession.fromJson(Map<String, dynamic>.from(response['session'] as Map));
  }

  Future<void> registerUser({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? address,
    int? age,
    bool twoFactorEnabled = true,
    String userType = 'user',
  }) async {
    await _client.post(
      '/auth/register',
      body: {
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'password': password,
        'address': address,
        'age': age,
        'twoFactorEnabled': twoFactorEnabled,
        'userType': userType,
      },
    );
  }

  Future<void> registerCompanyAccount({
    required String companyName,
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? website,
    String? focusArea,
    String? location,
    bool twoFactorEnabled = true,
  }) async {
    await _client.post(
      '/auth/register/company',
      body: {
        'companyName': companyName,
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'password': password,
        'website': website,
        'focusArea': focusArea,
        'location': location,
        'twoFactorEnabled': twoFactorEnabled,
      },
    );
  }

  Future<void> registerAgencyAccount({
    required String agencyName,
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? website,
    String? focusArea,
    String? location,
    bool twoFactorEnabled = true,
  }) async {
    await _client.post(
      '/auth/register/agency',
      body: {
        'agencyName': agencyName,
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'password': password,
        'website': website,
        'focusArea': focusArea,
        'location': location,
        'twoFactorEnabled': twoFactorEnabled,
      },
    );
  }
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return AuthRepository(client);
});
