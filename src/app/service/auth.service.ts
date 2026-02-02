import { inject, Injectable } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user } from '@angular/fire/auth';
import { firstValueFrom, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import * as CryptoJS from 'crypto-js';

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
      // El usuario ha iniciado sesión correctamente.
      const user = result.user;
      console.log('¡Usuario logueado!', user);
      // Puedes redirigir al usuario ahora
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      // Maneja los errores (ej. ventana emergente cerrada, credenciales incorrectas)
    }
  }

  async loginWithEmailPassword(username: string, password: string): Promise<any> {

    const verifier = await this.generateCodeVerifier();
    const challenge = await this.createCodeChallenge(verifier);
    // guarda el verifier para el intercambio de tokens posterior
    sessionStorage.setItem('pkce_verifier', verifier);

    const authorizeBody = {
      username,
      password,
      code_challenge: challenge,
      typeDevice: this.detectDeviceType()
    };

    try {
      const base = this.config.getApiBase(); // usa origen configurado
      const res = await firstValueFrom(this.http.post<AuthenticateResponse>(`${base}/security/auth/authenticate`, authorizeBody)); 
      console.log(res);
      const url = (res.data && res.data.length && res.data[0].url) ? res.data[0].url : 'about:blank';
      return url;
    } catch (err) {
      console.error('Error authenticating:');
      console.error(err);
      throw err;
    }
  }

  async validateEmail(correo: string): Promise<any> {
    const requestChangePAssword = this.http.post<any>(`${this.config.getApiBase()}/security/auth/password-reset/request`, { correo }); 
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
    const resetPasswordRequest = this.http.post<any>(`${this.config.getApiBase()}/security/auth/password-reset/reset`, body); 
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
      const validateTokenRequest = this.http.get<any>(`${this.config.getApiBase()}/security/auth/password-reset/validate?token=${encodeURIComponent(token)}&uuid=${encodeURIComponent(sessionId)}`); 
      const res = await firstValueFrom(validateTokenRequest); 
      console.log(res);
      return res;
    } catch (err) {
      console.error('Error validating token:');
      console.error(err);
      throw err;
    }
  }

  setAccessToken(token: string) {
    // this.accessTokenSubject.next(token);
    sessionStorage.setItem('access_token', token);
    // si quieres persistencia entre pestañas: localStorage.setItem('access_token', token);
  }

  async generateCodeVerifier(length = 128): Promise<string> {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    const chars = Array.from(array).map((v) => ('0' + (v % 36).toString(36)).slice(-1));
    return chars.join('').slice(0, length);
  }

  base64urlEncode(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer);
    let str = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      str += String.fromCharCode(bytes[i]);
    }
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private hexToArrayBuffer(hex: string): ArrayBuffer {
    const typed = new Uint8Array(hex.length / 2);
    for (let i = 0; i < typed.length; i++) {
      typed[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return typed.buffer;
  }

  async createCodeChallenge(verifier: string): Promise<string> {
    // intenta Web Crypto (incluye webkitSubtle en iOS WebKit)
    const subtle = (window.crypto as any)?.subtle || (window.crypto as any)?.webkitSubtle;
    if (subtle && typeof subtle.digest === 'function') {
      const encoder = new TextEncoder();
      const data = encoder.encode(verifier);
      const digest = await subtle.digest('SHA-256', data);
      return this.base64urlEncode(digest);
    }

    // fallback usando crypto-js (para navegadores sin crypto.subtle, p.e. algunos webviews iOS)
    const hashHex = CryptoJS.SHA256(verifier).toString(CryptoJS.enc.Hex);
    const buf = this.hexToArrayBuffer(hashHex);
    return this.base64urlEncode(buf);
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
