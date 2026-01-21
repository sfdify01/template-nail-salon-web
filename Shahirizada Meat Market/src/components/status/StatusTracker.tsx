import { OrderStatus } from '../../lib/types';
import { Check, Clock, Loader2, Truck, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface StatusTrackerProps {
  status: string;
  fulfillment: 'pickup' | 'delivery';
  placedAt: string;
  eta: string;
  brandColor?: string;
}

const statusSteps = {
  pickup: [
    { key: 'created', label: 'Order Placed', icon: Check },
    { key: 'accepted', label: 'Confirmed', icon: Check },
    { key: 'in_kitchen', label: 'Preparing', icon: Loader2 },
    { key: 'ready', label: 'Ready for Pickup', icon: CheckCircle },
  ],
  delivery: [
    { key: 'created', label: 'Order Placed', icon: Check },
    { key: 'accepted', label: 'Confirmed', icon: Check },
    { key: 'in_kitchen', label: 'Preparing', icon: Loader2 },
    { key: 'ready', label: 'Ready', icon: Check },
    { key: 'driver_en_route', label: 'Driver En Route', icon: Truck },
    { key: 'picked_up', label: 'Picked Up', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle },
  ],
};

export const StatusTracker = ({ status, fulfillment, placedAt, eta, brandColor = '#B64D2E' }: StatusTrackerProps) => {
  const steps = statusSteps[fulfillment];
  const currentStepIndex = steps.findIndex(s => s.key === status);
  const isFailed = ['rejected', 'canceled', 'failed'].includes(status);

  if (isFailed) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl">
        <div className="flex items-center gap-3 text-red-700">
          <XCircle className="w-6 h-6" />
          <div>
            <h3 className="text-lg">Order {status.charAt(0).toUpperCase() + status.slice(1)}</h3>
            <p className="text-sm">
              {status === 'rejected' && 'Your order could not be confirmed. Please contact us.'}
              {status === 'canceled' && 'This order has been canceled.'}
              {status === 'failed' && 'There was an error processing your order.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isComplete = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const timestamp = timeline[step.key];
        const Icon = step.icon;

        return (
          <motion.div
            key={step.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex items-start gap-4"
          >
            {/* Timeline line */}
            {index < steps.length - 1 && (
              <div
                className={`absolute left-4 top-8 bottom-0 w-0.5 ${
                  isComplete ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}

            {/* Icon */}
            <div
              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                isComplete
                  ? 'bg-green-500 text-white'
                  : isCurrent
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {isCurrent && step.icon === Loader2 ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-8">
              <div className="flex items-center justify-between">
                <h4
                  className={`${
                    isComplete || isCurrent ? '' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </h4>
                {timestamp && (
                  <span className="text-sm text-gray-500">
                    {new Date(timestamp).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
              {isCurrent && (
                <p className="text-sm text-gray-600 mt-1">
                  {step.key === 'in_kitchen' && 'Your order is being prepared'}
                  {step.key === 'ready' && fulfillment === 'pickup' && 'Ready for pickup!'}
                  {step.key === 'driver_en_route' && 'Driver is on the way'}
                  {step.key === 'picked_up' && 'Order picked up, arriving soon'}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
