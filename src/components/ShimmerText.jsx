import React from 'react';

const ShimmerText = ({ 
  text = "AfrikRaga", 
  size = "text-4xl", 
  className = "",
  showSubtitle = false,
  subtitle = "Chargement..."
}) => {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[200px] ${className}`}>
      {/* Texte principal avec effet shimmer */}
      <div className="relative">
        <h1 
          className={`${size} font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 animate-pulse`}
          style={{
            backgroundImage: 'linear-gradient(90deg, #d1d5db 25%, #9ca3af 50%, #d1d5db 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite linear'
          }}
        >
          {text}
        </h1>
        
        {/* Effet shimmer personnalisé */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite linear'
          }}
        />
      </div>
      
      {/* Sous-titre optionnel */}
      {showSubtitle && (
        <p className="mt-4 text-sm text-gray-500 animate-pulse">
          {subtitle}
        </p>
      )}
      
      {/* Styles CSS pour l'animation shimmer */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>
    </div>
  );
};

// Variantes prédéfinies pour différents contextes
export const ShimmerTextVariants = {
  // Pour les pages de chargement principales
  PageLoader: ({ text = "AfrikRaga", subtitle = "Chargement de la page..." }) => (
    <ShimmerText 
      text={text} 
      size="text-5xl md:text-6xl" 
      showSubtitle={true} 
      subtitle={subtitle}
      className="min-h-screen"
    />
  ),
  
  // Pour les sections de contenu
  SectionLoader: ({ text = "AfrikRaga", subtitle = "Chargement..." }) => (
    <ShimmerText 
      text={text} 
      size="text-3xl md:text-4xl" 
      showSubtitle={true} 
      subtitle={subtitle}
      className="min-h-[300px]"
    />
  ),
  
  // Pour les cartes de produits
  CardLoader: ({ text = "AfrikRaga" }) => (
    <ShimmerText 
      text={text} 
      size="text-2xl" 
      className="min-h-[200px]"
    />
  ),
  
  // Pour les petits éléments
  SmallLoader: ({ text = "AfrikRaga" }) => (
    <ShimmerText 
      text={text} 
      size="text-lg" 
      className="min-h-[100px]"
    />
  ),
  
  // Version mobile optimisée
  MobileLoader: ({ text = "AfrikRaga", subtitle = "Chargement..." }) => (
    <ShimmerText 
      text={text} 
      size="text-4xl" 
      showSubtitle={true} 
      subtitle={subtitle}
      className="min-h-screen px-4"
    />
  )
};

export default ShimmerText;
