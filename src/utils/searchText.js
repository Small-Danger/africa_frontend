/** Normalise pour comparaison (accents, casse). */
export function normalizeSearchText(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Découpe la requête en mots : "epice p" → ["epice", "p"] */
export function tokenizeSearchQuery(query) {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];
  return normalized.split(' ').filter(Boolean);
}

/** Chaque mot doit apparaître quelque part dans au moins un des champs. */
export function fieldsMatchAllTokens(fields, query) {
  const tokens = tokenizeSearchQuery(query);
  if (tokens.length === 0) return false;

  const normalizedFields = fields
    .filter(Boolean)
    .map((field) => normalizeSearchText(field))
    .filter(Boolean);

  if (normalizedFields.length === 0) return false;

  return tokens.every((token) =>
    normalizedFields.some((field) => field.includes(token))
  );
}
