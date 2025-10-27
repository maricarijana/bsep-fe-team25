import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CSRUploadData {
  file: File;
  fileName: string;
  preview?: {
    commonName?: string;
    organization?: string;
    country?: string;
  };
}

@Component({
  selector: 'app-certificate-csr-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certificate-csr-upload.component.html',
  styleUrls: ['./certificate-csr-upload.component.css'] 
})
export class CertificateCsrUploadComponent {
  @Output() csrSelected = new EventEmitter<CSRUploadData>();
  @Output() csrCleared = new EventEmitter<void>();

  csrFile: File | null = null;
  csrFileName: string = '';
  csrFileError: string = '';
  csrPreview: any = null;

  onCSRFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validacija ekstenzije
      if (!file.name.endsWith('.csr') && !file.name.endsWith('.pem')) {
        this.csrFileError = 'Please select a valid CSR file (.csr or .pem)';
        this.clearCSR();
        return;
      }

      // Validacija veličine (max 10KB)
      if (file.size > 10 * 1024) {
        this.csrFileError = 'CSR file is too large (max 10KB)';
        this.clearCSR();
        return;
      }

      this.csrFile = file;
      this.csrFileName = file.name;
      this.csrFileError = '';

      // Parsira CSR za preview
      this.parseCSRForPreview(file);

      // Emituj podatke parent komponenti
      this.csrSelected.emit({
        file: file,
        fileName: file.name,
        preview: this.csrPreview
      });
    }
  }

  parseCSRForPreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const csrContent = e.target.result;
      const subjectMatch = csrContent.match(/Subject:(.+)/);
      if (subjectMatch) {
        const subject = subjectMatch[1];
        this.csrPreview = {
          commonName: this.extractCSRField(subject, 'CN'),
          organization: this.extractCSRField(subject, 'O'),
          country: this.extractCSRField(subject, 'C')
        };
      }
    };
    reader.readAsText(file);
  }

  extractCSRField(subject: string, field: string): string | null {
    const regex = new RegExp(`${field}\\s*=\\s*([^,]+)`);
    const match = subject.match(regex);
    return match ? match[1].trim() : null;
  }

  clearCSR(): void {
    this.csrFile = null;
    this.csrFileName = '';
    this.csrPreview = null;
    this.csrCleared.emit();
  }
}