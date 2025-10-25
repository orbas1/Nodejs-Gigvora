import crypto from 'crypto';

/** @type {import('sequelize').QueryInterface} */
export async function up(queryInterface) {
  const [sessions] = await queryInterface.sequelize.query(
    'SELECT id, "userId" as "userId", "ipAddress" as "ipAddress", "userAgent" as "userAgent", context FROM user_refresh_sessions',
  );

  const updates = sessions.map((session) => {
    let context = session.context;
    if (typeof context === 'string') {
      try {
        context = JSON.parse(context);
      } catch (error) {
        context = null;
      }
    }

    const additional = context?.additional ?? context ?? {};
    const fingerprintSource = [
      additional.device?.id,
      additional.deviceId,
      additional.hardwareId,
      additional.sessionId,
      session.userAgent,
      session.ipAddress,
    ]
      .filter((value) => typeof value === 'string' && value.trim().length > 0)
      .join('|');

    const deviceFingerprint = fingerprintSource
      ? crypto.createHash('sha256').update(fingerprintSource).digest('hex')
      : null;

    return queryInterface.bulkUpdate(
      'user_refresh_sessions',
      {
        deviceFingerprint,
        deviceLabel: session.userAgent ? session.userAgent.slice(0, 180) : null,
        riskLevel: 'low',
        riskScore: 0,
        riskSignals: JSON.stringify([]),
      },
      { id: session.id },
    );
  });

  await Promise.all(updates);
}

export async function down(queryInterface) {
  await queryInterface.bulkUpdate(
    'user_refresh_sessions',
    {
      deviceFingerprint: null,
      deviceLabel: null,
      riskLevel: 'low',
      riskScore: 0,
      riskSignals: null,
    },
    {},
  );
}
