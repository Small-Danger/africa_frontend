import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
  const phoneNumber = '22663126849'; // Votre numéro WhatsApp
  const defaultMessage = 'Bonjour, j\'ai besoin d\'aide avec BS Shop.';

  const openWhatsApp = () => {
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button
      onClick={openWhatsApp}
      className="fixed bottom-20 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 z-50 group"
      title="Contacter le support WhatsApp"
    >
      <MessageCircle size={24} />
      
      {/* Tooltip */}
      <span className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Besoin d'aide ? Contactez-nous !
      </span>
      
      {/* Animation de pulsation */}
      <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
    </button>
  );
};

export default WhatsAppButton;
