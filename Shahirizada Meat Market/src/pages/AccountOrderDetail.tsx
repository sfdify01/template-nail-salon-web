import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, Mail, MapPin, Clock, ShoppingBag, Truck, Phone } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../lib/auth/AuthContext';
import { StatusTracker } from '../components/status/StatusTracker';
import { getPickupCode } from '../lib/utils/id';

interface AccountOrderDetailProps {
  orderId: string;
  onNavigate: (path: string) => void;
  config: {
    name: string;
    contact: { phone: string; email: string };
    address: { line1: string; city: string; state: string; zip: string };
  };
  brandColor?: string;
}

export const AccountOrderDetail = ({ 
  orderId, 
  onNavigate, 
  config,
  brandColor = '#B64D2E' 
}: AccountOrderDetailProps) => {
  const { user, loading } = useAuth();
  const [order, setOrder] = useState<any | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      onNavigate('/login');
      return;
    }

    if (user) {
      // Load order from localStorage
      const allOrders = JSON.parse(localStorage.getItem('tabsy-orders') || '[]');
      const foundOrder = allOrders.find((o: any) => o.id === orderId);

      if (foundOrder) {
        // Verify order belongs to user
        const isUserOrder = foundOrder.customer.email === user.email || 
                           foundOrder.customer.phone === user.phone;
        
        if (isUserOrder) {
          setOrder(foundOrder);
        } else {
          onNavigate('/account/orders');
        }
      } else {
        onNavigate('/account/orders');
      }
    }
  }, [orderId, user, loading, onNavigate]);

  if (loading || !user || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  const pickupCode = getPickupCode(order.id);
  const eta = new Date(order.eta);

  const handleDownloadReceipt = () => {
    // Mock download - in production, generate and download PDF
    alert('Receipt download coming soon! Order #' + order.id.slice(-6));
  };

  const handleNeedHelp = () => {
    const subject = encodeURIComponent(`Help with Order #${order.id.slice(-6)}`);
    const body = encodeURIComponent(`Hi, I need help with my order:\n\nOrder Number: ${order.id}\nPlaced: ${new Date(order.placedAt).toLocaleString()}\n\nIssue: `);
    window.location.href = `mailto:${config.contact.email}?subject=${subject}&body=${body}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'in_kitchen':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'out_for_delivery':
        return 'bg-amber-100 text-amber-800';
      case 'delivered':
        return 'bg-gray-100 text-gray-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <button
              onClick={() => onNavigate('/account/orders')}
              className="text-sm text-gray-600 hover:text-gray-900 mb-2"
            >
              ← Back to Orders
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="mb-1">Order #{order.id.slice(-6)}</h1>
                <p className="text-sm text-gray-600">
                  {new Date(order.placedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <Badge className={getStatusColor(order.status)}>
                {order.status.replace('_', ' ')}
              </Badge>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Status Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <h2 className="mb-4">Order Status</h2>
            <StatusTracker
              status={order.status}
              fulfillment={order.mode}
              placedAt={order.placedAt}
              eta={order.eta}
              brandColor={brandColor}
            />
          </Card>
        </motion.div>

        {/* Fulfillment Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <h2 className="mb-4">
              {order.mode === 'pickup' ? 'Pickup Details' : 'Delivery Details'}
            </h2>

            {order.mode === 'pickup' ? (
              <div className="space-y-4">
                {/* Pickup Code */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 text-center border border-amber-200">
                  <p className="text-sm text-gray-600 mb-2">Your pickup code</p>
                  <div className="text-3xl font-bold font-mono" style={{ color: brandColor }}>
                    {pickupCode}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Show this at pickup</p>
                </div>

                {/* Pickup Location */}
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium">Pickup Location</div>
                    <div className="text-sm text-gray-600">
                      {config.address.line1}<br />
                      {config.address.city}, {config.address.state} {config.address.zip}
                    </div>
                  </div>
                </div>

                {/* Ready Time */}
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium">Estimated Ready Time</div>
                    <div className="text-sm text-gray-600">
                      {eta.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Delivery Address */}
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium">Delivery Address</div>
                    <div className="text-sm text-gray-600">
                      {order.address?.line1}
                      {order.address?.apt && ` ${order.address.apt}`}<br />
                      {order.address?.city}, {order.address?.state} {order.address?.zip}
                    </div>
                    {order.address?.notes && (
                      <div className="text-sm text-gray-500 mt-1">
                        Note: {order.address.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* ETA */}
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium">Estimated Delivery</div>
                    <div className="text-sm text-gray-600">
                      {eta.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <h2 className="mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item: any, index: number) => (
                <div key={index}>
                  <div className="flex justify-between">
                    <div className="flex-1">
                      <div className="font-medium">
                        {item.qty}x {item.name}
                      </div>
                      {item.mods && item.mods.length > 0 && (
                        <div className="text-sm text-gray-600 mt-1">
                          {item.mods.map((mod: any) => mod.name).join(', ')}
                        </div>
                      )}
                      {item.note && (
                        <div className="text-sm text-gray-500 italic mt-1">
                          Note: {item.note}
                        </div>
                      )}
                    </div>
                    <div className="font-medium">
                      ${(item.price * item.qty).toFixed(2)}
                    </div>
                  </div>
                  {index < order.items.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>${order.totals.subtotal.toFixed(2)}</span>
              </div>
              {order.totals.fees > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span>${order.totals.fees.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span>${order.totals.tax.toFixed(2)}</span>
              </div>
              {order.totals.tips > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tip</span>
                  <span>${order.totals.tips.toFixed(2)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span style={{ color: brandColor }}>
                  ${order.totals.grand_total.toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid sm:grid-cols-2 gap-4"
        >
          <Button variant="outline" onClick={handleDownloadReceipt}>
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </Button>
          <Button
            variant="outline"
            onClick={handleNeedHelp}
          >
            <Mail className="w-4 h-4 mr-2" />
            Need Help?
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
