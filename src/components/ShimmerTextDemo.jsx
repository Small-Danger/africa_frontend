import React, { useState } from 'react';
import ShimmerText, { ShimmerTextVariants } from './ShimmerText';

const ShimmerTextDemo = () => {
  const [showLoader, setShowLoader] = useState(false);

  const simulateLoading = () => {
    setShowLoader(true);
    setTimeout(() => setShowLoader(false), 3000);
  };

  if (showLoader) {
    return <ShimmerTextVariants.PageLoader subtitle="Démonstration du ShimmerText..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          Démonstration ShimmerText
        </h1>
        
        <div className="space-y-8">
          {/* Bouton de démonstration */}
          <div className="text-center">
            <button
              onClick={simulateLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              🎬 Voir l'effet ShimmerText
            </button>
          </div>

          {/* Exemples des différentes variantes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* PageLoader */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">PageLoader</h3>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                <ShimmerTextVariants.PageLoader 
                  text="AfrikRaga" 
                  subtitle="Chargement de la page..." 
                />
              </div>
            </div>

            {/* SectionLoader */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">SectionLoader</h3>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                <ShimmerTextVariants.SectionLoader 
                  text="AfrikRaga" 
                  subtitle="Chargement de la section..." 
                />
              </div>
            </div>

            {/* CardLoader */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">CardLoader</h3>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                <ShimmerTextVariants.CardLoader text="AfrikRaga" />
              </div>
            </div>

            {/* SmallLoader */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">SmallLoader</h3>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                <ShimmerTextVariants.SmallLoader text="AfrikRaga" />
              </div>
            </div>

            {/* MobileLoader */}
            <div className="bg-white rounded-xl p-6 shadow-lg md:col-span-2">
              <h3 className="text-lg font-semibold mb-4">MobileLoader</h3>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                <ShimmerTextVariants.MobileLoader 
                  text="AfrikRaga" 
                  subtitle="Chargement mobile..." 
                />
              </div>
            </div>

            {/* Custom ShimmerText */}
            <div className="bg-white rounded-xl p-6 shadow-lg md:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Custom ShimmerText</h3>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                <ShimmerText 
                  text="AfrikRaga" 
                  size="text-6xl" 
                  showSubtitle={true}
                  subtitle="Chargement personnalisé..."
                  className="min-h-[200px]"
                />
              </div>
            </div>
          </div>

          {/* Code d'utilisation */}
          <div className="bg-gray-900 rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-4 text-green-400">💻 Code d'utilisation</h3>
            <pre className="text-sm overflow-x-auto">
{`// Import du composant
import ShimmerText, { ShimmerTextVariants } from './components/ShimmerText';

// Utilisation simple
<ShimmerText text="AfrikRaga" />

// Utilisation avec variantes prédéfinies
<ShimmerTextVariants.PageLoader subtitle="Chargement..." />
<ShimmerTextVariants.SectionLoader />
<ShimmerTextVariants.CardLoader />
<ShimmerTextVariants.SmallLoader />
<ShimmerTextVariants.MobileLoader />

// Utilisation personnalisée
<ShimmerText 
  text="Mon Texte" 
  size="text-4xl" 
  showSubtitle={true}
  subtitle="Chargement personnalisé..."
  className="min-h-[300px]"
/>`}
            </pre>
          </div>

          {/* Caractéristiques */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-900">✨ Caractéristiques</h3>
            <ul className="space-y-2 text-blue-800">
              <li>• 🎨 Effet shimmer moderne comme Facebook/LinkedIn</li>
              <li>• 📱 Responsive et mobile-first</li>
              <li>• ⚡ Performance optimisée</li>
              <li>• 🎯 Facilement personnalisable</li>
              <li>• 🔄 Variantes prédéfinies pour différents contextes</li>
              <li>• 🎪 Compatible avec Tailwind CSS</li>
              <li>• 🚀 Aucune dépendance externe</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShimmerTextDemo;
