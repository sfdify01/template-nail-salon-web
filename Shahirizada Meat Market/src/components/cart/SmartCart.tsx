import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Trash2, X } from 'lucide-react';
import { Button } from '../ui/button';
import { CheckoutStepReview } from './CheckoutStepReview';
import { CheckoutStepDetails, CheckoutFormData } from './CheckoutStepDetails';
import { CheckoutStepConfirmation } from './CheckoutStepConfirmation';
import { useCart } from '../../lib/cart/useCart';
import { generateOrderId } from '../../lib/utils/id';
import { toast } from 'sonner@2.0.3';
import { MenuItem, MenuData } from '../../hooks/useConfig';

interface SmartCartProps {
  brandColor: string;
  onNavigate: (path: string) => void;
  menu?: MenuData;
  className?: string;
  hasAnnouncementBar?: boolean;
  loyaltyConfig?: {
    enabled: boolean;
    earnPerDollar: number;
    rewardThreshold: number;
    loyaltyHref: string;
  };
}

type CheckoutStep = 'review' | 'details' | 'confirmed';

export const SmartCart = ({ brandColor, onNavigate, menu, className = '', hasAnnouncementBar = false, loyaltyConfig }: SmartCartProps) => {
  const { items, clearCart, updateItemQty, removeItem, addItem } = useCart();
  const [tip, setTip] = useState<{ mode: 'percent' | 'amount'; value: number }>({
    mode: 'percent',
    value: 15,
  });
  const [showCart, setShowCart] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('review');
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);

  // Flatten menu categories into single array of menu items for recommendations
  const menuItems = useMemo<MenuItem[]>(() => {
    if (!menu || !menu.categories) {
      console.log('ℹ️ Menu data not available yet for recommendations');
      return [];
    }
    try {
      const items = menu.categories.flatMap((category: any) =>
        category.items.map((item: any) => ({
          ...item,
          categoryId: category.id,
        }))
      );
      console.log('✅ Loaded', items.length, 'products for AI recommendations');
      return items;
    } catch (error) {
      console.error('Failed to process menu items for recommendations:', error);
      return [];
    }
  }, [menu]);

  // Calculate totals
  const subtotalCents = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFeeCents = deliveryType === 'delivery' && subtotalCents < 5000 ? 399 : 0; // $3.99 if under $50
  const serviceFeeCents = Math.round(subtotalCents * 0.01); // 1% service fee
  const customItemsFeeCents = 0; // For custom items
  const discountCents = 0; // For promo codes
  
  const preTaxCents = subtotalCents + serviceFeeCents + deliveryFeeCents + customItemsFeeCents - discountCents;
  const taxRatePercent = 8.875; // Example tax rate
  const taxCents = Math.round(preTaxCents * taxRatePercent / 100);
  
  const tipCents = tip.mode === 'percent' 
    ? Math.round(subtotalCents * tip.value / 100)
    : Math.round(tip.value * 100);
  
  const totalCents = preTaxCents + taxCents + tipCents;

  const totals = {
    subtotal: subtotalCents,
    customItemsFee: customItemsFeeCents > 0 ? customItemsFeeCents : undefined,
    deliveryFee: deliveryFeeCents > 0 ? deliveryFeeCents : undefined,
    serviceFee: serviceFeeCents,
    discount: discountCents > 0 ? discountCents : undefined,
    tax: taxCents,
    tip: tipCents,
    total: totalCents,
    currency: 'USD',
  };

  const handleUpdateQty = (id: string, qty: number) => {
    updateItemQty(id, qty);
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    // TODO: Add notes update to cart context
    console.log('Update notes:', id, notes);
  };

  const handleRemove = (id: string) => {
    removeItem(id);
  };

  const handleEdit = (id: string) => {
    // TODO: Open customization modal
    console.log('Edit item:', id);
  };

  const handleRecommendationAdd = (item: any) => {
    // Convert recommendation to cart item format
    const cartItem = {
      sku: item.id,
      name: item.name,
      price: Math.round(item.price * 100), // Convert to cents
      qty: 1,
      image: item.imageUrl,
      mods: [],
      note: '',
    };
    
    // Add to cart - this will handle merging if the same item already exists
    addItem(cartItem);
  };

  const handleContinueToCheckout = () => {
    setCheckoutStep('details');
  };

  const handleBackToReview = () => {
    setCheckoutStep('review');
  };

  const handlePlaceOrder = async (formData: CheckoutFormData) => {
    // Generate order
    const orderId = generateOrderId();
    const now = new Date();
    const etaMinutes = deliveryType === 'pickup' ? 25 : 60;
    const eta = new Date(now.getTime() + etaMinutes * 60000);

    const order = {
      id: orderId,
      number: orderId.slice(-6).toUpperCase(),
      mode: deliveryType,
      customer: formData.customer,
      address: formData.delivery,
      items: items.map(item => ({
        sku: item.sku,
        name: item.name,
        price: item.price,
        qty: item.qty,
        mods: item.mods,
        note: item.note,
      })),
      totals: {
        subtotal: totals.subtotal,
        deliveryFee: totals.deliveryFee,
        serviceFee: totals.serviceFee,
        tax: totals.tax,
        tip: totals.tip,
        total: totals.total,
      },
      placedAt: now.toISOString(),
      eta: eta.toISOString(),
      status: 'confirmed',
      pickupTime: formData.pickupTime,
    };

    // Save to localStorage
    const orders = JSON.parse(localStorage.getItem('tabsy-orders') || '[]');
    orders.push(order);
    localStorage.setItem('tabsy-orders', JSON.stringify(orders));

    // Set confirmed order and move to confirmation step
    setConfirmedOrder(order);
    setCheckoutStep('confirmed');

    // Show success toast
    toast.success('Order placed successfully!');
  };

  const handleTrackOrder = () => {
    if (confirmedOrder) {
      setShowCart(false);
      onNavigate(`/track/${confirmedOrder.id}`);
    }
  };

  const handleBackToMenu = () => {
    setShowCart(false);
    clearCart();
    setCheckoutStep('review');
    setConfirmedOrder(null);
    onNavigate('/products');
  };

  const handleNewOrder = () => {
    clearCart();
    setCheckoutStep('review');
    setConfirmedOrder(null);
    setShowCart(false);
  };

  // Reset to review step when cart is opened
  useEffect(() => {
    if (showCart && checkoutStep !== 'review' && items.length > 0) {
      // Keep the current step if there are items
      return;
    }
    if (showCart && items.length === 0 && checkoutStep !== 'review') {
      setCheckoutStep('review');
    }
  }, [showCart, items.length]);

  // Manage body scroll and cart-open state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (showCart) {
        document.body.setAttribute('data-cart-open', 'true');
        document.body.style.overflow = 'hidden';
      } else {
        document.body.removeAttribute('data-cart-open');
        document.body.style.overflow = '';
      }
      return () => {
        document.body.removeAttribute('data-cart-open');
        document.body.style.overflow = '';
      };
    }
  }, [showCart]);

  // Calculate top offset based on header + announcement bar
  // Mobile: 64px nav (16 * 4) + 40px announcement = 104px
  // Desktop: 80px nav (20 * 4) + 40px announcement = 120px
  const topOffsetMobile = hasAnnouncementBar ? '104px' : '64px';
  const topOffsetDesktop = hasAnnouncementBar ? '120px' : '80px';

  return (
    <>
      {/* Backdrop */}
      <div id="cartBackdrop" aria-hidden="true" />

      {/* Desktop: Fixed Right Drawer */}
      <aside 
        className="cart-drawer hidden lg:flex fixed right-0 bottom-0 bg-white shadow-2xl flex-col border-l border-gray-200 overflow-hidden z-[100]"
        style={{ 
          width: 'var(--drawer-w)', 
          top: topOffsetDesktop,
          transition: 'top 250ms ease-in-out'
        }}
      >
        <AnimatePresence mode="wait">
          {checkoutStep === 'review' && (
            <CheckoutStepReview
              key="review"
              items={items}
              itemCount={itemCount}
              subtotalCents={subtotalCents}
              tip={tip}
              deliveryType={deliveryType}
              totals={totals}
              brandColor={brandColor}
              loyaltyConfig={loyaltyConfig}
              menuItems={menuItems}
              onUpdateQty={handleUpdateQty}
              onUpdateNotes={handleUpdateNotes}
              onRemove={handleRemove}
              onEdit={handleEdit}
              onRecommendationAdd={handleRecommendationAdd}
              onTipChange={setTip}
              onDeliveryTypeChange={setDeliveryType}
              onContinue={handleContinueToCheckout}
              onClearCart={clearCart}
              onNavigate={onNavigate}
            />
          )}

          {checkoutStep === 'details' && (
            <CheckoutStepDetails
              key="details"
              deliveryType={deliveryType}
              totals={totals}
              brandColor={brandColor}
              onBack={handleBackToReview}
              onSubmit={handlePlaceOrder}
            />
          )}

          {checkoutStep === 'confirmed' && confirmedOrder && (
            <CheckoutStepConfirmation
              key="confirmed"
              orderId={confirmedOrder.id}
              orderNumber={confirmedOrder.number}
              eta={confirmedOrder.eta}
              deliveryType={confirmedOrder.mode}
              items={confirmedOrder.items}
              totals={confirmedOrder.totals}
              brandColor={brandColor}
              onTrackOrder={deliveryType === 'delivery' ? handleTrackOrder : undefined}
              onBackToMenu={handleBackToMenu}
              onNewOrder={handleNewOrder}
            />
          )}
        </AnimatePresence>
      </aside>

      {/* Mobile: Floating Button + Full Screen Drawer */}
      <div className="lg:hidden">
        {/* Floating Cart Button */}
        {items.length > 0 && !showCart && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="fixed bottom-20 right-4 z-[80] rounded-full shadow-lg text-white p-4"
            style={{ backgroundColor: brandColor }}
            onClick={() => setShowCart(true)}
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {itemCount}
            </span>
          </motion.button>
        )}

        {/* Mobile Drawer */}
        {showCart && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="cart-drawer fixed inset-0 bg-white flex flex-col z-[100]"
            style={{ top: topOffsetMobile }}
          >
            {/* Close button overlay */}
            {checkoutStep === 'review' && (
              <button
                onClick={() => setShowCart(false)}
                className="absolute top-4 right-4 z-50 h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 grid place-items-center transition-colors"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <AnimatePresence mode="wait">
              {checkoutStep === 'review' && (
                <CheckoutStepReview
                  key="review-mobile"
                  items={items}
                  itemCount={itemCount}
                  subtotalCents={subtotalCents}
                  tip={tip}
                  deliveryType={deliveryType}
                  totals={totals}
                  brandColor={brandColor}
                  loyaltyConfig={loyaltyConfig}
                  menuItems={menuItems}
                  onUpdateQty={handleUpdateQty}
                  onUpdateNotes={handleUpdateNotes}
                  onRemove={handleRemove}
                  onEdit={handleEdit}
                  onRecommendationAdd={handleRecommendationAdd}
                  onTipChange={setTip}
                  onDeliveryTypeChange={setDeliveryType}
                  onContinue={handleContinueToCheckout}
                  onClearCart={clearCart}
                  onNavigate={onNavigate}
                />
              )}

              {checkoutStep === 'details' && (
                <CheckoutStepDetails
                  key="details-mobile"
                  deliveryType={deliveryType}
                  totals={totals}
                  brandColor={brandColor}
                  onBack={handleBackToReview}
                  onSubmit={handlePlaceOrder}
                />
              )}

              {checkoutStep === 'confirmed' && confirmedOrder && (
                <CheckoutStepConfirmation
                  key="confirmed-mobile"
                  orderId={confirmedOrder.id}
                  orderNumber={confirmedOrder.number}
                  eta={confirmedOrder.eta}
                  deliveryType={confirmedOrder.mode}
                  items={confirmedOrder.items}
                  totals={confirmedOrder.totals}
                  brandColor={brandColor}
                  onTrackOrder={deliveryType === 'delivery' ? handleTrackOrder : undefined}
                  onBackToMenu={handleBackToMenu}
                  onNewOrder={handleNewOrder}
                />
              )}
            </AnimatePresence>
          </motion.aside>
        )}

        {/* Backdrop for mobile */}
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCart(false)}
            className="fixed inset-0 bg-black/40 z-[90] lg:hidden"
            style={{ top: topOffsetMobile }}
          />
        )}
      </div>
    </>
  );
};
