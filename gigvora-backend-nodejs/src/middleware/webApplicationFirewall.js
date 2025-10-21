import crypto from 'node:crypto';

import { recordBlockedOrigin } from '../observability/perimeterMetrics.js';
import logger from '../utils/logger.js';
import { evaluateRequest } from '../security/webApplicationFirewall.js';

export default function createWebApplicationFirewall({ logger: providedLogger, auditRecorder } = {}) {
  const log = providedLogger?.child ? providedLogger.child({ component: 'waf' }) : providedLogger || logger.child({ component: 'waf' });
  let resolvedAuditRecorder = typeof auditRecorder === 'function' ? auditRecorder : null;

  return async function webApplicationFirewallMiddleware(req, res, next) {
    let evaluation;
    try {
      evaluation = await evaluateRequest(req);
    } catch (error) {
      log.error({ err: error, path: req.originalUrl || req.path }, 'Web application firewall evaluation failed');
      res.status(403).json({
        message: 'Request blocked by security policy.',
        requestId: req.id ?? null,
      });
      return;
    }

    if (evaluation.allowed) {
      next();
      return;
    }

    const detectedAt = evaluation.detectedAt ?? new Date().toISOString();
    const referenceId = evaluation.referenceId ?? crypto.randomUUID();
    const autoBlock = evaluation.autoBlock ?? null;
    const autoBlockMetadata = autoBlock
      ? {
          triggered: Boolean(autoBlock.triggered),
          blockedAt: autoBlock.blockedAt ?? null,
          expiresAt: autoBlock.expiresAt ?? null,
          hits: autoBlock.hits ?? null,
          threshold: autoBlock.threshold ?? null,
          windowSeconds: autoBlock.windowSeconds ?? null,
        }
      : null;

    const perimeterKey = evaluation.origin ?? (evaluation.ip ? `ip://${evaluation.ip}` : 'unknown');
    recordBlockedOrigin(perimeterKey, {
      path: evaluation.path,
      method: evaluation.method,
    });

    log.warn(
      {
        referenceId,
        path: evaluation.path,
        method: evaluation.method,
        ip: evaluation.ip,
        origin: evaluation.origin,
        userAgent: evaluation.userAgent,
        reason: evaluation.reason,
        matchedRules: evaluation.matchedRules?.map((rule) => rule.id) ?? [],
        autoBlock: autoBlockMetadata,
      },
      'Blocked request via web application firewall',
    );

    try {
      if (!resolvedAuditRecorder) {
        const module = await import('../services/securityAuditService.js');
        const candidate = module.recordRuntimeSecurityEvent ?? module.default;
        if (typeof candidate === 'function') {
          resolvedAuditRecorder = candidate;
        }
      }

      const level = (() => {
        if (autoBlockMetadata?.triggered) {
          return 'error';
        }
        if (evaluation.reason === 'ip-blocked') {
          return 'warn';
        }
        if (evaluation.reason === 'auto-block') {
          return 'warn';
        }
        return 'notice';
      })();

      if (resolvedAuditRecorder) {
        await resolvedAuditRecorder(
          {
            eventType: 'security.perimeter.request_blocked',
            level,
            message: `Blocked ${evaluation.method} ${evaluation.path} via web application firewall`,
            metadata: {
              ip: evaluation.ip,
              origin: evaluation.origin,
              userAgent: evaluation.userAgent,
              matchedRules: evaluation.matchedRules,
              referenceId,
              detectedAt,
              autoBlock: autoBlockMetadata,
            },
            requestId: req.id,
          },
          { logger: log },
        );
      }
    } catch (error) {
      log.error({ err: error, referenceId }, 'Failed to persist web application firewall audit event');
    }

    res.status(403).json({
      message: 'Request blocked by security policy.',
      referenceId,
      requestId: req.id ?? null,
      detectedAt,
      reason: evaluation.reason,
      autoBlock: autoBlockMetadata,
    });
  };
}
