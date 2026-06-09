import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../service/auth.service';
import { ThemeService } from '../../core/theming/theme.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loading = false;
  errorMsg = '';
  successMsg = '';
  submitted = false;
  showPassword = false;

  form: FormGroup;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private themeService: ThemeService,
    private router: Router
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    const state = this.router.lastSuccessfulNavigation?.extras?.state as Record<string, unknown> | undefined;
    if (state?.['toast'] === 'password-updated') {
      this.successMsg = 'Contraseña actualizada. Puedes iniciar sesión.';
    }
  }

  get usernameCtrl() { return this.form.controls['username']; }
  get passwordCtrl() { return this.form.controls['password']; }

  async login() {
    this.submitted = true;
    if (this.form.invalid) return;

    const { username, password } = this.form.value;
    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';

    try {
      const redirectUrl = await this.authService.loginWithEmailPassword(username, password);
      globalThis.location.href = redirectUrl;
    } catch (err) {
      this.loading = false;
      const httpErr = err as HttpErrorResponse;

      // Backend signals that the account exists but email is not yet verified.
      // Redirect to the OTP step with the email as a query param so the wizard
      // can auto-send a fresh code without requiring the user to re-fill the form.
      if (
        (httpErr.status === 403 || httpErr.status === 401) &&
        httpErr.error?.code === 'EMAIL_NOT_VERIFIED'
      ) {
        const pendingEmail: string = httpErr.error?.email ?? username;
        this.router.navigate(['/registro'], {
          queryParams: { verify: pendingEmail },
        });
        return;
      }

      if (httpErr.status === 401 || httpErr.status === 403) {
        this.errorMsg = 'Nombre de usuario o contraseña incorrectos.';
      } else if (httpErr.status === 0) {
        this.errorMsg = 'No se pudo conectar. Verifica tu conexión e intenta nuevamente.';
      } else if (httpErr.status >= 500) {
        this.errorMsg = 'Error del servidor. Intenta más tarde.';
      } else {
        this.errorMsg = 'Ocurrió un error inesperado. Intenta nuevamente.';
      }
    }
  }

  forgotPassword() {
    this.router.navigate(['pages', 'forgot-password']);
  }

  getThemeService(): ThemeService {
    return this.themeService;
  }

  switchTheme() {
    this.themeService.toggle();
  }
}
