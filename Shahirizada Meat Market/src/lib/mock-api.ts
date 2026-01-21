// Mock API routes for client-side development
// This simulates the backend API that would exist in production

import { createOrderAPI, getOrderAPI, createPaymentIntent, createOrderStream } from './api-client';

// Polyfill fetch for API routes
export function setupMockAPI() {
  const originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    // POST /api/orders - Create order
    if (url === '/api/orders' && init?.method === 'POST') {
      try {
        const body = JSON.parse(init.body as string);
        const result = await createOrderAPI(body);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // GET /api/orders/:id - Get order
    if (url.match(/^\/api\/orders\/[^/]+$/) && (!init?.method || init.method === 'GET')) {
      const orderId = url.split('/')[3];
      const order = await getOrderAPI(orderId);
      
      if (!order) {
        return new Response(JSON.stringify({ error: 'Order not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(order), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // POST /api/payments/intent - Create payment intent
    if (url === '/api/payments/intent' && init?.method === 'POST') {
      const body = JSON.parse(init.body as string);
      const result = await createPaymentIntent(body.amount);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // GET /api/orders/:id/stream - SSE stream (mock)
    if (url.match(/^\/api\/orders\/[^/]+\/stream$/)) {
      // For SSE, we can't fully mock via fetch
      // The EventSource in Status.tsx will handle this differently
      return new Response('', { status: 200 });
    }

    // Fall back to original fetch for other requests
    return originalFetch(input, init);
  };

  // Mock EventSource for SSE
  (window as any).EventSource = class MockEventSource {
    url: string;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    private interval: number | null = null;

    constructor(url: string) {
      this.url = url;
      const orderId = url.split('/')[3];
      
      // Poll for updates
      this.interval = window.setInterval(async () => {
        const order = await getOrderAPI(orderId);
        if (order && this.onmessage) {
          const event = new MessageEvent('message', {
            data: JSON.stringify(order),
          });
          this.onmessage(event);
        }
      }, 2000);
    }

    close() {
      if (this.interval !== null) {
        clearInterval(this.interval);
      }
    }
  };
}
