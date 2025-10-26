import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { Session } from '../../model/session.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  sessions: Session[] = [];
  loading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(private sessionService: SessionService, private router: Router) {}

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.loading = true;
    this.clearMessages();

    this.sessionService.getSessions().subscribe({
      next: (sessions) => {
        this.sessions = sessions;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading sessions:', err);
        this.errorMessage = 'Failed to load sessions. Please try again.';
        this.loading = false;
      },
    });
  }

  revokeSession(jti: string): void {
    if (!confirm('Are you sure you want to revoke this session?')) {
      return;
    }

    this.clearMessages();
    this.sessionService.revokeSession(jti).subscribe({
      next: () => {
        this.successMessage = 'Session revoked successfully';
        this.loadSessions();
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (err) => {
        console.error('Error revoking session:', err);
        this.errorMessage = 'Failed to revoke session. Please try again.';
        setTimeout(() => this.clearMessages(), 3000);
      },
    });
  }

  revokeAllOthers(): void {
    if (!confirm('Are you sure you want to log out of all other sessions?')) {
      return;
    }

    this.clearMessages();
    this.sessionService.revokeAllOthers().subscribe({
      next: () => {
        this.successMessage = 'All other sessions have been revoked successfully';
        this.loadSessions();
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (err) => {
        console.error('Error revoking sessions:', err);
        this.errorMessage = 'Failed to revoke sessions. Please try again.';
        setTimeout(() => this.clearMessages(), 3000);
      },
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}
