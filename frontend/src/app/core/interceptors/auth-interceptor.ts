import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Auth } from '../services/auth';
import { NotificationService } from '../services/notification';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(Auth);
  const router = inject(Router);
  const notification = inject(NotificationService);
  const token = authService.getToken();

  const clonedReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(clonedReq).pipe(
    catchError((error) => {
      if (error.status === 401 && token) {
        authService.logout();
        notification.error('Votre session a expiré, veuillez vous reconnecter');
        router.navigate(['/']);
      }
      return throwError(() => error);
    }),
  );
};
