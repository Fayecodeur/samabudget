import { Component, Inject, ChangeDetectorRef, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { NotificationService } from '../../../core/services/notification';
import { MatProgressSpinnerModule, MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-auth-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinner,
  ],
  templateUrl: './auth-dialog.html',
  styleUrl: './auth-dialog.scss',
})
export class AuthDialog {
  mode: 'login' | 'register' | 'forgot';
  loginForm: FormGroup;
  registerForm: FormGroup;
  forgotForm: FormGroup;
  errorMessage = '';
  forgotSuccessMessage = '';
  isSubmitting = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private notification: NotificationService,
    private router: Router,
    private dialogRef: MatDialogRef<AuthDialog>,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'login' | 'register' },
  ) {
    this.mode = data.mode;

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  switchMode(mode: 'login' | 'register' | 'forgot'): void {
    this.mode = mode;
    this.errorMessage = '';
    this.forgotSuccessMessage = '';
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    const { email, password } = this.loginForm.value;
    this.authService.login(email, password).subscribe({
      next: () => {
        this.dialogRef.close();
        this.router.navigate(['/app/dashboard']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur de connexion';
        this.isSubmitting.set(false);
        this.cdr.detectChanges();
      },
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const { name, email, password } = this.registerForm.value;

    this.authService.register(name, email, password).subscribe({
      next: () => {
        this.notification.success('Compte créé avec succès, connectez-vous', 5000);
        this.switchMode('login');
        this.loginForm.patchValue({ email });
        this.isSubmitting.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || "Erreur lors de l'inscription";
        this.isSubmitting.set(false);
        this.cdr.detectChanges();
      },
    });
  }

  onForgotPassword(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage = '';
    const { email } = this.forgotForm.value;

    this.authService.forgotPassword(email).subscribe({
      next: (res) => {
        this.forgotSuccessMessage = res.message;
        this.isSubmitting.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur, veuillez réessayer';
        this.isSubmitting.set(false);
        this.cdr.detectChanges();
      },
    });
  }
}
