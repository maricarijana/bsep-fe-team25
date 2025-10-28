// src/app/services/password-manager.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreatePasswordItemRequest, PasswordItemResponse } from '../model/passwor-item.model';
import { SharePasswordRequest, SharePasswordResponse } from '../model/password-share.model';

export interface ShareableUser {
  id: number;
  email: string;
  name?: string;
  surname?: string;
  organization?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PasswordManagerService {
  
  private apiUrl = 'http://localhost:8080/password-manager';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ==================== PASSWORD ITEMS ====================

  /**
   * Create new password item (encrypted)
   * POST /password-manager/items
   */
  createPasswordItem(request: CreatePasswordItemRequest): Observable<PasswordItemResponse> {
    return this.http.post<PasswordItemResponse>(
      `${this.apiUrl}/items`, 
      request, 
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get my password items
   * GET /password-manager/items
   */
  getMyPasswordItems(): Observable<PasswordItemResponse[]> {
    return this.http.get<PasswordItemResponse[]>(
      `${this.apiUrl}/items`, 
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get password item detail (includes ciphertextB64 for decryption)
   * GET /password-manager/items/{itemId}
   */
  getPasswordItemDetail(itemId: number): Observable<PasswordItemResponse> {
    return this.http.get<PasswordItemResponse>(
      `${this.apiUrl}/items/${itemId}`, 
      { headers: this.getHeaders() }
    );
  }

  /**
   * Delete password item
   * DELETE /password-manager/items/{itemId}
   */
  deletePasswordItem(itemId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/items/${itemId}`, 
      { headers: this.getHeaders() }
    );
  }

  // ==================== PASSWORD SHARES ====================

  /**
   * Share password with another user
   * POST /password-manager/shares
   */
  sharePassword(request: SharePasswordRequest): Observable<SharePasswordResponse> {
    return this.http.post<SharePasswordResponse>(
      `${this.apiUrl}/shares`, 
      request, 
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get passwords shared WITH ME (received)
   * GET /password-manager/shares/received
   */
  getReceivedShares(): Observable<SharePasswordResponse[]> {
    return this.http.get<SharePasswordResponse[]>(
      `${this.apiUrl}/shares/received`, 
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get passwords I SHARED with others (sent)
   * GET /password-manager/shares/sent
   */
  getSentShares(): Observable<SharePasswordResponse[]> {
    return this.http.get<SharePasswordResponse[]>(
      `${this.apiUrl}/shares/sent`, 
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get received share detail (includes ciphertextB64 for decryption)
   * GET /password-manager/shares/{shareId}
   */
 getReceivedShareDetail(shareId: number): Observable<SharePasswordResponse> {
  return this.http.get<SharePasswordResponse>(
    `${this.apiUrl}/shares/received/${shareId}`,  // ✅ TAČNO!
    { headers: this.getHeaders() }
  );
}

  /**
   * Delete share (revoke access)
   * DELETE /password-manager/shares/{shareId}
   */
  deleteShare(shareId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/shares/${shareId}`, 
      { headers: this.getHeaders() }
    );
  }

  // ==================== USERS WITH EE CERTIFICATES ====================

  /**
   * Get all users with END_ENTITY certificates (for share dropdown)
   * GET /api/user/with-ee-certificates
   */
  getEEUsers(): Observable<ShareableUser[]> {
    return this.http.get<ShareableUser[]>(
      'http://localhost:8080/api/user/with-ee-certificates', 
      { headers: this.getHeaders() }
    );
  }
}