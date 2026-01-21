// Client-side authentication helpers

import { authStore } from './store';
import { AuthStartRequest, AuthStartResponse, AuthVerifyRequest, AuthVerifyResponse, User, MeResponse } from './types';
import { getOrCreateProfile } from '../loyalty/client';
import { loyaltyStore } from '../loyalty/store';

const TOKEN_STORAGE_KEY = 'tabsy_auth_token';

/**
 * Get current auth token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

/**
 * Set auth token in localStorage
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

/**
 * Clear auth token from localStorage
 */
export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * Start authentication flow
 */
export async function startAuth(data: AuthStartRequest): Promise<AuthStartResponse> {
  // Validate input
  if (!data.email && !data.phone) {
    throw new Error('Email or phone is required');
  }

  // Determine method
  const method = data.email ? 'email' : 'sms';
  const identifier = (data.email || data.phone)!;

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Create auth flow
  const flow = authStore.createFlow(method, identifier);

  return {
    method,
    codeSent: true,
    flowId: flow.id,
  };
}

/**
 * Verify authentication code
 */
export async function verifyAuth(data: AuthVerifyRequest): Promise<AuthVerifyResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Get flow
  const flow = authStore.getFlow(data.flowId);
  if (!flow) {
    throw new Error('Invalid verification flow');
  }

  // Verify code
  const isValid = authStore.verifyFlow(data.flowId, data.code);
  if (!isValid) {
    throw new Error('Invalid or expired code');
  }

  // Find or create user
  const isEmail = flow.method === 'email';
  let user = authStore.findUserByEmailOrPhone(
    isEmail ? flow.identifier : undefined,
    isEmail ? undefined : flow.identifier
  );

  if (!user) {
    user = authStore.createUser({
      email: isEmail ? flow.identifier : undefined,
      phone: isEmail ? undefined : flow.identifier,
    });

    // Also create loyalty profile
    getOrCreateProfile(user.email, user.phone);
  }

  // Create session
  const session = authStore.createSession(user.id);

  // Store token
  setAuthToken(session.token);

  return {
    success: true,
    token: session.token,
    user,
  };
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<MeResponse | null> {
  const token = getAuthToken();
  if (!token) return null;

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  // Get user from token
  const user = authStore.getUserByToken(token);
  if (!user) {
    clearAuthToken();
    return null;
  }

  // Get loyalty balance
  const loyaltyProfile = loyaltyStore.findProfileByEmailOrPhone(user.email, user.phone);
  const loyaltyBalance = loyaltyProfile?.stars || 0;

  return {
    user,
    loyaltyBalance,
  };
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  const token = getAuthToken();
  if (token) {
    authStore.deleteSession(token);
  }
  clearAuthToken();
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) return false;

  const session = authStore.getSession(token);
  return !!session;
}

/**
 * Resend verification code
 */
export async function resendCode(flowId: string): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const flow = authStore.getFlow(flowId);
  if (!flow) {
    throw new Error('Invalid flow');
  }

  // Create new code
  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  flow.code = newCode;
  flow.expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  console.log(`[AUTH DEMO] New verification code for ${flow.identifier}: ${newCode}`);
}
