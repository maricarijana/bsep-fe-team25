import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateTemplateRequest, TemplateResponse } from '../model/template.model';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  private apiUrl = 'http://localhost:8080/api/pki/templates';

  constructor(private http: HttpClient) {}

  /**
   * Creates HTTP headers with JWT authentication token
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Creates a new certificate template
   * Requires: CA_USER or ADMIN role
   */
  createTemplate(request: CreateTemplateRequest): Observable<TemplateResponse> {
    return this.http.post<TemplateResponse>(this.apiUrl, request, {
      headers: this.getHeaders()
    });
  }

  /**
   * Retrieves all certificate templates
   */
  getAllTemplates(): Observable<TemplateResponse[]> {
    return this.http.get<TemplateResponse[]>(this.apiUrl, {
      headers: this.getHeaders()
    });
  }

  /**
   * Retrieves templates for a specific CA issuer
   * @param issuerSerial - Serial number of the CA issuer
   */
  getTemplatesByIssuer(issuerSerial: string): Observable<TemplateResponse[]> {
    return this.http.get<TemplateResponse[]>(`${this.apiUrl}/by-issuer/${issuerSerial}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Retrieves templates created by the current user
   */
  getMyTemplates(): Observable<TemplateResponse[]> {
    return this.http.get<TemplateResponse[]>(`${this.apiUrl}/my`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Retrieves a specific template by name
   * @param name - Template name
   */
  getTemplateByName(name: string): Observable<TemplateResponse> {
    return this.http.get<TemplateResponse>(`${this.apiUrl}/${name}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Deletes a certificate template
   * @param name - Template name
   */
  deleteTemplate(name: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${name}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Validates a string against a regex pattern
   * @param value - String to validate
   * @param regexPattern - Regex pattern to test against
   * @returns true if valid, false otherwise
   */
  validateAgainstRegex(value: string, regexPattern: string): boolean {
    try {
      const regex = new RegExp(regexPattern);
      return regex.test(value);
    } catch (e) {
      return false;
    }
  }
}
