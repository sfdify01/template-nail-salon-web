// Uber Direct Integration
// Documentation: https://developer.uber.com/docs/deliveries

import { OrderRecord, CourierQuote, CourierJob } from '../types';
import { config } from '../config';

const UBER_API_URL = config.uber.apiUrl;
const UBER_CUSTOMER_ID = config.uber.customerId;
const UBER_CLIENT_ID = config.uber.clientId;
const UBER_CLIENT_SECRET = config.uber.clientSecret;

export async function quoteDelivery(
  pickupAddress: string,
  pickupLat: number,
  pickupLng: number,
  dropoffAddress: string,
  dropoffLat: number,
  dropoffLng: number
): Promise<CourierQuote> {
  const quote = {
    pickup: {
      location: {
        lat: pickupLat,
        lng: pickupLng,
      },
    },
    dropoff: {
      location: {
        lat: dropoffLat,
        lng: dropoffLng,
      },
    },
  };

  try {
    const response = await fetch(
      `${UBER_API_URL}/${UBER_CUSTOMER_ID}/delivery_quotes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(quote),
      }
    );

    if (!response.ok) {
      throw new Error(`Uber API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      fee: data.fee / 100,
      eta_minutes: data.pickup_eta || 15,
      quote_id: data.id,
    };
  } catch (error) {
    console.error('Uber quote error:', error);
    
    // Mock quote for demo
    return {
      fee: 5.99,
      eta_minutes: 12,
      quote_id: `UBER-QUOTE-${Date.now()}`,
    };
  }
}

export async function requestDelivery(
  order: OrderRecord,
  restaurantAddress?: { line1: string; city: string; state: string; lat: number; lng: number },
  restaurantPhone?: string
): Promise<CourierJob> {
  if (!order.delivery) {
    throw new Error('Delivery address required');
  }

  const delivery = {
    pickup: {
      name: 'Fresh Market',
      phone_number: restaurantPhone || '+16305551234',
      address: restaurantAddress
        ? `${restaurantAddress.line1}, ${restaurantAddress.city}, ${restaurantAddress.state}`
        : '123 Main St, City, ST',
      location: {
        lat: restaurantAddress?.lat || 41.77,
        lng: restaurantAddress?.lng || -88.15,
      },
      notes: 'Restaurant pickup',
    },
    dropoff: {
      name: `${order.customer.first_name} ${order.customer.last_name}`,
      phone_number: order.customer.phone,
      address: order.delivery.address,
      location: {
        lat: order.delivery.lat,
        lng: order.delivery.lng,
      },
      notes: order.delivery.instructions,
    },
    manifest_items: [
      {
        name: 'Restaurant Order',
        quantity: order.items.length,
        size: 'medium',
      },
    ],
  };

  try {
    const response = await fetch(
      `${UBER_API_URL}/${UBER_CUSTOMER_ID}/deliveries`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(delivery),
      }
    );

    if (!response.ok) {
      throw new Error(`Uber API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      job_id: data.id,
      status: 'confirmed',
      tracking_url: data.tracking_url,
    };
  } catch (error) {
    console.error('Uber delivery error:', error);
    
    // Mock job for demo
    return {
      job_id: `UBER-${Date.now()}`,
      status: 'confirmed',
      tracking_url: 'https://uber.com/track/demo',
    };
  }
}

export async function updatePickupWindow(
  jobId: string,
  readyTime: string
): Promise<void> {
  // Update delivery with ready time
  try {
    await fetch(`${UBER_API_URL}/${UBER_CUSTOMER_ID}/deliveries/${jobId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify({
        pickup: {
          ready_dt: readyTime,
        },
      }),
    });
  } catch (error) {
    console.error('Uber update error:', error);
  }
}

export interface UberWebhookEvent {
  event_type: string;
  delivery_id: string;
  courier?: {
    name: string;
    phone_number: string;
    location?: { lat: number; lng: number };
  };
}

export function parseWebhook(payload: any): UberWebhookEvent {
  return {
    event_type: payload.event_type,
    delivery_id: payload.delivery_id,
    courier: payload.courier,
  };
}

export function mapToOrderStatus(event: UberWebhookEvent): string {
  switch (event.event_type) {
    case 'delivery.created':
      return 'courier_requested';
    case 'delivery.assigned':
      return 'driver_en_route';
    case 'delivery.picked_up':
      return 'picked_up';
    case 'delivery.delivered':
      return 'delivered';
    default:
      return 'courier_requested';
  }
}

async function getAuthToken(): Promise<string> {
  // In production, implement OAuth 2.0 flow
  // For demo, return placeholder
  return 'DEMO_TOKEN';
}
