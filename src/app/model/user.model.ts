export interface User {
  id?: number;
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  surname: string;
  organization: string;
  active?: boolean;
  role?: string;
}
export interface UserPublicKeyResponse {
  userId: string;       // Backend šalje kao string (Long.toString())
  publicKeyPem: string; // PEM formatted public key
}
export interface ShareableUser {
  id: number;
  email: string;
  name?: string;        // ← Ime
  surname?: string;     // ← Prezime
  organization?: string;
}