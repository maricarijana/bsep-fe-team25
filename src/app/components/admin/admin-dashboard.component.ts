import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateCAUserComponent } from './create-ca-user/create-ca-user.component';
import { CAUsersListComponent } from './ca-users-list/ca-users-list.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, CreateCAUserComponent, CAUsersListComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent {
  activeTab: 'create' | 'list' = 'create';

  setActiveTab(tab: 'create' | 'list'): void {
    this.activeTab = tab;
  }

  // Event handler kada se uspešno kreira novi CA user
  onUserCreated(): void {
    // Automatski prebaci na listu da korisnik vidi novo kreiranog korisnika
    this.activeTab = 'list';
  }
}
