import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CertificateService } from '../../../services/certificate.service';
import { Certificate } from '../../../model/certificate.model';
import { CrlService } from '../../../services/crl.service';
@Component({
  selector: 'app-certificate-details',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  templateUrl: './certificate-details.component.html',
  styleUrls: ['./certificate-details.component.scss'],
})
export class CertificateDetailsComponent implements OnInit {
  certificate: Certificate | null = null;
  loading: boolean = true;
  serialNumber: string = '';
  showRevokeDialog: boolean = false;
  revocationReason: string = 'unspecified';
  isRevoked = signal<boolean | null>(null);
  checkingRevocation = signal<boolean>(false);
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private certificateService: CertificateService,
    private crlService: CrlService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.serialNumber = this.route.snapshot.paramMap.get('serialNumber') || '';
    if (this.serialNumber) {
      this.loadCertificate();
    }
  }

  loadCertificate(): void {
    this.loading = true;
    this.certificateService.getMyCertificates().subscribe({
      next: (certificates) => {
        this.certificate =
          certificates.find((c) => c.serialNumber === this.serialNumber) ||
          null;
        if (!this.certificate) {
          this.snackBar.open('Certificate not found', 'Close', {
            duration: 3000,
          });
          this.router.navigate(['/certificates']);
        } else {
          // Automatski provjeri CRL status kada se učita sertifikat
          this.checkRevocationStatus(this.certificate.serialNumber);
        }
        this.loading = false;
      },
      error: (err) => {
        this.snackBar.open('Failed to load certificate', 'Close', {
          duration: 3000,
        });
        this.loading = false;
      },
    });
  }

  getStatusInfo(): { label: string; class: string } {
    if (!this.certificate) return { label: '', class: '' };

    if (this.certificate.isRevoked) {
      return { label: 'Revoked', class: 'status-revoked' };
    }

    const now = new Date();
    const validUntil = new Date(this.certificate.validUntil);
    const daysUntilExpiry = Math.floor(
      (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (validUntil < now) {
      return { label: 'Expired', class: 'status-expired' };
    } else if (daysUntilExpiry <= 30) {
      return { label: 'Expiring Soon', class: 'status-expiring' };
    } else {
      return { label: 'Active', class: 'status-active' };
    }
  }

  getTypeClass(): string {
    if (!this.certificate) return '';

    switch (this.certificate.certificateType) {
      case 'ROOT_CA':
        return 'type-root';
      case 'INTERMEDIATE_CA':
        return 'type-intermediate';
      case 'END_ENTITY':
        return 'type-end-entity';
      default:
        return '';
    }
  }

  downloadPEM(): void {
    if (!this.certificate) return;

    const blob = new Blob([this.certificate.pemCertificate], {
      type: 'application/x-pem-file',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.certificate.commonName}_${this.certificate.serialNumber}.pem`;
    link.click();
    window.URL.revokeObjectURL(url);
    this.snackBar.open('Certificate downloaded', 'Close', { duration: 2000 });
  }

  copyPEM(): void {
    if (!this.certificate) return;

    navigator.clipboard.writeText(this.certificate.pemCertificate).then(() => {
      this.snackBar.open('PEM copied to clipboard', 'Close', {
        duration: 2000,
      });
    });
  }

  toggleRevokeDialog(): void {
    this.showRevokeDialog = !this.showRevokeDialog;
    if (this.showRevokeDialog) {
      this.revocationReason = 'unspecified';
    }
  }

  confirmRevoke(): void {
    if (!this.certificate) return;

    this.certificateService
      .revokeCertificate({
        serialNumber: this.certificate.serialNumber,
        reason: this.revocationReason,
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Certificate revoked successfully', 'Close', {
            duration: 3000,
          });
          this.showRevokeDialog = false;
          this.loadCertificate();
        },
        error: (err) => {
          const message = err.error?.message || 'Failed to revoke certificate';
          this.snackBar.open(message, 'Close', { duration: 5000 });
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/certificates']);
  }

  /**
   * Provjerava CRL status sertifikata
   */
  checkRevocationStatus(serialNumber: string): void {
    this.checkingRevocation.set(true);
    this.crlService.checkCertificateRevocation(serialNumber).subscribe({
      next: (revoked) => {
        this.isRevoked.set(revoked);
        this.checkingRevocation.set(false);

        // Prikaži notifikaciju ako je status različit od baze
        if (revoked && !this.certificate?.isRevoked) {
          this.snackBar.open(
            '⚠️ Warning: Certificate appears in CRL but not marked as revoked in database',
            'Close',
            { duration: 5000 }
          );
        }
      },
      error: (err) => {
        console.error('Error checking CRL:', err);
        this.checkingRevocation.set(false);
        this.snackBar.open('Failed to check CRL status', 'Close', {
          duration: 3000,
        });
      },
    });
  }
}
