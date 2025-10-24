import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  password: string = '';
  confirmPassword: string = '';
  message: string = '';
  error: string = '';
  token: string = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
  }

  resetPassword() {
    this.message = '';
    this.error = '';

    if (!this.password || !this.confirmPassword) {
      this.error = 'Popunite oba polja.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Lozinke se ne poklapaju.';
      return;
    }

    this.http
      .post(`http://localhost:8080/api/password/reset/${this.token}`, {
        password: this.password,
      })
      .subscribe({
        next: (res: any) => {
          this.message = res.message;
          setTimeout(() => this.router.navigate(['/login']), 3000);
        },
        error: (err) => {
          this.error =
            err.error?.message || 'Greška prilikom resetovanja lozinke.';
        },
      });
  }
}
