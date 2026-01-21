import { useState } from 'react';
import { motion } from 'motion/react';
import { Star, Plus, Minus } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { MenuItem } from '../../hooks/useConfig';
import { ProductPrice } from './ProductPrice';

interface ModernMenuCardProps {
  item: MenuItem;
  brandColor: string;
  onAdd: (item: MenuItem, qty: number) => void;
}

export const ModernMenuCard = ({ item, brandColor, onAdd }: ModernMenuCardProps) => {
  const [qty, setQty] = useState(1);

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (qty > 1) setQty(qty - 1);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (qty < 99) setQty(qty + 1);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Always add directly to cart (no modal)
    onAdd(item, qty);
  };

  // Use discounted price if available and valid, otherwise use regular price
  const effectivePrice = (item.discountedPrice && item.originalPrice && item.discountedPrice < item.originalPrice) 
    ? item.discountedPrice 
    : item.price;
  const totalPrice = effectivePrice * qty;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="w-full rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm hover:shadow-md transition-all p-2.5 sm:p-3 md:p-4 bg-white"
    >
      {/* Image */}
      <div 
        className="aspect-[4/3] rounded-md sm:rounded-lg md:rounded-xl bg-gray-100 overflow-hidden relative group mb-2.5 sm:mb-3"
      >
        {item.imageUrl ? (
          <ImageWithFallback
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <ImageWithFallback
            src={`https://source.unsplash.com/800x600/?${encodeURIComponent(item.image)}`}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        )}
        
        {/* Badges */}
        <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 flex gap-1.5 sm:gap-2">
          {item.popular && (
            <Badge 
              className="text-white shadow-lg text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
              style={{ backgroundColor: brandColor }}
            >
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 fill-current" />
              Popular
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-1.5 sm:space-y-2">
        {/* Title & Price */}
        <div className="flex justify-between items-start gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
            <h3 className="text-sm sm:text-[15px] md:text-base leading-tight line-clamp-2 pr-1">{item.name}</h3>
            {item.dietary.length > 0 && (
              <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                {item.dietary.includes('vegetarian') && (
                  <span className="text-xs sm:text-sm" title="Vegetarian">🥬</span>
                )}
                {item.dietary.includes('vegan') && (
                  <span className="text-xs sm:text-sm" title="Vegan">🌱</span>
                )}
                {item.dietary.includes('gf') && (
                  <span className="text-xs sm:text-sm" title="Gluten-Free">🌾</span>
                )}
              </div>
            )}
          </div>
          <span style={{ color: brandColor }}>
            <ProductPrice
              price={item.price}
              originalPrice={item.originalPrice}
              discountedPrice={item.discountedPrice}
              unit={item.unit}
              unitLabel={item.unitLabel}
              className="text-sm sm:text-[15px] md:text-base font-semibold flex-shrink-0"
            />
          </span>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        {/* Actions Row */}
        <div className="flex items-center gap-1.5 sm:gap-2 pt-1 sm:pt-1.5 md:pt-2">
          {/* Qty Stepper */}
          <div className="flex items-center rounded-md sm:rounded-lg border border-gray-200 bg-gray-50">
            <button
              onClick={handleDecrement}
              disabled={qty <= 1}
              className="p-1.5 sm:p-2 hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
            <span className="px-2 sm:px-2.5 md:px-3 text-sm font-medium min-w-[1.75rem] sm:min-w-[2rem] text-center">
              {qty}
            </span>
            <button
              onClick={handleIncrement}
              disabled={qty >= 99}
              className="p-1.5 sm:p-2 hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>

          {/* Add Button */}
          <Button
            onClick={handleQuickAdd}
            className="flex-1 text-white min-h-[44px] text-sm sm:text-base rounded-md sm:rounded-lg touch-manipulation active:scale-95"
            style={{ backgroundColor: brandColor }}
            aria-label={`Add to cart: ${item.name}`}
          >
            Add to cart
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
