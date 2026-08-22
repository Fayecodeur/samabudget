import { Injectable } from '@angular/core';
import { toast } from 'ngx-sonner';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  success(message: string, duration = 3000): void {
    toast.success(message, { duration });
  }

  error(message: string, duration = 4000): void {
    toast.error(message, { duration });
  }
}
