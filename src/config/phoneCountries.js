/**
 * Règles de numérotation mobile par pays (sources : ARCEP BF, ANRT MA, ARTCI, etc.)
 * mobilePrefixes2/3 = préfixes nationaux réels (hors indicatif +XXX)
 */

export const PHONE_COUNTRIES = [
  {
    code: 'BF',
    name: 'Burkina Faso',
    dial: '226',
    flag: '🇧🇫',
    placeholder: '01 23 45 67 ou 63 12 68 49',
    nationalLengths: [8],
    // ARCEP / opérateurs — Moov, Orange, Telecel (mobiles uniquement, pas fixes 20/24/25)
    mobilePrefixes2: [
      '01', '02', '03', // Moov
      '04', '05', '06', '07', // Orange
      '50', '51', '52', '53', // Moov
      '54', '55', '56', '57', // Orange
      '58', // Telecel
      '60', '61', '62', '63', // Moov
      '64', '65', '66', '67', // Orange
      '68', '69', // Telecel
      '70', '71', '72', '73', // Moov
      '74', '75', '76', '77', // Orange
      '78', '79', // Telecel
    ],
    operatorsHint: 'Moov · Orange · Telecel',
    invalidMessage: 'Numéro mobile invalide au Burkina (01–07, 50–79…) — pas un fixe 20/25',
  },
  {
    code: 'MA',
    name: 'Maroc',
    dial: '212',
    flag: '🇲🇦',
    placeholder: '6 12 34 56 78',
    nationalLengths: [9],
    mobilePrefixes1: ['6', '7'], // ANRT : mobile 06/07 → 9 chiffres sans le 0
    operatorsHint: 'IAM · Orange · Inwi',
    invalidMessage: 'Mobile Maroc : 9 chiffres commençant par 6 ou 7 (pas fixe 5…)',
  },
  {
    code: 'CI',
    name: "Côte d'Ivoire",
    dial: '225',
    flag: '🇨🇮',
    placeholder: '07 12 34 56 78',
    nationalLengths: [9],
    mobilePrefixes1: ['1', '5', '7'], // Moov 01 · MTN 05 · Orange 07 (sans le 0 initial)
    operatorsHint: 'Moov 01 · MTN 05 · Orange 07',
    invalidMessage: 'Mobile CI : 9 chiffres après +225 (commence par 1, 5 ou 7 — ex. 07… → 712…)',
  },
  {
    code: 'SN',
    name: 'Sénégal',
    dial: '221',
    flag: '🇸🇳',
    placeholder: '77 123 45 67',
    nationalLengths: [9],
    mobilePrefixes2: ['70', '75', '76', '77', '78'],
    operatorsHint: 'Orange · Free · Expresso',
    invalidMessage: 'Mobile Sénégal : 9 chiffres commençant par 70, 75, 76, 77 ou 78',
  },
  {
    code: 'ML',
    name: 'Mali',
    dial: '223',
    flag: '🇲🇱',
    placeholder: '65 12 34 56',
    nationalLengths: [8],
    mobilePrefixes2: ['65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '82', '83', '84', '89', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99'],
    mobilePrefixes1: ['6', '7', '9'], // fallback 8 chiffres 6x/7x/9x
    excludePrefixes2: ['20', '21', '22', '23', '24', '25', '26', '27'], // fixes
    operatorsHint: 'Orange · Malitel/Moov · Telecel',
    invalidMessage: 'Mobile Mali : 8 chiffres (6x, 7x, 9x…) — pas un fixe 20–27',
  },
  {
    code: 'NE',
    name: 'Niger',
    dial: '227',
    flag: '🇳🇪',
    placeholder: '96 12 34 56',
    nationalLengths: [8],
    mobilePrefixes2: ['93', '94', '96'], // Sahelcom · Telecel · Airtel/Zamani
    operatorsHint: 'Airtel 96 · Telecel 94 · Sahelcom 93',
    invalidMessage: 'Mobile Niger : 8 chiffres commençant par 93, 94 ou 96',
  },
  {
    code: 'TG',
    name: 'Togo',
    dial: '228',
    flag: '🇹🇬',
    placeholder: '90 12 34 56',
    nationalLengths: [8],
    mobilePrefixes2: ['70', '71', '72', '73', '78', '79', '90', '91', '92', '93', '96', '97', '98', '99'],
    mobilePrefixes3: ['700', '701', '702', '703', '704', '705', '793', '794', '795', '796', '797', '798', '799'],
    excludePrefixes2: ['22', '23', '24', '25', '26', '27'], // fixes
    operatorsHint: 'Yas/Togocom · Moov',
    invalidMessage: 'Mobile Togo : 8 chiffres (70–73, 90–93, 96–99…) — pas fixe 22–27',
  },
  {
    code: 'BJ',
    name: 'Bénin',
    dial: '229',
    flag: '🇧🇯',
    placeholder: '01 66 12 34 56',
    nationalLengths: [10],
    keepLeadingZero: true, // le 01 fait partie du numéro
    mobilePrefixes2: ['01'], // tout numéro 10 chiffres depuis nov. 2024
    mobileSubPrefixes2: ['40', '41', '42', '43', '44', '45', '46', '47', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '90', '91', '93', '94', '95', '96', '97', '98', '99'],
    excludeSubPrefixes2: ['20', '21', '22', '23'], // fixes géographiques
    operatorsHint: 'MTN · Moov · Celtiis',
    invalidMessage: 'Mobile Bénin : 10 chiffres (01 + opérateur mobile, pas 01 20–23…)',
  },
  {
    code: 'GN',
    name: 'Guinée',
    dial: '224',
    flag: '🇬🇳',
    placeholder: '621 12 34 56',
    nationalLengths: [9],
    mobilePrefixes1: ['6'],
    operatorsHint: 'Orange · MTN · Cellcom',
    invalidMessage: 'Mobile Guinée : 9 chiffres commençant par 6',
  },
  {
    code: 'GH',
    name: 'Ghana',
    dial: '233',
    flag: '🇬🇭',
    placeholder: '24 123 4567',
    nationalLengths: [9],
    mobilePrefixes2: ['20', '23', '24', '25', '26', '27', '28', '50', '53', '54', '55', '56', '57', '59'],
    excludePrefixes2: ['30', '31', '32', '33', '34', '35', '36', '37', '38'], // fixes
    operatorsHint: 'MTN · Telecel · AT',
    invalidMessage: 'Mobile Ghana : 9 chiffres (24, 50, 26…) — pas fixe 30–38',
  },
  {
    code: 'CM',
    name: 'Cameroun',
    dial: '237',
    flag: '🇨🇲',
    placeholder: '6 12 34 56 78',
    nationalLengths: [9],
    mobilePrefixes1: ['6'],
    excludePrefixes1: ['2'],
    operatorsHint: 'MTN · Orange · Nexttel',
    invalidMessage: 'Mobile Cameroun : 9 chiffres commençant par 6 (pas fixe 2…)',
  },
  {
    code: 'FR',
    name: 'France',
    dial: '33',
    flag: '🇫🇷',
    placeholder: '6 12 34 56 78',
    nationalLengths: [9],
    mobilePrefixes1: ['6', '7'],
    invalidMessage: 'Mobile France : 9 chiffres commençant par 6 ou 7',
  },
  {
    code: 'BE',
    name: 'Belgique',
    dial: '32',
    flag: '🇧🇪',
    placeholder: '470 12 34 56',
    nationalLengths: [9],
    mobilePrefixes2: ['45', '46', '47', '48', '49'],
    invalidMessage: 'Mobile Belgique : 9 chiffres commençant par 45–49',
  },
  {
    code: 'CA',
    name: 'Canada',
    dial: '1',
    flag: '🇨🇦',
    placeholder: '514 123 4567',
    nationalLengths: [10],
    mobilePattern: /^[2-9]\d{9}$/,
    invalidMessage: 'Numéro NANP : 10 chiffres, indicatif régional valide',
  },
  {
    code: 'US',
    name: 'États-Unis',
    dial: '1',
    flag: '🇺🇸',
    placeholder: '202 555 0123',
    nationalLengths: [10],
    mobilePattern: /^[2-9]\d{9}$/,
    invalidMessage: 'Numéro NANP : 10 chiffres, indicatif régional valide',
  },
];

export const DEFAULT_PHONE_COUNTRY = 'BF';

export const getCountryByCode = (code) =>
  PHONE_COUNTRIES.find((c) => c.code === code) ||
  PHONE_COUNTRIES.find((c) => c.code === DEFAULT_PHONE_COUNTRY);
