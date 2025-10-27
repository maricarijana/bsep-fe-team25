import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { HomePageComponent } from './components/home-page/home-page.component';
import { authGuard } from './guards/auth.guard';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { CertificateListComponent } from './components/certificates/certificate-list/certificate-list.component';
import { CertificateCreateComponent } from './components/certificates/certificate-create/certificate-create.component';
import { CertificateDetailsComponent } from './components/certificates/certificate-details/certificate-details.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard.component';
import {
  changePasswordGuard,
  mustChangePasswordGuard,
} from './guards/change-password.guard';

import { adminGuard } from './guards/admin.guard';
import { PasswordListComponent } from './components/password-manager/password-list/password-list.component';
import { PasswordCreateComponent } from './components/password-manager/password-create/password-create.component';
import { SharedPasswordsComponent } from './components/password-manager/shared-passwords/shared-passwords.component';
import { PasswordDetailComponent } from './components/password-manager/password-detail/password-detail.component';
import { PasswordShareComponent } from './components/password-manager/password-share/password-share.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password/:token', component: ResetPasswordComponent },
  // Ruta za obaveznu promjenu lozinke
  {
    path: 'change-password',
    component: ChangePasswordComponent,
    canActivate: [authGuard, changePasswordGuard],
  },
  // Sve zaštićene rute provjeravaju mustChangePassword flag
  {
    path: 'home',
    component: HomePageComponent,
    canActivate: [authGuard, mustChangePasswordGuard],
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard, mustChangePasswordGuard],
  },
  {
    path: 'certificates',
    canActivate: [authGuard, mustChangePasswordGuard],
    children: [
      { path: '', component: CertificateListComponent },
      { path: 'create', component: CertificateCreateComponent },
      { path: ':serialNumber', component: CertificateDetailsComponent },
    ],
  },
  // Admin rute - backend provjerava role preko JWT tokena
  {
    path: 'admin/ca-users',
    component: AdminDashboardComponent,
    canActivate: [authGuard, mustChangePasswordGuard],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
 // ✅ PASSWORD MANAGER ROUTES
  {
    path: 'password-manager',
    canActivate: [authGuard, mustChangePasswordGuard],
    children: [
      { path: '', component: PasswordListComponent },
      { path: 'create', component: PasswordCreateComponent },
      { path: 'shared', component: SharedPasswordsComponent },
      { path: ':id', component: PasswordDetailComponent },
      { path: ':id/share', component: PasswordShareComponent },
    ],
  },
  {
    path: 'admin/ca-users',
    component: AdminDashboardComponent,
    canActivate: [authGuard, mustChangePasswordGuard],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
