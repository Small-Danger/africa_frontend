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

/** Mot présent dans un texte (ex. « epice » → « epices »). */
export function tokenMatchesInText(token, text) {
  if (!token || !text) return false;
  if (text.includes(token)) return true;
  return text.split(/\s+/).some(
    (word) => word.startsWith(token) || (token.length >= 3 && token.startsWith(word))
  );
}

/** Les mots de la requête apparaissent dans le même ordre dans le texte. */
export function tokensAppearInOrder(text, tokens) {
  if (!text || tokens.length === 0) return false;
  let fromIndex = 0;
  for (const token of tokens) {
    let found = -1;
    const words = text.split(/\s+/);
    let charIndex = 0;
    for (const word of words) {
      if (tokenMatchesInText(token, word)) {
        found = charIndex;
        break;
      }
      charIndex += word.length + 1;
    }
    if (found === -1) {
      found = text.indexOf(token, fromIndex);
      if (found === -1) {
        for (const word of words) {
          if (word.startsWith(token)) {
            found = text.indexOf(word, fromIndex);
            break;
          }
        }
      }
    }
    if (found === -1 || found < fromIndex) return false;
    fromIndex = found + token.length;
  }
  return true;
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
    normalizedFields.some((field) => tokenMatchesInText(token, field))
  );
}

/**
 * Score de pertinence :
 * 1) nombre de mots trouvés dans le NOM (priorité absolue)
 * 2) tous les mots dans le nom + ordre de la requête
 * 3) nom > catégorie > description pour chaque mot
 */
export function computeSearchRelevance(fields, query) {
  const tokens = tokenizeSearchQuery(query);
  if (tokens.length === 0) return 0;

  const name = normalizeSearchText(fields[0] || '');
  const description = normalizeSearchText(fields[1] || '');
  const category = normalizeSearchText(fields[2] || '');

  const tokensInName = tokens.filter((token) => tokenMatchesInText(token, name));
  const tokensInNameCount = tokensInName.length;
  const allTokensInName = tokensInNameCount === tokens.length;

  // Palier dominant : 2 mots dans le nom bat toujours 1 mot dans le nom
  let score = tokensInNameCount * 2000;

  if (allTokensInName) {
    score += 800;
    if (tokensAppearInOrder(name, tokens)) score += 400;
    score += Math.max(0, 150 - name.length);
  }

  for (const token of tokens) {
    if (tokenMatchesInText(token, name)) {
      const wordStart = name.split(/\s+/).some((word) => word.startsWith(token));
      score += name.startsWith(token) || wordStart ? 60 : 40;
    } else if (tokenMatchesInText(token, category)) {
      score += 18;
    } else if (tokenMatchesInText(token, description)) {
      score += 4;
    }
  }

  return score;
}

export function countTokensInName(fields, query) {
  const tokens = tokenizeSearchQuery(query);
  const name = normalizeSearchText(fields[0] || '');
  return tokens.filter((token) => tokenMatchesInText(token, name)).length;
}

export function compareBySearchRelevance(a, b, getFields, query) {
  const nameMatchDiff =
    countTokensInName(getFields(b), query) - countTokensInName(getFields(a), query);
  if (nameMatchDiff !== 0) return nameMatchDiff;

  const scoreDiff =
    computeSearchRelevance(getFields(b), query) - computeSearchRelevance(getFields(a), query);
  if (scoreDiff !== 0) return scoreDiff;

  const nameA = normalizeSearchText(getFields(a)[0] || '');
  const nameB = normalizeSearchText(getFields(b)[0] || '');
  return nameA.localeCompare(nameB, 'fr');
}

export function sortBySearchRelevance(items, query, getFields) {
  return [...items].sort((a, b) => compareBySearchRelevance(a, b, getFields, query));
}

export const productSearchFields = (item) => [
  item.name,
  item.description,
  item.category?.name,
];

export const categorySearchFields = (item) => [item.name, item.description, ''];
