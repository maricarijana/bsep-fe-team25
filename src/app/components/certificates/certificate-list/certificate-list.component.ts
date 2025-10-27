import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CertificateService } from '../../../services/certificate.service';
import { Certificate } from '../../../model/certificate.model';
import { AuthService } from '../../../services/auth.service'; 
@Component({
  selector: 'app-certificate-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSnackBarModule
  ],
  templateUrl: './certificate-list.component.html',
  styleUrls: ['./certificate-list.component.scss']
})
export class CertificateListComponent implements OnInit {
  certificates: Certificate[] = [];
  filteredCertificates: Certificate[] = [];

  searchText: string = '';
  selectedType: string = 'ALL';
  loading: boolean = false;

  constructor(
    private certificateService: CertificateService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCertificates();
  }

loadCertificates(): void {
    this.loading = true;
    
    // ✅ IZMENI - Admin vidi SVE, ostali samo svoje
    const isAdmin = this.authService.isAdmin();
    const apiCall = isAdmin 
      ? this.certificateService.getAllCertificates()  // Admin → /all
      : this.certificateService.getMyCertificates();  // CA_USER/END_USER → /my
    
    apiCall.subscribe({
      next: (data) => {
        this.certificates = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.snackBar.open('Failed to load certificates', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }
  applyFilters(): void {
    let filtered = [...this.certificates];

    // Filter by search text
    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(cert =>
        cert.commonName.toLowerCase().includes(search) ||
        cert.serialNumber.toLowerCase().includes(search) ||
        cert.organization.toLowerCase().includes(search)
      );
    }

    // Filter by type
    if (this.selectedType !== 'ALL') {
      filtered = filtered.filter(cert => cert.certificateType === this.selectedType);
    }

    this.filteredCertificates = filtered;
  }

  getStatusInfo(cert: Certificate): { label: string, class: string } {
    if (cert.isRevoked) {
      return { label: 'Revoked', class: 'status-revoked' };
    }

    const now = new Date();
    const validUntil = new Date(cert.validUntil);
    const daysUntilExpiry = Math.floor((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (validUntil < now) {
      return { label: 'Expired', class: 'status-expired' };
    } else if (daysUntilExpiry <= 30) {
      return { label: 'Expiring Soon', class: 'status-expiring' };
    } else {
      return { label: 'Active', class: 'status-active' };
    }
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'ROOT_CA': return 'type-root';
      case 'INTERMEDIATE_CA': return 'type-intermediate';
      case 'END_ENTITY': return 'type-end-entity';
      default: return '';
    }
  }

  viewDetails(serialNumber: string): void {
    this.router.navigate(['/certificates', serialNumber]);
  }

  downloadPEM(cert: Certificate): void {
    const blob = new Blob([cert.pemCertificate], { type: 'application/x-pem-file' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cert.commonName}_${cert.serialNumber}.pem`;
    link.click();
    window.URL.revokeObjectURL(url);
    this.snackBar.open('Certificate downloaded', 'Close', { duration: 2000 });
  }

  createNew(): void {
    this.router.navigate(['/certificates/create']);
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onTypeChange(): void {
    this.applyFilters();
  }

  selectType(type: string): void {
    this.selectedType = type;
    this.applyFilters();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isCAUser(): boolean {
    return this.authService.getUserRole() === 'CA_USER';
  }
}
