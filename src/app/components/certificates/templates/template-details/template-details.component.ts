import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TemplateService } from '../../../../services/template.service';
import { TemplateResponse } from '../../../../model/template.model';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-template-details',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule],
  templateUrl: './template-details.component.html',
  styleUrls: ['./template-details.component.scss']
})
export class TemplateDetailsComponent implements OnInit {
  template: TemplateResponse | null = null;
  loading: boolean = true;
  templateName: string = '';
  showDeleteDialog: boolean = false;

  // Test regex fields
  testCN: string = '';
  testSAN: string = '';
  cnValid: boolean = false;
  sanValid: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private templateService: TemplateService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.templateName = this.route.snapshot.paramMap.get('name') || '';
    if (this.templateName) {
      this.loadTemplate();
    }
  }

  /**
   * Load template details
   */
  loadTemplate(): void {
    this.loading = true;

    this.templateService.getTemplateByName(this.templateName).subscribe({
      next: (data) => {
        this.template = data;
        this.loading = false;
      },
      error: (err) => {
        this.snackBar.open('Failed to load template', 'Close', { duration: 3000 });
        this.router.navigate(['/certificates/templates']);
        this.loading = false;
      }
    });
  }

  /**
   * Validate test CN input against template regex
   */
  validateTestCN(): void {
    if (!this.template || !this.testCN) {
      this.cnValid = false;
      return;
    }

    this.cnValid = this.templateService.validateAgainstRegex(
      this.testCN,
      this.template.cnValidationRegex
    );
  }

  /**
   * Validate test SAN input against template regex
   */
  validateTestSAN(): void {
    if (!this.template || !this.template.sanValidationRegex || !this.testSAN) {
      this.sanValid = false;
      return;
    }

    this.sanValid = this.templateService.validateAgainstRegex(
      this.testSAN,
      this.template.sanValidationRegex
    );
  }

  /**
   * Check if current user can delete this template
   */
  canDeleteTemplate(): boolean {
    if (!this.template) return false;

    const currentUserEmail = this.authService.getUserEmail();
    const isAdmin = this.authService.isAdmin();

    return isAdmin || this.template.createdByEmail === currentUserEmail;
  }

  /**
   * Toggle delete confirmation dialog
   */
  toggleDeleteDialog(): void {
    this.showDeleteDialog = !this.showDeleteDialog;
  }

  /**
   * Confirm template deletion
   */
  confirmDelete(): void {
    if (!this.template) return;

    this.templateService.deleteTemplate(this.template.name).subscribe({
      next: () => {
        this.snackBar.open('Template deleted successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/certificates/templates']);
      },
      error: (err) => {
        const message = err.error?.message || err.error || 'Failed to delete template';
        this.snackBar.open(message, 'Close', { duration: 5000 });
        this.showDeleteDialog = false;
      }
    });
  }

  /**
   * Format label from camelCase to Title Case
   */
  formatLabel(value: string): string {
    return value
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Navigate back to templates list
   */
  goBack(): void {
    this.router.navigate(['/certificates/templates']);
  }

  /**
   * Copy regex pattern to clipboard
   */
  copyRegex(regex: string): void {
    navigator.clipboard.writeText(regex).then(() => {
      this.snackBar.open('Regex copied to clipboard', 'Close', { duration: 2000 });
    });
  }

  /**
   * Navigate to create certificate with this template pre-selected
   */
  useTemplate(): void {
    // Store template name in session storage for certificate creation
    sessionStorage.setItem('selectedTemplate', this.template?.name || '');
    this.router.navigate(['/certificates/create']);
    this.snackBar.open('Template selected for certificate creation', 'Close', { duration: 2000 });
  }
}
