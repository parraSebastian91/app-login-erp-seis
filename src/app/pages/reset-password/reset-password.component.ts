import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../service/auth.service';
import { ThemeService } from '../../core/theming/theme.service';

export type StrengthLevel = 1 | 2 | 3 | 4;

/** Calcula el nivel de fortaleza (1-4) según las reglas de HU-17 CA-04. */
export function calcStrength(value: string): StrengthLevel {
  if (value.length < 8) return 1;
  const hasUpper = /[A-Z]/.test(value);
  const hasNumber = /\d/.test(value);
  if (!hasUpper || !hasNumber) return 2;
  if (value.length >= 12 && /[^A-Za-z0-9]/.test(value)) return 4;
  return 3;
}

/** Validador personalizado: contraseñas deben coincidir. */
const passwordMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const pw = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { mismatch: true } : null;
};

type PageState = 'loading' | 'invalid-token' | 'form' | 'submitting';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
  state: PageState = 'loading';
  errorMsg = '';
  tokenErrorMsg = '';
  submitted = false;
  showNew = false;
  showConfirm = false;
  strengthLevel: StrengthLevel = 1;

  private token = '';
  private uuid = '';

  form: FormGroup;

  readonly STRENGTH_LABELS: Record<StrengthLevel, string> = {
    1: 'Muy débil',
    2: 'Débil',
    3: 'Aceptable',
    4: 'Fuerte',
  };

  readonly STRENGTH_CLASSES: Record<StrengthLevel, string> = {
    1: 'strength-1',
    2: 'strength-2',
    3: 'strength-3',
    4: 'strength-4',
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private themeService: ThemeService,
  ) {
    this.form = this.fb.group(
      {
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordMatchValidator },
    );

    // Actualizar medidor en tiempo real
    this.form.get('newPassword')!.valueChanges.subscribe((val: string) => {
      this.strengthLevel = calcStrength(val ?? '');
    });
  }

  get newPwCtrl() { return this.form.get('newPassword')!; }
  get confirmPwCtrl() { return this.form.get('confirmPassword')!; }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    this.token = (params['token'] as string) ?? '';
    this.uuid  = (params['uuid']  as string) ?? '';

    if (!this.token || !this.uuid) {
      this.tokenErrorMsg = 'El enlace de recuperación no es válido. Faltan parámetros requeridos.';
      this.state = 'invalid-token';
      return;
    }

    this.authService.validateToken(this.token, this.uuid)
      .then(res => {
        if (res?.valid) {
          this.state = 'form';
        } else {
          this.tokenErrorMsg = 'El enlace expiró o ya fue utilizado.';
          this.state = 'invalid-token';
        }
      })
      .catch(() => {
        this.tokenErrorMsg = 'El enlace expiró o ya fue utilizado.';
        this.state = 'invalid-token';
      });
  }

  async submitReset(): Promise<void> {
    this.submitted = true;
    if (this.form.invalid) return;

    const { newPassword, confirmPassword } = this.form.value;
    this.state = 'submitting';
    this.errorMsg = '';

    try {
      await this.authService.resetPassword({
        token: this.token,
        uuid: this.uuid,
        newPassword,
        confirmPassword,
      });
      this.router.navigate(['pages', 'login'], {
        state: { toast: 'password-updated' },
      });
    } catch (err) {
      this.state = 'form';
      const httpErr = err as HttpErrorResponse;
      if (httpErr.status === 400) {
        const msg: string = httpErr.error?.message ?? '';
        if (/reutilizar|reuse|history/i.test(msg)) {
          this.errorMsg = 'No puedes reutilizar una contraseña anterior.';
          return;
        }
        this.tokenErrorMsg = 'El enlace expiró o ya fue utilizado.';
        this.state = 'invalid-token';
      } else {
        this.errorMsg = 'No se pudo actualizar la contraseña. Intenta más tarde.';
      }
    }
  }

  goToForgotPassword(): void {
    this.router.navigate(['pages', 'forgot-password']);
  }

  getThemeService(): ThemeService { return this.themeService; }
}
