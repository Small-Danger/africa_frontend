/**
 * Transforme les réponses d'erreur API auth en messages clairs pour l'utilisateur.
 */

const DUPLICATE_RULES = [
  {
    field: 'whatsapp_phone',
    match: (msg) => /déjà|already|unique|utilisé/i.test(msg),
    message: 'Ce numéro WhatsApp est déjà inscrit sur AfrikRaga.',
    hint: 'Connectez-vous avec ce numéro et votre mot de passe, ou utilisez un autre numéro.',
    accountExists: true,
    duplicateField: 'whatsapp_phone',
  },
  {
    field: 'email',
    match: (msg) => /déjà|already|unique|utilisé/i.test(msg),
    message: 'Cette adresse email est déjà utilisée.',
    hint: 'Connectez-vous avec cet email ou choisissez une autre adresse.',
    accountExists: true,
    duplicateField: 'email',
  },
];

const FIELD_MESSAGES = {
  whatsapp_phone: {
    required: 'Indiquez votre numéro WhatsApp.',
    invalid: 'Numéro WhatsApp invalide — vérifiez l\'indicatif et le format mobile.',
  },
  email: {
    email: 'Format d\'email incorrect (ex. nom@mail.com).',
    required: 'Indiquez votre adresse email.',
  },
  password: {
    min: 'Le mot de passe doit contenir au minimum 8 caractères.',
    confirmed: 'La confirmation ne correspond pas au mot de passe.',
    required: 'Choisissez un mot de passe.',
  },
  password_confirmation: {
    confirmed: 'Les deux mots de passe ne correspondent pas.',
  },
  name: {
    required: 'Indiquez votre nom complet.',
    min: 'Le nom doit contenir au moins 2 caractères.',
  },
};

const firstMessage = (value) => {
  if (Array.isArray(value)) return value[0];
  if (typeof value === 'string') return value;
  return null;
};

const matchFieldRule = (field, rawMsg) => {
  const msg = rawMsg || '';
  const rules = FIELD_MESSAGES[field];
  if (!rules) return msg;

  for (const [key, text] of Object.entries(rules)) {
    if (msg.toLowerCase().includes(key) || msg === text) {
      return text;
    }
  }
  return msg;
};

/**
 * @param {{ success?: boolean, message?: string, errors?: Record<string, string[]>, status?: number } | Error} source
 */
export function parseAuthFormError(source) {
  const errors = source?.errors || {};
  const fieldErrors = {};
  let accountExists = false;
  let duplicateField = null;
  let title = 'Impossible de continuer';
  let message = source?.message || 'Une erreur est survenue. Veuillez réessayer.';
  let hint = null;

  for (const [field, raw] of Object.entries(errors)) {
    const rawMsg = firstMessage(raw);
    if (!rawMsg) continue;

    const duplicateRule = DUPLICATE_RULES.find((r) => r.field === field && r.match(rawMsg));
    if (duplicateRule) {
      fieldErrors[field] = duplicateRule.message;
      accountExists = true;
      duplicateField = duplicateRule.duplicateField;
      title = 'Compte déjà existant';
      message = duplicateRule.message;
      hint = duplicateRule.hint;
      continue;
    }

    fieldErrors[field] = matchFieldRule(field, rawMsg) || rawMsg;
  }

  if (Object.keys(fieldErrors).length > 0 && !accountExists) {
    title = 'Corrigez les champs signalés';
    const firstFieldMsg = Object.values(fieldErrors)[0];
    message = firstFieldMsg;
  }

  if (source?.status === 0 || /network|fetch|connexion/i.test(message)) {
    title = 'Connexion interrompue';
    message = 'Impossible de joindre le serveur. Vérifiez votre connexion internet et réessayez.';
    hint = null;
  }

  if (source?.status === 401 && !accountExists) {
    title = 'Identifiants incorrects';
    message = 'Numéro ou mot de passe incorrect. Vérifiez vos informations.';
    hint = 'Si vous venez de créer un compte, attendez quelques secondes et réessayez.';
  }

  return {
    fieldErrors,
    title,
    message,
    hint,
    accountExists,
    duplicateField,
  };
}

export function buildRegisterPayload(formData, sanitizePhoneE164) {
  const payload = {
    name: formData.name.trim(),
    password: formData.password,
    password_confirmation: formData.password_confirmation,
    whatsapp_phone: sanitizePhoneE164(formData.whatsapp_phone),
  };

  const email = formData.email?.trim();
  if (email) {
    payload.email = email;
  }

  return payload;
}
