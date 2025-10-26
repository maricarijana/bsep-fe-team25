import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { CAUserResponse } from '../../../model/ca-user.model';

@Component({
  selector: 'app-ca-users-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ca-users-list.component.html',
  styleUrls: ['./ca-users-list.component.scss'],
})
export class CAUsersListComponent implements OnInit {
  caUsers: CAUserResponse[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadCAUsers();
  }

  /**
   * Učitava listu svih CA korisnika
   */
  loadCAUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminService.getAllCAUsers().subscribe({
      next: (users) => {
        this.caUsers = users;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage =
          err.error.message || 'Failed to load CA users. Please try again.';
        this.isLoading = false;
      },
    });
  }

  /**
   * Refresh tabele
   */
  refreshList(): void {
    this.loadCAUsers();
  }
}
