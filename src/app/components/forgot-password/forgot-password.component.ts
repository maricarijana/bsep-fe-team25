import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  email: string = '';
  message: string = '';
  error: string = '';

  constructor(private http: HttpClient) {}

  sendResetLink() {
    this.message = '';
    this.error = '';

    if (!this.email) {
      this.error = 'Molimo unesite svoj email.';
      return;
    }

    this.http
      .post('http://localhost:8080/api/password/request-reset', {
        email: this.email,
      })
      .subscribe({
        next: (res: any) => {
          this.message = res.message;
        },
        error: (err) => {
          this.error =
            err.error?.message || 'Greška prilikom slanja linka za reset.';
        },
      });
  }
}
