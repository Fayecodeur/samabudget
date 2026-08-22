import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Auth } from '../../../core/services/auth';
import { NotificationService } from '../../../core/services/notification';

@Component({
  selector: 'app-reset-password',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword implements OnInit {
  form: FormGroup;
  token = '';
  tokenMissing = false;
  hideNewPassword = true;
  hideConfirmPassword = true;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: Auth,
    private notification: NotificationService,
  ) {
    this.form = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    const tokenParam = this.route.snapshot.queryParamMap.get('token');
    if (!tokenParam) {
      this.tokenMissing = true;
      return;
    }
    this.token = tokenParam;
  }

  get passwordsMismatch(): boolean {
    const { newPassword, confirmPassword } = this.form.value;
    return !!confirmPassword && newPassword !== confirmPassword;
  }

  onSubmit(): void {
    if (this.form.invalid || this.passwordsMismatch) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService.resetPassword(this.token, this.form.value.newPassword).subscribe({
      next: () => {
        this.successMessage = 'Mot de passe réinitialisé avec succès';
        this.isSubmitting = false;
        setTimeout(() => this.router.navigate(['/']), 2500);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Une erreur est survenue';
        this.isSubmitting = false;
      },
    });
  }
}
