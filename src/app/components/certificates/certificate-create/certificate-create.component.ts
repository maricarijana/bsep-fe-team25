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
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { CAUserResponse } from '../../../model/ca-user.model';
import { CertificateCsrUploadComponent, CSRUploadData } from './certificate-csr-upload/certificate-csr-upload.component';

interface SubjectAlternativeName {
  type: 'DNS' | 'IP' | 'EMAIL';
  value: string;
}

@Component({
  selector: 'app-certificate-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule, CertificateCsrUploadComponent],
  templateUrl: './certificate-create.component.html',
  styleUrls: ['./certificate-create.component.scss'],
})
export class CertificateCreateComponent implements OnInit {
  certificateForm!: FormGroup;
  selectedType: 'ROOT_CA' | 'INTERMEDIATE_CA' | 'END_ENTITY' = 'ROOT_CA';
  activeCAs: Certificate[] = [];
  loading: boolean = false;
  creating: boolean = false;
  caUsers: CAUserResponse[] = [];
  isCurrentUserAdmin: boolean = false;
  isCurrentUserCA: boolean = false;  // ✅ DODATO
  userOrganization: string = '';
  csrFile: File | null = null;
  private selectedIssuer?: Certificate;

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
    private adminService: AdminService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.checkUserRole();  // ✅ PROMENJENA METODA
    this.loadUserOrganization();
    
