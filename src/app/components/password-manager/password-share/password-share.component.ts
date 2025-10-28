// src/app/password-manager/password-share/password-share.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { PrivateKeyUploadComponent, PrivateKeyData } from '../private-key-upload/private-key-upload.component';
import { PasswordItemResponse } from '../../../model/passwor-item.model';
import { PasswordManagerService, ShareableUser } from '../../../services/password-manager.service';
import { CertificateService } from '../../../services/certificate.service';
import { WebCryptoService } from '../../../services/web-crypto.service';
import { SharePasswordRequest } from '../../../model/password-share.model';


@Component({
  selector: 'app-password-share',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule, PrivateKeyUploadComponent],
  templateUrl: './password-share.component.html',
  styleUrls: ['./password-share.component.scss']
})
export class PasswordShareComponent implements OnInit {
  shareForm!: FormGroup;
  passwordItem: PasswordItemResponse | null = null;
  availableUsers: ShareableUser[] = [];
  privateKeyData: PrivateKeyData | null = null;
  
  loading: boolean = false;
  sharing: boolean = false;
  searchTerm: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private passwordService: PasswordManagerService,
    private certificateService: CertificateService,
    private webCrypto: WebCryptoService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    
    const itemId = this.route.snapshot.paramMap.get('id');
    if (itemId) {
      this.loadPasswordItem(Number(itemId));
      this.loadAvailableUsers();
    }
  }

  initializeForm(): void {
    this.shareForm = this.fb.group({
      sharedWithUserId: ['', Validators.required],
      sharedWithCertificateSerialNumber: ['', Validators.required]
    });
  }

  loadPasswordItem(itemId: number): void {
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

 loadAvailableUsers(): void {
  this.passwordService.getEEUsers().subscribe({  // ← Позива прави endpoint
    next: (users) => {
      this.availableUsers = users.filter(user => 
        this.passwordItem ? user.id !== this.passwordItem.ownerId : true
      );
    },
    error: (error) => {
      console.error('Failed to load users:', error);
      this.snackBar.open('Failed to load users', 'Close', { duration: 3000 });
    }
  });
}

 get filteredUsers(): ShareableUser[] {
  if (!this.searchTerm) {
    return this.availableUsers;
  }
  
  const search = this.searchTerm.toLowerCase();
  return this.availableUsers.filter(user => 
    user.email.toLowerCase().includes(search) ||
    (user.name && user.name.toLowerCase().includes(search)) ||
    (user.surname && user.surname.toLowerCase().includes(search)) ||
    (user.organization && user.organization.toLowerCase().includes(search))
  );
}

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
  }

  selectUser(userId: number, userEmail: string): void {
    this.shareForm.patchValue({ sharedWithUserId: userId });
    
    // Get user's END_ENTITY certificate (includes serial number)
    this.certificateService.getUserEndEntityCertificate(userId).subscribe({
      next: (certificate) => {
        this.shareForm.patchValue({ 
          sharedWithCertificateSerialNumber: certificate.serialNumber 
        });
      },
      error: (error) => {
        console.error('Failed to get user certificate:', error);
        this.snackBar.open('User does not have an END_ENTITY certificate', 'Close', { 
          duration: 3000 
        });
      }
    });
  }

  onPrivateKeyLoaded(keyData: PrivateKeyData): void {
    this.privateKeyData = keyData;
  }

  onPrivateKeyCleared(): void {
    this.privateKeyData = null;
  }

  async sharePassword(): Promise<void> {
    if (!this.shareForm.valid) {
      this.snackBar.open('Please select a user to share with', 'Close', { duration: 3000 });
      return;
    }

    if (!this.privateKeyData) {
      this.snackBar.open('Please upload your private key first', 'Close', { duration: 3000 });
      return;
    }

    if (!this.passwordItem) {
      this.snackBar.open('Password data not loaded', 'Close', { duration: 3000 });
      return;
    }

    this.sharing = true;

    try {
      // Step 1: Decrypt password with MY private key
      const plainPassword = await this.webCrypto.decryptPassword(
        this.passwordItem.ciphertextB64,
        this.privateKeyData.cryptoKey
      );

      // Step 2: Get recipient's public key
      const recipientUserId = this.shareForm.value.sharedWithUserId;
      
      this.certificateService.getUserPublicKey(recipientUserId).subscribe({
        next: async (publicKeyResponse) => {
          try {
            // Step 3: Encrypt password with recipient's public key
            const recipientCiphertext = await this.webCrypto.encryptPasswordWithPem(
              plainPassword,
              publicKeyResponse.publicKeyPem
            );

            // Step 4: Prepare share request
            const request: SharePasswordRequest = {
              passwordItemId: this.passwordItem!.id,
              sharedWithUserId: recipientUserId,
              sharedWithCertificateSerialNumber: this.shareForm.value.sharedWithCertificateSerialNumber,
              ciphertextForRecipientB64: recipientCiphertext
            };

            // Step 5: Send to backend
            this.passwordService.sharePassword(request).subscribe({
              next: (response) => {
                this.snackBar.open('Password shared successfully!', 'Close', { duration: 3000 });
                this.router.navigate(['/password-manager']);
              },
              error: (error) => {
                console.error('Failed to share password:', error);
                this.snackBar.open('Failed to share password', 'Close', { duration: 3000 });
                this.sharing = false;
              }
            });
          } catch (encryptError) {
            console.error('Encryption error:', encryptError);
            this.snackBar.open('Failed to encrypt password for recipient', 'Close', { duration: 3000 });
            this.sharing = false;
          }
        },
        error: (error) => {
          console.error('Failed to get recipient public key:', error);
          this.snackBar.open('Failed to get recipient public key', 'Close', { duration: 3000 });
          this.sharing = false;
        }
      });
    } catch (decryptError) {
      console.error('Decryption error:', decryptError);
      this.snackBar.open('Failed to decrypt password. Please check your private key.', 'Close', { 
        duration: 5000 
      });
      this.sharing = false;
    }
  }

  cancel(): void {
    this.router.navigate(['/password-manager', this.passwordItem?.id]);
  }
}