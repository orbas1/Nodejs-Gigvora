import { Server } from 'socket.io';
import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import baseLogger from '../utils/logger.js';
import { getRuntimeConfig } from '../config/runtimeConfig.js';
import {
  resolveAllowedOrigins,
  compileAllowedOriginRules,
  isOriginAllowed,
} from '../config/httpSecurity.js';
import authenticateSocket from './socketAuth.js';
import { createConnectionRegistry } from './connectionRegistry.js';
import { createPresenceStore } from './presenceStore.js';
import registerCommunityNamespace from './communityNamespace.js';
import registerVoiceNamespace from './voiceNamespace.js';
import registerEventsNamespace from './eventsNamespace.js';
import registerModerationNamespace from './moderationNamespace.js';
import registerMessagingNamespace from './messagingNamespace.js';
import { AuthenticationError } from '../utils/errors.js';

let ioInstance = null;
let redisClients = [];
let connectionRegistry = null;

function resolveCorsOrigins(runtimeConfig, env = process.env) {
  const realtimeOrigins = runtimeConfig?.realtime?.cors?.allowedOrigins ?? [];
  if (realtimeOrigins.length > 0) {
    return realtimeOrigins;
  }
  const securityOrigins = runtimeConfig?.security?.cors?.allowedOrigins ?? [];
  if (securityOrigins.length > 0) {
    return securityOrigins;
  }
  return resolveAllowedOrigins(env);
}

function buildRedisClients(redisConfig, logger) {
  if (!redisConfig?.url) {
    return { adapter: null, clients: [], presenceStore: createPresenceStore({ logger }) };
  }
  const options = redisConfig.tls ? { tls: { rejectUnauthorized: false } } : {};
  const publisher = new Redis(redisConfig.url, options);
  const subscriber = publisher.duplicate();
  const adapter = createAdapter(publisher, subscriber, { key: `${redisConfig.keyPrefix ?? 'gigvora:realtime'}:socket` });

  const presenceStore = createPresenceStore({
    redisClient: publisher,
    keyPrefix: `${redisConfig.keyPrefix ?? 'gigvora:realtime'}:presence`,
    logger,
  });

  const clients = [publisher, subscriber];
  clients.forEach((client) => {
    client.on('error', (error) => {
      logger.warn({ err: error }, 'Realtime Redis client error');
    });
  });

  return { adapter, clients, presenceStore };
}

export async function attachSocketServer(httpServer, { logger = baseLogger } = {}) {
  if (ioInstance) {
    return ioInstance;
  }
  const runtimeConfig = getRuntimeConfig();
  if (!runtimeConfig?.realtime?.enabled) {
    logger.warn('Realtime socket server disabled by configuration.');
    return null;
  }

  const corsOrigins = resolveCorsOrigins(runtimeConfig);
  const originRules = compileAllowedOriginRules(corsOrigins);
  const corsLogger = typeof logger.child === 'function' ? logger.child({ component: 'realtime-cors' }) : logger;
  const io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (!origin || isOriginAllowed(origin, originRules)) {
          callback(null, true);
          return;
        }

        const error = new Error('Origin not allowed');
        error.data = { origin };
        corsLogger.warn({ origin }, 'Blocked realtime connection from untrusted origin');
        callback(error, false);
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    serveClient: false,
    transports: ['websocket', 'polling'],
    pingInterval: runtimeConfig.realtime.connection.pingIntervalMs,
    pingTimeout: runtimeConfig.realtime.connection.pingTimeoutMs,
    allowEIO3: false,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60_000,
      skipMiddlewares: false,
    },
  });

  io.engine.opts.handshakeTimeout = runtimeConfig.realtime.connection.handshakeTimeoutMs;

  const { adapter, clients, presenceStore } = buildRedisClients(
    runtimeConfig.realtime.redis,
    logger.child({ component: 'realtime-redis' }),
  );
  if (adapter) {
    io.adapter(adapter);
  }
  redisClients = clients;

  connectionRegistry = createConnectionRegistry({
    maxConnectionsPerUser: runtimeConfig.realtime.connection.maxConnectionsPerUser,
    presenceStore,
    logger: logger.child({ component: 'connection-registry' }),
  });

  io.use(async (socket, next) => {
    try {
      const actor = await authenticateSocket(socket, { allowAnonymous: false });
      socket.data.actor = actor;
      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return next(new Error(error.message));
      }
      logger.error({ err: error }, 'Unexpected error during socket authentication');
      return next(new Error('Realtime authentication failed.'));
    }
  });

  io.on('connection', (socket) => {
    const socketLogger = logger.child({ component: 'realtime-root', socketId: socket.id, userId: socket.data.actor?.id });
    connectionRegistry
      .register(socket)
      .catch((error) => {
        socketLogger.error({ err: error }, 'Failed to register realtime connection');
        socket.disconnect(true);
      });

    socket.emit('realtime:ready', {
      userId: socket.data.actor?.id ?? null,
      roles: socket.data.actor?.roles ?? [],
      permissions: socket.data.actor?.permissions ?? [],
      heartbeat: {
        pingIntervalMs: runtimeConfig.realtime.connection.pingIntervalMs,
        pingTimeoutMs: runtimeConfig.realtime.connection.pingTimeoutMs,
      },
    });

    socket.on('disconnect', (reason) => {
      connectionRegistry
        .unregister(socket, reason)
        .catch((error) => socketLogger.warn({ err: error }, 'Failed to unregister socket connection'));
    });
  });

  registerCommunityNamespace(io, { logger, runtimeConfig });
  registerVoiceNamespace(io, { logger, runtimeConfig });
  registerEventsNamespace(io, { logger });
  registerModerationNamespace(io, { logger });
  registerMessagingNamespace(io, { logger, runtimeConfig });

  ioInstance = io;
  logger.info('Realtime socket server attached.');
  return ioInstance;
}

export async function shutdownSocketServer() {
  if (!ioInstance) {
    return;
  }
  await new Promise((resolve) => {
    ioInstance.close(() => resolve());
  });
  ioInstance = null;
  await Promise.all(
    redisClients.map(async (client) => {
      try {
        await client.quit();
      } catch (error) {
        client.disconnect();
      }
    }),
  );
  redisClients = [];
}

export function getSocketServer() {
  return ioInstance;
}

export function getConnectionRegistry() {
  return connectionRegistry;
}

export default {
  attachSocketServer,
  shutdownSocketServer,
  getSocketServer,
  getConnectionRegistry,
};
