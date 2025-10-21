import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:gigvora_mobile/features/notifications/application/push_notification_controller.dart';

class FakePushNotificationService implements PushNotificationService {
  FakePushNotificationService();

  PushPermissionStatus status = PushPermissionStatus.unknown;
  PushPermissionStatus requestResult = PushPermissionStatus.granted;
  bool requestShouldThrow = false;
  bool registerShouldThrow = false;
  bool openSettingsShouldThrow = false;
  bool registerResult = true;
  bool openedSettings = false;
  String? lastToken;
  Map<String, dynamic>? lastMetadata;

  @override
  Future<void> bootstrap() async {}

  @override
  Future<void> dispose() async {}

  @override
  Future<PushPermissionStatus> getStatus({bool refresh = false}) async {
    return status;
  }

  @override
  Future<void> openSystemSettings() async {
    if (openSettingsShouldThrow) {
      throw PushNotificationException('Unable to open settings');
    }
    openedSettings = true;
  }

  @override
  Future<PushPermissionStatus> requestPermission() async {
    if (requestShouldThrow) {
      throw PushNotificationException('Permission request rejected');
    }
    status = requestResult;
    return requestResult;
  }

  @override
  Future<bool> registerDevice({String? token, Map<String, dynamic>? metadata}) async {
    if (registerShouldThrow) {
      throw PushNotificationException('Registration failed');
    }
    lastToken = token;
    lastMetadata = metadata;
    return registerResult;
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('PushNotificationController', () {
    late FakePushNotificationService service;
    late PushNotificationController controller;

    setUp(() {
      service = FakePushNotificationService()
        ..status = PushPermissionStatus.denied;
      controller = PushNotificationController(service);
    });

    tearDown(() {
      controller.dispose();
    });

    test('refreshStatus updates state from the service', () async {
      service.status = PushPermissionStatus.granted;

      await controller.refreshStatus();

      expect(controller.state.status, PushPermissionStatus.granted);
      expect(controller.state.isSupported, isTrue);
      expect(controller.state.lastUpdated, isNotNull);
    });

    test('requestPermission surfaces service failures', () async {
      service.requestShouldThrow = true;

      await controller.requestPermission();

      expect(controller.state.hasError, isTrue);
      expect(controller.state.isRequesting, isFalse);
      expect(controller.state.status, isNot(PushPermissionStatus.granted));
    });

    test('registerDevice toggles registration flags and stores metadata', () async {
      service.registerResult = true;

      await controller.registerDevice(token: 'abc123', metadata: {'source': 'test'});

      expect(controller.state.isRegistered, isTrue);
      expect(controller.state.isRegistering, isFalse);
      expect(service.lastToken, 'abc123');
      expect(service.lastMetadata, containsPair('source', 'test'));
    });

    test('openSettings captures errors without crashing the controller', () async {
      service.openSettingsShouldThrow = true;

      await controller.openSettings();

      expect(controller.state.hasError, isTrue);
    });
  });
}
