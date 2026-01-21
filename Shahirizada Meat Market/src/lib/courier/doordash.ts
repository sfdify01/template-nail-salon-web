// DoorDash Drive Integration
// Documentation: https://developer.doordash.com/en-US/docs/drive/

import { OrderRecord, CourierQuote, CourierJob } from '../types';
import { config } from '../config';

const DOORDASH_API_URL = config.doordash.apiUrl;
const DOORDASH_DEVELOPER_ID = config.doordash.developerId;
const DOORDASH_KEY_ID = config.doordash.keyId;
const DOORDASH_SIGNING_SECRET = config.doordash.signingSecret;

export async function quoteDelivery(
  pickupAddress: string,
  pickupLat: number,
  pickupLng: number,
  dropoffAddress: string,
  dropoffLat: number,
  dropoffLng: number
): Promise<CourierQuote> {
  const quote = {
    external_delivery_id: `QUOTE-${Date.now()}`,
    pickup_address: pickupAddress,
    pickup_business_name: 'Fresh Market',
    pickup_phone_number: '+16305551234',
    dropoff_address: dropoffAddress,
    dropoff_phone_number: '+16305551234',
    order_value: 2500, // cents
  };

  try {
    const response = await fetch(`${DOORDASH_API_URL}/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify(quote),
    });

    if (!response.ok) {
      throw new Error(`DoorDash API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      fee: data.fee / 100, // Convert cents to dollars
      eta_minutes: data.estimated_pickup_time_minutes || 15,
      quote_id: data.external_delivery_id,
    };
  } catch (error) {
    console.error('DoorDash quote error:', error);
    
    // Mock quote for demo
    return {
      fee: 4.99,
      eta_minutes: 15,
      quote_id: `DD-QUOTE-${Date.now()}`,
    };
  }
}

export async function requestDelivery(
  order: OrderRecord,
  restaurantAddress?: { line1: string; city: string; state: string; zip: string },
  restaurantPhone?: string
): Promise<CourierJob> {
  if (!order.delivery) {
    throw new Error('Delivery address required');
  }

  const delivery = {
    external_delivery_id: order.id,
    pickup_address: restaurantAddress 
      ? `${restaurantAddress.line1}, ${restaurantAddress.city}, ${restaurantAddress.state} ${restaurantAddress.zip}`
      : '123 Main St, City, ST 12345',
    pickup_business_name: 'Fresh Market',
    pickup_phone_number: restaurantPhone || '+16305551234',
    pickup_instructions: 'Call upon arrival',
    dropoff_address: order.delivery.address,
    dropoff_business_name: `${order.customer.first_name} ${order.customer.last_name}`,
    dropoff_phone_number: order.customer.phone,
    dropoff_instructions: order.delivery.instructions,
    order_value: Math.round(order.totals.grand_total * 100),
    pickup_time: order.timestamps.ready,
  };

  try {
    const response = await fetch(`${DOORDASH_API_URL}/deliveries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify(delivery),
    });

    if (!response.ok) {
      throw new Error(`DoorDash API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      job_id: data.external_delivery_id,
      status: 'confirmed',
      tracking_url: data.tracking_url,
    };
  } catch (error) {
    console.error('DoorDash delivery error:', error);
    
    // Mock job for demo
    return {
      job_id: `DD-${Date.now()}`,
      status: 'confirmed',
      tracking_url: 'https://doordash.com/track/demo',
    };
  }
}

export async function sendReadySignal(jobId: string): Promise<void> {
  // Update delivery status to ready for pickup
  try {
    await fetch(`${DOORDASH_API_URL}/deliveries/${jobId}/ready`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getAuthToken()}`,
      },
    });
  } catch (error) {
    console.error('DoorDash ready signal error:', error);
  }
}

export interface DoorDashWebhookEvent {
  event_type: string;
  external_delivery_id: string;
  dasher_name?: string;
  dasher_phone?: string;
  dasher_location?: { lat: number; lng: number };
}

export function parseWebhook(payload: any): DoorDashWebhookEvent {
  return {
    event_type: payload.event_type,
    external_delivery_id: payload.external_delivery_id,
    dasher_name: payload.dasher?.name,
    dasher_phone: payload.dasher?.phone_number,
    dasher_location: payload.dasher?.location,
  };
}

export function mapToOrderStatus(event: DoorDashWebhookEvent): string {
  switch (event.event_type) {
    case 'delivery_created':
      return 'courier_requested';
    case 'dasher_confirmed':
      return 'driver_en_route';
    case 'dasher_picked_up':
      return 'picked_up';
    case 'delivery_delivered':
      return 'delivered';
    default:
      return 'courier_requested';
  }
}

async function getAuthToken(): Promise<string> {
  // In production, implement JWT signing with DOORDASH_SIGNING_SECRET
  // For demo, return placeholder
  return 'DEMO_TOKEN';
}
