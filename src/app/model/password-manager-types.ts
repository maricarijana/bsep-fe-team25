// src/app/model/password-manager-types.ts

// Helper type za dekriptovanu lozinku (samo na frontendu)
export interface DecryptedPassword {
  passwordItemId: number;
  website: string;
  username: string;
  plainPassword: string;  // Dekriptovana lozinka (NIKAD ne šalje backendu)
  decryptedAt: Date;
}

// Helper type za private key upload
export interface PrivateKeyData {
  keyPem: string;         // PEM formatted private key
  fileName: string;
  loadedAt: Date;
}

// Lista korisnika za share dropdown
export interface ShareableUser {
  id: number;
  email: string;
  fullName?: string;
  organization?: string;
}
