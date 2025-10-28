// src/app/password-manager/password-detail/password-detail.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { PrivateKeyUploadComponent, PrivateKeyData } from '../private-key-upload/private-key-upload.component';
import { PasswordItemResponse } from '../../../model/passwor-item.model';
import { PasswordManagerService } from '../../../services/password-manager.service';
import { WebCryptoService } from '../../../services/web-crypto.service';

@Component({
  selector: 'app-password-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatSnackBarModule, PrivateKeyUploadComponent],
  templateUrl: './password-detail.component.html',
  styleUrls: ['./password-detail.component.scss']
})
export class PasswordDetailComponent implements OnInit {
  passwordItem: PasswordItemResponse | null = null;
  privateKeyData: PrivateKeyData | null = null;
  decryptedPassword: string = '';
  
  loading: boolean = false;
  decrypting: boolean = false;
  isDecrypted: boolean = false;
  showPassword: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private passwordService: PasswordManagerService,
    private webCrypto: WebCryptoService,
    private snackBar: MatSnackBar
  ) {}

 ngOnInit(): void {
  const itemId = Number(this.route.snapshot.paramMap.get('id'));
  
  // ✅ DODAJ - Proveri da li je shared
  this.route.url.subscribe(segments => {
    const isShared = segments.some(s => s.path === 'shared');
    
    if (isShared) {
      this.loadSharedPasswordDetail(itemId);  // ✅ Za deljene
    } else {
      this.loadPasswordDetail(itemId);        // ✅ Za svoje
    }
  });
}
  

  loadPasswordDetail(itemId: number): void {
    this.loading = true;
    this.passwordService.getPasswordItemDetail(itemId).subscribe({
      next: (item) => {
        this.passwordItem = item;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load password:', error);
        this.snackBar.open('Failed to load password', 'Close', { duration: 3000 });
        this.loading = false;
        this.router.navigate(['/password-manager']);
      }
    });
  }
  loadSharedPasswordDetail(shareId: number): void {
  this.loading = true;
  this.passwordService.getReceivedShareDetail(shareId).subscribe({
    next: (share) => {
      // ✅ Mapiranje SharePasswordResponse → PasswordItemResponse
      this.passwordItem = {
        id: share.id,
        website: share.siteLabel,           // ✅ Backend šalje siteLabel
        username: share.loginHandle,        // ✅ Backend šalje loginHandle
        ciphertextB64: share.ciphertextB64, // ✅ Recipient verzija
        createdAt: share.createdAt,
        ownerEmail: share.sharedByEmail,    // ✅ Ko je podelio
        ownerId: share.sharedByUserId,
        encryptionCertificateId: share.recipientCertificateId,
        encryptionCertificateSerialNumber: share.recipientCertificateSerialNumber,
        encryptionCertificateCommonName: share.sharedWithEmail
      };
      this.loading = false;
    },
    error: (error) => {
      console.error('Failed to load shared password:', error);
      this.snackBar.open('Failed to load shared password', 'Close', { duration: 3000 });
      this.loading = false;
      this.router.navigate(['/password-manager/shared']);
    }
  });
}

  onPrivateKeyLoaded(keyData: PrivateKeyData): void {
    this.privateKeyData = keyData;
    console.log('Private key loaded:', keyData.fileName);
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

    if (!this.passwordItem) {
      this.snackBar.open('Password data not loaded', 'Close', { duration: 3000 });
      return;
    }

    this.decrypting = true;

    try {
      // Decrypt password using private key
      const plainPassword = await this.webCrypto.decryptPassword(
        this.passwordItem.ciphertextB64,
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

  sharePassword(): void {
    if (!this.passwordItem) return;
    this.router.navigate(['/password-manager', this.passwordItem.id, 'share']);
  }

  deletePassword(): void {
    if (!this.passwordItem) return;

    if (!confirm(`Are you sure you want to delete password for ${this.passwordItem.website}?`)) {
      return;
    }

    this.passwordService.deletePasswordItem(this.passwordItem.id).subscribe({
      next: () => {
        this.snackBar.open('Password deleted successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/password-manager']);
      },
      error: (error) => {
        console.error('Failed to delete password:', error);
        this.snackBar.open('Failed to delete password', 'Close', { duration: 3000 });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/password-manager']);
  }
}
