import { inject, Injectable } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user } from '@angular/fire/auth';
import { catchError, map, Observable, throwError } from 'rxjs';
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
  data: string[];
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

  async loginWithEmailPassword(username: string, password: string): Promise<void> {

    const verifier = await this.generateCodeVerifier();
    const challenge = await this.createCodeChallenge(verifier);

    const authorizeBody = {
      username,
      password,
      code_challenge: challenge,
      typeDevice: 'WEB'
    };

    let redirectUrl: URL = new URL('about:blank');
    const code = redirectUrl.searchParams.get('code');

    this.http.post<AuthenticateResponse>(`${environment.apiBaseURL}/auth/authenticate`, authorizeBody)
    .pipe(
      map(res => {
        
        redirectUrl = new URL(environment.basePortal+res.data[0]); // pueden ser mas de 1 URLs, de momentos tomamos la primera
        console.log('Redirigiendo al portal...');
        console.log(redirectUrl.toString());
          const code = redirectUrl.searchParams.get('code');
        if (!code) {
          throw new Error('No se obtuvo code en la respuesta de autenticación');
        }
        return redirectUrl.toString();
      }),
      catchError(err => {
        console.error('Login error:', err);
        return throwError(() => err);
      })
    ).subscribe(async (fullRedirectUrl: string) => {
      window.location.href = fullRedirectUrl;
    });



    // 3) intercambiar code por token (en backend): enviar code_verifier
    // const tokenBody = new URLSearchParams();
    // tokenBody.set('grant_type', 'authorization_code');
    // tokenBody.set('code', code);
    // tokenBody.set('code_verifier', verifier);

    // // El backend creará JWT y SET-Cookie HttpOnly; aquí request conCredentials para permitir cookies
    // await this.http.post(`${environment.apiBaseURL}/auth/token`, tokenBody.toString(), {
    //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    //   withCredentials: true
    // }).toPromise();

    // // 4) redirigir al portal (la cookie HttpOnly ya está seteada)


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

  async createCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64urlEncode(digest);
  }

}
