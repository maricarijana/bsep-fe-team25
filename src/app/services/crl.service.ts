// services/crl.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RevokedCertificate {
  serialNumber: string;
  commonName: string;
  revokedAt: string;
  reason: string;
}

export interface CRLInfo {
  totalRevoked: number;
  certificates: RevokedCertificate[];
}

@Injectable({
  providedIn: 'root',
})
export class CrlService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/pki/certificates';

  /**
   * Preuzmi CRL info (JSON format) - za admin
   */
  getCRLInfo(issuerSerial?: string): Observable<CRLInfo> {
    const url = issuerSerial
      ? `${this.apiUrl}/crl/info?issuer=${issuerSerial}`
      : `${this.apiUrl}/crl/info`;

    return this.http.get<CRLInfo>(url);
  }

  /**
   * Preuzmi CRL fajl (binarni format)
   */
  downloadCRL(issuerSerial?: string): Observable<Blob> {
    const url = issuerSerial
      ? `${this.apiUrl}/crl?issuer=${issuerSerial}`
      : `${this.apiUrl}/crl`;

    return this.http.get(url, {
      responseType: 'blob',
      headers: new HttpHeaders({
        Accept: 'application/pkix-crl',
      }),
    });
  }

  /**
   * Provjeri da li je sertifikat povučen
   */
  checkCertificateRevocation(serialNumber: string): Observable<boolean> {
    return new Observable((observer) => {
      this.getCRLInfo().subscribe({
        next: (crlInfo) => {
          const isRevoked = crlInfo.certificates.some(
            (cert) => cert.serialNumber === serialNumber
          );
          observer.next(isRevoked);
          observer.complete();
        },
        error: (err) => {
          console.error('Error checking revocation:', err);
          observer.next(false);
          observer.complete();
        },
      });
    });
  }
}
