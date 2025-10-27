// interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // ========================================
  // 1. DODAVANJE JWT TOKENA U ZAHTJEV
  // ========================================

  // URL-ovi koji ne trebaju token
  const excludedUrls = [
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-email',
    // '/api/pki/certificates/crl',
  ];

  const isExcluded = excludedUrls.some((url) => req.url.includes(url));

  let clonedRequest = req;

  // Dodaj token ako postoji i nije excluded URL
  if (!isExcluded) {
    const token = localStorage.getItem('jwt');

    if (token) {
      clonedRequest = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('🔑 Token added to request:', req.url);
    } else {
      console.warn('⚠️ No token found for request:', req.url);
    }
  }

  // ========================================
  // 2. SLANJE ZAHTJEVA I HVATANJE GREŠAKA
  // ========================================

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('❌ HTTP Error caught:', {
        status: error.status,
        url: error.url,
        message: error.message,
      });

      // ========================================
      // 401 UNAUTHORIZED
      // ========================================
      if (error.status === 401) {
        const sessionRevoked = error.headers?.get('X-Session-Revoked');
        const errorBody = error.error;

        // Sesija revokana sa drugog uređaja
        if (
          sessionRevoked === 'true' ||
          errorBody?.error === 'SESSION_REVOKED'
        ) {
          console.log('🚫 Session revoked from another device!');

          localStorage.removeItem('jwt');

          router.navigate(['/login'], {
            queryParams: {
              reason: 'session-revoked',
              message: 'Your session was terminated from another device',
            },
          });
        }
        // Token istekao ili neispravan
        else {
          console.log('🔐 Token expired or invalid');

          localStorage.removeItem('jwt');

          router.navigate(['/login'], {
            queryParams: {
              reason: 'token-expired',
              message: 'Your session has expired. Please login again.',
            },
          });
        }
      }

      // ========================================
      // 403 FORBIDDEN
      // ========================================
      if (error.status === 403) {
        console.log('⛔ Access forbidden - insufficient permissions');

        router.navigate(['/forbidden'], {
          queryParams: {
            message: 'You do not have permission to access this resource',
          },
        });
      }

      // ========================================
      // 404 NOT FOUND
      // ========================================
      if (error.status === 404) {
        console.log('🔍 Resource not found:', error.url);
      }

      // ========================================
      // 500 SERVER ERROR
      // ========================================
      if (error.status === 500) {
        console.log('🔥 Internal server error');
      }

      // ========================================
      // 0 - NETWORK ERROR (Backend nije dostupan)
      // ========================================
      if (error.status === 0) {
        console.error('🌐 Network error - Backend is not reachable');
      }

      // Proslijedi grešku dalje za dodatnu obradu u komponentama
      return throwError(() => error);
    })
  );
};
