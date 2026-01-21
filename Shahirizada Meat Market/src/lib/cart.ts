// Cart state management

import { CartItem, MenuItem } from './types';
import { calculateItemSubtotal } from './pricing';

// Generate unique line item ID
export function generateLineId(): string {
  return `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Generate deduplication key for cart line
function generateLineKey(
  sku: string,
  mods?: { id: string; name: string; price: number }[],
  note?: string
): string {
  // Sort modifiers by id for consistent comparison
  const sortedMods = [...(mods || [])]
    .map(m => ({ id: m.id, name: m.name, price: m.price }))
    .sort((a, b) => a.id.localeCompare(b.id));
  
  const cleanNote = (note || '').trim();
  
  return JSON.stringify({
    sku,
    mods: sortedMods,
    note: cleanNote,
  });
}

// Add item to cart (with merging support)
export function addToCart(
  cart: CartItem[],
  item: MenuItem,
  qty: number = 1,
  mods?: { id: string; name: string; price: number }[],
  note?: string
): CartItem[] {
  const key = generateLineKey(item.sku, mods, note);
  
  // Check if item with same configuration exists
  const existingIndex = cart.findIndex((cartItem) => {
    const itemKey = generateLineKey(cartItem.sku, cartItem.mods, cartItem.note);
    return itemKey === key;
  });

  if (existingIndex >= 0) {
    // Merge: increase quantity of existing item
    const updatedCart = [...cart];
    const existingItem = updatedCart[existingIndex];
    const newQty = existingItem.qty + qty;
    const newSubtotal = calculateItemSubtotal(existingItem.price, newQty, existingItem.mods);
    
    updatedCart[existingIndex] = {
      ...existingItem,
      qty: newQty,
      subtotal: newSubtotal,
    };
    
    return updatedCart;
  } else {
    // New item: add to cart
    const lineId = generateLineId();
    const subtotal = calculateItemSubtotal(item.price, qty, mods);

    const newItem: CartItem = {
      lineId,
      sku: item.sku,
      name: item.name,
      price: item.price,
      qty,
      mods,
      note,
      subtotal,
    };

    return [...cart, newItem];
  }
}

// Update item quantity
export function updateQuantity(
  cart: CartItem[],
  lineId: string,
  qty: number
): CartItem[] {
  if (qty <= 0) {
    return removeFromCart(cart, lineId);
  }

  return cart.map((item) => {
    if (item.lineId === lineId) {
      const subtotal = calculateItemSubtotal(item.price, qty, item.mods);
      return { ...item, qty, subtotal };
    }
    return item;
  });
}

// Remove item from cart
export function removeFromCart(cart: CartItem[], lineId: string): CartItem[] {
  return cart.filter((item) => item.lineId !== lineId);
}

// Clear cart
export function clearCart(): CartItem[] {
  return [];
}

// Get cart count
export function getCartCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

// Cart persistence
const CART_STORAGE_KEY = 'tabsy_cart';

export function saveCartToStorage(cart: CartItem[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }
}

export function loadCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load cart from storage:', error);
    return [];
  }
}

export function clearCartStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CART_STORAGE_KEY);
  }
}
