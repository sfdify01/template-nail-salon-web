import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner@2.0.3';

// Cart item type
export type CartItem = {
  id: string;
  sku: string;
  name: string;
  price: number; // in cents
  qty: number;
  image?: string;
  mods?: { id: string; name: string; price?: number }[];
  note?: string;
  _key?: string; // Internal deduplication key
};

// Cart totals type
export type CartTotals = {
  subtotal: number;
  tax: number;
  fees: number;
  tips: number;
  grand_total: number;
};

// Cart context type
type CartContextType = {
  items: CartItem[];
  totals: CartTotals;
  isOpen: boolean;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateItemQty: (id: string, qty: number) => void;
  updateItemNote: (id: string, note: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  couponCode: string;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  tipPercentage: number;
  setTipPercentage: (percent: number) => void;
  customTip: number;
  setCustomTip: (amount: number) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'tabsy-cart';
const TAX_RATE = 0.0875; // 8.75%
const SERVICE_FEE = 0; // No service fee for now

// Generate unique deduplication key for cart line
function generateLineKey(item: Omit<CartItem, 'id' | '_key'>): string {
  // Sort modifiers by id for consistent comparison
  const sortedMods = [...(item.mods || [])]
    .map(m => ({ id: m.id, name: m.name, price: m.price || 0 }))
    .sort((a, b) => a.id.localeCompare(b.id));
  
  const note = (item.note || '').trim();
  
  return JSON.stringify({
    sku: item.sku,
    mods: sortedMods,
    note,
  });
}

// Calculate totals
function calculateTotals(
  items: CartItem[],
  tipPercentage: number,
  customTip: number,
  couponCode: string
): CartTotals {
  const subtotal = items.reduce((sum, item) => {
    const modsTotal = item.mods?.reduce((modSum, mod) => modSum + (mod.price || 0), 0) || 0;
    return sum + (item.price + modsTotal) * item.qty;
  }, 0);

  // Apply coupon discount
  let discountedSubtotal = subtotal;
  if (couponCode === 'WELCOME10') {
    discountedSubtotal = subtotal * 0.9; // 10% off
  }

  const tax = Math.round(discountedSubtotal * TAX_RATE);
  const fees = SERVICE_FEE;
  const tips = customTip > 0 ? customTip : Math.round(discountedSubtotal * (tipPercentage / 100));
  const grand_total = discountedSubtotal + tax + fees + tips;

  return {
    subtotal: discountedSubtotal,
    tax,
    fees,
    tips,
    grand_total,
  };
}

// Cart provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [tipPercentage, setTipPercentage] = useState(0);
  const [customTip, setCustomTip] = useState(0);
  const [couponCode, setCouponCode] = useState('');

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        try {
          setItems(JSON.parse(saved));
        } catch (err) {
          console.error('Failed to load cart:', err);
        }
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items]);

  const totals = calculateTotals(items, tipPercentage, customTip, couponCode);

  const addItem = (item: Omit<CartItem, 'id'>) => {
    const key = generateLineKey(item);
    let wasMerged = false;
    let finalQty = 0;
    
    setItems((prev) => {
      // Check if item with same key exists
      const existingIndex = prev.findIndex(i => i._key === key);
      
      if (existingIndex >= 0) {
        // Merge: increase quantity of existing item
        wasMerged = true;
        const newItems = [...prev];
        finalQty = newItems[existingIndex].qty + (item.qty || 1);
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          qty: finalQty,
        };
        
        return newItems;
      } else {
        // New item: add to cart
        const id = `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return [...prev, { ...item, id, _key: key }];
      }
    });
    
    // Show toast notification after state update
    if (wasMerged && finalQty > 0) {
      toast.success(`Added ${item.qty || 1} more • ${item.name} (${finalQty} in cart)`, {
        duration: 2000,
      });
    }
    
    setIsOpen(true); // Auto-open drawer on add
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const setQty = (id: string, qty: number) => {
    if (qty < 1) {
      // Remove item if quantity is 0
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty } : item))
    );
  };

  const updateItemQty = (id: string, qty: number) => {
    setQty(id, qty);
  };

  const updateItemNote = (id: string, note: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, note } : item))
    );
  };

  const clear = () => {
    setItems([]);
    setCouponCode('');
    setTipPercentage(0);
    setCustomTip(0);
  };

  const clearCart = clear;

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  const applyCoupon = (code: string) => {
    setCouponCode(code.toUpperCase());
  };

  const removeCoupon = () => {
    setCouponCode('');
  };

  return (
    <CartContext.Provider
      value={{
        items,
        totals,
        isOpen,
        addItem,
        removeItem,
        updateItemQty,
        updateItemNote,
        setQty,
        clear,
        clearCart,
        openDrawer,
        closeDrawer,
        couponCode,
        applyCoupon,
        removeCoupon,
        tipPercentage,
        setTipPercentage,
        customTip,
        setCustomTip,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Hook to use cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

// Format cents to currency
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Get total item count
export function getTotalQty(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.qty, 0);
}
