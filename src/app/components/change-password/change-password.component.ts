import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import zxcvbn from 'zxcvbn';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
})
export class ChangePasswordComponent {
  oldPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  showOldPassword: boolean = false;
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;

  passwordStrength: number = 0;
  passwordFeedback: string = '';

  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  /**
   * Proverava jačinu lozinke koristeći zxcvbn biblioteku
   */
  checkPasswordStrength(): void {
    if (this.newPassword) {
      const result = zxcvbn(this.newPassword);
      this.passwordStrength = result.score; // 0 - 4
      this.passwordFeedback = result.feedback.warning || 'Good password';
    } else {
      this.passwordStrength = 0;
      this.passwordFeedback = '';
    }
  }

  /**
   * Vraća boju za strength indicator
   */
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

  /**
   * Toggle za prikaz/skrivanje lozinke
   */
  togglePasswordVisibility(field: 'old' | 'new' | 'confirm'): void {
    switch (field) {
      case 'old':
        this.showOldPassword = !this.showOldPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  /**
   * Validacija forme
   */
  isFormValid(): boolean {
    return (
      this.oldPassword.length > 0 &&
      this.newPassword.length > 0 &&
      this.confirmPassword.length > 0 &&
      this.newPassword === this.confirmPassword &&
      this.passwordStrength >= 3
    );
  }

  /**
   * Poziva API za promenu lozinke
   */
  changePassword(): void {
    this.errorMessage = '';
    this.successMessage = '';

    // Validacija
    if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'All fields are required!';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match!';
      return;
    }

    if (this.passwordStrength < 3) {
      this.errorMessage = 'Password is too weak! Please choose a stronger password.';
      return;
    }

    if (this.oldPassword === this.newPassword) {
      this.errorMessage = 'New password must be different from the old password!';
      return;
    }

    this.isLoading = true;

    this.authService
      .changePassword(this.oldPassword, this.newPassword, this.confirmPassword)
      .subscribe({
        next: (res) => {
          this.successMessage = res.message || 'Password changed successfully!';
          this.isLoading = false;

          // Ukloni flag iz localStorage
          localStorage.removeItem('mustChangePassword');

          // Redirektuj na home nakon 2 sekunde
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 2000);
        },
        error: (err) => {
          this.errorMessage =
            err.error.message || 'Failed to change password. Please try again.';
          this.isLoading = false;
        },
      });
  }
}
