import apiClient from './apiClient.js';

function normalisePersona(persona) {
  if (!persona) {
    return null;
  }
  return {
    id: persona.id ?? persona.slug ?? persona.personaKey ?? '',
    title: persona.title ?? '',
    subtitle: persona.subtitle ?? '',
    headline: persona.headline ?? null,
    benefits: Array.isArray(persona.benefits) ? persona.benefits : [],
    metrics: Array.isArray(persona.metrics) ? persona.metrics : [],
    signatureMoments: Array.isArray(persona.signatureMoments) ? persona.signatureMoments : [],
    recommendedModules: Array.isArray(persona.recommendedModules) ? persona.recommendedModules : [],
  };
}

export async function listOnboardingPersonas({ signal } = {}) {
  const response = await apiClient.get('/onboarding/personas', { signal });
  const personas = Array.isArray(response?.personas) ? response.personas : Array.isArray(response) ? response : [];
  return personas.map((persona) => normalisePersona(persona)).filter(Boolean);
}

export async function createOnboardingJourney(payload, { signal } = {}) {
  const response = await apiClient.post('/onboarding/journeys', payload, { signal });
  return response?.journey ?? response;
}

export default {
  listOnboardingPersonas,
  createOnboardingJourney,
};
