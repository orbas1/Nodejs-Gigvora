import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uni_links/uni_links.dart';

import 'routes.dart';

final deepLinkActivatedProvider = StateProvider<bool>((ref) => false);

final deepLinkStreamProvider = StreamProvider<Uri?>((ref) async* {
  Uri? initial;
  try {
    initial = await getInitialUri();
  } on PlatformException catch (error, stackTrace) {
    debugPrint('Failed to resolve initial deep link: $error\n$stackTrace');
  }

  if (initial != null) {
    yield initial;
  }

  Uri? previous;
  await for (final uri in uriLinkStream) {
    if (uri == null) {
      continue;
    }
    if (previous != null && uri.toString() == previous.toString()) {
      continue;
    }
    previous = uri;
    yield uri;
  }
});

class DeepLinkResult {
  const DeepLinkResult({
    required this.route,
    this.pathParameters,
    this.queryParameters,
  });

  final AppRoute route;
  final Map<String, String>? pathParameters;
  final Map<String, String>? queryParameters;
}

class DeepLinkParser {
  static DeepLinkResult? parse(Uri uri) {
    if (_hasEmbeddedRoute(uri)) {
      final embedded = uri.queryParameters['route'] ?? uri.fragment;
      if (embedded != null && embedded.isNotEmpty) {
        return parse(Uri.parse(embedded));
      }
    }

    final segments = uri.pathSegments.where((segment) => segment.isNotEmpty).toList();
    if (segments.isEmpty) {
      return const DeepLinkResult(route: AppRoute.home);
    }

    final first = segments.first.toLowerCase();
    switch (first) {
      case 'home':
        return const DeepLinkResult(route: AppRoute.home);
      case 'signup':
        return const DeepLinkResult(route: AppRoute.signUp);
      case 'login':
        return const DeepLinkResult(route: AppRoute.login);
      case 'register':
        if (segments.length > 1 && segments[1].toLowerCase() == 'company') {
          return const DeepLinkResult(route: AppRoute.registerCompany);
        }
        return const DeepLinkResult(route: AppRoute.register);
      case 'feed':
        return const DeepLinkResult(route: AppRoute.feed);
      case 'calendar':
        return const DeepLinkResult(route: AppRoute.calendar);
      case 'explorer':
        return const DeepLinkResult(route: AppRoute.explorer);
      case 'jobs':
        if (segments.length > 1 && segments[1].isNotEmpty) {
          return DeepLinkResult(
            route: AppRoute.jobDetail,
            pathParameters: {'id': segments[1]},
          );
        }
        return DeepLinkResult(
          route: AppRoute.jobs,
          queryParameters: uri.queryParameters.isEmpty ? null : uri.queryParameters,
        );
      case 'gigs':
        if (segments.length > 1 && segments[1].toLowerCase() == 'purchase') {
          return const DeepLinkResult(route: AppRoute.gigPurchase);
        }
        return const DeepLinkResult(route: AppRoute.gigs);
      case 'projects':
        if (segments.length >= 3 && segments[2].toLowerCase() == 'auto-match') {
          return DeepLinkResult(
            route: AppRoute.projectAutoMatch,
            pathParameters: {'id': segments[1]},
          );
        }
        if (segments.length > 1 && segments[1].toLowerCase() == 'new') {
          return const DeepLinkResult(route: AppRoute.projectPost);
        }
        return const DeepLinkResult(route: AppRoute.projects);
      case 'creation-studio':
        return const DeepLinkResult(route: AppRoute.creationStudio);
      case 'blog':
        if (segments.length > 1 && segments[1].isNotEmpty) {
          return DeepLinkResult(
            route: AppRoute.blogDetail,
            pathParameters: {'slug': segments[1]},
          );
        }
        return const DeepLinkResult(route: AppRoute.blogList);
      case 'launchpad':
        return const DeepLinkResult(route: AppRoute.launchpad);
      case 'volunteering':
        return const DeepLinkResult(route: AppRoute.volunteering);
      case 'notifications':
        return const DeepLinkResult(route: AppRoute.notifications);
      case 'pages':
        return const DeepLinkResult(route: AppRoute.pages);
      case 'support':
        return const DeepLinkResult(route: AppRoute.support);
      case 'settings':
        return const DeepLinkResult(route: AppRoute.settings);
      case 'about':
        return const DeepLinkResult(route: AppRoute.about);
      case 'privacy':
        return const DeepLinkResult(route: AppRoute.privacy);
      case 'inbox':
        return const DeepLinkResult(route: AppRoute.inbox);
      case 'mentors':
        if (segments.length > 1 && segments[1].isNotEmpty) {
          return DeepLinkResult(
            route: AppRoute.mentorProfile,
            pathParameters: {'id': segments[1]},
          );
        }
        return const DeepLinkResult(route: AppRoute.mentorDashboard);
      case 'finance':
        return const DeepLinkResult(route: AppRoute.finance);
      case 'connections':
        return const DeepLinkResult(route: AppRoute.connections);
      case 'operations':
        if (segments.length > 1 && segments[1].toLowerCase() == 'manage') {
          return DeepLinkResult(
            route: AppRoute.projectOperations,
            queryParameters: uri.queryParameters.isEmpty ? null : uri.queryParameters,
          );
        }
        return const DeepLinkResult(route: AppRoute.serviceOperations);
      case 'security':
        return const DeepLinkResult(route: AppRoute.securityOperations);
      case 'dashboard':
        return _parseDashboardSegments(segments.sublist(1), uri.queryParameters);
      case 'networking':
        return const DeepLinkResult(route: AppRoute.networking);
      case 'groups':
        if (segments.length > 1) {
          final second = segments[1].toLowerCase();
          if (second == 'manage') {
            return const DeepLinkResult(route: AppRoute.groupsManage);
          }
          return DeepLinkResult(
            route: AppRoute.groupProfile,
            pathParameters: {'groupId': segments[1]},
          );
        }
        return const DeepLinkResult(route: AppRoute.groupsDirectory);
      case 'profile':
        return DeepLinkResult(
          route: AppRoute.profile,
          queryParameters: uri.queryParameters.isEmpty ? null : uri.queryParameters,
        );
      case 'admin':
        if (segments.length > 1 && segments[1].toLowerCase() == 'ads') {
          return const DeepLinkResult(route: AppRoute.adminAds);
        }
        return const DeepLinkResult(route: AppRoute.adminLogin);
      default:
        return null;
    }
  }

