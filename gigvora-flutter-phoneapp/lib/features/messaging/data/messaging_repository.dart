import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'models/message_thread.dart';
import 'models/thread_message.dart';

class MessagingRepository {
  MessagingRepository(this._apiClient, this._cache);

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _inboxCacheKeyPrefix = 'messaging:threads:user:';
  static const _messageCacheKeyPrefix = 'messaging:messages:thread:';
  static const _cacheTtl = Duration(minutes: 2);

  Future<RepositoryResult<List<MessageThread>>> fetchInbox({
    required int actorId,
    bool includeParticipants = true,
    bool includeSupport = true,
    int page = 1,
    int pageSize = 30,
    bool forceRefresh = false,
  }) async {
    final cacheKey = '$_inboxCacheKeyPrefix$actorId';
    final cached = _readThreadCache(cacheKey);

    if (!forceRefresh && cached != null) {
      return RepositoryResult<List<MessageThread>>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      final response = await _apiClient.get(
        '/messaging/threads',
        query: {
          'userId': actorId,
          'includeParticipants': includeParticipants,
          'includeSupport': includeSupport,
          'page': page,
          'pageSize': pageSize,
        },
      );

      final threads = _parseThreads(response);
      await _cache.write(cacheKey, threads.map((thread) => _threadToJson(thread)).toList(), ttl: _cacheTtl);
      return RepositoryResult<List<MessageThread>>(
        data: threads,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      if (cached != null) {
        return RepositoryResult<List<MessageThread>>(
          data: cached.value,
          fromCache: true,
          lastUpdated: cached.storedAt,
          error: error,
        );
      }
      rethrow;
    }
  }

  Future<RepositoryResult<List<ThreadMessage>>> fetchThreadMessages(
    int threadId, {
    int page = 1,
    int pageSize = 100,
    bool includeSystem = false,
    bool forceRefresh = false,
  }) async {
    final cacheKey = '$_messageCacheKeyPrefix$threadId';
    final cached = _readMessageCache(cacheKey);
    if (!forceRefresh && cached != null) {
      return RepositoryResult<List<ThreadMessage>>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      final response = await _apiClient.get(
        '/messaging/threads/$threadId/messages',
        query: {
          'page': page,
          'pageSize': pageSize,
          'includeSystem': includeSystem,
        },
      );

      final messages = _parseMessages(response);
      await _cache.write(cacheKey, messages.map((message) => _messageToJson(message)).toList(), ttl: _cacheTtl);
      return RepositoryResult<List<ThreadMessage>>(
        data: messages,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      if (cached != null) {
        return RepositoryResult<List<ThreadMessage>>(
          data: cached.value,
          fromCache: true,
          lastUpdated: cached.storedAt,
          error: error,
        );
      }
      rethrow;
    }
  }

  Future<ThreadMessage> sendMessage(
    int threadId, {
    required int userId,
    required String body,
    String messageType = 'text',
  }) async {
    final response = await _apiClient.post(
      '/messaging/threads/$threadId/messages',
      body: {
        'userId': userId,
        'messageType': messageType,
        'body': body,
      },
    );

    if (response is Map<String, dynamic>) {
      return ThreadMessage.fromJson(response);
    }

    return ThreadMessage.fromJson(Map<String, dynamic>.from(response as Map));
  }

  Future<CallSession> createCallSession(
    int threadId, {
    required int userId,
    String callType = 'video',
    String? callId,
    String? role,
  }) async {
    final response = await _apiClient.post(
      '/messaging/threads/$threadId/calls',
      body: {
        'userId': userId,
        'callType': callType,
        if (callId != null) 'callId': callId,
        if (role != null) 'role': role,
      },
    );

    if (response is Map<String, dynamic>) {
      return CallSession.fromJson(response);
    }

    return CallSession.fromJson(Map<String, dynamic>.from(response as Map));
  }

  Future<MessageAttachmentDownload> downloadAttachment({
    required int threadId,
    required int messageId,
    required int attachmentId,
  }) async {
    final response = await _apiClient.get(
      '/messaging/threads/$threadId/messages/$messageId/attachments/$attachmentId/download',
    );

    if (response is Map<String, dynamic>) {
      return MessageAttachmentDownload.fromJson(response);
    }

    return MessageAttachmentDownload.fromJson(Map<String, dynamic>.from(response as Map));
  }

  Future<void> markThreadRead(int threadId, {required int userId}) async {
    try {
      await _apiClient.post('/messaging/threads/$threadId/read', body: {'userId': userId});
    } catch (_) {
      // best-effort acknowledgement; ignore errors for now
    }
  }

  CacheEntry<List<MessageThread>>? _readThreadCache(String key) {
    try {
      return _cache.read<List<MessageThread>>(key, (raw) {
        if (raw is List) {
          return raw
              .whereType<Map>()
              .map((item) => MessageThread.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false);
        }
        return const <MessageThread>[];
      });
    } catch (_) {
      return null;
    }
  }

  CacheEntry<List<ThreadMessage>>? _readMessageCache(String key) {
    try {
      return _cache.read<List<ThreadMessage>>(key, (raw) {
        if (raw is List) {
          return raw
              .whereType<Map>()
              .map((item) => ThreadMessage.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false);
        }
        return const <ThreadMessage>[];
      });
    } catch (_) {
      return null;
    }
  }

  List<MessageThread> _parseThreads(dynamic response) {
    final data = response is Map<String, dynamic> ? response['data'] : response;
    if (data is List) {
      return data
          .whereType<Map>()
          .map((item) => MessageThread.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(growable: false);
    }
    return const <MessageThread>[];
  }

  List<ThreadMessage> _parseMessages(dynamic response) {
    final data = response is Map<String, dynamic> ? response['data'] : response;
    if (data is List) {
      return data
          .whereType<Map>()
          .map((item) => ThreadMessage.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(growable: false);
    }
    return const <ThreadMessage>[];
  }

  Map<String, dynamic> _threadToJson(MessageThread thread) {
    return {
      'id': thread.id,
      'subject': thread.subject,
      'channelType': thread.channelType,
      'lastMessagePreview': thread.lastMessagePreview,
      'lastMessageAt': thread.lastMessageAt?.toIso8601String(),
      'unreadCount': thread.unreadCount,
      'participants': thread.participants
          .map(
            (participant) => {
              'userId': participant.userId,
              'role': participant.role,
              'state': participant.state,
              'joinedAt': participant.joinedAt?.toIso8601String(),
              'user': {
                'id': participant.user.id,
                'firstName': participant.user.firstName,
                'lastName': participant.user.lastName,
                'email': participant.user.email,
              },
            },
          )
          .toList(growable: false),
      'viewerState': {'lastReadAt': thread.viewerState.lastReadAt?.toIso8601String()},
      'metadata': thread.metadata,
      'supportCase': thread.supportCase,
    };
  }

  Map<String, dynamic> _messageToJson(ThreadMessage message) {
    return {
      'id': message.id,
      'threadId': message.threadId,
      'senderId': message.senderId,
      'messageType': message.messageType,
      'body': message.body,
      'metadata': message.metadata,
      'createdAt': message.createdAt?.toIso8601String(),
      'sender': {
        'id': message.sender.id,
        'firstName': message.sender.firstName,
        'lastName': message.sender.lastName,
        'email': message.sender.email,
      },
      'attachments': message.attachments
          .map(
            (attachment) => {
              'id': attachment.id,
              'fileName': attachment.fileName,
              'mimeType': attachment.mimeType,
              'storageKey': attachment.storageKey,
              'fileSize': attachment.fileSize,
            },
          )
          .toList(growable: false),
    };
  }
}
