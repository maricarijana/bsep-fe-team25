import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { User } from '../model/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}

  // Helper metoda za JWT headers
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  register(user: User): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, user);
  }

  activate(token: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/activate/${token}`);
  }

  login(credentials: {
    email: string;
    password: string;
    captchaToken?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        console.log('🔍 Login response:', res); // ← PROVERI OVDE ŠTA BACKEND ŠALJE
        
        if (res && res.token) {
          localStorage.setItem('jwt', res.token);
          console.log('✅ JWT saved');
        }
        
        if (res && res.role) {
          localStorage.setItem('userRole', res.role);
          console.log('✅ Role saved:', res.role);
        } else {
          console.warn('⚠️ Role NOT found in response!');
        }
        
        if (res && res.mustChangePassword !== undefined) {
          localStorage.setItem('mustChangePassword', res.mustChangePassword.toString());
          console.log('✅ mustChangePassword saved:', res.mustChangePassword);
        } else {
          console.warn('⚠️ mustChangePassword NOT found in response!');
        }
      })
    );
  }

  isLoggedIn(): boolean {
    const t = localStorage.getItem('jwt');
    return !!t;
  }

  getUserRole(): string | null {
    return localStorage.getItem('userRole');
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'ADMIN';
  }

  clearLocalAuth(): void {
    localStorage.removeItem('jwt');
    localStorage.removeItem('userRole');
    localStorage.removeItem('mustChangePassword');
  }

  logout(): Observable<any> {
    const token = localStorage.getItem('jwt');
    if (!token) {
      this.clearLocalAuth();
      return of({ message: 'No token locally' });
    }

    return this.http.post<any>(`${this.apiUrl}/logout`, {}, { headers: this.getHeaders() }).pipe(
      tap(() => {
        this.clearLocalAuth();
      }),
      catchError((err) => {
        this.clearLocalAuth();
        throw err;
      })
    );
  }

  changePassword(
    oldPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/change-password`,
      {
        oldPassword,
        newPassword,
        confirmPassword,
      },
      { headers: this.getHeaders() }
    );
  }
}