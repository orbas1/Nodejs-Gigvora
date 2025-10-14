import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../data/group_repository.dart';
import '../data/models/group.dart';

enum GroupFeedbackType { success, error }

class GroupManagementFeedback {
  const GroupManagementFeedback(this.type, this.message);

  final GroupFeedbackType type;
  final String message;
}

class GroupManagementState {
  const GroupManagementState({
    required this.groups,
    this.loading = false,
    this.error,
    this.feedback,
  });

  final List<GroupSummary> groups;
  final bool loading;
  final Object? error;
  final GroupManagementFeedback? feedback;

  GroupManagementState copyWith({
    List<GroupSummary>? groups,
    bool? loading,
    Object? error = _sentinel,
    GroupManagementFeedback? feedback = _sentinel,
  }) {
    return GroupManagementState(
      groups: groups ?? this.groups,
      loading: loading ?? this.loading,
      error: identical(error, _sentinel) ? this.error : error,
      feedback: identical(feedback, _sentinel) ? this.feedback : feedback as GroupManagementFeedback?,
    );
  }

  static const _sentinel = Object();

  static const initial = GroupManagementState(groups: <GroupSummary>[]);
}

class GroupManagementController extends StateNotifier<GroupManagementState> {
  GroupManagementController(this._repository) : super(GroupManagementState.initial);

  final GroupRepository _repository;

  Future<void> load({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, feedback: null, error: null);
    try {
      final result = await _repository.fetchManagedGroups(forceRefresh: forceRefresh);
      state = state.copyWith(
        groups: result.data,
        loading: false,
        error: result.error,
        feedback: null,
      );
    } catch (error, stackTrace) {
      debugPrint('Failed to load groups: $error\n$stackTrace');
      state = state.copyWith(loading: false, error: error, feedback: null);
    }
  }

  Future<void> createGroup(Map<String, dynamic> payload) async {
    try {
      await _repository.createGroup(payload);
      await load(forceRefresh: true);
      state = state.copyWith(
        feedback: const GroupManagementFeedback(GroupFeedbackType.success, 'Group created successfully'),
      );
    } catch (error, stackTrace) {
      debugPrint('Failed to create group: $error\n$stackTrace');
      state = state.copyWith(
        feedback: GroupManagementFeedback(GroupFeedbackType.error, _friendlyMessage(error)),
      );
    }
  }

  Future<void> addMember(int groupId, Map<String, dynamic> payload) async {
    try {
      await _repository.addMember(groupId, payload);
      await load(forceRefresh: true);
      state = state.copyWith(
        feedback: const GroupManagementFeedback(GroupFeedbackType.success, 'Member added successfully'),
      );
    } catch (error, stackTrace) {
      debugPrint('Failed to add member: $error\n$stackTrace');
      state = state.copyWith(
        feedback: GroupManagementFeedback(GroupFeedbackType.error, _friendlyMessage(error)),
      );
    }
  }

  Future<void> approveMember(int groupId, int membershipId) async {
    try {
      await _repository.updateMember(groupId, membershipId, {'status': 'active'});
      await load(forceRefresh: true);
      state = state.copyWith(
        feedback: const GroupManagementFeedback(GroupFeedbackType.success, 'Membership approved'),
      );
    } catch (error, stackTrace) {
      debugPrint('Failed to approve member: $error\n$stackTrace');
      state = state.copyWith(
        feedback: GroupManagementFeedback(GroupFeedbackType.error, _friendlyMessage(error)),
      );
    }
  }

  String _friendlyMessage(Object error) {
    if (error is ApiException) {
      final status = error.statusCode;
      final message = error.message.isNotEmpty ? error.message : 'Unexpected response from the server';
      if (status == 401 || status == 403) {
        return 'Your session does not have permission to complete that action.';
      }
      if (status == 409) {
        return 'That action conflicts with an existing group record. Please review and try again.';
      }
      return message;
    }
    if (error is TimeoutException || error is SocketException) {
      return 'We could not reach the server. Please check your connection and retry in a moment.';
    }
    return 'We hit a snag completing that request. Please try again shortly.';
  }
}
