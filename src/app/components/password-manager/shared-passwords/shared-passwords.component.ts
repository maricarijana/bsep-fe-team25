// src/app/password-manager/shared-passwords/shared-passwords.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { PrivateKeyUploadComponent, PrivateKeyData } from '../private-key-upload/private-key-upload.component';
import { SharePasswordResponse } from '../../../model/password-share.model';
import { PasswordManagerService } from '../../../services/password-manager.service';
import { WebCryptoService } from '../../../services/web-crypto.service';

@Component({
  selector: 'app-shared-passwords',
  standalone: true,
  imports: [CommonModule, RouterModule, MatSnackBarModule, PrivateKeyUploadComponent],
  templateUrl: './shared-passwords.component.html',
  styleUrls: ['./shared-passwords.component.scss']
})
export class SharedPasswordsComponent implements OnInit {
  sharedPasswords: SharePasswordResponse[] = [];
  selectedShare: SharePasswordResponse | null = null;
  privateKeyData: PrivateKeyData | null = null;
  decryptedPassword: string = '';
  
  loading: boolean = false;
  decrypting: boolean = false;
  isDecrypted: boolean = false;
  showPassword: boolean = false;

  constructor(
    private passwordService: PasswordManagerService,
    private webCrypto: WebCryptoService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadSharedPasswords();
  }

  loadSharedPasswords(): void {
    this.loading = true;
    this.passwordService.getReceivedShares().subscribe({
      next: (shares) => {
        this.sharedPasswords = shares;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load shared passwords:', error);
        this.snackBar.open('Failed to load shared passwords', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  viewSharedPassword(share: SharePasswordResponse): void {
    this.selectedShare = share;
    this.resetDecryptionState();
  }

  closeDetail(): void {
    this.selectedShare = null;
    this.resetDecryptionState();
  }

  resetDecryptionState(): void {
    this.privateKeyData = null;
    this.decryptedPassword = '';
    this.isDecrypted = false;
    this.showPassword = false;
  }

  onPrivateKeyLoaded(keyData: PrivateKeyData): void {
    this.privateKeyData = keyData;
  }

  onPrivateKeyCleared(): void {
    this.privateKeyData = null;
    this.decryptedPassword = '';
    this.isDecrypted = false;
    this.showPassword = false;
  }

  async decryptPassword(): Promise<void> {
    if (!this.privateKeyData) {
      this.snackBar.open('Please upload your private key first', 'Close', { duration: 3000 });
      return;
    }

    if (!this.selectedShare) {
      this.snackBar.open('No password selected', 'Close', { duration: 3000 });
      return;
    }

    this.decrypting = true;

    try {
      const plainPassword = await this.webCrypto.decryptPassword(
        this.selectedShare.ciphertextB64,
        this.privateKeyData.cryptoKey
      );

      this.decryptedPassword = plainPassword;
      this.isDecrypted = true;
      this.showPassword = true;
      this.snackBar.open('Password decrypted successfully!', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Decryption error:', error);
      this.snackBar.open('Failed to decrypt password. Please check your private key.', 'Close', { 
        duration: 5000 
      });
    } finally {
      this.decrypting = false;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  copyToClipboard(): void {
    if (!this.decryptedPassword) {
      return;
    }

    navigator.clipboard.writeText(this.decryptedPassword).then(() => {
      this.snackBar.open('Password copied to clipboard!', 'Close', { duration: 2000 });
    }).catch(err => {
      console.error('Failed to copy:', err);
      this.snackBar.open('Failed to copy password', 'Close', { duration: 3000 });
    });
  }

  removeAccess(share: SharePasswordResponse): void {
    if (!confirm(`Remove access to ${share.siteLabel}?`)) {
      return;
    }

    this.passwordService.deleteShare(share.id).subscribe({
      next: () => {
        this.snackBar.open('Access removed successfully', 'Close', { duration: 3000 });
        this.loadSharedPasswords();
        if (this.selectedShare?.id === share.id) {
          this.closeDetail();
        }
      },
      error: (error) => {
        console.error('Failed to remove access:', error);
        this.snackBar.open('Failed to remove access', 'Close', { duration: 3000 });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/password-manager']);
  }
}
