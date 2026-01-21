import { X, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../lib/pricing';

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckout: () => void;
  brandColor: string;
}

export const CartSheet = ({
  open,
  onOpenChange,
  onCheckout,
  brandColor,
}: CartSheetProps) => {
  const { items, totals, updateQuantity, removeItem } = useCart();
  
  // Ensure items is always an array
  const cartItems = items || [];
  if (cartItems.length === 0) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Your Cart</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-6">Add some delicious items to get started</p>
            <Button onClick={() => onOpenChange(false)}>Continue Shopping</Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>Your Cart ({cartItems.length})</SheetTitle>
        </SheetHeader>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {cartItems.map((item) => (
            <div key={item.lineId} className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h4 className="mb-1">{item.name}</h4>
                  {item.mods && item.mods.length > 0 && (
                    <div className="text-sm text-gray-600 space-y-0.5">
                      {item.mods.map((mod, idx) => (
                        <div key={idx}>
                          + {mod.name} {mod.price > 0 && `(${formatCurrency(mod.price)})`}
                        </div>
                      ))}
                    </div>
                  )}
                  {item.note && (
                    <div className="text-sm text-gray-600 italic mt-1">
                      Note: {item.note}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="mb-2">{formatCurrency(item.subtotal)}</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.lineId, item.qty - 1)}
                      className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100 transition-colors"
                      aria-label="Decrease quantity"
                      disabled={item.qty <= 1}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQuantity(item.lineId, item.qty + 1)}
                      className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeItem(item.lineId)}
                      className="ml-2 w-7 h-7 rounded-full border border-red-200 flex items-center justify-center hover:bg-red-50 transition-colors text-red-600"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              <Separator />
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatCurrency(totals?.subtotal || 0)}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span>Total</span>
            <span>{formatCurrency(totals?.subtotal || 0)}</span>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            Tax and fees calculated at checkout
          </p>
        </div>

        {/* Checkout Button */}
        <Button
          size="lg"
          className="w-full mt-4 text-white"
          style={{ backgroundColor: brandColor }}
          onClick={onCheckout}
        >
          Proceed to Checkout
        </Button>
      </SheetContent>
    </Sheet>
  );
};
