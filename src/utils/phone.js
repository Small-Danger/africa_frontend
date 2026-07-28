import {
  PHONE_COUNTRIES,
  DEFAULT_PHONE_COUNTRY,
  getCountryByCode,
} from '../config/phoneCountries.js';

export { PHONE_COUNTRIES, DEFAULT_PHONE_COUNTRY, getCountryByCode };

const onlyDigits = (value) => value.replace(/\D/g, '');

const hasMobilePrefix2 = (digits, prefixes) =>
  digits.length >= 2 && prefixes.includes(digits.slice(0, 2));

/**
 * Burkina : deux cas distincts
 * - 01–07, 50–79… = 8 chiffres dont le 0 fait partie du numéro (Moov/Orange)
 * - 0 + 63… = 9 chiffres, le 0 est le préfixe local à retirer → 63126849
 */
const normalizeBurkinaDigits = (digits, prefixes) => {
  if (!digits) return '';

  if (digits.length <= 8) {
    return digits;
  }

  if (digits.length === 9 && digits.startsWith('0')) {
    const withoutTrunk = digits.slice(1);
    if (hasMobilePrefix2(withoutTrunk, prefixes)) {
      return withoutTrunk;
    }
    const first8 = digits.slice(0, 8);
    if (hasMobilePrefix2(first8, prefixes)) {
      return first8;
    }
  }

  return digits.slice(0, 8);
};

/** Retire le 0 tronc local sauf quand le 0 fait partie du numéro (ex. BF 01…) */
export const normalizeNationalDigits = (value, country) => {
  const digits = onlyDigits(value);
  if (country?.keepLeadingZero) return digits;

  if (country?.code === 'BF') {
    return normalizeBurkinaDigits(digits, country.mobilePrefixes2 || []);
  }

  return digits.replace(/^0+/, '');
};

export const buildE164 = (dial, nationalValue, country) => {
  const c = country || PHONE_COUNTRIES.find((x) => x.dial === dial);
  const national = normalizeNationalDigits(nationalValue, c);
  if (!national) return '';
  return `+${dial}${national}`;
};

/** Décompose un numéro E.164 en pays + partie nationale */
export const parsePhoneE164 = (value) => {
  if (!value?.trim()) {
    return { countryCode: DEFAULT_PHONE_COUNTRY, national: '' };
  }

  const digits = onlyDigits(value);
  if (!digits) {
    return { countryCode: DEFAULT_PHONE_COUNTRY, national: '' };
  }

  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

  for (const country of sorted) {
    if (digits.startsWith(country.dial)) {
      return {
        countryCode: country.code,
        national: digits.slice(country.dial.length),
      };
    }
  }

  return { countryCode: DEFAULT_PHONE_COUNTRY, national: digits };
};

export const formatNationalDisplay = (nationalDigits, country) => {
  const digitsOnly = onlyDigits(nationalDigits);
  const raw =
    country.code === 'BF'
      ? digitsOnly.length <= 8
        ? digitsOnly
        : normalizeBurkinaDigits(digitsOnly, country.mobilePrefixes2 || [])
      : country.keepLeadingZero
        ? digitsOnly
        : normalizeNationalDigits(nationalDigits, country);
  const maxLen = country.code === 'BF' ? 9 : Math.max(...country.nationalLengths);
  const trimmed = raw.slice(0, maxLen);

  if (country.code === 'BF') {
    return trimmed.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  }

  if (country.code === 'BJ' && trimmed.length >= 4) {
    const parts = trimmed.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
    if (parts) return `${parts[1]} ${parts[2]} ${parts[3]} ${parts[4]} ${parts[5]}`;
  }

  if (country.code === 'CI' && trimmed.length === 9) {
    return `${trimmed.slice(0, 1)} ${trimmed.slice(1, 3)} ${trimmed.slice(3, 5)} ${trimmed.slice(5, 7)} ${trimmed.slice(7)}`;
  }

  if (country.code === 'CI' && trimmed.length === 10) {
    return `${trimmed.slice(0, 2)} ${trimmed.slice(2, 4)} ${trimmed.slice(4, 6)} ${trimmed.slice(6, 8)} ${trimmed.slice(8)}`;
  }

  if (trimmed.length <= 4) return trimmed;
  if (trimmed.length <= 6) return `${trimmed.slice(0, 2)} ${trimmed.slice(2)}`;
  if (trimmed.length <= 8) {
    return `${trimmed.slice(0, 2)} ${trimmed.slice(2, 4)} ${trimmed.slice(4)}`;
  }
  return `${trimmed.slice(0, 2)} ${trimmed.slice(2, 4)} ${trimmed.slice(4, 6)} ${trimmed.slice(6)}`;
};

const isObviousFakeNumber = (digits) => {
  if (!digits || digits.length < 6) return false;
  if (/^(\d)\1+$/.test(digits)) return true;
  if (['12345678', '123456789', '1234567890'].includes(digits)) return true;
  return false;
};

const isExcludedPrefix = (nationalDigits, country) => {
  if (country.excludePrefixes2?.length) {
    const p2 = nationalDigits.slice(0, 2);
    if (country.excludePrefixes2.includes(p2)) return true;
  }
  if (country.excludePrefixes1?.length) {
    const p1 = nationalDigits.slice(0, 1);
    if (country.excludePrefixes1.includes(p1)) return true;
  }
  return false;
};

