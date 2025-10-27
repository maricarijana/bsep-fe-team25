// src/app/password-manager/password-list/password-list.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PasswordManagerService } from '../../../services/password-manager.service';

import { SharePasswordResponse } from '../../../model/password-share.model';
import { PasswordItemResponse } from '../../../model/passwor-item.model';

@Component({
  selector: 'app-password-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatSnackBarModule],
  templateUrl: './password-list.component.html',
  styleUrls: ['./password-list.component.scss']
})
export class PasswordListComponent implements OnInit {
  myPasswords: PasswordItemResponse[] = [];
  sharedWithMe: SharePasswordResponse[] = [];
  
  loading: boolean = false;
  activeTab: 'my' | 'shared' = 'my';
  deleting: { [key: number]: boolean } = {};

  constructor(
    private passwordService: PasswordManagerService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadMyPasswords();
    this.loadSharedPasswords();
  }

  loadMyPasswords(): void {
    this.loading = true;
    this.passwordService.getMyPasswordItems().subscribe({
      next: (passwords) => {
        this.myPasswords = passwords;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load passwords:', error);
        this.snackBar.open('Failed to load passwords', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  loadSharedPasswords(): void {
    this.passwordService.getReceivedShares().subscribe({
      next: (shared) => {
        this.sharedWithMe = shared;
      },
      error: (error) => {
        console.error('Failed to load shared passwords:', error);
      }
    });
  }

  switchTab(tab: 'my' | 'shared'): void {
    this.activeTab = tab;
  }

  createNewPassword(): void {
    this.router.navigate(['/password-manager/create']);
  }

  viewPassword(itemId: number): void {
    this.router.navigate(['/password-manager', itemId]);
  }

  viewSharedPassword(shareId: number): void {
    this.router.navigate(['/password-manager/shared', shareId]);
  }

  deletePassword(itemId: number, event?: Event): void {
    event?.stopPropagation();
     const password = this.myPasswords.find(p => p.id === itemId);
      if (!password) return;

    if (!confirm(`Are you sure you want to delete password for ${password.website}?`)) {
      return;
    }
     this.deleting[itemId] = true;

    this.passwordService.deletePasswordItem(itemId).subscribe({
      next: () => {
        this.snackBar.open('Password deleted successfully', 'Close', { duration: 3000 });
        this.loadMyPasswords();
        delete this.deleting[itemId];  
      },
      error: (error) => {
        console.error('Failed to delete password:', error);
        this.snackBar.open('Failed to delete password', 'Close', { duration: 3000 });
        delete this.deleting[itemId];  
      }
    });
  }

  deleteShare(shareId: number,event?: Event): void {
     event?.stopPropagation();
  
  const share = this.sharedWithMe.find(s => s.id === shareId);
  if (!share) return;

  if (!confirm(`Are you sure you want to remove access to ${share.siteLabel}?`)) {
    return;
  }
     this.deleting[shareId] = true;

    this.passwordService.deleteShare(shareId).subscribe({
      next: () => {
        this.snackBar.open('Access removed successfully', 'Close', { duration: 3000 });
        this.loadSharedPasswords();
         delete this.deleting[shareId];
      },
      error: (error) => {
        console.error('Failed to remove access:', error);
        this.snackBar.open('Failed to remove access', 'Close', { duration: 3000 });
         delete this.deleting[shareId];  
      }
    });
  }

  sharePassword(itemId: number): void {
    this.router.navigate(['/password-manager', itemId], { 
      queryParams: { action: 'share' } 
    });
  }
  getWebsiteInitial(website: string): string {
  return website ? website.charAt(0).toUpperCase() : '?';
}

formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
}