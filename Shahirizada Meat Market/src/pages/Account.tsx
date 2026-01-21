import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, ShoppingBag, Users, ArrowRight, Copy } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../lib/auth/AuthContext';
import { getOrCreateReferralLink, buildReferralLink, REFERRAL_INVITER_BONUS, REFERRAL_FRIEND_BONUS } from '../lib/loyalty/client';
import { toast } from 'sonner@2.0.3';

interface AccountProps {
  onNavigate: (path: string) => void;
  brandColor?: string;
}

export const Account = ({ onNavigate, brandColor = '#B64D2E' }: AccountProps) => {
  const { user, loyaltyBalance, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      onNavigate('/login');
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

  // Get recent orders from localStorage
  const orders = JSON.parse(localStorage.getItem('tabsy-orders') || '[]')
    .filter((order: any) => {
      // Filter to current user's orders
      return order.customer.email === user.email || order.customer.phone === user.phone;
    })
    .sort((a: any, b: any) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime())
    .slice(0, 2);

  // Get referral link
  const referralCode = user.email || user.phone 
    ? getOrCreateReferralLink(user.email, user.phone)
    : '';
  const referralLink = referralCode ? buildReferralLink(referralCode) : '';

  const handleCopyReferral = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const displayName = user.name || user.email || user.phone || 'Guest';

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
            <h1 className="mb-2">My Account</h1>
            <p className="text-gray-600">Welcome back, {displayName}!</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Dashboard Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Rewards Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('/account/rewards')}>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${brandColor}15` }}
                >
                  <Star className="w-6 h-6 fill-current" style={{ color: brandColor }} />
                </div>
                <div>
                  <h3 className="text-sm text-gray-600">Rewards Balance</h3>
                  <div className="text-2xl font-bold" style={{ color: brandColor }}>
                    {loyaltyBalance.toLocaleString()} ⭐
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('/account/rewards');
                }}
              >
                View details
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Card>
          </motion.div>

          {/* Recent Orders Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${brandColor}15` }}
                >
                  <ShoppingBag className="w-6 h-6" style={{ color: brandColor }} />
                </div>
                <div>
                  <h3 className="text-sm text-gray-600">Recent Orders</h3>
                  <div className="text-2xl font-bold">{orders.length}</div>
                </div>
              </div>
              
              {orders.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {orders.map((order: any) => (
                    <div
                      key={order.id}
                      className="flex justify-between text-sm p-2 rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => onNavigate(`/account/orders/${order.id}`)}
                    >
                      <span className="text-gray-600">#{order.id.slice(-6)}</span>
                      <span className="font-medium">${order.totals.grand_total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-3">No orders yet</p>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between"
                onClick={() => onNavigate('/account/orders')}
              >
                See all orders
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Card>
          </motion.div>

          {/* Referral Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${brandColor}15` }}
                >
                  <Users className="w-6 h-6" style={{ color: brandColor }} />
                </div>
                <div>
                  <h3 className="text-sm text-gray-600">Refer a Friend</h3>
                  <div className="text-sm font-medium">+{REFERRAL_INVITER_BONUS} ⭐ each</div>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="flex-1 px-3 py-2 text-xs border rounded-lg bg-gray-50 font-mono"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyReferral}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  You get +{REFERRAL_INVITER_BONUS} ⭐, they get +{REFERRAL_FRIEND_BONUS} ⭐
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between"
                onClick={() => onNavigate('/account/referrals')}
              >
                Manage referrals
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h2 className="mb-4">Quick Actions</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onNavigate('/products')}
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Order Now
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onNavigate('/account/orders')}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                View All Orders
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
