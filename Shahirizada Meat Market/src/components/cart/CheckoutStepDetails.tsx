import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Loader2, CreditCard, ShoppingBag } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { useAuth } from '../../lib/auth/AuthContext';
import { authStore } from '../../lib/auth/store';
import { useConfig } from '../../hooks/useConfig';

interface CheckoutStepDetailsProps {
  deliveryType: 'pickup' | 'delivery';
  totals: {
    subtotal: number;
    deliveryFee?: number;
    serviceFee: number;
    tax: number;
    tip: number;
    total: number;
    currency: string;
  };
  brandColor: string;
  onBack: () => void;
  onSubmit: (data: CheckoutFormData) => Promise<void>;
}

export interface CheckoutFormData {
  customer: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  };
  delivery?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    instructions?: string;
  };
  pickupTime?: string;
  deliveryTime?: string;
  paymentMethod: 'card' | 'apple_pay' | 'google_pay' | 'pos';
}

export const CheckoutStepDetails = ({
  deliveryType,
  totals,
  brandColor,
  onBack,
  onSubmit,
}: CheckoutStepDetailsProps) => {
  const { user } = useAuth();
  const config = useConfig();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Smart login detection state
  const [accountLookup, setAccountLookup] = useState<{ exists: boolean; name?: string } | null>(null);
  const [lookupTimer, setLookupTimer] = useState<NodeJS.Timeout | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CheckoutFormData>({
    customer: {
      first_name: user?.name?.split(' ')[0] || '',
      last_name: user?.name?.split(' ')[1] || '',
      phone: user?.phone || '',
      email: user?.email || '',
    },
    delivery: deliveryType === 'delivery' ? {
      line1: '',
      line2: '',
      city: '',
      state: '',
      zip: '',
      instructions: '',
    } : undefined,
    pickupTime: 'asap',
    paymentMethod: 'card',
  });

  // Account lookup function
  const lookupAccount = async (identifier: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Check if user exists in auth store
    const existingUser = authStore.findUserByEmailOrPhone(
      identifier.includes('@') ? identifier : undefined,
      !identifier.includes('@') && identifier.length > 3 ? identifier : undefined
    );

    if (existingUser) {
      setAccountLookup({ exists: true, name: existingUser.name || 'there' });
    } else {
      setAccountLookup(null);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('customer.')) {
      const customerField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        customer: { ...prev.customer, [customerField]: value }
      }));

      // Trigger account lookup for phone or email
      if ((customerField === 'phone' || customerField === 'email') && value.length > 3) {
        // Clear existing timer
        if (lookupTimer) clearTimeout(lookupTimer);
        
        // Reset account lookup
        setAccountLookup(null);
        
        // Set new timer for 1 second delay
        const timer = setTimeout(() => {
          lookupAccount(value);
        }, 1000);
        
        setLookupTimer(timer);
      }
    } else if (field.startsWith('delivery.')) {
      const deliveryField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        delivery: { ...prev.delivery!, [deliveryField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (lookupTimer) clearTimeout(lookupTimer);
    };
  }, [lookupTimer]);

  const validateForm = (): string | null => {
    if (!formData.customer.first_name || !formData.customer.last_name) {
      return 'Please enter your first and last name';
    }
    if (!formData.customer.phone) {
      return 'Please enter your phone number';
    }
    if (!formData.customer.email) {
      return 'Please enter your email address';
    }
    if (deliveryType === 'delivery') {
      if (!formData.delivery?.line1 || !formData.delivery?.city || !formData.delivery?.zip) {
        return 'Please complete the delivery address';
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
      <header className="flex-shrink-0 bg-white border-b h-14 flex items-center gap-3 px-4">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h3 className="font-semibold text-gray-900">Checkout Details</h3>
          <p className="text-xs text-gray-500">Enter your info and payment method</p>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="flex-shrink-0 px-4 py-3 bg-gray-50 border-b">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Step 2 of 3</span>
          <div className="flex gap-1.5">
            <div className="w-8 h-1 rounded-full bg-gray-300" />
            <div className="w-8 h-1 rounded-full" style={{ backgroundColor: brandColor }} />
            <div className="w-8 h-1 rounded-full bg-gray-200" />
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h4 className="font-medium mb-4">Contact Information</h4>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="first_name" className="text-sm">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.customer.first_name}
                    onChange={(e) => handleInputChange('customer.first_name', e.target.value)}
                    className="mt-1 h-10"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="text-sm">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.customer.last_name}
                    onChange={(e) => handleInputChange('customer.last_name', e.target.value)}
                    className="mt-1 h-10"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.customer.phone}
                  onChange={(e) => handleInputChange('customer.phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className="mt-1 h-10"
                  required
                />
                {accountLookup && accountLookup.exists && formData.customer.phone && (
                  <AnimatePresence>
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-gray-600 italic mt-2"
                    >
                      🔍 We found an existing account for {accountLookup.name}.{' '}
                      <button
                        type="button"
                        onClick={() => setShowLoginModal(true)}
                        className="underline"
                        style={{ color: brandColor }}
                      >
                        Log in
                      </button>
                      {' or '}
                      <button
                        type="button"
                        onClick={() => setAccountLookup(null)}
                        className="underline text-gray-500 hover:text-gray-700"
                      >
                        Continue as Guest
                      </button>
                    </motion.p>
                  </AnimatePresence>
                )}
              </div>
              <div>
                <Label htmlFor="email" className="text-sm">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.customer.email}
                  onChange={(e) => handleInputChange('customer.email', e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 h-10"
                  required
                />
                {accountLookup && accountLookup.exists && formData.customer.email && (
                  <AnimatePresence>
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-gray-600 italic mt-2"
                    >
                      🔍 We found an existing account for {accountLookup.name}.{' '}
                      <button
                        type="button"
                        onClick={() => setShowLoginModal(true)}
                        className="underline"
                        style={{ color: brandColor }}
                      >
                        Log in
                      </button>
                      {' or '}
                      <button
                        type="button"
                        onClick={() => setAccountLookup(null)}
                        className="underline text-gray-500 hover:text-gray-700"
                      >
                        Continue as Guest
                      </button>
                    </motion.p>
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>

          {/* Fulfillment Details */}
          {deliveryType === 'pickup' ? (
            <div className="bg-[#FDF3F1] rounded-xl border-2 p-4 shadow-sm" style={{ borderColor: brandColor }}>
              <h4 className="font-medium mb-3" style={{ color: brandColor }}>Pickup Details</h4>
              <div className="text-sm text-gray-700 mb-3">
                <p className="font-medium">📍 Pickup Location</p>
                <p className="text-gray-600 mt-1">
                  {config.address.line1}<br />
                  {config.address.city}, {config.address.state} {config.address.zip}
                </p>
              </div>
              <div>
                <Label htmlFor="pickupTime" className="text-sm">Pickup Time</Label>
                <select
                  id="pickupTime"
                  value={formData.pickupTime}
                  onChange={(e) => handleInputChange('pickupTime', e.target.value)}
                  className="w-full mt-1 h-10 px-3 rounded-lg border border-gray-300 bg-white"
                >
                  <option value="asap">ASAP (25-30 min)</option>
                  <option value="30">In 30 minutes</option>
                  <option value="60">In 1 hour</option>
                  <option value="90">In 1.5 hours</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="bg-[#FDF3F1] rounded-xl border-2 p-4 shadow-sm" style={{ borderColor: brandColor }}>
              <h4 className="font-medium mb-4" style={{ color: brandColor }}>Delivery Address</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="line1" className="text-sm">Street Address *</Label>
                  <Input
                    id="line1"
                    value={formData.delivery?.line1 || ''}
                    onChange={(e) => handleInputChange('delivery.line1', e.target.value)}
                    placeholder="123 Main Street"
                    className="mt-1 h-10"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="line2" className="text-sm">Apt, Suite, etc. (Optional)</Label>
                  <Input
                    id="line2"
                    value={formData.delivery?.line2 || ''}
                    onChange={(e) => handleInputChange('delivery.line2', e.target.value)}
                    placeholder="Apt 4B"
                    className="mt-1 h-10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city" className="text-sm">City *</Label>
                    <Input
                      id="city"
                      value={formData.delivery?.city || ''}
                      onChange={(e) => handleInputChange('delivery.city', e.target.value)}
                      className="mt-1 h-10"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-sm">State *</Label>
                    <Input
                      id="state"
                      value={formData.delivery?.state || ''}
                      onChange={(e) => handleInputChange('delivery.state', e.target.value)}
                      placeholder="CA"
                      className="mt-1 h-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="zip" className="text-sm">ZIP Code *</Label>
                  <Input
                    id="zip"
                    value={formData.delivery?.zip || ''}
                    onChange={(e) => handleInputChange('delivery.zip', e.target.value)}
                    placeholder="94102"
                    className="mt-1 h-10"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="instructions" className="text-sm">Delivery Instructions (Optional)</Label>
                  <Textarea
                    id="instructions"
                    value={formData.delivery?.instructions || ''}
                    onChange={(e) => handleInputChange('delivery.instructions', e.target.value)}
                    placeholder="Ring doorbell twice"
                    className="mt-1 resize-none"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h4 className="font-medium mb-3">Payment Method</h4>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleInputChange('paymentMethod', 'card')}
                className={`w-full p-3 rounded-lg border-2 transition-all ${
                  formData.paymentMethod === 'card'
                    ? 'border-current bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={formData.paymentMethod === 'card' ? { borderColor: brandColor } : {}}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Credit / Debit Card</p>
                    <p className="text-xs text-gray-500">Pay with Stripe</p>
                  </div>
                </div>
              </button>

              {/* Quick pay options would go here */}
              <p className="text-xs text-gray-500 text-center pt-2">
                💳 Secure payment powered by Stripe
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <h4 className="font-medium mb-3">Order Total</h4>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.deliveryFee && totals.deliveryFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Fee</span>
                <span>{formatCurrency(totals.deliveryFee)}</span>
              </div>
            )}
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Service Fee (1%)</span>
                <span>{formatCurrency(totals.serviceFee)}</span>
              </div>
              <p className="text-xs text-gray-500 italic mt-0.5">
                Includes a small 1% Tabsy support fee for processing and support.
              </p>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span>{formatCurrency(totals.tax)}</span>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tip</span>
                <span>{formatCurrency(totals.tip)}</span>
              </div>
              <p className="mt-2 flex items-start gap-2 text-xs text-gray-600">
                <span className="mt-0.5">💡</span>
                <span>All tips go directly to our hard-working staff. Thank you for your support!</span>
              </p>
            </div>
            <div className="border-t border-gray-300 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-bold">Total</span>
                <span className="font-bold text-xl" style={{ color: brandColor }}>
                  {formatCurrency(totals.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </form>
      </div>

      {/* Footer - Fixed */}
      <footer className="flex-shrink-0 bg-white border-t p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
        <Button
          size="lg"
          type="submit"
          disabled={submitting}
          className="w-full text-white hover:opacity-90"
          style={{ backgroundColor: brandColor }}
          onClick={handleSubmit}
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Placing Order...
            </>
          ) : (
            <>
              <ShoppingBag className="w-5 h-5 mr-2" />
              Place Order — {formatCurrency(totals.total)}
            </>
          )}
        </Button>
      </footer>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome back!</DialogTitle>
            <DialogDescription>
              Enter your password or request a one-time code.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Button
              className="w-full text-white"
              style={{ backgroundColor: brandColor }}
              onClick={() => {
                setShowLoginModal(false);
                // In production, this would trigger SMS/email code
                console.log('Send verification code to user');
              }}
            >
              Send Code
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowLoginModal(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
