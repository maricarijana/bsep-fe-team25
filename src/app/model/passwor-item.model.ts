// src/app/model/password-item.model.ts

export interface CreatePasswordItemRequest {
  website: string;          // max 255 chars
  username: string;         // max 255 chars
  ciphertextB64: string;    // Base64 encrypted password (max 4096 chars)
  certificateSerialNumber: string;  // Owner's certificate serial number
}

export interface PasswordItemResponse {
  id: number;
  website: string;
  username: string;
  ciphertextB64: string;    // Base64 RSA-OAEP encrypted password
  
  // Encryption certificate metadata
  encryptionCertificateId: number;
  encryptionCertificateSerialNumber: string;
  encryptionCertificateCommonName: string;
  
  // Owner metadata
  ownerId: number;
  ownerEmail: string;
  
  createdAt: string;  // ISO 8601 datetime string
}