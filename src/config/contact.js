// Configuration des informations de contact
export const CONTACT_CONFIG = {
  // Numéro de téléphone principal (WhatsApp)
  WHATSAPP_PHONE: '+22663126849',
  
  // Numéro de téléphone formaté pour l'affichage
  WHATSAPP_PHONE_DISPLAY: '+226 63 12 68 49',
  
  // Numéro de téléphone pour les liens WhatsApp (sans +)
  WHATSAPP_PHONE_LINK: '22663126849',
  
  // Format de numéro de téléphone pour les placeholders
  PHONE_PLACEHOLDER: '+226 63 12 68 49',
  
  // Format de validation des numéros
  PHONE_FORMAT: '+226 ## ## ## ##',
  
  // Informations de l'entreprise
  COMPANY: {
    name: 'AfrikRaga',
    address: 'Ouagadougou, Burkina Faso',
    email: 'contact@afrikraga.com',
    website: 'https://afrikraga.com'
  },
  
  // Messages de contact
  MESSAGES: {
    whatsapp: {
      order: 'Bonjour ! J\'ai une question concernant ma commande',
      support: 'Bonjour ! J\'ai besoin d\'aide avec mon compte',
      general: 'Bonjour ! J\'aimerais avoir des informations'
    }
  }
};

// Fonction utilitaire pour générer un lien WhatsApp
export const generateWhatsAppLink = (message = '', phone = CONTACT_CONFIG.WHATSAPP_PHONE_LINK) => {
  const baseUrl = `https://wa.me/${phone}`;
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
};

// Fonction utilitaire pour formater un numéro de téléphone
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Nettoyer le numéro
  const cleaned = phone.replace(/\D/g, '');
  
  // Formater selon le format burkinabé
  if (cleaned.startsWith('226')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9, 11)}`;
  }
  
  return phone;
};

export default CONTACT_CONFIG;
