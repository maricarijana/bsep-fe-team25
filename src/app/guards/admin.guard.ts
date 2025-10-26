import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard koji štiti admin rute.
 * Provjerava da li je korisnik ulogovan I da li ima ADMIN role.
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Prvo provjeri da li je korisnik ulogovan
  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // Provjeri da li je korisnik admin
  if (!authService.isAdmin()) {
    // Nije admin, redirektuj na home sa error porukom
    router.navigate(['/home'], {
      queryParams: { error: 'Access denied. Admin privileges required.' },
    });
    return false;
  }

  return true;
};
