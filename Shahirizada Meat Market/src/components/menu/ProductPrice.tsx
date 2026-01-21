/**
 * ProductPrice Component
 * Displays product price with unit information (e.g., "$18.99 / lb" or "$4.50 each")
 * Supports discount pricing with strikethrough original price
 */

interface ProductPriceProps {
  price: number | string;
  originalPrice?: number;    // Original price before discount
  discountedPrice?: number;  // Discounted sale price
  unit?: 'lb' | 'each';
  unitLabel?: string;
  className?: string;
  showDiscount?: boolean;    // Whether to show discount pricing
}

export const ProductPrice = ({ 
  price, 
  originalPrice,
  discountedPrice,
  unit = 'lb', 
  unitLabel,
  className = '',
  showDiscount = true
}: ProductPriceProps) => {
  // Check if we should show discount pricing
  const hasValidDiscount = showDiscount && 
    originalPrice !== undefined && 
    discountedPrice !== undefined && 
    discountedPrice < originalPrice;

  // Use discounted price if available, otherwise use regular price
  const displayPrice = hasValidDiscount ? discountedPrice : price;
  
  // Convert price to number if string
  const numericPrice = typeof displayPrice === 'string' ? parseFloat(displayPrice) : displayPrice;
  
  // Format price using Intl.NumberFormat
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formattedPrice = formatPrice(numericPrice);
  const formattedOriginalPrice = originalPrice ? formatPrice(originalPrice) : '';

  // Determine unit text based on rules
  let unitText = '';
  if (unitLabel) {
    unitText = unitLabel;
  } else if (unit === 'lb') {
    unitText = '/ lb';
  } else if (unit === 'each') {
    unitText = 'each';
  }

  // Create accessible label
  const dollars = Math.floor(numericPrice);
  const cents = Math.round((numericPrice - dollars) * 100);
  const unitTextForAria = unitLabel || (unit === 'lb' ? 'per pound' : 'each');
  const ariaLabel = hasValidDiscount 
    ? `Sale price ${dollars} dollars${cents > 0 ? ` ${cents} cents` : ''} ${unitTextForAria}, was ${formatPrice(originalPrice!)}`
    : `Price ${dollars} dollars${cents > 0 ? ` ${cents} cents` : ''} ${unitTextForAria}`;

  if (hasValidDiscount) {
    return (
      <span className={`${className} flex flex-col items-end gap-0.5`} aria-label={ariaLabel}>
        {/* Strikethrough Original Price */}
        <span className="text-xs sm:text-sm text-gray-400 line-through leading-none">
          {formattedOriginalPrice}
          {unitText && <span className="whitespace-nowrap ml-1">{unitText}</span>}
        </span>
        {/* Discounted Price */}
        <span className="leading-none">
          {formattedPrice}
          {unitText && (
            <>
              {' '}
              <span className="whitespace-nowrap">{unitText}</span>
            </>
          )}
        </span>
      </span>
    );
  }

  return (
    <span 
      className={className}
      aria-label={ariaLabel}
    >
      {formattedPrice}
      {unitText && (
        <>
          {' '}
          <span className="whitespace-nowrap">{unitText}</span>
        </>
      )}
    </span>
  );
};
