import { useState, useEffect } from 'react';
import { CartItem, MenuItem } from '../lib/types';
import {
  addToCart as addToCartUtil,
  updateQuantity as updateQuantityUtil,
  removeFromCart as removeFromCartUtil,
  clearCart as clearCartUtil,
  getCartCount,
  saveCartToStorage,
  loadCartFromStorage,
  clearCartStorage,
} from '../lib/cart';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load cart from storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        setCart(loadCartFromStorage());
      } catch (error) {
        console.error('Error loading cart:', error);
        setCart([]);
      }
    }
  }, []);

  // Save cart to storage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        saveCartToStorage(cart);
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    }
  }, [cart]);

  const addToCart = (
    item: MenuItem,
    qty: number = 1,
    mods?: { id: string; name: string; price: number }[],
    note?: string
  ) => {
    setCart((prev) => addToCartUtil(prev, item, qty, mods, note));
    setIsOpen(true); // Open cart sheet when item added
  };

  const updateQuantity = (lineId: string, qty: number) => {
    setCart((prev) => updateQuantityUtil(prev, lineId, qty));
  };

  const removeFromCart = (lineId: string) => {
    setCart((prev) => removeFromCartUtil(prev, lineId));
  };

  const clearCart = () => {
    setCart(clearCartUtil());
    clearCartStorage();
  };

  const count = getCartCount(cart);
  
  // Calculate totals
  const totals = cart.reduce(
    (acc, item) => ({
      subtotal: acc.subtotal + item.subtotal,
    }),
    { subtotal: 0 }
  );

  return {
    items: cart,
    cart,
    count,
    totals,
    isOpen,
    setIsOpen,
    addToCart,
    updateQuantity,
    removeItem: removeFromCart,
    removeFromCart,
    clearCart,
  };
}
