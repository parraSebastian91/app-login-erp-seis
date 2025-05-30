import { inject, Injectable } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user } from '@angular/fire/auth';
import { Observable } from 'rxjs';

import { User } from 'firebase/auth'; // Importa el tipo User
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private provider = new GoogleAuthProvider();
  user$: Observable<User | null> = user(this.auth); // user$ emitirá el usuario o null
  constructor() { }

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

  async logout() {
    try {
      await signOut(this.auth);
      console.log('¡Sesión cerrada!');
      // Puedes redirigir al usuario a la página de inicio de sesión
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

}
