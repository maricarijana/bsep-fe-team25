// src/app/model/password-share.model.ts

export interface SharePasswordRequest {
  passwordItemId: number;                     // ID of original PasswordItem
  sharedWithUserId: number;                   // Recipient user ID
  sharedWithCertificateSerialNumber: string;  // Recipient's certificate serial
  ciphertextForRecipientB64: string;          // Base64 encrypted for recipient (max 4096 chars)
}

export interface SharePasswordResponse {
  id: number;
  
  // Original item reference
  sourceItemId: number;
  
  // Duplicated metadata for easy display
  siteLabel: string;      // website
  loginHandle: string;    // username
  
  // Encrypted password for recipient
  ciphertextB64: string;  // Base64 RSA-OAEP encrypted with recipient's public key
  
  // Sharing parties
  sharedByUserId: number;
  sharedByEmail: string;
  
  sharedWithUserId: number;
  sharedWithEmail: string;
  
  // Recipient certificate metadata
  recipientCertificateId: number;
  recipientCertificateSerialNumber: string;
  
  createdAt: string;  // ISO 8601 datetime string
}