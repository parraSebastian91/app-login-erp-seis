import { inject, Injectable } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, user } from '@angular/fire/auth';
import { firstValueFrom, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
  typeDevice: 'WEB' | 'DESKTOP' | 'MOBILE' | 'POSTMAN';
}

export interface AuthenticateResponse {
  status: number;
  message: string;
  data: {
    code: string;
    url: string;
  }[];
}


import { User } from 'firebase/auth'; // Importa el tipo User
import { ConfigService } from './config.service';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private provider = new GoogleAuthProvider();
  user$: Observable<User | null> = user(this.auth); // user$ emitirá el usuario o null
  constructor(private http: HttpClient, private config: ConfigService) { }

  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(this.auth, this.provider);
      const user = result.user;
      console.log('¡Usuario logueado!', user);
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
    }
  }

  /**
   * HU-15: Flujo PKCE Paso 1.
   * Genera sessionId + PKCE en memoria (nunca en storage).
   * Devuelve la URL de redirect al Portal con ?code=...&sid=...
   */
  async loginWithEmailPassword(username: string, password: string): Promise<string> {
    const sessionId = crypto.randomUUID();

    // 32 bytes aleatorios → base64url (Web Crypto API, sin librerías)
    const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
    const code_verifier = this.base64urlEncode(verifierBytes.buffer);
    const code_challenge = await this.createCodeChallenge(code_verifier);

    const authorizeBody = {
      username,
      password,
      code_challenge,
      typeDevice: this.detectDeviceType(),
      sessionId,
    };

    const base = this.config.getApiBase();
    const res = await firstValueFrom(
      this.http.post<AuthenticateResponse>(`${base}/api/auth/security/authenticate`, authorizeBody)
    );

    const code = res.data?.[0]?.code;
    if (!code) {
      throw new Error('NO_CODE');
    }

    const portalUrl = (environment as any).portalUrl ?? 'http://localhost:8083';
    return `${portalUrl}/auth/callback?code=${encodeURIComponent(code)}&sid=${encodeURIComponent(sessionId)}`;
  }

  async validateEmail(correo: string): Promise<any> {
    const requestChangePAssword = this.http.post<any>(`${this.config.getApiBase()}/api/auth/security/password-reset/request`, { correo });
    try {
      const res = await firstValueFrom(requestChangePAssword);
      console.log(res);
      const url = (res.data && res.data.length && res.data[0].url) ? res.data[0].url : 'about:blank';
      return url;
    } catch (err) {
      console.error('Error validating email:');
      console.error(err);
      throw err;
    }
  }

  async resetPassword(body: any): Promise<any> {
    const resetPasswordRequest = this.http.post<any>(`${this.config.getApiBase()}/api/auth/security/password-reset/reset`, body);
    try {
      const res = await firstValueFrom(resetPasswordRequest);
      console.log(res);
      return res;
    } catch (err) {
      console.error('Error resetting password:');
      console.error(err);
      throw err;
    }
  }

  async validateToken(token: string, sessionId: string): Promise<any> {
    try {
      const validateTokenRequest = this.http.get<any>(`${this.config.getApiBase()}/api/auth/security/password-reset/validate?token=${encodeURIComponent(token)}&uuid=${encodeURIComponent(sessionId)}`);
      const res = await firstValueFrom(validateTokenRequest);
      console.log(res);
      return res;
    } catch (err) {
      console.error('Error validating token:');
      console.error(err);
      throw err;
    }
  }

  base64urlEncode(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let str = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      str += String.fromCharCode(bytes[i]);
    }
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async createCodeChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64urlEncode(digest);
  }

  private detectDeviceType(): LoginRequest['typeDevice'] {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    const maxTouch = (navigator as any).maxTouchPoints || 0;

    if (/postmanruntime/i.test(ua)) return 'POSTMAN';
    if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua) || maxTouch > 0) return 'MOBILE';
    if (/electron/i.test(ua) || /Win|Mac|Linux/.test(platform)) return 'DESKTOP';
    return 'WEB';
  }

}
