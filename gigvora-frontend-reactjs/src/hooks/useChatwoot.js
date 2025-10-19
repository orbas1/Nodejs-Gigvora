import { useEffect, useRef } from 'react';
import useSession from './useSession.js';
import { fetchChatwootSession } from '../services/support.js';

const SCRIPT_ID = 'gigvora-chatwoot-sdk';
const SDK_PATH = '/packs/js/sdk.js';

function waitForChatwoot() {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }
  if (window.$chatwoot) {
    return Promise.resolve(window.$chatwoot);
  }
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 100;
    const interval = setInterval(() => {
      attempts += 1;
      if (window.$chatwoot) {
        clearInterval(interval);
        resolve(window.$chatwoot);
        return;
      }
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        resolve(null);
      }
    }, 100);
  });
}

function loadChatwootScript(baseUrl) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve();
  }
  const normalizedBase = String(baseUrl ?? '').replace(/\/$/, '');
  if (!normalizedBase) {
    return Promise.reject(new Error('Chatwoot base URL is required.'));
  }

  const existing = document.getElementById(SCRIPT_ID);
  if (existing) {
    if (existing.dataset.baseUrl !== normalizedBase) {
      existing.remove();
    } else if (window.chatwootSDK) {
      return Promise.resolve();
    }
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.dataset.baseUrl = normalizedBase;
    script.src = `${normalizedBase}${SDK_PATH}`;
    script.onload = () => resolve();
    script.onerror = (error) => reject(error);
    document.head.appendChild(script);
  });
}

function applyWidgetConfiguration(widget, configuration) {
  if (!widget || !configuration?.enabled) {
    return;
  }
  const { contact, secureMode, customAttributes, locale, inboxId, sla } = configuration;
  const identifier = secureMode?.identifier ?? contact?.identifier ?? null;
  if (!identifier) {
    return;
  }

  const identityPayload = {
    email: contact?.email ?? undefined,
    name: contact?.name ?? undefined,
    avatar_url: contact?.avatarUrl ?? undefined,
  };

  const customPayload = {
    ...(customAttributes ?? {}),
    inbox_id: inboxId ?? undefined,
    support_sla_first_response_minutes: sla?.firstResponseMinutes ?? undefined,
    support_sla_resolution_minutes: sla?.resolutionMinutes ?? undefined,
  };

  try {
    const options = {
      custom_attributes: customPayload,
    };
    if (secureMode?.identifierHash) {
      options.identifier_hash = secureMode.identifierHash;
    }
    widget.setUser(identifier, identityPayload, options);
    if (typeof widget.setCustomAttributes === 'function') {
      widget.setCustomAttributes(customPayload);
    }
    if (typeof widget.setConversationCustomAttributes === 'function') {
      widget.setConversationCustomAttributes({
        preferred_dashboard: customAttributes?.primary_dashboard ?? undefined,
        gigvora_user_id: customAttributes?.gigvora_user_id ?? undefined,
        memberships: Array.isArray(customAttributes?.memberships)
          ? customAttributes.memberships.join(', ')
          : customAttributes?.memberships,
      });
    }
    if (locale && typeof widget.setLocale === 'function') {
      widget.setLocale(locale);
    }
    window.__gigvoraChatwootIdentifier = identifier;
  } catch (error) {
    console.error('Failed to configure Chatwoot widget', error);
  }
}

export default function useChatwoot({ enabled = true } = {}) {
  const { isAuthenticated, session } = useSession();
  const controllerRef = useRef(null);
  const lastUserRef = useRef(null);

  useEffect(() => {
    if (!enabled || !isAuthenticated || !session?.id) {
      lastUserRef.current = null;
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
      return undefined;
    }

    if (lastUserRef.current === session.id) {
      return undefined;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    lastUserRef.current = session.id;

    async function bootstrap() {
      try {
        const configuration = await fetchChatwootSession({ signal: controller.signal });
        if (!configuration?.enabled) {
          return;
        }
        const baseUrl = String(configuration.baseUrl ?? '').replace(/\/$/, '');
        if (!baseUrl) {
          console.warn('Chatwoot configuration missing baseUrl.');
          return;
        }

        window.chatwootSettings = {
          hideMessageBubble: false,
          position: 'right',
          locale: configuration.locale ?? 'en',
          type: 'standard',
          launcherTitle: 'Need help?',
        };

        await loadChatwootScript(baseUrl);
        if (controller.signal.aborted) {
          return;
        }

        if (window.chatwootSDK?.run) {
          window.chatwootSDK.run({
            websiteToken: configuration.websiteToken,
            baseUrl,
          });
        }

        const widget = await waitForChatwoot();
        if (!widget || controller.signal.aborted) {
          return;
        }

        applyWidgetConfiguration(widget, configuration);
        if (typeof widget.hide === 'function') {
          widget.hide();
        }
        if (typeof widget.toggle === 'function') {
          widget.toggle('open');
          widget.toggle('close');
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Chatwoot bootstrap failed', error);
        }
      }
    }

    bootstrap();

    return () => {
      controller.abort();
      controllerRef.current = null;
    };
  }, [enabled, isAuthenticated, session?.id]);

  return null;
}
