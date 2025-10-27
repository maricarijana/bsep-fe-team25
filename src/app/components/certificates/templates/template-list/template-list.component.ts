import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TemplateService } from '../../../../services/template.service';
import { TemplateResponse } from '../../../../model/template.model';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  templateUrl: './template-list.component.html',
  styleUrls: ['./template-list.component.scss']
})
export class TemplateListComponent implements OnInit {
  templates: TemplateResponse[] = [];
  filteredTemplates: TemplateResponse[] = [];

  searchText: string = '';
  selectedIssuer: string = 'ALL';
  loading: boolean = false;

  // Unique CA issuers for filter dropdown
  uniqueIssuers: { serial: string, name: string }[] = [];

  constructor(
    private templateService: TemplateService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  /**
   * Load all certificate templates
   */
  loadTemplates(): void {
    this.loading = true;

    this.templateService.getAllTemplates().subscribe({
      next: (data) => {
        this.templates = data;
        this.extractUniqueIssuers();
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.snackBar.open('Failed to load templates', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  /**
   * Extract unique CA issuers for filter dropdown
   */
  extractUniqueIssuers(): void {
    const issuersMap = new Map<string, string>();

    this.templates.forEach(template => {
      if (!issuersMap.has(template.caIssuerSerialNumber)) {
        issuersMap.set(template.caIssuerSerialNumber, template.caIssuerCommonName);
      }
    });

    this.uniqueIssuers = Array.from(issuersMap.entries()).map(([serial, name]) => ({
      serial,
      name
    }));
  }

  /**
   * Apply search and filter logic
   */
  applyFilters(): void {
    let filtered = [...this.templates];

    // Filter by search text
    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(search) ||
        template.caIssuerCommonName.toLowerCase().includes(search) ||
        template.createdByEmail.toLowerCase().includes(search)
      );
    }

    // Filter by CA issuer
    if (this.selectedIssuer !== 'ALL') {
      filtered = filtered.filter(template =>
        template.caIssuerSerialNumber === this.selectedIssuer
      );
    }

    this.filteredTemplates = filtered;
  }

  /**
   * Check if current user can delete a template
   */
  canDeleteTemplate(template: TemplateResponse): boolean {
    const currentUserEmail = this.authService.getUserEmail();
    const isAdmin = this.authService.isAdmin();

    return isAdmin || template.createdByEmail === currentUserEmail;
  }

  /**
   * Delete a template with confirmation
   */
  deleteTemplate(template: TemplateResponse, event: Event): void {
    event.stopPropagation();

    const confirmed = confirm(
      `Are you sure you want to delete template "${template.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    this.templateService.deleteTemplate(template.name).subscribe({
      next: () => {
        this.snackBar.open('Template deleted successfully', 'Close', { duration: 3000 });
        this.loadTemplates();
      },
      error: (err) => {
        const message = err.error?.message || err.error || 'Failed to delete template';
        this.snackBar.open(message, 'Close', { duration: 5000 });
      }
    });
  }

  /**
   * Navigate to template details
   */
  viewDetails(templateName: string): void {
    this.router.navigate(['/certificates/templates', templateName]);
  }

  /**
   * Navigate to create template page
   */
  createNew(): void {
    this.router.navigate(['/certificates/templates/create']);
  }

  /**
   * Handle search input change
   */
  onSearchChange(): void {
    this.applyFilters();
  }

  /**
   * Handle issuer filter change
   */
  onIssuerChange(): void {
    this.applyFilters();
  }

  /**
   * Select issuer from button group
   */
  selectIssuer(issuerSerial: string): void {
    this.selectedIssuer = issuerSerial;
    this.applyFilters();
  }

  /**
   * Check if user can create templates
   */
  canCreateTemplate(): boolean {
    const role = this.authService.getUserRole();
    return role === 'CA_USER' || role === 'ADMIN';
  }

  /**
   * Get user email for display
   */
  getUserEmail(): string {
    return this.authService.getUserEmail() || '';
  }
}
