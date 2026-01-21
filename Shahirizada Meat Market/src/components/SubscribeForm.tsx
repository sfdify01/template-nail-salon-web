import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface SubscribeFormProps {
  brandColor?: string;
}

export const SubscribeForm = ({ brandColor = '#B64D2E' }: SubscribeFormProps) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple email validation
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      alert('Please enter a valid email address');
      return;
    }

    // Frontend-only: just show success message
    setSubmitted(true);
    setEmail('');

    // Reset after 5 seconds
    setTimeout(() => {
      setSubmitted(false);
    }, 5000);
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="form"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-10 rounded-lg border-gray-300 focus-visible:ring-2 focus-visible:ring-offset-0"
                  style={{
                    ['--tw-ring-color' as string]: brandColor,
                  }}
                  required
                />
              </div>
              <Button
                type="submit"
                className="h-10 px-6 rounded-lg text-white font-medium shadow-sm hover:opacity-90 transition-opacity whitespace-nowrap"
                style={{ backgroundColor: brandColor }}
              >
                Subscribe
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 flex-shrink-0">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-900">
                Thanks! You're now subscribed.
              </p>
              <p className="text-xs text-green-700">
                We'll keep you updated on offers and events.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
