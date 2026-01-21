// Authentication type definitions

export interface User {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  createdAt: string;
}

export interface AuthFlow {
  id: string;
  method: 'email' | 'sms';
  identifier: string; // email or phone
  code: string;
  expiresAt: string;
  verified: boolean;
}

export interface Session {
  userId: string;
  token: string;
  expiresAt: string;
}

export interface AuthStartRequest {
  email?: string;
  phone?: string;
}

export interface AuthStartResponse {
  method: 'email' | 'sms';
  codeSent: boolean;
  flowId: string;
}

export interface AuthVerifyRequest {
  flowId: string;
  code: string;
}

export interface AuthVerifyResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface MeResponse {
  user: User;
  loyaltyBalance: number;
}
