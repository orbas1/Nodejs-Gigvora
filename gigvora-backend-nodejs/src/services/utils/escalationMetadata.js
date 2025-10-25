export function normaliseEscalationMetadata(metadata) {
  if (metadata == null) {
    return {};
  }

  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata);
      return normaliseEscalationMetadata(parsed);
    } catch (error) {
      return { raw: metadata };
    }
  }

  if (Array.isArray(metadata)) {
    return { items: [...metadata] };
  }

  if (typeof metadata === 'object') {
    return { ...metadata };
  }

  return { value: metadata };
}

export function toNullableEscalationMetadata(metadata) {
  const normalised = normaliseEscalationMetadata(metadata);
  return Object.keys(normalised).length > 0 ? normalised : null;
}
