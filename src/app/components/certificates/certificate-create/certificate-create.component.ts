import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CertificateService } from '../../../services/certificate.service';
import { CreateCertificateRequest } from '../../../model/certificate-request.model';
import { Certificate } from '../../../model/certificate.model';

interface SubjectAlternativeName {
  type: 'DNS' | 'IP' | 'EMAIL';
  value: string;
}

@Component({
  selector: 'app-certificate-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './certificate-create.component.html',
  styleUrls: ['./certificate-create.component.scss'],
})
export class CertificateCreateComponent implements OnInit {
  certificateForm!: FormGroup;
  selectedType: 'ROOT_CA' | 'INTERMEDIATE_CA' | 'END_ENTITY' = 'ROOT_CA';
  activeCAs: Certificate[] = [];
  loading: boolean = false;
  creating: boolean = false;

  countries = [
    { code: 'RS', name: 'Serbia' },
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'BE', name: 'Belgium' },
    { code: 'AT', name: 'Austria' },
    { code: 'CH', name: 'Switzerland' },
  ];

  keyUsageOptions = [
    { value: 'keyCertSign', label: 'Key Cert Sign' },
    { value: 'cRLSign', label: 'CRL Sign' },
    { value: 'digitalSignature', label: 'Digital Signature' },
    { value: 'keyEncipherment', label: 'Key Encipherment' },
    { value: 'dataEncipherment', label: 'Data Encipherment' },
  ];

  extendedKeyUsageOptions = [
    { value: 'serverAuth', label: 'Server Authentication' },
    { value: 'clientAuth', label: 'Client Authentication' },
    { value: 'codeSigning', label: 'Code Signing' },
    { value: 'emailProtection', label: 'Email Protection' },
  ];

  subjectAlternativeNames: SubjectAlternativeName[] = [];

  constructor(
    private fb: FormBuilder,
    private certificateService: CertificateService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.certificateForm = this.fb.group({
      commonName: ['', Validators.required],
      organization: ['', Validators.required],
      organizationalUnit: [''],
      country: ['RS', Validators.required],
      state: [''],
      locality: [''],
      email: ['', Validators.email],
      validityYears: [
        5,
        [Validators.required, Validators.min(1), Validators.max(30)],
      ],
      issuerSerialNumber: [''],
      pathLength: [0],
      keyUsage: [[]],
      extendedKeyUsage: [[]],
    });
  }

  selectType(type: 'ROOT_CA' | 'INTERMEDIATE_CA' | 'END_ENTITY'): void {
    this.selectedType = type;

    // Update validators based on type
    const issuerControl = this.certificateForm.get('issuerSerialNumber');
    if (type === 'ROOT_CA') {
      issuerControl?.clearValidators();
    } else {
      issuerControl?.setValidators([Validators.required]);
      // Load active CAs when selecting non-ROOT type
      if (this.activeCAs.length === 0) {
        this.loadActiveCAs();
      }
    }
    issuerControl?.updateValueAndValidity();

    // ✅ DODAJ OVO - Set default keyUsage za INTERMEDIATE_CA
    if (type === 'INTERMEDIATE_CA') {
      this.certificateForm.patchValue({
        keyUsage: ['keyCertSign', 'cRLSign'], // ← Default za CA
        pathLength: 1, // ← Default path length
      });
    } else if (type === 'END_ENTITY') {
      this.certificateForm.patchValue({
        keyUsage: ['digitalSignature', 'keyEncipherment'], // ← Default za server
        extendedKeyUsage: ['serverAuth'], // ← Default za server
      });
    } else {
      // ROOT_CA
      this.certificateForm.patchValue({
        keyUsage: [],
        extendedKeyUsage: [],
      });
    }
  }

  selectCountry(code: string): void {
    this.certificateForm.patchValue({ country: code });
  }

  selectIssuer(serialNumber: string): void {
    this.certificateForm.patchValue({ issuerSerialNumber: serialNumber });
  }

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

  getValidFromDate(): Date {
    return new Date();
  }

  getValidUntilDate(): Date {
    const years = this.certificateForm.get('validityYears')?.value || 5;
    const date = new Date();
    date.setFullYear(date.getFullYear() + years);
    return date;
  }

  addSubjectAlternativeName(): void {
    this.subjectAlternativeNames.push({ type: 'DNS', value: '' });
  }

  removeSubjectAlternativeName(index: number): void {
    this.subjectAlternativeNames.splice(index, 1);
  }

  updateSanType(index: number, type: 'DNS' | 'IP' | 'EMAIL'): void {
    this.subjectAlternativeNames[index].type = type;
  }

  updateSanValue(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.subjectAlternativeNames[index].value = value;
  }

  onKeyUsageChange(event: any, value: string): void {
    const currentUsages = this.certificateForm.get('keyUsage')?.value || [];

    if (event.target.checked) {
      this.certificateForm.patchValue({
        keyUsage: [...currentUsages, value],
      });
    } else {
      this.certificateForm.patchValue({
        keyUsage: currentUsages.filter((u: string) => u !== value),
      });
    }
  }

  onExtendedKeyUsageChange(event: any, value: string): void {
    const currentUsages =
      this.certificateForm.get('extendedKeyUsage')?.value || [];

    if (event.target.checked) {
      this.certificateForm.patchValue({
        extendedKeyUsage: [...currentUsages, value],
      });
    } else {
      this.certificateForm.patchValue({
        extendedKeyUsage: currentUsages.filter((u: string) => u !== value),
      });
    }
  }

  isKeyUsageSelected(value: string): boolean {
    const usages = this.certificateForm.get('keyUsage')?.value || [];
    return usages.includes(value);
  }

  isExtendedKeyUsageSelected(value: string): boolean {
    const usages = this.certificateForm.get('extendedKeyUsage')?.value || [];
    return usages.includes(value);
  }

  createCertificate(): void {
    if (!this.certificateForm.valid) {
      this.snackBar.open('Please fill in all required fields', 'Close', {
        duration: 3000,
      });
      return;
    }

    const formValue = this.certificateForm.value;
    const request: CreateCertificateRequest = {
      commonName: formValue.commonName,
      organization: formValue.organization,
      organizationalUnit: formValue.organizationalUnit,
      country: formValue.country,
      state: formValue.state,
      locality: formValue.locality,
      email: formValue.email,
      validityYears: formValue.validityYears,
    };

    // ✅ ISPRAVLJENO - Dodaj issuerSerialNumber za INTERMEDIATE i END_ENTITY
    if (this.selectedType !== 'ROOT_CA') {
      request.issuerSerialNumber = formValue.issuerSerialNumber;
    }

    // ✅ ISPRAVLJENO - Dodaj CA-specific polja za INTERMEDIATE
    if (this.selectedType === 'INTERMEDIATE_CA') {
      request.isCA = true;
      request.pathLength = formValue.pathLength;
      request.keyUsage =
        formValue.keyUsage.length > 0
          ? formValue.keyUsage
          : ['keyCertSign', 'cRLSign']; // ← Fallback ako korisnik nije odabrao
    }

    // ✅ ISPRAVLJENO - Dodaj END_ENTITY-specific polja
    if (this.selectedType === 'END_ENTITY') {
      request.keyUsage = formValue.keyUsage;
      request.extendedKeyUsage = formValue.extendedKeyUsage;

      // Subject Alternative Names
      if (this.subjectAlternativeNames.length > 0) {
        request.subjectAlternativeNames = this.subjectAlternativeNames
          .filter((san) => san.value.trim())
          .map((san) => `${san.type}:${san.value}`);
      }
    }

    this.creating = true;

    let apiCall;
    if (this.selectedType === 'ROOT_CA') {
      apiCall = this.certificateService.createRootCA(request);
    } else if (this.selectedType === 'INTERMEDIATE_CA') {
      apiCall = this.certificateService.createIntermediateCA(request);
    } else {
      apiCall = this.certificateService.createEndEntity(request);
    }

    apiCall.subscribe({
      next: (cert) => {
        this.snackBar.open('Certificate created successfully!', 'Close', {
          duration: 3000,
        });
        this.router.navigate(['/certificates']);
      },
      error: (err) => {
        const message =
          err.error?.message || err.error || 'Failed to create certificate';
        this.snackBar.open(message, 'Close', { duration: 5000 });
        this.creating = false;
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/certificates']);
  }
}
