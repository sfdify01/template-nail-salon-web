// Toast POS Integration
// Documentation: https://doc.toasttab.com/

import { OrderInput } from '../types';
import { config } from '../config';

const TOAST_API_URL = config.toast.apiUrl;
const TOAST_API_KEY = config.toast.apiKey;

export interface ToastOrderResponse {
  guid: string;
  entityType: string;
  externalId: string;
}

export async function createOrder(order: OrderInput): Promise<{ pos_order_id: string }> {
  // Transform Tabsy order to Toast format
  const toastOrder = {
    checks: [
      {
        displayNumber: order.id,
        customer: {
          firstName: order.customer.first_name,
          lastName: order.customer.last_name,
          phone: order.customer.phone,
          email: order.customer.email,
        },
        selections: order.items.map((item, idx) => ({
          itemId: item.sku,
          quantity: item.qty,
          modifiers: item.mods?.map(m => ({ modifierId: m.id })),
          specialRequest: item.note,
          selectionType: 'NONE',
          displayName: `Item ${idx + 1}`,
        })),
        payments: order.payments.map(p => ({
          type: p.type === 'pos' ? 'CASH' : 'CREDIT',
          amount: order.totals.grand_total,
        })),
        appliedLoyaltyInfo: null,
      },
    ],
    deliveryInfo:
      order.fulfillment === 'delivery' && order.delivery
        ? {
            address: {
              address1: order.delivery.address,
              latitude: order.delivery.lat,
              longitude: order.delivery.lng,
            },
            deliveryNotes: order.delivery.instructions,
          }
        : null,
    requiredPrepTime: order.scheduled_at || undefined,
  };

  try {
    const response = await fetch(`${TOAST_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Toast-Restaurant-External-ID': config.toast.restaurantId || '',
        Authorization: `Bearer ${TOAST_API_KEY}`,
      },
      body: JSON.stringify(toastOrder),
    });

    if (!response.ok) {
      throw new Error(`Toast API error: ${response.statusText}`);
    }

    const data: ToastOrderResponse = await response.json();
    
    return {
      pos_order_id: data.guid,
    };
  } catch (error) {
    console.error('Toast POS error:', error);
    
    // Mock response for demo
    return {
      pos_order_id: `TOAST-${Date.now()}`,
    };
  }
}

export async function updateOrder(
  posOrderId: string,
  updates: Partial<OrderInput>
): Promise<void> {
  // Toast API for updating orders
  console.log('Updating Toast order:', posOrderId, updates);
  
  // In production, make actual API call
  // await fetch(`${TOAST_API_URL}/orders/${posOrderId}`, { method: 'PATCH', ... });
}

export interface ToastWebhookEvent {
  eventType: 'ORDER_CREATED' | 'ORDER_MODIFIED' | 'ORDER_READY' | 'ORDER_COMPLETED';
  guid: string;
  restaurantGuid: string;
  checkGuid: string;
  timestamp: string;
}

export function parseWebhook(payload: any): ToastWebhookEvent {
  return {
    eventType: payload.eventType,
    guid: payload.guid,
    restaurantGuid: payload.restaurantGuid,
    checkGuid: payload.checkGuid,
    timestamp: payload.businessDate,
  };
}

export function mapToOrderStatus(event: ToastWebhookEvent): string {
  switch (event.eventType) {
    case 'ORDER_CREATED':
      return 'accepted';
    case 'ORDER_MODIFIED':
      return 'in_kitchen';
    case 'ORDER_READY':
      return 'ready';
    case 'ORDER_COMPLETED':
      return 'delivered';
    default:
      return 'created';
  }
}
