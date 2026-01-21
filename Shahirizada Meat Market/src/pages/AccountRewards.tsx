import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Star, TrendingUp, Gift, ShoppingBag } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { useAuth } from '../lib/auth/AuthContext';
import { EARN_RATE, REFERRAL_INVITER_BONUS, REFERRAL_FRIEND_BONUS } from '../lib/loyalty/client';
import { loyaltyStore } from '../lib/loyalty/store';

interface AccountRewardsProps {
  onNavigate: (path: string) => void;
  brandColor?: string;
}

export const AccountRewards = ({ onNavigate, brandColor = '#B64D2E' }: AccountRewardsProps) => {
  const { user, loyaltyBalance, loading } = useAuth();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      onNavigate('/login');
      return;
    }

    if (user) {
      // Get loyalty profile
      const profile = loyaltyStore.findProfileByEmailOrPhone(user.email, user.phone);
      if (profile) {
        const userEvents = loyaltyStore.getEventsByProfile(profile.id);
        setEvents(userEvents);
      }
    }
  }, [user, loading, onNavigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ShoppingBag className="w-4 h-4" />;
      case 'referral_inviter':
      case 'referral_friend':
        return <Gift className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <button
              onClick={() => onNavigate('/account')}
              className="text-sm text-gray-600 hover:text-gray-900 mb-2"
            >
              ← Back to Account
            </button>
            <h1 className="mb-2">Rewards</h1>
            <p className="text-gray-600">Track your stars and redeem rewards</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white mx-auto mb-4"
                style={{ backgroundColor: brandColor }}
              >
                <Star className="w-8 h-8 fill-current" />
              </div>
              <h2 className="mb-2">Your Balance</h2>
              <div className="text-5xl font-bold mb-4" style={{ color: brandColor }}>
                {loyaltyBalance.toLocaleString()} ⭐
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Keep earning to unlock more rewards!
              </p>
              <Button
                className="text-white"
                style={{ backgroundColor: brandColor }}
                onClick={() => onNavigate('/products')}
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Order Now
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <h2 className="mb-4">How It Works</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="earn">
                <AccordionTrigger>How do I earn stars?</AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Earn {EARN_RATE} ⭐ for every $1 you spend on orders. Stars are automatically
                  added to your account after each purchase. The more you order, the more you earn!
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="referral">
                <AccordionTrigger>What about referral bonuses?</AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Invite friends to earn bonus stars! When someone uses your referral link
                  and completes their first order (minimum $10), you'll receive +{REFERRAL_INVITER_BONUS} ⭐
                  and they'll get +{REFERRAL_FRIEND_BONUS} ⭐. It's a win-win!
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="redeem">
                <AccordionTrigger>How do I redeem stars?</AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Browse our rewards catalog to see available rewards. You can redeem stars
                  for free items, discounts, and exclusive offers. Rewards are applied during checkout.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </motion.div>

        {/* Recent Earnings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5" style={{ color: brandColor }} />
              <h2>Recent Earnings</h2>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No stars earned yet</p>
                <Button
                  variant="outline"
                  onClick={() => onNavigate('/products')}
                >
                  Start Earning
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${brandColor}15` }}
                      >
                        {getEventIcon(event.type)}
                      </div>
                      <div>
                        <div className="font-medium">{event.description}</div>
                        <div className="text-sm text-gray-500">{formatDate(event.createdAt)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-semibold" style={{ color: brandColor }}>
                      <span>+{event.stars}</span>
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
