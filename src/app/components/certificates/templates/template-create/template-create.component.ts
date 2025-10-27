import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TemplateService } from '../../../../services/template.service';
import { CertificateService } from '../../../../services/certificate.service';
import { CreateTemplateRequest, KEY_USAGE_OPTIONS, EXTENDED_KEY_USAGE_OPTIONS } from '../../../../model/template.model';
import { Certificate } from '../../../../model/certificate.model';

@Component({
  selector: 'app-template-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule, RouterModule],
  templateUrl: './template-create.component.html',
  styleUrls: ['./template-create.component.scss'],
})
export class TemplateCreateComponent implements OnInit {
  templateForm!: FormGroup;
  activeCAs: Certificate[] = [];
  loading: boolean = false;
  creating: boolean = false;

  // Test regex fields
  testCN: string = '';
  testSAN: string = '';
  cnValid: boolean = false;
  sanValid: boolean = false;

  keyUsageOptions = KEY_USAGE_OPTIONS.map(value => ({
    value,
    label: this.formatLabel(value)
  }));

  extendedKeyUsageOptions = EXTENDED_KEY_USAGE_OPTIONS.map(value => ({
    value,
    label: this.formatLabel(value)
  }));

  constructor(
    private fb: FormBuilder,
    private templateService: TemplateService,
    private certificateService: CertificateService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadActiveCAs();
    this.setupRegexValidation();
  }

  /**
   * Initialize template form with validators
   */
  initializeForm(): void {
    this.templateForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_-]+$/)]],
      caIssuerSerialNumber: ['', Validators.required],
      cnValidationRegex: ['', Validators.required],
      sanValidationRegex: [''],
      maxTTLDays: [365, [Validators.required, Validators.min(1), Validators.max(3650)]],
      keyUsage: [[]],
      extendedKeyUsage: [[]]
    });
  }

  /**
   * Setup real-time regex validation
   */
  setupRegexValidation(): void {
    // Watch CN regex changes
    this.templateForm.get('cnValidationRegex')?.valueChanges.subscribe(() => {
      this.validateTestCN();
    });

    // Watch SAN regex changes
    this.templateForm.get('sanValidationRegex')?.valueChanges.subscribe(() => {
      this.validateTestSAN();
    });
  }

  /**
   * Load active CA certificates
   */
  loadActiveCAs(): void {
    this.loading = true;
    this.certificateService.getActiveCAs().subscribe({
      next: (data) => {
        this.activeCAs = data;
        this.loading = false;
      },
      error: (err) => {
        this.snackBar.open('Failed to load CA certificates', 'Close', {
          duration: 3000,
        });
        this.loading = false;
      },
    });
  }

  /**
   * Select CA issuer
   */
  selectIssuer(serialNumber: string): void {
    this.templateForm.patchValue({ caIssuerSerialNumber: serialNumber });
  }

  /**
   * Handle key usage checkbox change
   */
  onKeyUsageChange(event: any, value: string): void {
    const currentUsages = this.templateForm.get('keyUsage')?.value || [];

    if (event.target.checked) {
      this.templateForm.patchValue({
        keyUsage: [...currentUsages, value],
      });
    } else {
      this.templateForm.patchValue({
        keyUsage: currentUsages.filter((u: string) => u !== value),
      });
    }
  }

  /**
   * Handle extended key usage checkbox change
   */
  onExtendedKeyUsageChange(event: any, value: string): void {
    const currentUsages = this.templateForm.get('extendedKeyUsage')?.value || [];

    if (event.target.checked) {
      this.templateForm.patchValue({
        extendedKeyUsage: [...currentUsages, value],
      });
    } else {
      this.templateForm.patchValue({
        extendedKeyUsage: currentUsages.filter((u: string) => u !== value),
      });
    }
  }

  /**
   * Check if key usage is selected
   */
  isKeyUsageSelected(value: string): boolean {
    const usages = this.templateForm.get('keyUsage')?.value || [];
    return usages.includes(value);
  }

  /**
   * Check if extended key usage is selected
   */
  isExtendedKeyUsageSelected(value: string): boolean {
    const usages = this.templateForm.get('extendedKeyUsage')?.value || [];
    return usages.includes(value);
  }

  /**
   * Validate test CN input against regex
   */
  validateTestCN(): void {
    if (!this.testCN) {
      this.cnValid = false;
      return;
    }

    const regex = this.templateForm.get('cnValidationRegex')?.value;
    if (!regex) {
      this.cnValid = false;
      return;
    }

    this.cnValid = this.templateService.validateAgainstRegex(this.testCN, regex);
  }

  /**
   * Validate test SAN input against regex
   */
  validateTestSAN(): void {
    if (!this.testSAN) {
      this.sanValid = false;
      return;
    }

    const regex = this.templateForm.get('sanValidationRegex')?.value;
    if (!regex) {
      this.sanValid = false;
      return;
    }

    this.sanValid = this.templateService.validateAgainstRegex(this.testSAN, regex);
  }

  /**
   * Get selected CA issuer
   */
  getSelectedIssuer(): Certificate | undefined {
    const serialNumber = this.templateForm.get('caIssuerSerialNumber')?.value;
    return this.activeCAs.find(ca => ca.serialNumber === serialNumber);
  }

  /**
   * Create certificate template
   */
  createTemplate(): void {
    if (!this.templateForm.valid) {
      this.snackBar.open('Please fill in all required fields', 'Close', {
        duration: 3000,
      });
      return;
    }

    const formValue = this.templateForm.value;

    // Validate regex patterns
    try {
      new RegExp(formValue.cnValidationRegex);
      if (formValue.sanValidationRegex) {
        new RegExp(formValue.sanValidationRegex);
      }
    } catch (e) {
      this.snackBar.open('Invalid regex pattern', 'Close', { duration: 3000 });
      return;
    }

    const request: CreateTemplateRequest = {
      name: formValue.name,
      caIssuerSerialNumber: formValue.caIssuerSerialNumber,
      cnValidationRegex: formValue.cnValidationRegex,
      sanValidationRegex: formValue.sanValidationRegex || null,
      maxTTLDays: formValue.maxTTLDays,
      keyUsage: formValue.keyUsage.length > 0 ? formValue.keyUsage : [],
      extendedKeyUsage: formValue.extendedKeyUsage.length > 0 ? formValue.extendedKeyUsage : []
    };

    this.creating = true;

    this.templateService.createTemplate(request).subscribe({
      next: (template) => {
        this.snackBar.open('Template created successfully!', 'Close', {
          duration: 3000,
        });
        this.router.navigate(['/certificates/templates']);
      },
      error: (err) => {
        const message = err.error?.message || err.error || 'Failed to create template';
        this.snackBar.open(message, 'Close', { duration: 5000 });
        this.creating = false;
      },
    });
  }

  /**
   * Cancel and return to templates list
   */
  cancel(): void {
    this.router.navigate(['/certificates/templates']);
  }

  /**
   * Format label from camelCase to Title Case
   */
  private formatLabel(value: string): string {
    return value
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}
