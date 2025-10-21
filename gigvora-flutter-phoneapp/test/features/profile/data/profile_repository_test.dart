import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/features/profile/data/models/profile.dart';
import 'package:gigvora_mobile/features/profile/data/models/profile_update.dart';
import 'package:gigvora_mobile/features/profile/data/profile_repository.dart';

import '../../../support/test_api_client.dart';
import '../../../support/test_feature_flag_service.dart';
import '../../../support/test_graphql_gateway.dart';
import '../../../support/test_offline_cache.dart';

void main() {
  late InMemoryOfflineCache cache;
  late TestApiClient apiClient;
  late TestGraphQLGateway graphQlGateway;
  late TestFeatureFlagService featureFlags;
  late ProfileRepository repository;

  setUp(() {
    cache = InMemoryOfflineCache();
    apiClient = TestApiClient();
    graphQlGateway = TestGraphQLGateway();
    featureFlags = TestFeatureFlagService(initialFlags: const {'mobile_profile_graphql': true});
    repository = ProfileRepository(
      graphQLGateway: graphQlGateway,
      apiClient: apiClient,
      cache: cache,
      featureFlags: featureFlags,
    );
  });

  test('fetchProfile uses GraphQL when flag enabled and caches the payload', () async {
    graphQlGateway.onQuery = (request) async {
      expect(request.operationName, 'GetProfile');
      expect(request.variables, containsPair('profileId', '123'));
      return RepositoryResult<Map<String, dynamic>>(
        data: {
          'profile': createProfileJson(id: '123'),
        },
        fromCache: false,
        lastUpdated: DateTime(2024, 4, 10, 10),
      );
    };

    var apiCalled = false;
    apiClient = TestApiClient(onGet: (path) async {
      apiCalled = true;
      return null;
    });
    repository = ProfileRepository(
      graphQLGateway: graphQlGateway,
      apiClient: apiClient,
      cache: cache,
      featureFlags: featureFlags,
    );

    final result = await repository.fetchProfile('123');

    expect(result.data, isA<ProfileModel>());
    expect(result.fromCache, isFalse);
    expect(result.data!.fullName, 'Alex Rivera');
    expect(result.data!.referenceSettings.allowPrivate, isTrue);
    expect(result.data!.experiences, isNotEmpty);
    expect(apiCalled, isFalse, reason: 'REST fallback should not be triggered');
    expect(graphQlGateway.queryInvocations, hasLength(1));

    final cached = cache.read<ProfileModel>('profile:details:123', (raw) {
      expect(raw, isA<Map<String, dynamic>>());
      return ProfileModel.fromJson(Map<String, dynamic>.from(raw as Map));
    });
    expect(cached, isNotNull);
    expect(cached!.value.fullName, 'Alex Rivera');

    // Second call should serve from cache without hitting GraphQL again.
    final second = await repository.fetchProfile('123');
    expect(second.fromCache, isTrue);
    expect(graphQlGateway.queryInvocations, hasLength(1));
  });

  test('fetchProfile falls back to REST when GraphQL errors', () async {
    featureFlags.setFlags(const {'mobile_profile_graphql': true});
    graphQlGateway.onQuery = (_) async {
      throw StateError('GraphQL unavailable');
    };

    var requestedPath = '';
    repository = ProfileRepository(
      graphQLGateway: graphQlGateway,
      apiClient: TestApiClient(onGet: (path) async {
        requestedPath = path;
        return createProfileJson(id: '456');
      }),
      cache: cache,
      featureFlags: featureFlags,
    );

    final result = await repository.fetchProfile('456');

    expect(requestedPath, '/profiles/456');
    expect(result.data?.id, '456');
    expect(result.error, isA<StateError>());
    expect(result.fromCache, isFalse);
    expect(cache.read('profile:details:456', (raw) => raw), isNotNull);
  });

  test('fetchProfile returns cached payload when REST and GraphQL fail', () async {
    // Seed cache with successful response.
    graphQlGateway.onQuery = (request) async {
      return RepositoryResult<Map<String, dynamic>>(
        data: {'profile': createProfileJson(id: '777')},
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    };
    await repository.fetchProfile('777');

    // Force refresh with both channels throwing.
    featureFlags.setFlags(const {'mobile_profile_graphql': false});
    repository = ProfileRepository(
      graphQLGateway: TestGraphQLGateway(onQuery: (_) async => throw Exception('Down')),
      apiClient: TestApiClient(onGet: (path) async {
        throw ApiException(500, 'Server error');
      }),
      cache: cache,
      featureFlags: featureFlags,
    );

    final result = await repository.fetchProfile('777', forceRefresh: true);

    expect(result.fromCache, isTrue);
    expect(result.error, isNotNull);
    expect(result.data?.id, '777');
  });

  test('updateProfile invalidates cached profile and returns parsed data', () async {
    await cache.write('profile:details:888', createProfileJson(id: '888'));
    final request = ProfileUpdateRequest(headline: 'Senior Strategist');
    repository = ProfileRepository(
      graphQLGateway: graphQlGateway,
      apiClient: TestApiClient(onPut: (path, body) async {
        expect(path, '/profiles/888');
        expect(body, containsPair('headline', 'Senior Strategist'));
        return createProfileJson(id: '888', headline: 'Senior Strategist');
      }),
      cache: cache,
      featureFlags: featureFlags,
    );

    final updated = await repository.updateProfile('888', request);

    expect(updated.headline, 'Senior Strategist');
    final cached = cache.read('profile:details:888', (raw) => raw);
    expect(cached, isNull, reason: 'Cache should be invalidated after update');
  });

  test('experience lifecycle uses correct endpoints and payloads', () async {
    final draft = ProfileExperienceDraft(
      title: 'Lead Engineer',
      organisation: 'Gigvora',
      startDate: DateTime(2022, 1, 1),
      summary: 'Scale platform',
    );

    repository = ProfileRepository(
      graphQLGateway: graphQlGateway,
      apiClient: TestApiClient(
        onPost: (path, body) async {
          expect(path, '/profiles/999/experiences');
          return {
            'id': 'exp-1',
            'title': 'Lead Engineer',
            'organisation': 'Gigvora',
            'startDate': '2022-01-01T00:00:00.000Z',
          };
        },
        onPut: (path, body) async {
          expect(path, '/profiles/999/experiences/exp-1');
          expect(body, containsPair('title', 'Lead Engineer'));
          return {
            'id': 'exp-1',
            'title': 'Lead Engineer',
            'organisation': 'Gigvora',
            'startDate': '2022-01-01T00:00:00.000Z',
          };
        },
        onDelete: (path, body) async {
          expect(path, '/profiles/999/experiences/exp-1');
          return null;
        },
      ),
      cache: cache,
      featureFlags: featureFlags,
    );

    final created = await repository.createExperience('999', draft);
    expect(created.id, 'exp-1');

    final updated = await repository.updateExperience('999', 'exp-1', draft);
    expect(updated.id, 'exp-1');

    await repository.deleteExperience('999', 'exp-1');
  });

  test('requestReferenceInvite sends trimmed payload to expected endpoint', () async {
    var capturedBody = <String, dynamic>{};
    repository = ProfileRepository(
      graphQLGateway: graphQlGateway,
      apiClient: TestApiClient(onPost: (path, body) async {
        expect(path, '/profiles/321/references/requests');
        capturedBody = Map<String, dynamic>.from(body as Map);
        return null;
      }),
      cache: cache,
      featureFlags: featureFlags,
    );

    await repository.requestReferenceInvite(
      '321',
      clientName: '  Jamie  ',
      email: 'jamie@example.com',
      relationship: 'Former Manager',
      message: 'Could you share a short testimonial?',
    );

    expect(capturedBody['clientName'], 'Jamie');
    expect(capturedBody['email'], 'jamie@example.com');
    expect(capturedBody['relationship'], 'Former Manager');
    expect(capturedBody['message'], contains('testimonial'));
  });

  test('updateReferenceSettings parses response into settings object', () async {
    repository = ProfileRepository(
      graphQLGateway: graphQlGateway,
      apiClient: TestApiClient(onPut: (path, body) async {
        expect(path, '/profiles/654/references/settings');
        return {
          'allowPrivate': false,
          'showBadges': true,
          'autoShareToFeed': true,
          'autoRequest': true,
          'escalateConcerns': false,
        };
      }),
      cache: cache,
      featureFlags: featureFlags,
    );

    final settings = await repository.updateReferenceSettings(
      '654',
      const ProfileReferenceSettings(allowPrivate: true),
    );

    expect(settings.allowPrivate, isFalse);
    expect(settings.autoShareToFeed, isTrue);
    expect(settings.escalateConcerns, isFalse);
  });
}

Map<String, dynamic> createProfileJson({
  required String id,
  String headline = 'Principal Product Strategist',
}) {
  return {
    'id': id,
    'fullName': 'Alex Rivera',
    'headline': headline,
    'bio': 'Driving outcomes with collaborative delivery.',
    'location': 'Remote - North America',
    'skills': ['Product strategy', 'Design systems'],
    'focusAreas': ['marketplace', 'workflow'],
    'availability': {
      'status': 'available_now',
      'nextAvailability': '2024-05-01T00:00:00.000Z',
      'acceptingVolunteers': true,
      'acceptingLaunchpad': false,
    },
    'metrics': {
      'completedProjects': {'value': 24, 'label': 'Completed projects'},
      'responseRate': {'value': 97, 'label': 'Response rate'},
    },
    'groups': [
      {'id': 'grp-1', 'name': 'Product Collective', 'description': 'Weekly discussions'},
    ],
    'references': const <Map<String, dynamic>>[],
    'referenceSettings': {
      'allowPrivate': true,
      'showBadges': false,
      'autoShareToFeed': false,
      'autoRequest': false,
      'escalateConcerns': true,
    },
    'experiences': [
      {
        'id': 'exp-01',
        'title': 'Principal Strategist',
        'organisation': 'Gigvora',
        'startDate': '2022-01-01T00:00:00.000Z',
        'summary': 'Owning the marketplace program',
        'achievements': ['Scaled to 10k users'],
      },
    ],
  };
}
