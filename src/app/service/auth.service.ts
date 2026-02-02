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
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private provider = new GoogleAuthProvider();
  user$: Observable<User | null> = user(this.auth); // user$ emitirá el usuario o null
  constructor(private http: HttpClient) { }

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
      typeDevice: 'WEB'
    };

    try {
      const res = await firstValueFrom(this.http.post<AuthenticateResponse>(`${environment.apiAuth}/auth/authenticate`, authorizeBody));
      console.log(res);
      const url = (res.data && res.data.length && res.data[0].url) ? res.data[0].url : 'about:blank';
      return url;
    } catch (err) {
      console.error('Error authenticating:', err);
      throw err;
    }
  }

  async logout() {
    try {
      await signOut(this.auth);
      console.log('¡Sesión cerrada!');
      // Puedes redirigir al usuario a la página de inicio de sesión
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
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

  // async createCodeChallenge(verifier: string): Promise<string> {
  //   const encoder = new TextEncoder();
  //   const data = encoder.encode(verifier);
  //   const digest = await crypto.subtle.digest('SHA-256', data);
  //   return this.base64urlEncode(digest);
  // }

}
