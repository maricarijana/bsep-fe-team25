import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; // prilagodi putanju

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="nav">
      <a routerLink="/home">Home</a>
      <a routerLink="/register" *ngIf="!isLoggedIn()">Register</a>

      <!-- logout button vidljiv SAMO kad je korisnik ulogovan -->
      <button *ngIf="isLoggedIn()" (click)="logout()" class="logout-btn">
        Logout
      </button>
    </nav>
  `,
  styles: [
    `
      .nav {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .logout-btn {
        background: #e53e3e;
        color: white;
        border: none;
        padding: 6px 10px;
        border-radius: 4px;
        cursor: pointer;
      }
    `,
  ],
})
export class NavBarComponent {
  constructor(private authService: AuthService, private router: Router) {}

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        // nakon uspješne logout akcije idi na login
        this.router.navigate(['/login']);
      },
      error: () => {
        // i ako logout na serveru ne uspije, ipak očisti stanje lokalno
        this.authService.clearLocalAuth();
        this.router.navigate(['/login']);
      },
    });
  }
}
