/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface) {
  const now = new Date();
  const submissions = [
    {
      referenceId: 'post-48291',
      referenceType: 'community_post',
      channel: 'community_feed',
      submittedById: 741,
      submittedByType: 'user',
      assignedReviewerId: 12,
      assignedTeam: 'Integrity Squad',
      status: 'pending',
      priority: 'urgent',
      severity: 'high',
      riskScore: 82.5,
      title: 'Product launch post flagged for potential IP violation',
      summary:
        'User referenced competitor assets and attached design mockups. Requires confirmation that assets belong to the company.',
      submittedAt: new Date(now.getTime() - 1000 * 60 * 42),
      lastActivityAt: new Date(now.getTime() - 1000 * 60 * 10),
      slaMinutes: 120,
      region: 'us',
      language: 'en',
      metadata: {
        previewImage: 'https://cdn.example.com/review/ip-flagged.png',
        signals: ['banned_term', 'third_party_reference'],
      },
      rejectionReason: null,
      resolutionNotes: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      referenceId: 'profile-932',
      referenceType: 'company_profile_update',
      channel: 'profile',
      submittedById: 22,
      submittedByType: 'company_admin',
      assignedReviewerId: 15,
      assignedTeam: 'Policy Desk',
      status: 'in_review',
      priority: 'high',
      severity: 'medium',
      riskScore: 61.3,
      title: 'Benefits section update awaiting verification',
      summary:
        'Company updated benefits list with healthcare claims that need supporting documentation before publishing.',
      submittedAt: new Date(now.getTime() - 1000 * 60 * 300),
      lastActivityAt: new Date(now.getTime() - 1000 * 60 * 35),
      slaMinutes: 720,
      region: 'eu',
      language: 'en',
      metadata: {
        checklist: ['Request benefits verification', 'Confirm legal sign-off'],
      },
      rejectionReason: null,
      resolutionNotes: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      referenceId: 'job-1384',
      referenceType: 'job_posting',
      channel: 'jobs',
      submittedById: 97,
      submittedByType: 'recruiter',
      assignedReviewerId: 12,
      assignedTeam: 'Integrity Squad',
      status: 'needs_changes',
      priority: 'standard',
      severity: 'medium',
      riskScore: 44.9,
      title: 'Job post missing salary transparency notice',
      summary:
        'Posting targets New York candidates but omits salary range. Reviewer requested compliance update.',
      submittedAt: new Date(now.getTime() - 1000 * 60 * 1440),
      lastActivityAt: new Date(now.getTime() - 1000 * 60 * 120),
      slaMinutes: 1440,
      region: 'us',
      language: 'en',
      metadata: {
        requiredUpdate: 'Add salary range per NYC Pay Transparency Law',
      },
      rejectionReason: null,
      resolutionNotes: 'Awaiting recruiter confirmation of salary range update.',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const insertedSubmissions = await queryInterface.bulkInsert(
    'governance_content_submissions',
    submissions,
    { returning: ['id'] },
  );

  const firstSubmissionId = insertedSubmissions?.[0]?.id;
  const secondSubmissionId = insertedSubmissions?.[1]?.id;
  const thirdSubmissionId = insertedSubmissions?.[2]?.id;

  const actions = [
    {
      submissionId: firstSubmissionId,
      actorId: 12,
      actorType: 'admin',
      action: 'assign',
      severity: 'high',
      riskScore: 82.5,
      reason: 'Queue triage assigned to integrity specialist.',
      guidanceLink: 'https://governance.example.com/playbooks/ip-review',
      metadata: { assignedTeam: 'Integrity Squad' },
      resolutionSummary: 'Initial triage complete, awaiting creative rights verification.',
      createdAt: now,
      updatedAt: now,
    },
    {
      submissionId: thirdSubmissionId,
      actorId: 18,
      actorType: 'admin',
      action: 'request_changes',
      severity: 'medium',
      riskScore: 46.2,
      reason: 'Request salary range and location statement to comply with transparency requirements.',
      guidanceLink: 'https://policies.example.com/pay-transparency',
      metadata: { regulation: 'nyc-pay-transparency' },
      resolutionSummary: 'Notified recruiter with compliance instructions.',
      createdAt: now,
      updatedAt: now,
    },
    {
      submissionId: secondSubmissionId,
      actorId: 15,
      actorType: 'admin',
      action: 'add_note',
      severity: 'medium',
      riskScore: 60.1,
      reason: 'Waiting on supporting documents from benefits provider.',
      guidanceLink: null,
      metadata: { deadline: new Date(now.getTime() + 1000 * 60 * 360).toISOString() },
      resolutionSummary: 'Follow-up scheduled with company admin tomorrow.',
      createdAt: now,
      updatedAt: now,
    },
  ];

  await queryInterface.bulkInsert('governance_moderation_actions', actions, {});
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete('governance_moderation_actions', null, {});
  await queryInterface.bulkDelete('governance_content_submissions', null, {});
}
