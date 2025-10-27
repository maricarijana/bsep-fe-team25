import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Certificate, RevokeCertificateRequest } from '../model/certificate.model';
import { CreateCertificateRequest } from '../model/certificate-request.model';

@Injectable({
  providedIn: 'root'
})
export class CertificateService {
  private apiUrl = 'http://localhost:8080/api/pki/certificates';
   private getHeadersForFormData(): HttpHeaders {
    const token = localStorage.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // NE dodaj Content-Type - browser automatski postavlja multipart/form-data
    });
  }

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  createRootCA(data: CreateCertificateRequest): Observable<Certificate> {
    return this.http.post<Certificate>(`${this.apiUrl}/root`, data, {
      headers: this.getHeaders()
    });
  }

  createIntermediateCA(data: CreateCertificateRequest): Observable<Certificate> {
    return this.http.post<Certificate>(`${this.apiUrl}/intermediate`, data, {
      headers: this.getHeaders()
    });
  }

  createEndEntityFromCSR(
    csrFile: File,
    issuerSerialNumber: string,
    validityYears: number
  ): Observable<any> {
    const formData = new FormData();
    formData.append('csr', csrFile);
    formData.append('issuerSerialNumber', issuerSerialNumber);
    formData.append('validityYears', validityYears.toString());

    return this.http.post<any>(
      `${this.apiUrl}/end-entity/from-csr`,
      formData,
      { headers: this.getHeadersForFormData() }
    );
  }


  getActiveCAs(): Observable<Certificate[]> {
    return this.http.get<Certificate[]>(`${this.apiUrl}/active-cas`, {
      headers: this.getHeaders()
    });
  }

  getMyCertificates(): Observable<Certificate[]> {
    return this.http.get<Certificate[]>(`${this.apiUrl}/my`, {
      headers: this.getHeaders()
    });
  }

  getAllCertificates(): Observable<Certificate[]> {
    return this.http.get<Certificate[]>(`${this.apiUrl}/all`, {
      headers: this.getHeaders()
    });
  }

  revokeCertificate(request: RevokeCertificateRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/revoke`, request, {
      headers: this.getHeaders()
    });
  }

  getUserPublicKey(userId: number): Observable<{ userId: string; publicKeyPem: string }> {
  return this.http.get<{ userId: string; publicKeyPem: string }>(
    `${this.apiUrl}/users/${userId}/public-key`,
    { headers: this.getHeaders() }
  );
}
getUserEndEntityCertificate(userId: number): Observable<Certificate> {
  return this.http.get<Certificate>(
    `${this.apiUrl}/users/${userId}/end-entity-certificate`,
    { headers: this.getHeaders() }
  );
}
}