    // ✅ Ako je običan korisnik, automatski setuj END_ENTITY
    if (!this.isCurrentUserAdmin && !this.isCurrentUserCA) {
      this.selectedType = 'END_ENTITY';
      this.selectType('END_ENTITY');
      this.loadActiveCAs();
    }
  }

  // ✅ PROMENJENA METODA - proveri obe role
  checkUserRole(): void {
    this.isCurrentUserAdmin = this.authService.isAdmin();
    this.isCurrentUserCA = this.authService.isCAUser();
    
    console.log('🔍 checkUserRole:');
    console.log('  - isAdmin:', this.isCurrentUserAdmin);
    console.log('  - isCAUser:', this.isCurrentUserCA);

    // Samo Admin učitava CA korisnike (za owner selection)
    if (this.isCurrentUserAdmin) {
      this.loadCAUsers();
    }
  }

  onCSRSelected(data: CSRUploadData): void {
    this.csrFile = data.file;
    console.log('CSR selected:', data.fileName);
    console.log('Preview:', data.preview);
  }

  onCSRCleared(): void {
    this.csrFile = null;
    console.log('CSR cleared');
  }

  loadCAUsers(): void {
    this.adminService.getAllCAUsers().subscribe({
      next: (users) => {
        this.caUsers = users;
      },
      error: (err) => {
        console.error('Failed to load CA users', err);
      }
    });
  }

  loadUserOrganization(): void {
    console.log('🔍 loadUserOrganization called');
    console.log('🔍 isCurrentUserAdmin:', this.isCurrentUserAdmin);
    console.log('🔍 isCurrentUserCA:', this.isCurrentUserCA);

    // Samo CA korisnik ima locked organizaciju
    if (!this.isCurrentUserAdmin && this.isCurrentUserCA) {
      console.log('✅ User is CA_USER, loading certificates...');
      this.certificateService.getMyCertificates().subscribe({
        next: (certificates) => {
          console.log('📋 My certificates:', certificates);

          // Pronađi CA sertifikat
          let myCACert = certificates.find(c => c.isCA);
          console.log('🔍 Found CA certificate by isCA flag:', myCACert);

          if (!myCACert) {
            myCACert = certificates.find(c =>
              c.certificateType === 'INTERMEDIATE_CA' || c.certificateType === 'ROOT_CA'
            );
            console.log('🔍 Found CA certificate by type:', myCACert);
          }

          if (myCACert) {
            this.userOrganization = myCACert.organization;
            console.log('✅ Setting organization to:', this.userOrganization);
            this.certificateForm.patchValue({ organization: this.userOrganization });
            this.certificateForm.get('organization')?.disable();
            console.log('✅ Organization field disabled');
          } else {
            console.warn('⚠️ No CA certificate found for this CA user!');
          }
        },
        error: (err) => {
          console.error('❌ Failed to load user organization', err);
        }
      });
    } else {
      console.log('ℹ️ User is ADMIN or regular user, no organization lock needed');
    }
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
      validityYears: [5, [Validators.required, Validators.min(1), Validators.max(30)]],
      issuerSerialNumber: [''],
      pathLength: [0],
      keyUsage: [[]],
      extendedKeyUsage: [[]],
      ownerId: [null],
    });
  }

  selectOwner(userId: number | null): void {
    this.certificateForm.patchValue({ ownerId: userId });
  }

  selectType(type: 'ROOT_CA' | 'INTERMEDIATE_CA' | 'END_ENTITY'): void {
    this.selectedType = type;

    const issuerControl = this.certificateForm.get('issuerSerialNumber');
    const cn = this.certificateForm.get('commonName');
    const org = this.certificateForm.get('organization');
    const ou = this.certificateForm.get('organizationalUnit');
    const country = this.certificateForm.get('country');
    const state = this.certificateForm.get('state');
    const locality = this.certificateForm.get('locality');
    const email = this.certificateForm.get('email');
    const pathLength = this.certificateForm.get('pathLength');

    // Issuer validator
    if (type === 'ROOT_CA') {
      issuerControl?.clearValidators();
    } else {
      issuerControl?.setValidators([Validators.required]);
      if (this.activeCAs.length === 0) this.loadActiveCAs();
    }
    issuerControl?.updateValueAndValidity();

    if (type === 'END_ENTITY') {
      // END_ENTITY koristi CSR → disable form fields
      [cn, org, ou, country, state, locality, email].forEach(c => {
        c?.clearValidators();
        c?.updateValueAndValidity();
        c?.disable({ emitEvent: false });
      });

      this.certificateForm.patchValue({
        keyUsage: ['digitalSignature', 'keyEncipherment'],
        extendedKeyUsage: ['serverAuth'],
      });

      pathLength?.disable({ emitEvent: false });
    } else {
      // ROOT_CA i INTERMEDIATE_CA → enable form fields
      [cn, org, country].forEach(c => {
        c?.setValidators([Validators.required]);
        c?.enable({ emitEvent: false });
        c?.updateValueAndValidity();
      });
      [ou, state, locality, email].forEach(c => c?.enable({ emitEvent: false }));
      email?.setValidators([Validators.email]);
      email?.updateValueAndValidity();

      if (type === 'INTERMEDIATE_CA') {
        this.certificateForm.patchValue({
          keyUsage: ['keyCertSign', 'cRLSign'],
          extendedKeyUsage: [],
          pathLength: 1,
        });
        pathLength?.enable({ emitEvent: false });
      } else {
        // ROOT_CA
        this.certificateForm.patchValue({
          keyUsage: [],
          extendedKeyUsage: [],
        });
        pathLength?.disable({ emitEvent: false });
      }
    }
  }

  selectCountry(code: string): void {
    this.certificateForm.patchValue({ country: code });
  }

  selectIssuer(serialNumber: string): void {
    this.certificateForm.patchValue({ issuerSerialNumber: serialNumber });
    this.selectedIssuer = this.activeCAs.find(c => c.serialNumber === serialNumber);
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
    const currentUsages = this.certificateForm.get('extendedKeyUsage')?.value || [];

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
    // ✅ Za END_ENTITY uvek pozovi CSR metodu
    if (this.selectedType === 'END_ENTITY') {
      this.createEndEntityFromCSR();
      return;
    }

    // Za ROOT_CA i INTERMEDIATE_CA validacija forme
    if (!this.certificateForm.valid) {
      this.snackBar.open('Please fill in all required fields', 'Close', {
        duration: 3000,
      });
      return;
    }

    const formValue = this.certificateForm.value;
    const request: CreateCertificateRequest = {
      commonName: formValue.commonName,
      organization: this.certificateForm.get('organization')?.value,
      organizationalUnit: formValue.organizationalUnit,
      country: formValue.country,
      state: formValue.state,
      locality: formValue.locality,
      email: formValue.email,
      validityYears: formValue.validityYears,
    };

    // Dodaj issuerSerialNumber za INTERMEDIATE
    if (this.selectedType !== 'ROOT_CA') {
      request.issuerSerialNumber = formValue.issuerSerialNumber;
    }

    // Dodaj CA-specific polja za INTERMEDIATE
    if (this.selectedType === 'INTERMEDIATE_CA') {
      request.isCA = true;
      request.pathLength = formValue.pathLength;
      request.keyUsage = formValue.keyUsage.length > 0
        ? formValue.keyUsage
        : ['keyCertSign', 'cRLSign'];

      if (this.isCurrentUserAdmin && formValue.ownerId) {
        request.ownerId = formValue.ownerId;
      }
    }

    this.creating = true;

    // Poziv API-ja
    let apiCall;
    if (this.selectedType === 'ROOT_CA') {
      apiCall = this.certificateService.createRootCA(request);
    } else {
      apiCall = this.certificateService.createIntermediateCA(request);
    }

    apiCall.subscribe({
      next: (cert) => {
        this.snackBar.open('Certificate created successfully!', 'Close', {
          duration: 3000,
        });
        this.router.navigate(['/certificates']);
      },
      error: (err) => {
        const message = err.error?.message || err.error || 'Failed to create certificate';
        this.snackBar.open(message, 'Close', { duration: 5000 });
        this.creating = false;
      },
    });
  }

  createEndEntityFromCSR(): void {
    if (!this.csrFile) {
      this.snackBar.open('Please select a CSR file', 'Close', {
        duration: 3000,
      });
      return;
    }

    const issuerSerialNumber = this.certificateForm.get('issuerSerialNumber')?.value;
    if (!issuerSerialNumber) {
      this.snackBar.open('Please select an issuer CA', 'Close', {
        duration: 3000,
      });
      return;
    }

    const validityYears = this.certificateForm.get('validityYears')?.value || 1;

    this.creating = true;

    this.certificateService.createEndEntityFromCSR(
      this.csrFile,
      issuerSerialNumber,
      validityYears
    ).subscribe({
      next: (response: any) => {
        this.snackBar.open(
          response.message || 'Certificate issued successfully!',
          'Close',
          { duration: 3000 }
        );
        
        if (response.certificate && response.certificate.pemCertificate) {
          this.downloadIssuedCertificate(response.certificate);
        }
        
        this.router.navigate(['/certificates']);
      },
      error: (err) => {
        const message = err.error?.message || 'Failed to create certificate from CSR';
        this.snackBar.open(message, 'Close', { duration: 5000 });
        this.creating = false;
      },
    });
  }

  downloadIssuedCertificate(certificate: any): void {
    const blob = new Blob([certificate.pemCertificate], { 
      type: 'application/x-pem-file' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${certificate.commonName}_${certificate.serialNumber}.pem`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    this.snackBar.open('Certificate downloaded', 'Close', {
      duration: 2000,
    });
  }

  cancel(): void {
    this.router.navigate(['/certificates']);
  }
}