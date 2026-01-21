// Client-side API wrapper
// In production, these would call actual backend API routes

import { OrderInput, OrderRecord, OrderStatus } from './types';
import { generateOrderId, createOrder as dbCreateOrder, updateOrderStatus, getOrder } from './db';
import * as toastPOS from './pos/toast';
import * as squarePOS from './pos/square';
import * as cloverPOS from './pos/clover';
import * as doordashCourier from './courier/doordash';
import * as uberCourier from './courier/uber';

// Mock API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Create order
export async function createOrderAPI(input: OrderInput): Promise<{ id: string; order: OrderRecord }> {
  await delay(500); // Simulate network delay

  const orderId = generateOrderId();
  
  // Create in POS
  let posOrderId: string | undefined;
  try {
    const posAdapter = getPOSAdapter(input.meta.pos);
    const result = await posAdapter.createOrder(input);
    posOrderId = result.pos_order_id;
  } catch (error) {
    console.error('POS creation error:', error);
  }

  // Create order record
  const order: OrderRecord = {
    ...input,
    id: orderId,
    pos_order_id: posOrderId,
    status: 'created',
    timestamps: {
      created: new Date().toISOString(),
    },
  };

  await dbCreateOrder(order);

  // Simulate POS accepting the order after a delay
  setTimeout(async () => {
    await updateOrderStatus(orderId, 'accepted');
    // Simulate kitchen starting after another delay
    setTimeout(async () => {
      await updateOrderStatus(orderId, 'in_kitchen');
    }, 2000);
  }, 1000);

  return { id: orderId, order };
}

// Get order by ID
export async function getOrderAPI(id: string): Promise<OrderRecord | null> {
  await delay(200);
  return await getOrder(id);
}

// Mark order ready (called by POS webhook)
export async function markOrderReadyAPI(orderId: string): Promise<void> {
  await delay(300);
  const order = await getOrder(orderId);
  
  if (!order) {
    throw new Error('Order not found');
  }

  await updateOrderStatus(orderId, 'ready');

  // If delivery, request courier
  if (order.fulfillment === 'delivery') {
    await requestCourierAPI(orderId);
  }
}

// Request courier delivery
export async function requestCourierAPI(orderId: string, restaurantInfo?: any): Promise<void> {
  await delay(500);
  const order = await getOrder(orderId);
  
  if (!order || order.fulfillment !== 'delivery') {
    throw new Error('Invalid order for courier request');
  }

  try {
    const courierAdapter = getCourierAdapter(order.meta.courier || 'doordash');
    // Pass restaurant info if available
    const job = await courierAdapter.requestDelivery(
      order,
      restaurantInfo?.address,
      restaurantInfo?.phone
    );
    
    // Update order with courier job ID
    const updated = await getOrder(orderId);
    if (updated) {
      updated.courier_job_id = job.job_id;
      await updateOrderStatus(orderId, 'courier_requested');
    }

    // Simulate courier assignment
    setTimeout(async () => {
      await updateOrderStatus(orderId, 'driver_en_route');
      // Simulate pickup
      setTimeout(async () => {
        await updateOrderStatus(orderId, 'picked_up');
        // Simulate delivery
        setTimeout(async () => {
          await updateOrderStatus(orderId, 'delivered');
        }, 8000);
      }, 5000);
    }, 3000);
  } catch (error) {
    console.error('Courier request error:', error);
  }
}

// POS webhook handler
export async function handlePOSWebhook(payload: any, posType: string): Promise<void> {
  const posAdapter = getPOSAdapter(posType as any);
  const event = posAdapter.parseWebhook(payload);
  const newStatus = posAdapter.mapToOrderStatus(event);
  
  // Find order by POS ID and update status
  // In production, you'd have a database query for this
  console.log('POS webhook:', event, newStatus);
}

// Courier webhook handler
export async function handleCourierWebhook(payload: any, provider: string): Promise<void> {
  const courierAdapter = getCourierAdapter(provider as any);
  const event = courierAdapter.parseWebhook(payload);
  const newStatus = courierAdapter.mapToOrderStatus(event);
  
  console.log('Courier webhook:', event, newStatus);
}

// Server-Sent Events stream for order updates
export function createOrderStream(orderId: string): EventSource {
  // In production, this would connect to an actual SSE endpoint
  // For demo, we'll poll the database
  
  const eventSource = {
    onmessage: null as ((event: MessageEvent) => void) | null,
    onerror: null as ((event: Event) => void) | null,
    close: () => clearInterval(interval),
  };

  const interval = setInterval(async () => {
    const order = await getOrder(orderId);
    if (order && eventSource.onmessage) {
      const event = new MessageEvent('message', {
        data: JSON.stringify(order),
      });
      eventSource.onmessage(event);
    }
  }, 2000);

  return eventSource as EventSource;
}

// Helper functions
function getPOSAdapter(type: 'toast' | 'square' | 'clover') {
  switch (type) {
    case 'toast':
      return toastPOS;
    case 'square':
      return squarePOS;
    case 'clover':
      return cloverPOS;
    default:
      return toastPOS;
  }
}

function getCourierAdapter(provider: 'doordash' | 'uber') {
  switch (provider) {
    case 'doordash':
      return doordashCourier;
    case 'uber':
      return uberCourier;
    default:
      return doordashCourier;
  }
}

// Payment intent creation (Stripe)
export async function createPaymentIntent(amount: number): Promise<{ clientSecret: string; id: string }> {
  await delay(500);
  
  // In production, call Stripe API
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // const paymentIntent = await stripe.paymentIntents.create({ amount, currency: 'usd' });
  
  // Mock response
  return {
    clientSecret: `pi_mock_${Date.now()}_secret`,
    id: `pi_mock_${Date.now()}`,
  };
}
