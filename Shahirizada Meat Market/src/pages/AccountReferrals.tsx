import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, Copy, QrCode, MessageCircle, Share2 } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../lib/auth/AuthContext';
import {
  getOrCreateReferralLink,
  buildReferralLink,
  generateSMSShareLink,
  generateWhatsAppShareLink,
  REFERRAL_INVITER_BONUS,
  REFERRAL_FRIEND_BONUS,
} from '../lib/loyalty/client';
import { loyaltyStore } from '../lib/loyalty/store';
import { toast } from 'sonner@2.0.3';

interface AccountReferralsProps {
  onNavigate: (path: string) => void;
  config: { name: string };
  brandColor?: string;
}

export const AccountReferrals = ({ onNavigate, config, brandColor = '#B64D2E' }: AccountReferralsProps) => {
  const { user, loading } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [stats, setStats] = useState({ clicks: 0, conversions: 0 });
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      onNavigate('/login');
      return;
    }

    if (user) {
      const code = getOrCreateReferralLink(user.email, user.phone);
      setReferralCode(code);
      setReferralLink(buildReferralLink(code));

      // Get stats
      const referral = loyaltyStore['referrals'].get(code);
      if (referral) {
        setStats({
          clicks: referral.clicks,
          conversions: referral.conversions,
        });
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleSMSShare = () => {
    window.location.href = generateSMSShareLink(referralCode, config.name);
  };

  const handleWhatsAppShare = () => {
    window.open(generateWhatsAppShareLink(referralCode, config.name), '_blank');
  };

  const generateQRCodeURL = (text: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
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
            <h1 className="mb-2">Referrals</h1>
            <p className="text-gray-600">Share the love and earn rewards together</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Bonus Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <div className="text-center mb-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white mx-auto mb-3"
                style={{ backgroundColor: brandColor }}
              >
                <Users className="w-8 h-8" />
              </div>
              <h2 className="mb-2">Invite Friends, Earn Together</h2>
              <p className="text-gray-600 text-sm">
                Share your unique link and both you and your friend get rewarded!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-white rounded-lg p-4">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1" style={{ color: brandColor }}>
                  +{REFERRAL_FRIEND_BONUS} ⭐
                </div>
                <p className="text-sm text-gray-600">Your friend gets</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1" style={{ color: brandColor }}>
                  +{REFERRAL_INVITER_BONUS} ⭐
                </div>
                <p className="text-sm text-gray-600">You get</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold mb-1" style={{ color: brandColor }}>
                {stats.clicks}
              </div>
              <p className="text-sm text-gray-600">Total Clicks</p>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold mb-1" style={{ color: brandColor }}>
                {stats.conversions}
              </div>
              <p className="text-sm text-gray-600">Successful Referrals</p>
            </Card>
          </div>
        </motion.div>

        {/* Referral Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <h2 className="mb-4">Your Referral Link</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button onClick={handleCopy} style={{ backgroundColor: brandColor }} className="text-white">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>

              {/* Share Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={handleSMSShare} className="w-full">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Share via SMS
                </Button>
                <Button
                  variant="outline"
                  onClick={handleWhatsAppShare}
                  className="w-full"
                  style={{ color: '#25D366' }}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </div>

              {/* QR Code */}
              <div>
                <Button
                  variant="outline"
                  onClick={() => setShowQR(!showQR)}
                  className="w-full"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  {showQR ? 'Hide QR Code' : 'Show QR Code'}
                </Button>
                {showQR && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 flex justify-center"
                  >
                    <img
                      src={generateQRCodeURL(referralLink)}
                      alt="Referral QR Code"
                      className="rounded-lg border-2 border-gray-200"
                    />
                  </motion.div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h2 className="mb-4">How It Works</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold"
                  style={{ backgroundColor: brandColor }}
                >
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Share your link</p>
                  <p>Send your unique referral link to friends and family via SMS, WhatsApp, or social media.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold"
                  style={{ backgroundColor: brandColor }}
                >
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">They place their first order</p>
                  <p>Your friend uses your link and completes their first order (minimum $10).</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold"
                  style={{ backgroundColor: brandColor }}
                >
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">You both get rewarded</p>
                  <p>
                    You receive +{REFERRAL_INVITER_BONUS} ⭐ and your friend gets +{REFERRAL_FRIEND_BONUS} ⭐
                    automatically added to your accounts.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Terms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-4 bg-gray-50">
            <p className="text-xs text-gray-500">
              <strong>Terms:</strong> Bonus applies after your friend completes their first paid order
              with a minimum total of $10. Referral credits are awarded once per new customer. Self-referrals
              are not permitted. We reserve the right to modify or cancel the referral program at any time.
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
