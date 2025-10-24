import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { User } from '../model/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth'; // backend URL

  constructor(private http: HttpClient) {}

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
        if (res && res.token) {
          localStorage.setItem('jwt', res.token);
        }
      })
    );
  }

  // Vrati true ako imamo token (pojednostavljeno). Možeš produžiti provjerom isteka tokena.
  isLoggedIn(): boolean {
    const t = localStorage.getItem('jwt');
    return !!t;
  }

  // Očisti lokalne auth podatke bez poziva servera
  clearLocalAuth(): void {
    localStorage.removeItem('jwt');
  }

  // Logout: poziv backend-a da opozove sesiju + čišćenje lokalnog tokena
  logout(): Observable<any> {
    const token = localStorage.getItem('jwt');
    if (!token) {
      // nema tokena, odmah očisti i vrati observable
      this.clearLocalAuth();
      return of({ message: 'No token locally' });
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.post<any>(`${this.apiUrl}/logout`, {}, { headers }).pipe(
      tap(() => {
        this.clearLocalAuth();
      }),
      catchError((err) => {
        // u slučaju greške, ipak očisti lokalno i proslijedi error
        this.clearLocalAuth();
        throw err;
      })
    );
  }
}