/** Validation par préfixes opérateurs réels */
const matchesMobileRules = (nationalDigits, country) => {
  if (country.mobilePattern) {
    return country.mobilePattern.test(nationalDigits);
  }

  if (isExcludedPrefix(nationalDigits, country)) {
    return false;
  }

  // Bénin : 01 + sous-préfixe opérateur (10 chiffres)
  if (country.mobileSubPrefixes2?.length) {
    if (!nationalDigits.startsWith('01') || nationalDigits.length !== 10) return false;
    const sub = nationalDigits.slice(2, 4);
    if (country.excludeSubPrefixes2?.includes(sub)) return false;
    return country.mobileSubPrefixes2.includes(sub);
  }

  // Préfixes 3 chiffres (Togo 700…)
  if (country.mobilePrefixes3?.length) {
    const p3 = nationalDigits.slice(0, 3);
    if (country.mobilePrefixes3.includes(p3)) return true;
  }

  // Préfixes 2 chiffres
  if (country.mobilePrefixes2?.length) {
    const p2 = nationalDigits.slice(0, 2);
    if (country.mobilePrefixes2.includes(p2)) return true;
  }

  // Préfixe 1 chiffre (6 ou 7…)
  if (country.mobilePrefixes1?.length) {
    const p1 = nationalDigits.slice(0, 1);
    if (country.mobilePrefixes1.includes(p1)) return true;
  }

  return false;
};

/**
 * @returns {{ valid: boolean, status: 'empty'|'incomplete'|'invalid'|'valid', message: string|null, e164?: string, operatorHint?: string }}
 */
export const getPhoneValidationResult = (value) => {
  if (!value?.trim()) {
    return { valid: false, status: 'empty', message: null };
  }

  const normalized = value.replace(/\s/g, '');
  if (!normalized.startsWith('+')) {
    return { valid: false, status: 'invalid', message: 'Le numéro doit inclure l\'indicatif pays (+226…)' };
  }

  const { countryCode, national } = parsePhoneE164(normalized);
  const country = getCountryByCode(countryCode);
  const nationalDigits = country.keepLeadingZero
    ? onlyDigits(national)
    : normalizeNationalDigits(national, country);

  if (!nationalDigits) {
    return { valid: false, status: 'empty', message: 'Saisissez votre numéro mobile WhatsApp' };
  }

  const minLen = Math.min(...country.nationalLengths);
  const maxLen = Math.max(...country.nationalLengths);
  const inputMaxLen = country.code === 'BF' ? maxLen + 1 : maxLen; // 0 tronc local optionnel

  if (nationalDigits.length < minLen) {
    const remaining = minLen - nationalDigits.length;
    return {
      valid: false,
      status: 'incomplete',
      message: `Encore ${remaining} chiffre${remaining > 1 ? 's' : ''} — ex. ${country.placeholder}`,
      operatorHint: country.operatorsHint,
    };
  }

  if (nationalDigits.length > inputMaxLen) {
    return {
      valid: false,
      status: 'invalid',
      message: `Trop de chiffres pour ${country.name}`,
    };
  }

  const digitsForValidation =
    country.code === 'BF'
      ? normalizeBurkinaDigits(nationalDigits, country.mobilePrefixes2 || [])
      : nationalDigits;

  if (digitsForValidation.length !== minLen) {
    return {
      valid: false,
      status: 'incomplete',
      message: `Encore ${minLen - digitsForValidation.length} chiffre${minLen - digitsForValidation.length > 1 ? 's' : ''} — ex. ${country.placeholder}`,
      operatorHint: country.operatorsHint,
    };
  }

  if (isObviousFakeNumber(digitsForValidation)) {
    return {
      valid: false,
      status: 'invalid',
      message: 'Ce numéro ne semble pas valide',
    };
  }

  if (!matchesMobileRules(digitsForValidation, country)) {
    return {
      valid: false,
      status: 'invalid',
      message: country.invalidMessage,
      operatorHint: country.operatorsHint,
    };
  }

  const e164 = buildE164(country.dial, digitsForValidation, country);

  return {
    valid: true,
    status: 'valid',
    message: `Numéro mobile ${country.name} valide`,
    e164,
    operatorHint: country.operatorsHint,
  };
};

export const validatePhoneE164 = (value) => getPhoneValidationResult(value).valid;

export const formatPhoneE164Display = (value) => {
  if (!value) return '';
  const { countryCode, national } = parsePhoneE164(value);
  const country = getCountryByCode(countryCode);
  const formatted = formatNationalDisplay(national, country);
  return formatted ? `+${country.dial} ${formatted}` : `+${country.dial}`;
};

export const sanitizePhoneE164 = (value) => {
  const result = getPhoneValidationResult(value);
  return result.valid ? result.e164 : value?.replace(/\s/g, '') || '';
};

/** Opérateur Burkina à partir du numéro national 8 chiffres */
export const getBurkinaOperator = (nationalDigits) => {
  const p2 = nationalDigits.slice(0, 2);
  const moov = ['01', '02', '03', '50', '51', '52', '53', '60', '61', '62', '63', '70', '71', '72', '73'];
  const orange = ['04', '05', '06', '07', '54', '55', '56', '57', '64', '65', '66', '67', '74', '75', '76', '77'];
  const telecel = ['58', '68', '69', '78', '79'];
  if (moov.includes(p2)) return 'Moov Africa';
  if (orange.includes(p2)) return 'Orange';
  if (telecel.includes(p2)) return 'Telecel Faso';
  return null;
};
