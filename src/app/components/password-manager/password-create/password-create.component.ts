// src/app/password-manager/password-create/password-create.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Certificate } from '../../../model/certificate.model';
import { CertificateService } from '../../../services/certificate.service';
import { PasswordManagerService } from '../../../services/password-manager.service';
import { WebCryptoService } from '../../../services/web-crypto.service';
import { CreatePasswordItemRequest } from '../../../model/passwor-item.model';


@Component({
  selector: 'app-password-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './password-create.component.html',
  styleUrls: ['./password-create.component.scss']
})
export class PasswordCreateComponent implements OnInit {
  passwordForm!: FormGroup;
  myCertificates: Certificate[] = [];
  loading: boolean = false;
  creating: boolean = false;
  showPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private passwordService: PasswordManagerService,
    private certificateService: CertificateService,
    private webCrypto: WebCryptoService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadMyCertificates();
  }

  initializeForm(): void {
    this.passwordForm = this.fb.group({
      website: ['', [Validators.required, Validators.maxLength(255)]],
      username: ['', [Validators.required, Validators.maxLength(255)]],
      password: ['', [Validators.required, Validators.minLength(1)]],
      certificateSerialNumber: ['', Validators.required]
    });
  }

  loadMyCertificates(): void {
    this.loading = true;
    this.certificateService.getMyCertificates().subscribe({
      next: (certs) => {
        // Filter only END_ENTITY certificates that are NOT revoked
        this.myCertificates = certs.filter(cert => 
          cert.certificateType === 'END_ENTITY' && 
          !cert.isRevoked
        );
        this.loading = false;

        if (this.myCertificates.length === 0) {
          this.snackBar.open('You need an active END_ENTITY certificate to use Password Manager', 'Close', { 
            duration: 5000 
          });
        }
      },
      error: (error) => {
        console.error('Failed to load certificates:', error);
        this.snackBar.open('Failed to load certificates', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  selectCertificate(serialNumber: string): void {
    this.passwordForm.patchValue({ certificateSerialNumber: serialNumber });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  async createPassword(): Promise<void> {
    if (!this.passwordForm.valid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    const formData = this.passwordForm.value;
    const selectedCert = this.myCertificates.find(
      cert => cert.serialNumber === formData.certificateSerialNumber
    );

    if (!selectedCert) {
      this.snackBar.open('Please select a certificate', 'Close', { duration: 3000 });
      return;
    }

    this.creating = true;

    try {
      // Step 1: Get user's public key from the certificate owner (which is current user)
      // Since we're loading MY certificates (getMyCertificates), the owner is the current user
      const userId = selectedCert.ownerId;
      
      this.certificateService.getUserPublicKey(userId).subscribe({
        next: async (publicKeyResponse) => {
          try {
            // Step 2: Encrypt password with public key
            const ciphertextB64 = await this.webCrypto.encryptPasswordWithPem(
              formData.password,
              publicKeyResponse.publicKeyPem
            );

            // Step 3: Prepare request
            const request: CreatePasswordItemRequest = {
              website: formData.website,
              username: formData.username,
              ciphertextB64: ciphertextB64,
              certificateSerialNumber: formData.certificateSerialNumber
            };

            // Step 4: Send to backend
            this.passwordService.createPasswordItem(request).subscribe({
              next: (response) => {
                this.snackBar.open('Password saved successfully!', 'Close', { duration: 3000 });
                this.router.navigate(['/password-manager']);
              },
              error: (error) => {
                console.error('Failed to save password:', error);
                this.snackBar.open('Failed to save password', 'Close', { duration: 3000 });
                this.creating = false;
              }
            });
          } catch (encryptError) {
            console.error('Encryption error:', encryptError);
            this.snackBar.open('Failed to encrypt password', 'Close', { duration: 3000 });
            this.creating = false;
          }
        },
        error: (error) => {
          console.error('Failed to get public key:', error);
          this.snackBar.open('Failed to get public key', 'Close', { duration: 3000 });
          this.creating = false;
        }
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      this.snackBar.open('An unexpected error occurred', 'Close', { duration: 3000 });
      this.creating = false;
    }
  }

  cancel(): void {
    this.router.navigate(['/password-manager']);
  }
}