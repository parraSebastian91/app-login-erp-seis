import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  computed,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { RegistrationService } from '../registration.service';

@Component({
  selector: 'app-registration-page',
  standalone: false,
  templateUrl: './registration-page.component.html',
  styleUrl: './registration-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationPageComponent implements OnInit {
  readonly svc        = inject(RegistrationService);
  readonly currentStep = this.svc.step;
  private  readonly route      = inject(ActivatedRoute);
  private  readonly cdr        = inject(ChangeDetectorRef);
  private  readonly destroyRef = inject(DestroyRef);

  /** True while auto-sending the OTP after a resume redirect from login. */
  readonly resumeLoading = signal(false);
  readonly resumeError   = signal('');

  /** 0-based step index for progress bar (4 visible steps: 1-4) */
  readonly progressPct = computed(() => {
    const s = this.currentStep();
    return s === 0 ? 0 : Math.round(((s - 1) / 3) * 100);
  });

  readonly stepLabels = ['Perfil', 'Datos personales', 'Contraseña', 'Verificación'];

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('verify');
    if (!email) return;

    // User was redirected here from login with a pending verification.
    // Jump to the OTP step and auto-send a fresh code.
    this.resumeLoading.set(true);
    this.svc.resumeVerification(email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.resumeLoading.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.resumeLoading.set(false);
          this.resumeError.set(
            'No se pudo enviar el código. Usa el botón "Reenviar" en la pantalla de verificación.'
          );
          this.cdr.markForCheck();
        },
      });
  }
}
