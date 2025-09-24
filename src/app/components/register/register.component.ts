import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { User } from '../../model/user.model';
import { FormsModule } from '@angular/forms';
import zxcvbn from 'zxcvbn';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  user: User = {
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    surname: '',
    organization: '',
  };

  message: string = '';
  passwordStrength: number = 0;
  passwordFeedback: string = '';
  successMessage: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService) {}

  checkPasswordStrength() {
    if (this.user.password) {
      const result = zxcvbn(this.user.password);
      this.passwordStrength = result.score; // 0 - 4
      this.passwordFeedback = result.feedback.warning || 'Good password';
    } else {
      this.passwordStrength = 0;
      this.passwordFeedback = '';
    }
  }

  getStrengthColor(): string {
    switch (this.passwordStrength) {
      case 0:
        return 'red';
      case 1:
        return 'orange';
      case 2:
        return 'yellow';
      case 3:
        return 'lightgreen';
      case 4:
        return 'green';
      default:
        return 'grey';
    }
  }

  register(): void {
    if (this.user.password !== this.user.confirmPassword) {
      this.errorMessage = 'Passwords do not match!';
      return;
    }

    if (this.passwordStrength < 3) {
      this.errorMessage = 'Password is too weak!';
      return;
    }

    this.authService.register(this.user).subscribe({
      next: (res) => {
        this.successMessage = res.message; // ovde dobijes "Please check your email..."
        this.user = {
          email: '',
          password: '',
          confirmPassword: '',
          name: '',
          surname: '',
          organization: '',
        };
        this.passwordStrength = 0;
        this.passwordFeedback = '';
      },
      error: (err) => {
        this.errorMessage = err.error.message || 'Registration failed!';
      },
    });
  }
}
