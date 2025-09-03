import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const SimpleBannerCarousel = ({ banners = [], autoPlay = true, interval = 5000 }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const [isHovered, setIsHovered] = useState(false);
  const autoPlayRef = useRef(null);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Fonction pour passer à la slide suivante
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  // Fonction pour passer à la slide précédente
  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Fonction pour aller à une slide spécifique
  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
  }, []);

  // Gestion du swipe tactile
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  // Gestion de l'auto-play
  useEffect(() => {
    if (banners.length <= 1) return;

    if (isAutoPlaying && !isHovered) {
      autoPlayRef.current = setInterval(nextSlide, interval);
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, isHovered, nextSlide, interval, banners.length]);

  // Pause l'auto-play au survol
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Si aucune bannière, ne rien afficher
  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div 
      className="relative w-full h-full overflow-hidden group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Conteneur des slides */}
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {banners.map((banner, index) => (
          <div key={banner.id} className="w-full h-full flex-shrink-0 relative">
            {banner.link_url ? (
              <a 
                href={banner.link_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full h-full"
              >
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
                <div className="absolute inset-0 bg-black/10 hover:bg-black/5 transition-colors duration-300" />
              </a>
            ) : (
              <img
                src={banner.image_url}
                alt={banner.title}
                className="w-full h-full object-cover"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            )}
            
            {/* Overlay avec titre - Plus discret */}
            {banner.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 via-transparent to-transparent p-4">
                <h3 className="text-white text-sm font-medium">{banner.title}</h3>
              </div>
            )}
          </div>
        ))}
      </div>

             {/* Boutons de navigation - Visibles sur mobile, au survol sur desktop */}
       {banners.length > 1 && (
         <>
           <button
             onClick={prevSlide}
             className="absolute left-1 md:left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-1.5 md:p-2 shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 opacity-100 md:opacity-0 md:group-hover:opacity-100"
             aria-label="Slide précédente"
           >
             <ChevronLeftIcon className="h-3 w-3 md:h-4 md:w-4" />
           </button>
           
           <button
             onClick={nextSlide}
             className="absolute right-1 md:right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-1.5 md:p-2 shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 opacity-100 md:opacity-0 md:group-hover:opacity-100"
             aria-label="Slide suivante"
           >
             <ChevronRightIcon className="h-3 w-3 md:h-4 md:w-4" />
           </button>
         </>
       )}

             {/* Indicateurs de pagination - Optimisés mobile */}
       {banners.length > 1 && (
         <div className="absolute bottom-2 md:bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5 md:space-x-2">
           {banners.map((_, index) => (
             <button
               key={index}
               onClick={() => goToSlide(index)}
               className={`transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                 index === currentSlide
                   ? 'w-5 md:w-6 h-1 md:h-1.5 bg-white rounded-full shadow-md'
                   : 'w-1 md:w-1.5 h-1 md:h-1.5 bg-white/60 hover:bg-white/80 rounded-full hover:scale-125'
               }`}
               aria-label={`Aller à la slide ${index + 1}`}
             />
           ))}
         </div>
       )}

             {/* Compteur de slides - Optimisé mobile */}
       {banners.length > 1 && (
         <div className="absolute top-1.5 md:top-2 right-1.5 md:right-2 bg-black/30 text-white text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full backdrop-blur-sm">
           {currentSlide + 1} / {banners.length}
         </div>
       )}
    </div>
  );
};

export default SimpleBannerCarousel;
