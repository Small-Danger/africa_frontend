import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import ProductCard from './ProductCard';

const ProductCarousel = ({
  products = [],
  itemsPerSlide = 2,
  autoPlay = true,
  interval = 3500,
  dotColor = 'bg-brand-green',
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const autoPlayRef = useRef(null);

  const totalSlides = Math.max(1, Math.ceil(products.length / itemsPerSlide));

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    if (products.length === 0 || !isAutoPlaying || totalSlides <= 1) {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
      return;
    }

    autoPlayRef.current = setInterval(nextSlide, interval);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [products.length, isAutoPlaying, totalSlides, nextSlide, interval]);

  if (products.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-end gap-2 mb-3">
        {totalSlides > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIsAutoPlaying((v) => !v)}
              className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-brand-green-light transition-colors"
              aria-label={isAutoPlaying ? 'Pause' : 'Lecture'}
            >
              {isAutoPlaying ? (
                <Pause size={16} className="text-gray-600" />
              ) : (
                <Play size={16} className="text-gray-600" />
              )}
            </button>
            <button
              type="button"
              onClick={prevSlide}
              className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-brand-green-light transition-colors"
              aria-label="Précédent"
            >
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-brand-green-light transition-colors"
              aria-label="Suivant"
            >
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </>
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {Array.from({ length: totalSlides }).map((_, slideIndex) => (
            <div key={slideIndex} className="w-full flex-shrink-0 flex items-stretch gap-3 px-0.5">
              {products
                .slice(slideIndex * itemsPerSlide, slideIndex * itemsPerSlide + itemsPerSlide)
                .map((product) => (
                  <div key={product.id} className="w-1/2 flex-shrink-0 flex">
                    <ProductCard product={product} showActions className="flex-1" />
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      {totalSlides > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-200 ${
                index === currentSlide ? `${dotColor} w-6` : 'bg-gray-300 w-2 hover:bg-gray-400'
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductCarousel;
