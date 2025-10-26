import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      // Debug: Loguj error objekat i headere
      console.log('Interceptor caught error:', error);
      console.log('Error status:', error.status);
      console.log('Error headers:', error.headers);

      // Proveri da li je sesija revokana sa drugog uređaja
      if (error.status === 401) {
        const sessionRevoked = error.headers?.get('X-Session-Revoked');
        console.log('X-Session-Revoked header:', sessionRevoked);

        // Proveri i u error body-u
        const errorBody = error.error;
        console.log('Error body:', errorBody);

        if (sessionRevoked === 'true' || errorBody?.error === 'SESSION_REVOKED') {
          console.log('Session was revoked! Logging out...');

          // Sesija je revokana, očisti token i izloguj
          localStorage.removeItem('jwt');

          // Redirektuj na login sa porukom
          router.navigate(['/login'], {
            queryParams: { reason: 'session-revoked' }
          });
        }
      }

      // Proslijedi grešku dalje za normalnu obradu
      return throwError(() => error);
    })
  );
};
