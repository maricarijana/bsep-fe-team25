import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { RecaptchaModule } from 'ng-recaptcha';
import { Router, RouterLink } from '@angular/router'; // ✅ dodaj RouterLink

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule, RecaptchaModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  credentials = {
    email: '',
    password: '',
    captchaToken: '',
  };

  successMessage: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onCaptchaResolved(token: string | null): void {
    this.credentials.captchaToken = token || '';
  }

  login(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.credentials.captchaToken) {
      this.errorMessage = 'Molimo potvrdite da niste robot.';
      return;
    }

    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        this.successMessage = res.message; // "Login successful"
        console.log('User info:', res);

        if (res.token) {
          localStorage.setItem('jwt', res.token); //  snimanje tokena
        }

        // Provjera da li korisnik mora promijeniti lozinku
        if (res.mustChangePassword) {
          localStorage.setItem('mustChangePassword', 'true');
          this.router.navigate(['/change-password']);
        } else {
          this.router.navigate(['/home']);
        }
      },
    error: (err) => {
  console.log('Full error object:', err); // ← pogledaj u konzoli šta backend vraća
  this.errorMessage = err.error?.message || err.message || 'Login failed!';
}
    });
  }
}
