import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Save, Trash2, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

interface CartLineProps {
  id: string;
  itemId: string;
  name: string;
  thumbnail: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  selections?: {
    variants?: Array<{ label: string; value: string }>;
    addons?: Array<{ label: string; qty?: number }>;
  };
  notes?: string;
  brandColor: string;
  onUpdateQty: (id: string, qty: number) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
}

export const SmartCartLine = ({
  id,
  name,
  thumbnail,
  qty,
  unitPrice,
  lineTotal,
  selections,
  notes,
  brandColor,
  onUpdateQty,
  onUpdateNotes,
  onRemove,
  onEdit,
}: CartLineProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localNotes, setLocalNotes] = useState(notes || '');
  const [localQty, setLocalQty] = useState(qty);
  const [hasChanges, setHasChanges] = useState(false);

  // Track if user has made edits
  useEffect(() => {
    const notesChanged = localNotes !== (notes || '');
    const qtyChanged = localQty !== qty;
    setHasChanges(notesChanged || qtyChanged);
  }, [localNotes, localQty, notes, qty]);

  // Sync qty if externally changed
  useEffect(() => {
    setLocalQty(qty);
  }, [qty]);

  const hasCustomizations = 
    (selections?.variants && selections.variants.length > 0) ||
    (selections?.addons && selections.addons.length > 0) ||
    notes;

  const handleSaveChanges = () => {
    if (localNotes !== notes) {
      onUpdateNotes(id, localNotes);
    }
    if (localQty !== qty) {
      onUpdateQty(id, localQty);
    }
    setHasChanges(false);
    setIsExpanded(false);
    toast.success('Item updated successfully', {
      duration: 2000,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveChanges();
    }
  };

  const handleQtyChange = (newQty: number) => {
    if (newQty <= 0) {
      // Trigger remove animation and callback
      onRemove(id);
      return;
    }
    setLocalQty(newQty);
  };

  return (
    <motion.div 
      className="rounded-xl border border-gray-200 bg-white hover:shadow-sm transition-all duration-200 ease-in-out"
      layout
    >
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 text-left flex items-center gap-3 rounded-xl"
      >
        {/* Image */}
        <div className={`${isExpanded ? 'w-16 h-16' : 'w-14 h-14'} rounded-md overflow-hidden bg-gray-100 flex-shrink-0 transition-all duration-200`}>
          <ImageWithFallback
            src={thumbnail}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Name & Details */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium leading-5 truncate text-gray-800">
            {name}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {qty} × ${(unitPrice / 100).toFixed(2)}
          </p>
          {hasCustomizations && !isExpanded && (
            <p className="text-xs text-gray-400 mt-0.5">Customized</p>
          )}
        </div>

        {/* Price & Chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-semibold text-gray-800">
            ${(lineTotal / 100).toFixed(2)}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Expanded Section */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 mt-2 pt-3 pb-3 pl-[4.5rem] pr-3 space-y-3">
              {/* Variants & Add-ons (if any) */}
              {selections?.variants && selections.variants.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">Options</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selections.variants.map((variant, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-700"
                      >
                        {variant.label}: {variant.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selections?.addons && selections.addons.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">Add-ons</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selections.addons.map((addon, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-700"
                      >
                        {addon.label}
                        {addon.qty && addon.qty > 1 && ` (${addon.qty})`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Special instructions
                </label>
                <Textarea
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., No onions, extra sauce..."
                  className="rounded-lg border-gray-200 text-sm placeholder-gray-400 p-2 resize-none h-[72px]"
                />
              </div>

              {/* Quantity Control */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Quantity
                </label>
                <div className="inline-flex h-9 items-center border border-gray-200 rounded-xl overflow-hidden mt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQtyChange(localQty - 1);
                    }}
                    disabled={localQty <= 1}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="px-4 text-sm font-medium text-gray-800 min-w-[2.5rem] text-center">
                    {localQty}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQtyChange(localQty + 1);
                    }}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <Button
                  variant={hasChanges ? "default" : "outline"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasChanges) {
                      handleSaveChanges();
                    } else {
                      onEdit(id);
                    }
                  }}
                  className={`flex-1 h-9 rounded-lg transition-all ${
                    hasChanges 
                      ? 'text-white shadow-sm' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                  style={hasChanges ? { backgroundColor: brandColor } : undefined}
                  title={hasChanges ? "Save your updates to this item" : "Save item options"}
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  {hasChanges ? 'Save Changes' : 'Save Options'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(id);
                  }}
                  className="h-9 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Remove
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
