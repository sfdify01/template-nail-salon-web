import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DollarSign, Percent } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface SmartTipSelectorProps {
  subtotal: number;
  currentTip: {
    mode: 'percent' | 'amount';
    value: number;
  };
  presets: number[]; // e.g., [10, 15, 20]
  brandColor: string;
  onChange: (tip: { mode: 'percent' | 'amount'; value: number }) => void;
}

export const SmartTipSelector = ({
  subtotal,
  currentTip,
  presets,
  brandColor,
  onChange,
}: SmartTipSelectorProps) => {
  const [customMode, setCustomMode] = useState<'percent' | 'amount'>('percent');
  const [customValue, setCustomValue] = useState('');
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const handlePresetClick = (percent: number) => {
    onChange({ mode: 'percent', value: percent });
  };

  const handleCustomApply = () => {
    const value = parseFloat(customValue);
    if (!isNaN(value) && value >= 0) {
      onChange({ mode: customMode, value });
      setIsCustomOpen(false);
      setCustomValue('');
    }
  };

  const calculateTipAmount = (mode: 'percent' | 'amount', value: number) => {
    if (mode === 'percent') {
      return (subtotal * value) / 100;
    }
    return value;
  };

  const isPresetSelected = (percent: number) => {
    return currentTip.mode === 'percent' && currentTip.value === percent;
  };

  const isCustomSelected = 
    (currentTip.mode === 'amount') ||
    (currentTip.mode === 'percent' && !presets.includes(currentTip.value));

  return (
    <div className="rounded-xl bg-gray-50 p-4 border border-gray-100 space-y-3">
      <h3 className="font-semibold text-gray-800">Add a tip</h3>

      {/* Preset Buttons - Wrapping */}
      <div className="flex flex-wrap gap-2">
        {presets.map((percent) => (
          <button
            key={percent}
            onClick={() => handlePresetClick(percent)}
            aria-pressed={isPresetSelected(percent)}
            className="px-3 h-9 rounded-full border text-sm transition-all aria-pressed:text-white"
            style={
              isPresetSelected(percent)
                ? { backgroundColor: brandColor, borderColor: brandColor }
                : {}
            }
          >
            {percent}%
          </button>
        ))}
        
        {/* Custom Tip - Popover */}
        <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
          <PopoverTrigger asChild>
            <button
              aria-pressed={isCustomSelected}
              className="px-3 h-9 rounded-full border text-sm transition-all aria-pressed:text-white"
              style={
                isCustomSelected
                  ? { backgroundColor: brandColor, borderColor: brandColor }
                  : {}
              }
            >
              Custom
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="space-y-3">
              <div className="text-sm font-medium">Custom tip</div>
              
              {/* Mode Selector */}
              <div className="flex gap-2">
                <Button
                  variant={customMode === 'percent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCustomMode('percent')}
                  className="flex-1"
                  style={
                    customMode === 'percent'
                      ? { backgroundColor: brandColor, color: 'white' }
                      : {}
                  }
                >
                  <Percent className="w-3.5 h-3.5 mr-1" />
                  Percent
                </Button>
                <Button
                  variant={customMode === 'amount' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCustomMode('amount')}
                  className="flex-1"
                  style={
                    customMode === 'amount'
                      ? { backgroundColor: brandColor, color: 'white' }
                      : {}
                  }
                >
                  <DollarSign className="w-3.5 h-3.5 mr-1" />
                  Amount
                </Button>
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  {customMode === 'amount' && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      $
                    </span>
                  )}
                  <Input
                    type="number"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder={customMode === 'percent' ? 'e.g., 18' : 'e.g., 5.00'}
                    className={customMode === 'amount' ? 'pl-7' : ''}
                    min="0"
                    step={customMode === 'percent' ? '1' : '0.01'}
                  />
                  {customMode === 'percent' && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      %
                    </span>
                  )}
                </div>
                <Button
                  onClick={handleCustomApply}
                  style={{ backgroundColor: brandColor }}
                  className="text-white"
                >
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Tip Amount Display */}
      {currentTip.value > 0 && (
        <div className="text-xs text-gray-500">
          Tip amount: ${calculateTipAmount(currentTip.mode, currentTip.value).toFixed(2)}
        </div>
      )}
    </div>
  );
};
