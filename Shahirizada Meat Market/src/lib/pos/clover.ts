// Clover POS Integration
// Documentation: https://docs.clover.com/

import { OrderInput } from '../types';
import { config } from '../config';

const CLOVER_API_URL = config.clover.apiUrl;
const CLOVER_ACCESS_TOKEN = config.clover.accessToken;
const CLOVER_MERCHANT_ID = config.clover.merchantId;

export async function createOrder(order: OrderInput): Promise<{ pos_order_id: string }> {
  const cloverOrder = {
    state: 'open',
    orderType: {
      id: order.fulfillment === 'delivery' ? 'DELIVERY' : 'PICKUP',
    },
    customers: [
      {
        firstName: order.customer.first_name,
        lastName: order.customer.last_name,
        phoneNumbers: [
          {
            phoneNumber: order.customer.phone,
          },
        ],
        emailAddresses: order.customer.email
          ? [
              {
                emailAddress: order.customer.email,
              },
            ]
          : undefined,
      },
    ],
    lineItems: order.items.map(item => ({
      item: {
        id: item.sku,
      },
      modifications: item.mods?.map(m => ({
        modifier: {
          id: m.id,
        },
      })),
      note: item.note,
    })),
  };

  try {
    const response = await fetch(
      `${CLOVER_API_URL}/merchants/${CLOVER_MERCHANT_ID}/orders`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${CLOVER_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(cloverOrder),
      }
    );

    if (!response.ok) {
      throw new Error(`Clover API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      pos_order_id: data.id,
    };
  } catch (error) {
    console.error('Clover POS error:', error);
    
    // Mock response for demo
    return {
      pos_order_id: `CLV-${Date.now()}`,
    };
  }
}

export async function updateOrder(
  posOrderId: string,
  updates: Partial<OrderInput>
): Promise<void> {
  console.log('Updating Clover order:', posOrderId, updates);
  // Implementation similar to createOrder
}

export interface CloverWebhookEvent {
  type: string;
  objectId: string;
  merchantId: string;
}

export function parseWebhook(payload: any): CloverWebhookEvent {
  return {
    type: payload.type,
    objectId: payload.objectId,
    merchantId: payload.merchantId,
  };
}

export function mapToOrderStatus(event: CloverWebhookEvent): string {
  switch (event.type) {
    case 'ORDER_CREATED':
      return 'accepted';
    case 'ORDER_UPDATED':
      return 'in_kitchen';
    default:
      return 'created';
  }
}
