import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegistrationData, REGISTRATION_DATA_INITIAL } from './registration.types';

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  readonly data = signal<RegistrationData>({ ...REGISTRATION_DATA_INITIAL });
  readonly step = signal<number>(0); // 0=rol, 1=perfil, 2=personal, 3=contraseña, 4=otp

  constructor(private readonly http: HttpClient) {}

  patch(partial: Partial<RegistrationData>): void {
    this.data.update(d => ({ ...d, ...partial }));
  }

  goNext(): void {
    this.step.update(s => s + 1);
  }

  goBack(): void {
    this.step.update(s => Math.max(0, s - 1));
  }

  register(): Observable<{ userId: string }> {
    const d = this.data();
    return this.http.post<{ userId: string }>('/api/auth/registro', {
      rol:             d.role,
      email:           d.email,
      username:        d.username,
      nombres:         d.nombres,
      apellidoPaterno: d.apellidoPaterno,
      apellidoMaterno: d.apellidoMaterno || null,
      telefono:        `${d.prefijoTelefono}${d.telefono}`,
      tipoDocumento:   d.tipoDocumento,
      numeroDocumento: d.numeroDocumento,
      pais:            d.pais,
      fechaNacimiento: d.fechaNacimiento,
      direccion:       d.direccion,
      password:        d.password,
    });
  }

  verifyEmail(otp: string): Observable<void> {
    return this.http.post<void>('/api/auth/registro/verificar-email', { otp, email: this.data().email });
  }

  /**
   * Requests a new OTP.
   * - Without email: the backend uses the current session (normal wizard flow).
   * - With email: used when resuming verification after the user closed the browser;
   *   the backend looks up the pending registration by email and sends a new code.
   */
  resendOtp(email?: string): Observable<void> {
    return this.http.post<void>('/api/auth/registro/resend-otp', email ? { email } : {});
  }

  /**
   * Called from LoginComponent when the backend returns EMAIL_NOT_VERIFIED.
   * Stores the email in the wizard data, jumps to the OTP step, and
   * immediately requests a fresh code so the user doesn't have to click "Reenviar".
   */
  resumeVerification(email: string): Observable<void> {
    this.patch({ email });
    this.step.set(4);
    return this.resendOtp(email);
  }

  reset(): void {
    this.data.set({ ...REGISTRATION_DATA_INITIAL });
    this.step.set(0);
  }
}
