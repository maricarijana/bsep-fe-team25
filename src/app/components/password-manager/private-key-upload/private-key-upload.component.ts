// src/app/password-manager/private-key-upload/private-key-upload.component.ts

import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebCryptoService } from '../../../services/web-crypto.service';


export interface PrivateKeyData {
  keyPem: string;
  fileName: string;
  cryptoKey: CryptoKey;
  loadedAt: Date;
}

@Component({
  selector: 'app-private-key-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './private-key-upload.component.html',
  styleUrls: ['./private-key-upload.component.scss']
})
export class PrivateKeyUploadComponent {
  @Output() keyLoaded = new EventEmitter<PrivateKeyData>();
  @Output() keyCleared = new EventEmitter<void>();

  privateKeyFile: File | null = null;
  privateKeyFileName: string = '';
  privateKeyError: string = '';
  isKeyLoaded: boolean = false;
  isLoading: boolean = false;

  constructor(private webCrypto: WebCryptoService) {}

  async onPrivateKeyFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // Validacija ekstenzije
    if (!file.name.endsWith('.pem') && !file.name.endsWith('.key')) {
      this.privateKeyError = 'Please select a valid private key file (.pem or .key)';
      this.clearPrivateKey();
      return;
    }

    // Validacija veličine (max 100KB)
    if (file.size > 100 * 1024) {
      this.privateKeyError = 'Private key file is too large (max 100KB)';
      this.clearPrivateKey();
      return;
    }

    this.isLoading = true;
    this.privateKeyError = '';

    try {
      // Učitaj PEM sadržaj
      const pemContent = await this.webCrypto.readPemFile(file);

      // Validacija PEM formata
      if (!this.webCrypto.isValidPemFormat(pemContent)) {
        throw new Error('Invalid PEM format. Please ensure the file contains a valid private key.');
      }

      // Import private key u CryptoKey objekat
      const cryptoKey = await this.webCrypto.importPrivateKey(pemContent);

      // Sve OK - spremi podatke
      this.privateKeyFile = file;
      this.privateKeyFileName = file.name;
      this.isKeyLoaded = true;

      const keyData: PrivateKeyData = {
        keyPem: pemContent,
        fileName: file.name,
        cryptoKey: cryptoKey,
        loadedAt: new Date()
      };

      // Emituj event ka parent komponenti
      this.keyLoaded.emit(keyData);

    } catch (error: any) {
      console.error('Failed to load private key:', error);
      this.privateKeyError = error.message || 'Failed to load private key. Please check the file format.';
      this.clearPrivateKey();
    } finally {
      this.isLoading = false;
    }
  }

  clearPrivateKey(): void {
    this.privateKeyFile = null;
    this.privateKeyFileName = '';
    this.isKeyLoaded = false;
    this.privateKeyError = '';
    
    // Reset file input
    const fileInput = document.getElementById('private-key-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }

    this.keyCleared.emit();
  }
}
