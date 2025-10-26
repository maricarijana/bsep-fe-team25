import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { CreateCAUserRequest } from '../../../model/ca-user.model';

@Component({
  selector: 'app-create-ca-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-ca-user.component.html',
  styleUrls: ['./create-ca-user.component.scss'],
})
export class CreateCAUserComponent {
  @Output() userCreated = new EventEmitter<void>();

  formData: CreateCAUserRequest = {
    email: '',
    fullName: '',
    organization: '',
  };

  successMessage: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(private adminService: AdminService) {}

  /**
   * Validacija email formata
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Provjera da li je forma validna
   */
  isFormValid(): boolean {
    return (
      this.formData.email.length > 0 &&
      this.isValidEmail(this.formData.email) &&
      this.formData.fullName.length >= 3 &&
      this.formData.organization.length >= 2
    );
  }

  /**
   * Kreira novog CA korisnika
   */
  createCAUser(): void {
    this.successMessage = '';
    this.errorMessage = '';

    // Validacija
    if (!this.isValidEmail(this.formData.email)) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    if (this.formData.fullName.length < 3) {
      this.errorMessage = 'Full name must be at least 3 characters long.';
      return;
    }

    if (this.formData.organization.length < 2) {
      this.errorMessage = 'Organization must be at least 2 characters long.';
      return;
    }

    this.isLoading = true;

    this.adminService.createCAUser(this.formData).subscribe({
      next: (res) => {
        this.successMessage = `CA User created successfully! Login credentials have been sent to ${this.formData.email}`;
        this.isLoading = false;

        // Resetuj formu
        const createdEmail = this.formData.email;
        this.formData = {
          email: '',
          fullName: '',
          organization: '',
        };

        // Emituj event ka parent komponenti
        setTimeout(() => {
          this.userCreated.emit();
        }, 2000);
      },
      error: (err) => {
        this.errorMessage =
          err.error.message ||
          'Failed to create CA user. Please try again.';
        this.isLoading = false;
      },
    });
  }

  /**
   * Očisti poruke
   */
  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}
