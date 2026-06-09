import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { RegistrationService } from '../registration.service';

@Component({
  selector: 'app-credentials-step',
  standalone: false,
  templateUrl: './credentials-step.component.html',
  styleUrl: './credentials-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CredentialsStepComponent {
  private readonly svc = inject(RegistrationService);
  private readonly fb  = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly showPassword  = signal(false);
  readonly showConfirm   = signal(false);
  readonly loading       = signal(false);
  readonly serverError   = signal('');

  readonly form = this.fb.nonNullable.group(
    {
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
      ]],
      confirm:       ['', Validators.required],
      acceptedTerms: [false, Validators.requiredTrue],
    },
    { validators: (group: AbstractControl) => {
        const pw = group.get('password')?.value;
        const cf = group.get('confirm')?.value;
        return pw && cf && pw !== cf ? { mismatch: true } : null;
      }
    }
  );

  get passwordValue(): string { return this.form.get('password')?.value ?? ''; }
  get canContinue(): boolean  { return this.form.valid && !this.loading(); }

  onContinue(): void {
    if (!this.canContinue) { this.form.markAllAsTouched(); return; }

    const { password, acceptedTerms } = this.form.getRawValue();
    this.svc.patch({ password, acceptedTerms });

    this.loading.set(true);
    this.serverError.set('');

    // register() sends all collected data to the backend.
    // The backend creates the user and dispatches an OTP email.
    // Only on success do we advance to the OTP verification step.
    this.svc.register().subscribe({
      next: () => {
        this.loading.set(false);
        this.svc.goNext();
      },
      error: (err) => {
        this.loading.set(false);
        const msg: string =
          err?.error?.message ?? err?.message ?? null;
        this.serverError.set(
          msg || 'No se pudo completar el registro. Intenta nuevamente.',
        );
        this.cdr.markForCheck();
      },
    });
  }

  onBack(): void { this.svc.goBack(); }

  fieldError(name: 'password' | 'confirm'): string {
    const ctrl = this.form.get(name);
    if (!ctrl?.touched) return '';
    if (ctrl.hasError('required'))  return 'Este campo es requerido.';
    if (ctrl.hasError('minlength')) return 'Mínimo 8 caracteres.';
    if (ctrl.hasError('pattern'))   return 'Debe incluir mayúscula, minúscula y número.';
    if (name === 'confirm' && this.form.hasError('mismatch')) return 'Las contraseñas no coinciden.';
    return '';
  }
}
