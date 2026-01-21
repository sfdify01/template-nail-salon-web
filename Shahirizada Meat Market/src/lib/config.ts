// Client-side configuration
// In production, these would be loaded from environment variables or a secure config service

export const config = {
  // Stripe
  stripe: {
    publishableKey: 'pk_test_demo', // Replace with your Stripe publishable key
  },

  // Toast POS
  toast: {
    apiUrl: 'https://api.toasttab.com/orders/v2',
    apiKey: '', // Add your Toast API key
    restaurantId: '', // Add your Toast restaurant ID
  },

  // Square POS
  square: {
    apiUrl: 'https://connect.squareup.com/v2',
    accessToken: '', // Add your Square access token
  },

  // Clover POS
  clover: {
    apiUrl: 'https://api.clover.com/v3',
    accessToken: '', // Add your Clover access token
    merchantId: '', // Add your Clover merchant ID
  },

  // DoorDash Drive
  doordash: {
    apiUrl: 'https://openapi.doordash.com/drive/v2',
    developerId: '', // Add your DoorDash developer ID
    keyId: '', // Add your DoorDash key ID
    signingSecret: '', // Add your DoorDash signing secret
  },

  // Uber Direct
  uber: {
    apiUrl: 'https://api.uber.com/v1/customers',
    customerId: '', // Add your Uber customer ID
    clientId: '', // Add your Uber client ID
    clientSecret: '', // Add your Uber client secret
  },
};

// Helper to check if a service is configured
export function isConfigured(service: keyof typeof config): boolean {
  const serviceConfig = config[service];
  if (!serviceConfig) return false;
  
  // Check if all non-URL values are filled
  return Object.entries(serviceConfig).some(([key, value]) => {
    return !key.toLowerCase().includes('url') && value && value !== '';
  });
}

// In production, you might load this from an API:
// export async function loadConfig() {
//   const response = await fetch('/api/config');
//   return await response.json();
// }
