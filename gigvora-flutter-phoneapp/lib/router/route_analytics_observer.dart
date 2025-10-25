import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/providers.dart';
import '../features/app_boot/data/app_boot_providers.dart';
import '../features/app_boot/data/app_boot_repository.dart';
import '../features/auth/application/session_controller.dart';
import '../features/auth/domain/session.dart';
import 'app_routes.dart';

class RouteAnalyticsObserver extends NavigatorObserver {
  RouteAnalyticsObserver(this._read);

  final Reader _read;
  String? _lastTrackedRouteId;

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    super.didPush(route, previousRoute);
    _handleRoute(route);
  }

  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) {
    super.didReplace(newRoute: newRoute, oldRoute: oldRoute);
    _handleRoute(newRoute);
  }

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) {
    super.didPop(route, previousRoute);
    _handleRoute(previousRoute);
  }

  void reset() {
    _lastTrackedRouteId = null;
  }

  void _handleRoute(Route<dynamic>? route) {
    final appRoute = _resolveRoute(route);
    if (appRoute == null) {
      return;
    }
    if (_lastTrackedRouteId == appRoute.routeId) {
      return;
    }
    _lastTrackedRouteId = appRoute.routeId;

    final analytics = _read(analyticsServiceProvider);
    final session = _read(sessionControllerProvider);

    final metadata = <String, dynamic>{
      'actorType': session.isAuthenticated ? 'user' : 'anonymous',
      'source': 'mobile_app',
      'routeRequiresAuth': appRoute.requiresAuth,
      if (session.actorId != null) 'userId': session.actorId,
    };

    unawaited(analytics.track(
      'mobile_route_viewed',
      context: {
        'routeId': appRoute.routeId,
        'routeName': appRoute.name,
        'path': appRoute.path,
      },
      metadata: metadata,
    ));

    if (session.isAuthenticated) {
      final repository = _read(appBootRepositoryProvider);
      unawaited(repository.updateLastVisitedRoute(appRoute.routeId));
    }
  }

  AppRoute? _resolveRoute(Route<dynamic>? route) {
    if (route == null) {
      return null;
    }
    final settings = route.settings;
    final name = settings.name;
    if (name is String && name.isNotEmpty) {
      final resolved = AppRoute.fromName(name);
      if (resolved != null) {
        return resolved;
      }
    }
    final fallback = settings.name;
    if (fallback is String) {
      return AppRoute.fromRouteId(fallback);
    }
    return null;
  }
}

final routeAnalyticsObserverProvider = Provider<RouteAnalyticsObserver>((ref) {
  final observer = RouteAnalyticsObserver(ref.read);
  ref.listen<SessionState>(sessionControllerProvider, (_, __) {
    observer.reset();
  });
  return observer;
});
