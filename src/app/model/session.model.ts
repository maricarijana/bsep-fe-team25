export interface Session {
  jti: string;
  deviceDescription: string;
  ipAddress: string;
  createdAt: string;
  lastUsed: string;
  currentSession: boolean;
}
