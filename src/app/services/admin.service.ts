import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CAUserResponse,
  CreateCAUserRequest,
  CreateCAUserResponse,
} from '../model/ca-user.model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = 'http://localhost:8080/api/admin';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Kreira novog CA korisnika
   * Backend automatski generiše lozinku i šalje je na email
   */
  createCAUser(data: CreateCAUserRequest): Observable<CreateCAUserResponse> {
    return this.http.post<CreateCAUserResponse>(
      `${this.apiUrl}/ca-users`,
      data,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Dohvata sve CA korisnike
   */
  getAllCAUsers(): Observable<CAUserResponse[]> {
    return this.http.get<CAUserResponse[]>(`${this.apiUrl}/ca-users`, {
      headers: this.getHeaders()
    });
  }
}
