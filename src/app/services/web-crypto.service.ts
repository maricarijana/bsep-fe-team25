// src/app/services/web-crypto.service.ts

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebCryptoService {

  constructor() {}

  /**
   * Import PEM formatted RSA public key
   * @param pemPublicKey - PEM string (-----BEGIN PUBLIC KEY-----)
   * @returns CryptoKey for encryption
   */
  async importPublicKey(pemPublicKey: string): Promise<CryptoKey> {
    // Remove PEM headers and decode Base64
    const pemHeader = '-----BEGIN PUBLIC KEY-----';
    const pemFooter = '-----END PUBLIC KEY-----';
    const pemContents = pemPublicKey
      .replace(pemHeader, '')
      .replace(pemFooter, '')
      .replace(/\s/g, '');
    
    const binaryDer = this.base64ToArrayBuffer(pemContents);
    
    return await window.crypto.subtle.importKey(
      'spki',
      binaryDer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      true,
      ['encrypt']
    );
  }

  /**
   * Import PEM formatted RSA private key
   * @param pemPrivateKey - PEM string (-----BEGIN PRIVATE KEY-----)
   * @returns CryptoKey for decryption
   */
  async importPrivateKey(pemPrivateKey: string): Promise<CryptoKey> {
    // Remove PEM headers and decode Base64
    const pemHeader = '-----BEGIN PRIVATE KEY-----';
    const pemFooter = '-----END PRIVATE KEY-----';
    const pemContents = pemPrivateKey
      .replace(pemHeader, '')
      .replace(pemFooter, '')
      .replace(/\s/g, '');
    
    const binaryDer = this.base64ToArrayBuffer(pemContents);
    
    return await window.crypto.subtle.importKey(
      'pkcs8',
      binaryDer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      true,
      ['decrypt']
    );
  }

  /**
   * Encrypt plain text password with RSA-OAEP public key
   * @param plainPassword - Plain text password
   * @param publicKey - CryptoKey (public key)
   * @returns Base64 encoded ciphertext
   */
  async encryptPassword(plainPassword: string, publicKey: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainPassword);
    
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP'
      },
      publicKey,
      data
    );
    
    return this.arrayBufferToBase64(encrypted);
  }

  /**
   * Decrypt Base64 ciphertext with RSA-OAEP private key
   * @param ciphertextB64 - Base64 encoded encrypted password
   * @param privateKey - CryptoKey (private key)
   * @returns Plain text password
   */
  async decryptPassword(ciphertextB64: string, privateKey: CryptoKey): Promise<string> {
    const encryptedData = this.base64ToArrayBuffer(ciphertextB64);
    
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP'
      },
      privateKey,
      encryptedData
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Encrypt password using PEM public key (convenience method)
   * @param plainPassword - Plain text password
   * @param pemPublicKey - PEM formatted public key
   * @returns Base64 encoded ciphertext
   */
  async encryptPasswordWithPem(plainPassword: string, pemPublicKey: string): Promise<string> {
    const publicKey = await this.importPublicKey(pemPublicKey);
    return await this.encryptPassword(plainPassword, publicKey);
  }

  /**
   * Decrypt password using PEM private key (convenience method)
   * @param ciphertextB64 - Base64 encoded ciphertext
   * @param pemPrivateKey - PEM formatted private key
   * @returns Plain text password
   */
  async decryptPasswordWithPem(ciphertextB64: string, pemPrivateKey: string): Promise<string> {
    const privateKey = await this.importPrivateKey(pemPrivateKey);
    return await this.decryptPassword(ciphertextB64, privateKey);
  }

  /**
   * Read .pem file and return content as string
   * @param file - File object from input[type="file"]
   * @returns PEM content as string
   */
  async readPemFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        resolve(e.target.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });
  }

  /**
   * Validate if string is valid PEM format
   */
  isValidPemFormat(pemString: string): boolean {
    const publicKeyPattern = /-----BEGIN PUBLIC KEY-----[\s\S]+-----END PUBLIC KEY-----/;
    const privateKeyPattern = /-----BEGIN PRIVATE KEY-----[\s\S]+-----END PRIVATE KEY-----/;
    const rsaPrivateKeyPattern = /-----BEGIN RSA PRIVATE KEY-----[\s\S]+-----END RSA PRIVATE KEY-----/;
    
    return publicKeyPattern.test(pemString) || 
           privateKeyPattern.test(pemString) ||
           rsaPrivateKeyPattern.test(pemString);
  }

  // ===== HELPER METHODS =====

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}