import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/marketplace/data/models/job_application_record.dart';

void main() {
  group('JobApplicationRecord', () {
    test('fromJson parses interviews and normalises strings', () {
      final record = JobApplicationRecord.fromJson({
        'id': 'app-1',
        'jobId': 'job-1',
        'applicantName': '  Alex Gómez ',
        'email': 'alex@example.com',
        'status': 'offer',
        'createdAt': '2024-01-01T12:00:00Z',
        'updatedAt': '2024-01-02T12:00:00Z',
        'interviews': [
          {
            'id': 'intro',
            'label': 'Intro call',
            'startsAt': '2024-01-05T09:00:00Z',
            'format': 'Video',
          }
        ],
      });

      expect(record.applicantName, 'Alex Gómez');
      expect(record.status, JobApplicationStatus.offer);
      expect(record.interviews.first.label, 'Intro call');
    });

    test('copyWith updates selective fields', () {
      final now = DateTime.now();
      final record = JobApplicationRecord(
        id: 'app-2',
        jobId: 'job-1',
        applicantName: 'Lena Fields',
        email: 'lena@example.com',
        status: JobApplicationStatus.submitted,
        createdAt: now,
        updatedAt: now,
      );

      final updated = record.copyWith(status: JobApplicationStatus.interviewing, phone: '+44 7700 900123');
      expect(updated.status, JobApplicationStatus.interviewing);
      expect(updated.phone, '+44 7700 900123');
      expect(updated.id, record.id);
    });

    test('toJson omits empty optional fields', () {
      final now = DateTime.now();
      final record = JobApplicationRecord(
        id: 'app-3',
        jobId: 'job-2',
        applicantName: 'Priya Patel',
        email: 'priya@example.com',
        status: JobApplicationStatus.submitted,
        createdAt: now,
        updatedAt: now,
        interviews: const [],
      );

      final json = record.toJson();
      expect(json.containsKey('phone'), isFalse);
      expect(json['status'], 'submitted');
    });
  });

  group('JobApplicationRecordListX', () {
    test('sortedByMostRecent orders by updatedAt descending', () {
      final now = DateTime.now();
      final records = [
        JobApplicationRecord(
          id: '1',
          jobId: 'job',
          applicantName: 'A',
          email: 'a@example.com',
          status: JobApplicationStatus.submitted,
          createdAt: now.subtract(const Duration(days: 2)),
          updatedAt: now.subtract(const Duration(days: 1)),
        ),
        JobApplicationRecord(
          id: '2',
          jobId: 'job',
          applicantName: 'B',
          email: 'b@example.com',
          status: JobApplicationStatus.submitted,
          createdAt: now.subtract(const Duration(days: 3)),
          updatedAt: now,
        ),
      ];

      final sorted = records.sortedByMostRecent();
      expect(sorted.first.id, '2');
    });
  });
}
