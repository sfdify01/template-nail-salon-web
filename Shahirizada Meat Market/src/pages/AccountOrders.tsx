import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, ShoppingBag, Truck, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../lib/auth/AuthContext';

interface AccountOrdersProps {
  onNavigate: (path: string) => void;
  brandColor?: string;
}

type OrderStatus = 'confirmed' | 'in_kitchen' | 'ready' | 'out_for_delivery' | 'delivered' | 'canceled';
type FilterType = 'all' | 'in_progress' | 'completed' | 'canceled';

export const AccountOrders = ({ onNavigate, brandColor = '#B64D2E' }: AccountOrdersProps) => {
  const { user, loading } = useAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      onNavigate('/login');
      return;
    }

    if (user) {
      // Load orders from localStorage
      const allOrders = JSON.parse(localStorage.getItem('tabsy-orders') || '[]');
      const userOrders = allOrders
        .filter((order: any) => {
          return order.customer.email === user.email || order.customer.phone === user.phone;
        })
        .sort((a: any, b: any) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
      
      setOrders(userOrders);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'in_kitchen':
        return <Clock className="w-4 h-4" />;
      case 'ready':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'out_for_delivery':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'canceled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const isInProgress = (status: string) => {
    return ['confirmed', 'in_kitchen', 'ready', 'out_for_delivery'].includes(status);
  };

  const isCompleted = (status: string) => {
    return status === 'delivered';
  };

  const isCanceled = (status: string) => {
    return status === 'canceled';
  };

  const filteredOrders = orders.filter((order) => {
    // Apply filter
    if (filter === 'in_progress' && !isInProgress(order.status)) return false;
    if (filter === 'completed' && !isCompleted(order.status)) return false;
    if (filter === 'canceled' && !isCanceled(order.status)) return false;

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        order.id.toLowerCase().includes(searchLower) ||
        order.items.some((item: any) => item.name.toLowerCase().includes(searchLower))
      );
    }

    return true;
  });

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
            <h1 className="mb-2">My Orders</h1>
            <p className="text-gray-600">{orders.length} total orders</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Search and Filters */}
        <Card className="p-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by order number or item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="canceled">Canceled</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </Card>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="mb-2">No orders found</h3>
            <p className="text-gray-600 mb-6">
              {search ? 'Try a different search term' : 'Start by placing your first order'}
            </p>
            <button
              onClick={() => onNavigate('/products')}
              className="text-sm px-4 py-2 rounded-lg text-white"
              style={{ backgroundColor: brandColor }}
            >
              Order Now
            </button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => onNavigate(`/account/orders/${order.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-mono">#{order.id.slice(-6)}</h3>
                        <Badge className={getStatusColor(order.status)}>
                          <span className="mr-1">{getStatusIcon(order.status)}</span>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(order.placedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold" style={{ color: brandColor }}>
                        ${order.totals.grand_total.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600 capitalize">
                        {order.mode === 'pickup' ? (
                          <span className="flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3" /> Pickup
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Truck className="w-3 h-3" /> Delivery
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="border-t pt-3">
                    <p className="text-sm text-gray-600">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}: {' '}
                      {order.items.slice(0, 2).map((item: any) => item.name).join(', ')}
                      {order.items.length > 2 && ` +${order.items.length - 2} more`}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
