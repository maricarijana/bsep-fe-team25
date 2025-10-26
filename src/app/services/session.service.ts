import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Session } from '../model/session.model';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private apiUrl = 'http://localhost:8080/api/auth/sessions';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  getSessions(): Observable<Session[]> {
    return this.http.get<Session[]>(this.apiUrl, {
      headers: this.getAuthHeaders(),
    });
  }

  revokeSession(jti: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/revoke`,
      { jti },
      { headers: this.getAuthHeaders() }
    );
  }

  revokeAllOthers(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/revoke-all`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }
}
