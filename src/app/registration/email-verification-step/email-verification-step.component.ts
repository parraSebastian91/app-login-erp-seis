import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { RegistrationService } from '../registration.service';
import { OtpInputComponent } from '../otp-input/otp-input.component';

@Component({
  selector: 'app-email-verification-step',
  standalone: false,
  templateUrl: './email-verification-step.component.html',
  styleUrl: './email-verification-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailVerificationStepComponent {
  private readonly svc        = inject(RegistrationService);
  private readonly cdr        = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading          = signal(false);
  readonly error            = signal('');
  readonly resendCooldown   = signal(0);
  readonly registrationData = this.svc.data;

  @ViewChild(OtpInputComponent) private otpInput?: OtpInputComponent;

  onOtpComplete(code: string): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.cdr.markForCheck();

    this.svc.verifyEmail(code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          globalThis.location.href = `${globalThis.location.origin}/contenedor`;
        },
        error: (err) => {
          const msg: string = err?.error?.message ?? null;
          this.error.set(msg || 'Código incorrecto o expirado. Intenta nuevamente.');
          this.loading.set(false);
          this.otpInput?.shake();
          this.cdr.markForCheck();
        },
      });
  }

  onResend(): void {
    if (this.resendCooldown() > 0) return;
    this.error.set('');

    // Pass the stored email so the backend can find the pending registration
    // even when there is no active session (resume-after-close scenario).
    const email = this.registrationData().email || undefined;
    this.svc.resendOtp(email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.startCooldown();
          this.cdr.markForCheck();
        },
        error: () => {
          this.error.set('No se pudo reenviar el código. Intenta más tarde.');
          this.cdr.markForCheck();
        },
      });
  }

  private startCooldown(): void {
    this.resendCooldown.set(60);
    timer(1000, 1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const v = this.resendCooldown() - 1;
        this.resendCooldown.set(Math.max(0, v));
        this.cdr.markForCheck();
      });
  }

  onBack(): void { this.svc.goBack(); }
}
