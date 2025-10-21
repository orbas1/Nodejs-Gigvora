import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/connections/domain/connection_network.dart';

void main() {
  test('parses network JSON with nested actors and policies', () {
    final network = ConnectionNetwork.fromJson(_networkJson);

    expect(network.summary.total, 6);
    expect(network.policies.first.allowedRoles, contains('talent'));
    expect(network.nodes.first.connectors.first.name, 'Mina Ortiz');
  });

  test('round trips node payloads back to JSON', () {
    final network = ConnectionNetwork.fromJson(_networkJson);
    final encoded = jsonDecode(jsonEncode(network.toJson())) as Map<String, dynamic>;

    expect(encoded['summary']['total'], 6);
    expect((encoded['nodes'] as List).first['connectors'], isA<List>());
  });
}

const _networkJson = <String, dynamic>{
  'summary': {
    'firstDegree': 2,
    'secondDegree': 3,
    'thirdDegree': 1,
    'total': 6,
  },
  'policies': [
    {
      'actorRole': 'founder',
      'allowedRoles': ['talent', 'employer'],
      'matrix': {
        'talent': ['message', 'request_connection'],
      },
    }
  ],
  'nodes': [
    {
      'id': 1,
      'name': 'Avery Johnson',
      'userType': 'talent',
      'headline': 'Fractional CPO',
      'location': 'London',
      'degree': 1,
      'degreeLabel': 'First degree',
      'mutualConnections': 8,
      'connectors': [
        {'id': 99, 'name': 'Mina Ortiz', 'userType': 'talent'},
      ],
      'path': [
        {'id': 11, 'name': 'Salem Rhodes', 'userType': 'employer'},
      ],
      'actions': {
        'canMessage': true,
        'canRequestConnection': false,
        'requiresIntroduction': false,
      },
    },
  ],
};
