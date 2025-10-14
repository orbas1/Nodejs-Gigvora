import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/authorization.dart';
import '../../../core/providers.dart';
import '../../auth/application/session_controller.dart';
import '../../../theme/widgets.dart';
import 'work_management_panel.dart';

class WorkManagementScreen extends ConsumerWidget {
  const WorkManagementScreen({super.key, this.projectId});

  final int? projectId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionState = ref.watch(sessionControllerProvider);
    final access = evaluateWorkManagementAccess(sessionState.session);

    if (!access.allowed) {
      return GigvoraScaffold(
        title: 'Task & sprint manager',
        subtitle: 'Enterprise-grade delegation requires an authorised workspace',
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              access.reason ??
                  'Switch to a freelancer, operations, agency, or company workspace to unlock task delegation.',
              textAlign: TextAlign.center,
            ),
          ),
        ),
      );
    }

    final config = ref.watch(appConfigProvider);
    final defaultProjectId = projectId ??
        int.tryParse('${config.featureFlags['demoProjectId'] ?? config.featureFlags['demoProject'] ?? '1'}') ??
        1;

    return GigvoraScaffold(
      title: 'Task & sprint manager',
      subtitle: 'Operate backlog health, time, and approvals from mobile',
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          WorkManagementPanel(
            initialProjectId: defaultProjectId,
            projectOptions: const <ProjectOption>[],
            readOnly: !access.allowedToManage,
            accessMessage: access.reason,
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
