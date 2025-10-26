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

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: HomePageComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password/:token', component: ResetPasswordComponent },
  {
    path: 'certificates',
    canActivate: [authGuard],
    children: [
      { path: '', component: CertificateListComponent },
      { path: 'create', component: CertificateCreateComponent },
      { path: ':serialNumber', component: CertificateDetailsComponent },
    ],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
