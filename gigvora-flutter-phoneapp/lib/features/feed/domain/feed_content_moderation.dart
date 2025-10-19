import '../data/models/feed_post.dart';

enum FeedModerationSeverity { low, medium, high }

class FeedModerationSignal {
  const FeedModerationSignal({
    required this.type,
    required this.message,
    required this.severity,
  });

  final String type;
  final String message;
  final FeedModerationSeverity severity;
}

class FeedModerationResult {
  const FeedModerationResult({
    required this.content,
    required this.link,
    required this.signals,
  });

  final String content;
  final String? link;
  final List<FeedModerationSignal> signals;
}

class FeedModerationException implements Exception {
  const FeedModerationException(this.message, {this.reasons = const <String>[]});

  final String message;
  final List<String> reasons;

  @override
  String toString() => 'FeedModerationException($message)';
}

class FeedContentModeration {
  static const _maxCharacters = 2200;
  static const _maxLinks = 3;
  static const _maxMentions = 8;
  static const _minWordCount = 3;
  static const _maxUppercaseRatio = 0.65;
  static const _minUniqueWordRatio = 0.35;

  static const Set<String> _blockedDomains = <String>{
    'bit.ly',
    'tinyurl.com',
    'goo.gl',
    'grabify.link',
    'iplogger.org',
    '2no.co',
    'ulvis.net',
    'cut.ly',
    'cutt.ly',
    'shorte.st',
    'clk.sh',
  };

  static const List<String> _bannedTerms = <String>[
    'abuse',
    'adultwork',
    'anal',
    'anus',
    'ballsack',
    'bestiality',
    'bitch',
    'blowjob',
    'bollocks',
    'boner',
    'bukkake',
    'buttplug',
    'clit',
    'cock',
    'creampie',
    'cumshot',
    'cunt',
    'deepthroat',
    'dick',
    'dildo',
    'dogging',
    'ejaculate',
    'ejaculation',
    'escort',
    'faggot',
    'femdom',
    'fuck',
    'gangbang',
    'handjob',
    'hardcore',
    'hentai',
    'hooker',
    'incest',
    'jerkoff',
    'midget',
    'milf',
    'nazi',
    'nudity',
    'orgasm',
    'paedophile',
    'pegging',
    'penis',
    'porn',
    'prostitute',
    'pussy',
    'rape',
    'scat',
    'slut',
    'sodom',
    'stripper',
    'swinger',
    'threesome',
    'titfuck',
    'vibrator',
    'xxx',
  ];

  static const List<String> _spamPhrases = <String>[
    'buy followers',
    'buy now',
    'click here',
    'crypto giveaway',
    'double your money',
    'earn $$$',
    'exclusive offer',
    'limited time offer',
    'make money fast',
    'miracle cure',
    'no experience needed',
    'passive income hack',
    'risk free',
    'work from home and earn',
  ];

  static FeedModerationResult evaluate({
    required String content,
    FeedPostType? type,
    String? summary,
    String? title,
    String? link,
  }) {
    final sanitisedContent = _sanitiseText(content);
    final sanitisedSummary = _sanitiseText(summary ?? '');
    final sanitisedTitle = _sanitiseText(title ?? '');
    final sanitisedLink = sanitiseExternalLink(link);

    if (sanitisedContent.isEmpty) {
      throw const FeedModerationException(
        'Add more detail before publishing to the timeline.',
        reasons: <String>['Share at least three words so the community understands your update.'],
      );
    }

    if (sanitisedContent.length > _maxCharacters) {
      throw FeedModerationException(
        'Posts can contain up to $_maxCharacters characters.',
        reasons: <String>['Reduce your update to within $_maxCharacters characters.'],
      );
    }

    final bannedMatches = _detectBannedTerms('$sanitisedContent $sanitisedSummary $sanitisedTitle');
    if (bannedMatches.isNotEmpty) {
      throw FeedModerationException(
        'Your update contains language that is not permitted on the community feed.',
        reasons: bannedMatches.map((term) => 'The term "$term" is not allowed on Gigvora.').toList(),
      );
    }

    final signals = _detectSpamSignals(
      content: sanitisedContent,
      summary: sanitisedSummary,
      title: sanitisedTitle,
      link: sanitisedLink,
    );

    final severeSignals = signals.where((signal) => signal.severity == FeedModerationSeverity.high).toList();
    if (severeSignals.isNotEmpty) {
      throw FeedModerationException(
        'We detected spam indicators in your update.',
        reasons: severeSignals.map((signal) => signal.message).toList(),
      );
    }

    final words = sanitisedContent.split(RegExp(r'\s+')).where((word) => word.isNotEmpty).toList(growable: false);
    if (words.length < _minWordCount) {
      throw const FeedModerationException(
        'Add more context before publishing to the timeline.',
        reasons: <String>['Share at least three words so the community understands your update.'],
      );
    }

    return FeedModerationResult(
      content: sanitisedContent,
      link: sanitisedLink,
      signals: signals,
    );
  }

