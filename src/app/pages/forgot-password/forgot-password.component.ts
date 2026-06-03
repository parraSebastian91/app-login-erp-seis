import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../service/auth.service';
import { ThemeService } from '../../core/theming/theme.service';

type Step = 'request' | 'sent';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent implements OnDestroy {
  step: Step = 'request';
  loading = false;
  errorMsg = '';
  submitted = false;
  sentEmail = '';

  countdown = 60;
  resendDisabled = true;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService,
  ) {
    this.form = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
    });
  }

  get correoCtrl() { return this.form.controls['correo']; }

  async sendRequest(): Promise<void> {
    this.submitted = true;
    if (this.form.invalid) return;

    const { correo } = this.form.value;
    this.loading = true;
    this.errorMsg = '';

    try {
      await this.authService.validateEmail(correo);
    } catch (err) {
      const httpErr = err as HttpErrorResponse;
      // 404 = correo no existe → igual mostramos Pantalla B (no revelar)
      if (httpErr.status !== 404) {
        this.loading = false;
        this.errorMsg = 'No se pudo procesar. Intenta más tarde.';
        return;
      }
    } finally {
      this.loading = false;
    }

    this.sentEmail = correo;
    this.step = 'sent';
    this.startCountdown();
  }

  async resend(): Promise<void> {
    if (this.resendDisabled) return;
    this.loading = true;
    this.errorMsg = '';
    try {
      await this.authService.validateEmail(this.sentEmail);
    } catch (err) {
      const httpErr = err as HttpErrorResponse;
      if (httpErr.status !== 404) {
        this.errorMsg = 'No se pudo reenviar. Intenta más tarde.';
      }
    } finally {
      this.loading = false;
    }
    this.startCountdown();
  }

  private startCountdown(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.countdown = 60;
    this.resendDisabled = true;
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.resendDisabled = false;
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
    }, 1000);
  }

  backToLogin(): void {
    this.router.navigate(['pages', 'login']);
  }

  getThemeService(): ThemeService { return this.themeService; }

  ngOnDestroy(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }
}