  static bool _hasEmbeddedRoute(Uri uri) {
    return uri.queryParameters.containsKey('route') ||
        (uri.fragment.isNotEmpty && uri.fragment.startsWith('/'));
  }

  static DeepLinkResult _parseDashboardSegments(
    List<String> segments,
    Map<String, String> query,
  ) {
    if (segments.isEmpty) {
      return const DeepLinkResult(route: AppRoute.home);
    }

    final section = segments.first.toLowerCase();
    switch (section) {
      case 'company':
        if (segments.length > 1) {
          final companySection = segments[1].toLowerCase();
          if (companySection == 'integrations') {
            return const DeepLinkResult(route: AppRoute.companyIntegrations);
          }
          if (companySection == 'ats') {
            return const DeepLinkResult(route: AppRoute.companyAts);
          }
          if (companySection == 'analytics') {
            return const DeepLinkResult(route: AppRoute.companyAnalytics);
          }
        }
        break;
      case 'freelancer':
        if (segments.length > 1) {
          final freelancerSection = segments[1].toLowerCase();
          if (freelancerSection == 'pipeline') {
            return const DeepLinkResult(route: AppRoute.freelancerPipeline);
          }
          if (freelancerSection == 'work-management') {
            return DeepLinkResult(
              route: AppRoute.freelancerWorkManagement,
              queryParameters: query.isEmpty ? null : query,
            );
          }
        }
        break;
      case 'user':
        if (segments.length > 1 && segments[1].toLowerCase() == 'cv-workspace') {
          return const DeepLinkResult(route: AppRoute.userCvWorkspace);
        }
        return const DeepLinkResult(route: AppRoute.userDashboard);
      case 'mentor':
        return const DeepLinkResult(route: AppRoute.mentorDashboard);
      case 'agency':
        return const DeepLinkResult(route: AppRoute.agencyDashboard);
    }

    return const DeepLinkResult(route: AppRoute.home);
  }
}