  static String? sanitiseExternalLink(String? raw) {
    if (raw == null || raw.trim().isEmpty) {
      return null;
    }
    final trimmed = raw.trim();
    final candidate = trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : 'https://$trimmed';
    try {
      final uri = Uri.parse(candidate);
      if (!uri.hasScheme || (uri.scheme != 'http' && uri.scheme != 'https')) {
        return null;
      }
      final host = uri.host.replaceFirst(RegExp(r'^www\.'), '');
      if (_blockedDomains.any((domain) => host == domain || host.endsWith('.$domain'))) {
        return null;
      }
      return uri.toString();
    } catch (_) {
      return null;
    }
  }

  static String _sanitiseText(String? value) {
    if (value == null || value.isEmpty) {
      return '';
    }
    final withoutTags = value.replaceAll(RegExp(r'<[^>]*>', caseSensitive: false, multiLine: true), ' ');
    final withoutInvisible =
        withoutTags.replaceAll(RegExp(r'[\u200B-\u200D\uFEFF]', caseSensitive: false), '');
    return withoutInvisible.replaceAll(RegExp(r'\s+'), ' ').trim();
  }

  static List<String> _detectBannedTerms(String text) {
    final lower = text.toLowerCase();
    final matches = <String>[];
    for (final term in _bannedTerms) {
      final pattern = RegExp('\\b${RegExp.escape(term)}\\b', caseSensitive: false);
      if (pattern.hasMatch(lower) || _buildObfuscationPattern(term).hasMatch(lower)) {
        matches.add(term);
      }
    }
    return matches;
  }

  static RegExp _buildObfuscationPattern(String term) {
    final buffer = StringBuffer();
    for (final rune in term.runes) {
      final char = String.fromCharCode(rune);
      buffer.write(RegExp.escape(char));
      buffer.write('[^a-z0-9]*');
    }
    return RegExp(buffer.toString(), caseSensitive: false);
  }

  static List<FeedModerationSignal> _detectSpamSignals({
    required String content,
    required String summary,
    required String title,
    required String? link,
  }) {
    final combined = <String>[content, summary, title].where((part) => part.isNotEmpty).join(' ');
    final analysed = combined.toLowerCase();
    final signals = <FeedModerationSignal>[];

    if (RegExp(r'(.)\1{5,}').hasMatch(combined)) {
      signals.add(
        const FeedModerationSignal(
          type: 'repeated_characters',
          message: 'Please remove excessive repeated characters.',
          severity: FeedModerationSeverity.high,
        ),
      );
    }

    final words = analysed.split(RegExp(r'\s+')).where((word) => word.isNotEmpty).toList();
    if (words.length >= 4) {
      final uniqueWords = words.where((word) => word.length > 2).toSet();
      if (uniqueWords.isNotEmpty && uniqueWords.length / words.length < _minUniqueWordRatio) {
        signals.add(
          const FeedModerationSignal(
            type: 'repetitive_content',
            message: 'The update repeats the same words. Add more variety for clarity.',
            severity: FeedModerationSeverity.medium,
          ),
        );
      }
    }

    final linkMatches = RegExp(r'https?:\/\/').allMatches(combined).length + (link != null ? 1 : 0);
    if (linkMatches > _maxLinks) {
      signals.add(
        FeedModerationSignal(
          type: 'excessive_links',
          message: 'Posts can include up to $_maxLinks links.',
          severity: FeedModerationSeverity.high,
        ),
      );
    }

    final mentionMatches = RegExp(r'@[a-z0-9_.-]{2,}').allMatches(combined).length;
    if (mentionMatches > _maxMentions) {
      signals.add(
        FeedModerationSignal(
          type: 'excessive_mentions',
          message: 'Tag up to $_maxMentions handles in a single update.',
          severity: FeedModerationSeverity.medium,
        ),
      );
    }

    final letters = combined.replaceAll(RegExp(r'[^a-zA-Z]'), '');
    if (letters.length >= 12) {
      final uppercase = letters.replaceAll(RegExp(r'[^A-Z]'), '').length;
      final ratio = uppercase / letters.length;
      if (ratio > _maxUppercaseRatio) {
        signals.add(
          const FeedModerationSignal(
            type: 'shouting',
            message: 'Avoid using all caps throughout the update.',
            severity: FeedModerationSeverity.medium,
          ),
        );
      }
    }

    for (final phrase in _spamPhrases) {
      if (analysed.contains(phrase)) {
        signals.add(
          FeedModerationSignal(
            type: 'spam_phrase',
            message: 'The phrase "$phrase" is associated with spam and is not allowed.',
            severity: FeedModerationSeverity.high,
          ),
        );
      }
    }

    if (link != null && _isBlockedDomain(link)) {
      signals.add(
        const FeedModerationSignal(
          type: 'blocked_domain',
          message: 'Links from this domain are blocked for safety reasons.',
          severity: FeedModerationSeverity.high,
        ),
      );
    }

    return signals;
  }

  static bool _isBlockedDomain(String link) {
    try {
      final uri = Uri.parse(link);
      final host = uri.host.replaceFirst(RegExp(r'^www\.'), '');
      return _blockedDomains.any((domain) => host == domain || host.endsWith('.$domain'));
    } catch (_) {
      return false;
    }
  }
}
