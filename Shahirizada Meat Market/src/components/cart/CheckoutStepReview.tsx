import { motion } from 'motion/react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '../ui/button';
import { SmartCartLine } from './SmartCartLine';
import { AIMenuRecommendations } from './AIMenuRecommendations';
import { SmartTipSelector } from './SmartTipSelector';
import { FulfillmentSelector } from './FulfillmentSelector';
import { CartRewards } from './CartRewards';
import { useAuth } from '../../lib/auth/AuthContext';
import { MenuItem } from '../../hooks/useConfig';

interface CheckoutStepReviewProps {
  items: any[];
  itemCount: number;
  subtotalCents: number;
  tip: { mode: 'percent' | 'amount'; value: number };
  deliveryType: 'pickup' | 'delivery';
  totals: {
    subtotal: number;
    customItemsFee?: number;
    deliveryFee?: number;
    serviceFee: number;
    discount?: number;
    tax: number;
    tip: number;
    total: number;
    currency: string;
  };
  brandColor: string;
  loyaltyConfig?: {
    enabled: boolean;
    earnPerDollar: number;
    rewardThreshold: number;
    loyaltyHref: string;
  };
  menuItems?: MenuItem[];
  onUpdateQty: (id: string, qty: number) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
  onRecommendationAdd: (item: any) => void;
  onTipChange: (tip: { mode: 'percent' | 'amount'; value: number }) => void;
  onDeliveryTypeChange: (type: 'pickup' | 'delivery') => void;
  onContinue: () => void;
  onClearCart: () => void;
  onNavigate?: (path: string) => void;
}

export const CheckoutStepReview = ({
  items,
  itemCount,
  subtotalCents,
  tip,
  deliveryType,
  totals,
  brandColor,
  loyaltyConfig,
  menuItems = [],
  onUpdateQty,
  onUpdateNotes,
  onRemove,
  onEdit,
  onRecommendationAdd,
  onTipChange,
  onDeliveryTypeChange,
  onContinue,
  onClearCart,
  onNavigate,
}: CheckoutStepReviewProps) => {
  const { user, loyaltyBalance } = useAuth();
  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="flex flex-col h-full"
    >
      {/* Header - Fixed */}
      <header className="flex-shrink-0 bg-white border-b h-14 flex items-center justify-between px-4">
        <h3 className="font-semibold text-gray-900">
          Your Cart {itemCount > 0 && <span className="text-gray-500 font-normal">({itemCount})</span>}
        </h3>
        {items.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear
          </button>
        )}
      </header>

      {/* Progress Indicator */}
      <div className="flex-shrink-0 px-4 py-3 bg-gray-50 border-b">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Step 1 of 3</span>
          <div className="flex gap-1.5">
            <div className="w-8 h-1 rounded-full" style={{ backgroundColor: brandColor }} />
            <div className="w-8 h-1 rounded-full bg-gray-200" />
            <div className="w-8 h-1 rounded-full bg-gray-200" />
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: `${brandColor}20` }}
            >
              <ShoppingCart className="w-8 h-8" style={{ color: brandColor }} />
            </div>
            <h3 className="font-medium mb-2">Your cart is empty</h3>
            <p className="text-sm text-gray-500 mb-4">
              Add items from the menu to get started
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4">
            <div className="space-y-4">
              {/* Cart Lines */}
              <div className="space-y-3">
                {items.map((item) => (
                  <SmartCartLine
                    key={item.id}
                    id={item.id}
                    itemId={item.sku}
                    name={item.name}
                    thumbnail={item.image || 'https://source.unsplash.com/200x200/?food'}
                    qty={item.qty}
                    unitPrice={item.price}
                    lineTotal={item.price * item.qty}
                    notes={item.note}
                    brandColor={brandColor}
                    onUpdateQty={onUpdateQty}
                    onUpdateNotes={onUpdateNotes}
                    onRemove={onRemove}
                    onEdit={onEdit}
                  />
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* AI Recommendations */}
              <AIMenuRecommendations
                cartItems={items.map(item => ({ itemId: item.sku, qty: item.qty }))}
                menuItems={menuItems}
                brandColor={brandColor}
                onAdd={onRecommendationAdd}
              />

              {/* Fulfillment Selector */}
              <div>
                <h4 className="text-sm font-medium mb-3">Fulfillment Method</h4>
                <FulfillmentSelector
                  selected={deliveryType}
                  onChange={onDeliveryTypeChange}
                  brandColor={brandColor}
                />
              </div>

              {/* Tip Selector */}
              <div>
                <SmartTipSelector
                  subtotal={subtotalCents / 100}
                  currentTip={tip}
                  presets={[10, 15, 20]}
                  brandColor={brandColor}
                  onChange={onTipChange}
                />
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                </div>

                {totals.deliveryFee && totals.deliveryFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">{formatCurrency(totals.deliveryFee)}</span>
                  </div>
                )}

                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Service Fee (1%)</span>
                    <span className="font-medium">{formatCurrency(totals.serviceFee)}</span>
                  </div>
                  <p className="text-xs text-gray-500 italic mt-0.5">
                    Includes a small platform fee.
                  </p>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">{formatCurrency(totals.tax)}</span>
                </div>

                {totals.tip > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tip</span>
                    <span className="font-medium">{formatCurrency(totals.tip)}</span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-lg" style={{ color: brandColor }}>
                      {formatCurrency(totals.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rewards Panel */}
              {loyaltyConfig?.enabled && (
                <CartRewards
                  subtotalCents={totals.subtotal}
                  earnPerDollar={loyaltyConfig.earnPerDollar}
                  rewardThreshold={loyaltyConfig.rewardThreshold}
                  loyaltyHref={loyaltyConfig.loyaltyHref}
                  isLoggedIn={!!user}
                  currentStars={loyaltyBalance}
                  brandColor={brandColor}
                  onNavigate={onNavigate}
                />
              )}
            </div>
          </div>

          {/* Footer - Fixed */}
          <footer className="flex-shrink-0 bg-white border-t p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
            <Button
              size="lg"
              className="w-full text-white hover:opacity-90"
              style={{ backgroundColor: brandColor }}
              onClick={onContinue}
            >
              Continue to Checkout
            </Button>
          </footer>
        </>
      )}
    </motion.div>
  );
};
