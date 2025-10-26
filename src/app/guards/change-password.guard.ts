import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Guard koji štiti /change-password rutu.
 * Dozvoljava pristup samo ako korisnik ima mustChangePassword flag.
 */
export const changePasswordGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const mustChangePassword = localStorage.getItem('mustChangePassword');

  if (mustChangePassword === 'true') {
    return true;
  }

  // Ako nema flag, redirektuj na home
  router.navigate(['/home']);
  return false;
};

/**
 * Guard koji proverava da li korisnik mora da promeni lozinku
 * pre nego što pristupi zaštićenim rutama.
 * Ako ima mustChangePassword flag, redirektuje na /change-password.
 */
export const mustChangePasswordGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const mustChangePassword = localStorage.getItem('mustChangePassword');

  if (mustChangePassword === 'true') {
    router.navigate(['/change-password']);
    return false;
  }

  return true;
};
