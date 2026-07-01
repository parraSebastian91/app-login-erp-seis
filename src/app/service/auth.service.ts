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
    const CorrelationId = this.generateUUID();

    // 32 bytes aleatorios → base64url (Web Crypto API, sin librerías)
    const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
    const code_verifier = this.base64urlEncode(verifierBytes.buffer);
    const code_challenge = await this.createCodeChallenge(code_verifier);

    sessionStorage.setItem('pkce_verifier', code_verifier);
    // Puente temporal entre app-login (8082) y portal (8000): sessionStorage no se comparte entre puertos.
    this.storePkceVerifierForPortal(CorrelationId, code_verifier);

    const authorizeBody = {
      username,
      password,
      code_challenge,
      typeDevice: this.detectDeviceType(),
      CorrelationId,
    };

    const base = environment.getBaseUrl();
    const res = await firstValueFrom(
      this.http.post<AuthenticateResponse>(`${base}/api/auth/security/authenticate`, authorizeBody)
    );

    const code = res.data?.[0]?.code;
    if (!code) {
      throw new Error('NO_CODE');
    }

    const portalUrl = (environment as any).portalUrl;
    return `${portalUrl}/auth/callback?code=${encodeURIComponent(code)}&cid=${encodeURIComponent(CorrelationId)}`;
  }

  private storePkceVerifierForPortal(correlationId: string, codeVerifier: string): void {
    const payload = encodeURIComponent(JSON.stringify({ v: codeVerifier, ts: Date.now() }));
    document.cookie = `seis_pkce_${correlationId}=${payload}; Max-Age=300; Path=/; SameSite=Lax`;
  }

  async validateEmail(correo: string): Promise<any> {
    const base = environment.getBaseUrl();
    const requestChangePAssword = this.http.post<any>(`${base}/api/auth/security/password-reset/request`, { correo });
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
    const base = environment.getBaseUrl();
    const resetPasswordRequest = this.http.post<any>(`${base}/api/auth/security/password-reset/reset`, body);
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
    const base = environment.getBaseUrl();
    try {
      const validateTokenRequest = this.http.get<any>(`${base}/api/auth/security/password-reset/validate?token=${encodeURIComponent(token)}&uuid=${encodeURIComponent(sessionId)}`);
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
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const data = new TextEncoder().encode(verifier);
      const digest = await crypto.subtle.digest('SHA-256', data);
      return this.base64urlEncode(digest);
    }
    // Fallback para contextos HTTP (no-localhost): SHA-256 puro en JS
    const hexHash = this.sha256Sync(verifier);
    const bytes = new Uint8Array(hexHash.match(/../g)!.map(h => parseInt(h, 16)));
    return this.base64urlEncode(bytes.buffer);
  }

  /** UUID v4 con fallback para contextos HTTP sin crypto.randomUUID */
  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
      return (crypto as any).randomUUID();
    }
    // crypto.getRandomValues sí está disponible en HTTP
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const h = Array.from(bytes).map(b => b.toString(16).padStart(2, '0'));
    return `${h.slice(0,4).join('')}-${h.slice(4,6).join('')}-${h.slice(6,8).join('')}-${h.slice(8,10).join('')}-${h.slice(10).join('')}`;
  }

  /** SHA-256 puro JS para contextos HTTP (verifier es siempre ASCII base64url) */
  private sha256Sync(ascii: string): string {
    const rr = (v: number, a: number) => (v >>> a) | (v << (32 - a));
    const mw = 2 ** 32;
    const h: number[] = [], k: number[] = [];
    const ic: Record<number, number> = {};
    for (let c = 2, p = 0; p < 64; c++) {
      if (!ic[c]) {
        for (let i = 0; i < 313; i += c) ic[i] = c;
        h[p] = (Math.pow(c, 0.5) * mw) | 0;
        k[p++] = (Math.pow(c, 1 / 3) * mw) | 0;
      }
    }
    let msg = ascii + '\x80';
    while (msg.length % 64 - 56) msg += '\x00';
    const w: number[] = [];
    for (let i = 0; i < msg.length; i++) w[i >> 2] |= msg.charCodeAt(i) << ((3 - i) % 4) * 8;
    w.push((ascii.length * 8 / mw) | 0, ascii.length * 8);
    for (let j = 0; j < w.length;) {
      const chunk = w.slice(j, j += 16);
      const oh = [...h];
      h.splice(0, h.length, ...h.slice(0, 8));
      for (let i = 0; i < 64; i++) {
        const w15 = chunk[i - 15], w2 = chunk[i - 2];
        const t1 = h[7] + (rr(h[4],6)^rr(h[4],11)^rr(h[4],25)) + ((h[4]&h[5])^(~h[4]&h[6])) + k[i]
          + (chunk[i] = i < 16 ? chunk[i] : (chunk[i-16]+(rr(w15,7)^rr(w15,18)^(w15>>>3))+chunk[i-7]+(rr(w2,17)^rr(w2,19)^(w2>>>10)))|0);
        const t2 = (rr(h[0],2)^rr(h[0],13)^rr(h[0],22)) + ((h[0]&h[1])^(h[0]&h[2])^(h[1]&h[2]));
        h.unshift((t1+t2)|0); h[4]=(h[4]+t1)|0; h.length=8;
      }
      h.forEach((v, i) => h[i] = (v + oh[i]) | 0);
    }
    return h.map(v => (v >>> 0).toString(16).padStart(8, '0')).join('');
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
