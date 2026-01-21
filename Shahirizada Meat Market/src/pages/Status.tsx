import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { OrderRecord } from '../lib/types';
import { StatusTracker } from '../components/status/StatusTracker';
import { MapEta } from '../components/status/MapEta';
import { SupportButton } from '../components/status/SupportButton';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, Receipt, MapPin, Clock } from 'lucide-react';
import { formatCurrency } from '../lib/pricing';

interface StatusProps {
  orderId: string;
  onNavigate: (path: string) => void;
  config: {
    name: string;
    contact: { phone: string; email: string };
    theme: { brand: string };
  };
}

export const Status = ({ orderId, onNavigate, config }: StatusProps) => {
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load order
    const loadOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) {
          throw new Error('Order not found');
        }
        const data = await response.json();
        setOrder(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();

    // Set up SSE for real-time updates
    const eventSource = new EventSource(`/api/orders/${orderId}/stream`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setOrder(data);
    };

    eventSource.onerror = () => {
      console.error('SSE connection error');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">
            We couldn't find an order with ID: {orderId}
          </p>
          <Button
            onClick={() => onNavigate('/')}
            className="rounded-2xl text-white"
            style={{ backgroundColor: config.theme.brand }}
          >
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const isDelivery = order.fulfillment === 'delivery';
  const showMap = isDelivery && order.status !== 'delivered';

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('/')}
            className="rounded-2xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1>Order Status</h1>
            <p className="text-sm text-gray-600">#{order.id}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Success Message */}
        {order.status === 'created' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-green-50 border border-green-200 rounded-2xl text-center"
          >
            <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Receipt className="w-8 h-8 text-white" />
            </div>
            <h2 className="mb-2">Order Placed Successfully!</h2>
            <p className="text-gray-600">
              We've received your order and will start preparing it soon.
            </p>
          </motion.div>
        )}

        {/* ETA Card */}
        {order.eta && (
          <Card className="p-6 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: config.theme.brand }} />
            <p className="text-sm text-gray-600 mb-1">
              Estimated {isDelivery ? 'Delivery' : 'Pickup'} Time
            </p>
            <p className="text-2xl">{order.eta}</p>
          </Card>
        )}

        {/* Status Timeline */}
        <Card className="p-6">
          <h2 className="mb-6">Order Progress</h2>
          <StatusTracker
            status={order.status}
            timeline={order.timestamps}
            fulfillment={order.fulfillment}
          />
        </Card>

        {/* Map for Delivery */}
        {showMap && (
          <Card className="p-6">
            <h2 className="mb-4">Live Tracking</h2>
            <MapEta
              driverLocation={order.driver?.location}
              deliveryLocation={order.delivery!}
              eta={order.eta}
              trackingUrl={order.courier_job_id ? `https://track.example.com/${order.courier_job_id}` : undefined}
            />
          </Card>
        )}

        {/* Delivery/Pickup Address */}
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="mb-2">
                {isDelivery ? 'Delivery Address' : 'Pickup Location'}
              </h3>
              <p className="text-sm text-gray-600">
                {isDelivery && order.delivery
                  ? order.delivery.address
                  : (
                    <>
                      {config.address.line1}<br />
                      {config.address.city}, {config.address.state} {config.address.zip}
                    </>
                  )}
              </p>
              {isDelivery && order.delivery?.instructions && (
                <p className="text-sm text-gray-500 mt-2">
                  Instructions: {order.delivery.instructions}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Order Summary */}
        <Card className="p-6">
          <h2 className="mb-4">Order Details</h2>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>
                  {item.qty}x Item {idx + 1}
                </span>
                <span>SKU: {item.sku}</span>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatCurrency(order.totals.subtotal)}</span>
            </div>
            {order.totals.delivery_fee && order.totals.delivery_fee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span>{formatCurrency(order.totals.delivery_fee)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span>{formatCurrency(order.totals.tax)}</span>
            </div>
            {order.totals.tips > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tip</span>
                <span>{formatCurrency(order.totals.tips)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span>Total</span>
              <span>{formatCurrency(order.totals.grand_total)}</span>
            </div>
          </div>
        </Card>

        {/* Support */}
        <SupportButton
          phone={config.contact.phone}
          email={config.contact.email}
          orderId={order.id}
        />
      </div>
    </div>
  );
};
