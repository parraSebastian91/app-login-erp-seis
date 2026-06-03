import { Component } from '@angular/core';
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
export class LoginComponent {
  loading = false;
  errorMsg = '';
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

  get usernameCtrl() { return this.form.controls['username']; }
  get passwordCtrl() { return this.form.controls['password']; }

  async login() {
    this.submitted = true;
    if (this.form.invalid) return;

    const { username, password } = this.form.value;
    this.loading = true;
    this.errorMsg = '';

    try {
      const redirectUrl = await this.authService.loginWithEmailPassword(username, password);
      window.location.href = redirectUrl;
    } catch (err) {
      this.loading = false;
      const httpErr = err as HttpErrorResponse;
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
    this.router.navigate(['pages', 'restablecer-password']);
  }

  getThemeService(): ThemeService {
    return this.themeService;
  }

  switchTheme() {
    this.themeService.toggle();
  }
}
