import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../model/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth'; // backend URL

  constructor(private http: HttpClient) {}

  register(user: User): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user, {
      responseType: 'text',
    });
  }

  activate(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/activate/${token}`, {
      responseType: 'text',
    });
  }
}
