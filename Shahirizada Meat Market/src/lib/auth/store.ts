// Mock in-memory authentication store
// In production, this would be replaced with real database and auth service

import { User, AuthFlow, Session } from './types';

const STORAGE_KEY_USERS = 'tabsy_auth_users';
const STORAGE_KEY_FLOWS = 'tabsy_auth_flows';
const STORAGE_KEY_SESSIONS = 'tabsy_auth_sessions';

class AuthStore {
  private users: Map<string, User> = new Map();
  private flows: Map<string, AuthFlow> = new Map();
  private sessions: Map<string, Session> = new Map();
  private initialized = false;

  constructor() {
    this.loadFromLocalStorage();
    this.initializeDemoUser();
  }

  private initializeDemoUser() {
    // Add a demo user for testing account lookup
    if (this.users.size === 0) {
      const demoUser: User = {
        id: 'user_demo_sarah',
        name: 'Sarah',
        email: 'sarah@example.com',
        phone: '(555) 987-6543',
        createdAt: new Date().toISOString(),
      };
      this.users.set(demoUser.id, demoUser);
      this.saveToLocalStorage();
    }
  }

  private loadFromLocalStorage() {
    if (this.initialized || typeof window === 'undefined') return;

    try {
      const usersData = localStorage.getItem(STORAGE_KEY_USERS);
      const flowsData = localStorage.getItem(STORAGE_KEY_FLOWS);
      const sessionsData = localStorage.getItem(STORAGE_KEY_SESSIONS);

      if (usersData) {
        const users = JSON.parse(usersData);
        this.users = new Map(Object.entries(users));
      }

      if (flowsData) {
        const flows = JSON.parse(flowsData);
        this.flows = new Map(Object.entries(flows));
      }

      if (sessionsData) {
        const sessions = JSON.parse(sessionsData);
        this.sessions = new Map(Object.entries(sessions));
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error loading auth data from localStorage:', error);
    }
  }

  private saveToLocalStorage() {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        STORAGE_KEY_USERS,
        JSON.stringify(Object.fromEntries(this.users))
      );
      localStorage.setItem(
        STORAGE_KEY_FLOWS,
        JSON.stringify(Object.fromEntries(this.flows))
      );
      localStorage.setItem(
        STORAGE_KEY_SESSIONS,
        JSON.stringify(Object.fromEntries(this.sessions))
      );
    } catch (error) {
      console.error('Error saving auth data to localStorage:', error);
    }
  }

  // User operations
  findUserByEmailOrPhone(email?: string, phone?: string): User | undefined {
    for (const user of this.users.values()) {
      if (email && user.email === email) return user;
      if (phone && user.phone === phone) return user;
    }
    return undefined;
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  createUser(data: Omit<User, 'id' | 'createdAt'>): User {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user: User = {
      id,
      createdAt: new Date().toISOString(),
      ...data,
    };

    this.users.set(id, user);
    this.saveToLocalStorage();
    return user;
  }

  updateUser(userId: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const updated = { ...user, ...updates };
    this.users.set(userId, updated);
    this.saveToLocalStorage();
    return updated;
  }

  // Auth flow operations
  createFlow(method: 'email' | 'sms', identifier: string): AuthFlow {
    const id = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Expire in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const flow: AuthFlow = {
      id,
      method,
      identifier,
      code,
      expiresAt,
      verified: false,
    };

    this.flows.set(id, flow);
    this.saveToLocalStorage();

    // For demo purposes, log the code to console
    console.log(`[AUTH DEMO] Verification code for ${identifier}: ${code}`);

    return flow;
  }

  getFlow(flowId: string): AuthFlow | undefined {
    return this.flows.get(flowId);
  }

  verifyFlow(flowId: string, code: string): boolean {
    const flow = this.flows.get(flowId);
    if (!flow) return false;

    // Check expiration
    if (new Date(flow.expiresAt) < new Date()) {
      return false;
    }

    // Check code
    if (flow.code !== code) {
      return false;
    }

    flow.verified = true;
    this.flows.set(flowId, flow);
    this.saveToLocalStorage();
    return true;
  }

  // Session operations
  createSession(userId: string): Session {
    // Generate simple token (in production, use JWT)
    const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    
    // Expire in 30 days
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const session: Session = {
      userId,
      token,
      expiresAt,
    };

    this.sessions.set(token, session);
    this.saveToLocalStorage();
    return session;
  }

  getSession(token: string): Session | undefined {
    const session = this.sessions.get(token);
    if (!session) return undefined;

    // Check expiration
    if (new Date(session.expiresAt) < new Date()) {
      this.sessions.delete(token);
      this.saveToLocalStorage();
      return undefined;
    }

    return session;
  }

  deleteSession(token: string): void {
    this.sessions.delete(token);
    this.saveToLocalStorage();
  }

  getUserByToken(token: string): User | undefined {
    const session = this.getSession(token);
    if (!session) return undefined;

    return this.getUser(session.userId);
  }
}

// Singleton instance
export const authStore = new AuthStore();
