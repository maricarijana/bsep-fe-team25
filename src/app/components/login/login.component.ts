import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  credentials = {
    email: '',
    password: '',
  };

  successMessage: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  login(): void {
    this.successMessage = '';
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        this.successMessage = res.message; // "Login successful"
        console.log('User info:', res);

        if (res.token) {
          localStorage.setItem('jwt', res.token); //  snimanje tokena
        }
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.errorMessage = err.error.message || 'Login failed!';
      },
    });
  }
}
