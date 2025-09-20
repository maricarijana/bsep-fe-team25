import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { User } from '../../model/user.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
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

  constructor(private authService: AuthService) {}

  register(): void {
    this.authService.register(this.user).subscribe({
      next: (res) => (this.message = res),
      error: (err) => (this.message = err.error),
    });
  }
}
