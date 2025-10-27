import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CrlService,
  CRLInfo,
  RevokedCertificate,
} from '../../services/crl.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-crl-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crl-viewer.component.html',
  styleUrls: ['./crl-viewer.component.scss'],
})
export class CrlViewerComponent implements OnInit {
  private crlService = inject(CrlService);

  // Signals za reactive state
  crlInfo = signal<CRLInfo | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  selectedIssuer = signal<string>('');
  searchTerm = signal<string>('');

  ngOnInit(): void {
    this.loadCRLInfo();
  }

  loadCRLInfo(): void {
    this.loading.set(true);
    this.error.set(null);

    const issuer = this.selectedIssuer() || undefined;

    this.crlService.getCRLInfo(issuer).subscribe({
      next: (data) => {
        this.crlInfo.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load CRL info');
        this.loading.set(false);
      },
    });
  }

  downloadCRL(): void {
    const issuer = this.selectedIssuer() || undefined;

    this.crlService.downloadCRL(issuer).subscribe({
      next: (blob) => {
        // Kreiraj download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ca.crl';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        alert('CRL downloaded successfully!');
      },
      error: (err) => {
        alert('Failed to download CRL: ' + (err.error?.message || err.message));
      },
    });
  }

  checkCertificate(serialNumber: string): void {
    this.crlService.checkCertificateRevocation(serialNumber).subscribe({
      next: (isRevoked) => {
        if (isRevoked) {
          alert(`Certificate ${serialNumber} is REVOKED!`);
        } else {
          alert(`Certificate ${serialNumber} is VALID.`);
        }
      },
    });
  }

  // Filter za pretragu
  get filteredCertificates(): RevokedCertificate[] {
    const info = this.crlInfo();
    if (!info) return [];

    const search = this.searchTerm().toLowerCase();
    if (!search) return info.certificates;

    return info.certificates.filter(
      (cert) =>
        cert.serialNumber.toLowerCase().includes(search) ||
        cert.commonName.toLowerCase().includes(search) ||
        cert.reason.toLowerCase().includes(search)
    );
  }

  getReasonClass(reason: string): string {
    const normalized = reason.toLowerCase().replace(/ /g, '-');
    return `reason-${normalized}`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
