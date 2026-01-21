import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Package, ShoppingBag } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { StatusTracker } from '../components/status/StatusTracker';
import { useAuth } from '../lib/auth/AuthContext';

interface TrackOrderProps {
  orderNumber?: string;
  onNavigate: (path: string) => void;
  brandColor?: string;
}

export const TrackOrder = ({ orderNumber, onNavigate, brandColor = '#B64D2E' }: TrackOrderProps) => {
  const { user } = useAuth();
  const [search, setSearch] = useState(orderNumber || '');
  const [order, setOrder] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (orderNumber) {
      handleSearch(orderNumber);
    }
  }, [orderNumber]);

  const handleSearch = (searchTerm?: string) => {
    const term = searchTerm || search;
    if (!term) {
      setError('Please enter an order number');
      return;
    }

    setLoading(true);
    setError(null);
    setOrder(null);

    // Simulate API delay
    setTimeout(() => {
      const allOrders = JSON.parse(localStorage.getItem('tabsy-orders') || '[]');
      
      // Search by full order ID or last 6 digits
      const foundOrder = allOrders.find((o: any) => 
        o.id === term || o.id.endsWith(term)
      );

      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        setError('Order not found. Please check your order number and try again.');
      }

      setLoading(false);
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const isUserOrder = user && order && (
    order.customer.email === user.email || order.customer.phone === user.phone
  );

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
            <h1 className="mb-2">Track Your Order</h1>
            <p className="text-gray-600">
              Enter your order number to see real-time status updates
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Order Number
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Enter order number or last 6 digits"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="text-white"
                    style={{ backgroundColor: brandColor }}
                  >
                    {loading ? 'Searching...' : 'Track Order'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  You can find your order number in your confirmation email or receipt
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
            </form>
          </Card>
        </motion.div>

        {/* Order Status */}
        {order && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="mb-1">Order #{order.id.slice(-6)}</h2>
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
                  <div className="flex items-center gap-2">
                    {order.mode === 'pickup' ? (
                      <>
                        <ShoppingBag className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium">Pickup</span>
                      </>
                    ) : (
                      <>
                        <Package className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium">Delivery</span>
                      </>
                    )}
                  </div>
                </div>

                <StatusTracker
                  status={order.status}
                  fulfillment={order.mode}
                  placedAt={order.placedAt}
                  eta={order.eta}
                  brandColor={brandColor}
                />
              </Card>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Order Summary</h3>
                <div className="space-y-2">
                  {order.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.qty}x {item.name}
                      </span>
                      <span className="font-medium">
                        ${(item.price * item.qty).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span style={{ color: brandColor }}>
                        ${order.totals.grand_total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* View Full Order (if logged in and owns order) */}
            {isUserOrder && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onNavigate(`/account/orders/${order.id}`)}
                >
                  View Full Order Details
                </Button>
              </motion.div>
            )}
          </>
        )}

        {/* Empty State */}
        {!order && !error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="mb-2">Track Your Order</h3>
              <p className="text-gray-600 mb-6">
                Enter your order number above to see real-time updates on your order status
              </p>
              <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                <span>Don't have an order yet?</span>
                <button
                  onClick={() => onNavigate('/menu')}
                  className="font-medium hover:underline"
                  style={{ color: brandColor }}
                >
                  Start ordering →
                </button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};
