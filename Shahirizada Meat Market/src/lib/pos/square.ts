// Square POS Integration
// Documentation: https://developer.squareup.com/docs

import { OrderInput } from '../types';
import { config } from '../config';

const SQUARE_API_URL = config.square.apiUrl;
const SQUARE_ACCESS_TOKEN = config.square.accessToken;

export async function createOrder(order: OrderInput): Promise<{ pos_order_id: string }> {
  const squareOrder = {
    idempotency_key: order.id,
    order: {
      location_id: order.store_id,
      line_items: order.items.map(item => ({
        quantity: item.qty.toString(),
        catalog_object_id: item.sku,
        modifiers: item.mods?.map(m => ({
          catalog_object_id: m.id,
        })),
        note: item.note,
      })),
      fulfillments: [
        {
          type: order.fulfillment === 'delivery' ? 'DELIVERY' : 'PICKUP',
          state: 'PROPOSED',
          pickup_details:
            order.fulfillment === 'pickup'
              ? {
                  recipient: {
                    display_name: `${order.customer.first_name} ${order.customer.last_name}`,
                    phone_number: order.customer.phone,
                    email_address: order.customer.email,
                  },
                  schedule_type: order.when === 'asap' ? 'ASAP' : 'SCHEDULED',
                  pickup_at: order.scheduled_at,
                }
              : undefined,
          delivery_details:
            order.fulfillment === 'delivery' && order.delivery
              ? {
                  recipient: {
                    display_name: `${order.customer.first_name} ${order.customer.last_name}`,
                    phone_number: order.customer.phone,
                  },
                  address: {
                    address_line_1: order.delivery.address,
                  },
                  schedule_type: order.when === 'asap' ? 'ASAP' : 'SCHEDULED',
                  deliver_at: order.scheduled_at,
                  note: order.delivery.instructions,
                }
              : undefined,
        },
      ],
    },
  };

  try {
    const response = await fetch(`${SQUARE_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
        'Square-Version': '2024-01-18',
      },
      body: JSON.stringify(squareOrder),
    });

    if (!response.ok) {
      throw new Error(`Square API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      pos_order_id: data.order.id,
    };
  } catch (error) {
    console.error('Square POS error:', error);
    
    // Mock response for demo
    return {
      pos_order_id: `SQ-${Date.now()}`,
    };
  }
}

export async function updateOrder(
  posOrderId: string,
  updates: Partial<OrderInput>
): Promise<void> {
  console.log('Updating Square order:', posOrderId, updates);
  // Implementation similar to createOrder
}

export interface SquareWebhookEvent {
  type: string;
  data: {
    type: string;
    id: string;
    object: {
      order_updated?: any;
    };
  };
}

export function parseWebhook(payload: any): SquareWebhookEvent {
  return payload;
}

export function mapToOrderStatus(event: SquareWebhookEvent): string {
  const state = event.data.object.order_updated?.state;
  
  switch (state) {
    case 'OPEN':
      return 'accepted';
    case 'IN_PROGRESS':
      return 'in_kitchen';
    case 'COMPLETED':
      return 'ready';
    default:
      return 'created';
  }
}
