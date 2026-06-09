import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, of, timer } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RegistrationService } from '../registration.service';

/** Debounced async validator — checks field availability against the API. */
/**
 * @param http HttpClient instance for making API requests.
 * @param field The field to validate ('email' or 'username').
 * @param debounceMs Debounce time in milliseconds before making the API call.
 * @returns An AsyncValidatorFn for Angular forms.
 */
function uniqueValidator(
  http: HttpClient,
  field: 'email' | 'username',
  debounceMs = 500,
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) return of(null);
    return timer(debounceMs).pipe(
      switchMap(() =>
        http.get<{ available: boolean }>(`/api/auth/registro/check/${field}`, {
          params: { value: control.value as string },
        })
      ),
      map(res => (res.available ? null : { [`${field}Taken`]: true })),
      catchError(() => of(null)), // fail open — never block user on transient API errors
    );
  };
}

export type FieldState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

@Component({
  selector: 'app-profile-step',
  standalone: false,
  templateUrl: './profile-step.component.html',
  styleUrl: './profile-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileStepComponent {
  private readonly svc        = inject(RegistrationService);
  private readonly fb         = inject(FormBuilder);
  private readonly http       = inject(HttpClient);
  private readonly cdr        = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.nonNullable.group({
    email: [
      '',
      [Validators.required, Validators.email],
      [uniqueValidator(this.http, 'email')],
    ],
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern(/^[a-zA-Z0-9_.\-]+$/),
      ],
      [uniqueValidator(this.http, 'username')],
    ],
  });

  constructor() {
    // OnPush: re-check view on every form status change (pending <-> valid <-> invalid)
    this.form.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());
  }

  /** Returns the current validation state of a field for visual feedback. */
  fieldState(name: 'email' | 'username'): FieldState {
    const ctrl = this.form.get(name);
    if (!ctrl || !ctrl.dirty || ctrl.value === '') return 'idle';
    if (ctrl.pending) return 'checking';
    if (ctrl.invalid) {
      return (ctrl.hasError('emailTaken') || ctrl.hasError('usernameTaken'))
        ? 'taken'
        : 'invalid';
    }
    return 'available';
  }

  get canContinue(): boolean { return this.form.valid && !this.form.pending; }

  onContinue(): void {
    if (!this.canContinue) { this.form.markAllAsTouched(); return; }
    const { email, username } = this.form.getRawValue();
    this.svc.patch({ email, username });
    this.svc.goNext();
  }

  onBack(): void { this.svc.goBack(); }

  fieldError(name: 'email' | 'username'): string {
    const ctrl = this.form.get(name);
    // Never show errors while async validation is still running
    if (!ctrl?.invalid || !ctrl.touched || ctrl.pending) return '';
    if (ctrl.hasError('required'))      return 'Este campo es requerido.';
    if (ctrl.hasError('email'))         return 'Ingresa un email válido.';
    if (ctrl.hasError('emailTaken'))    return 'Este correo ya está registrado.';
    if (ctrl.hasError('minlength'))     return 'Mínimo 3 caracteres.';
    if (ctrl.hasError('maxlength'))     return 'Máximo 30 caracteres.';
    if (ctrl.hasError('pattern'))       return 'Solo letras, números, puntos, guiones y guión bajo.';
    if (ctrl.hasError('usernameTaken')) return 'Este nombre de usuario ya está en uso.';
    return '';
  }
}
