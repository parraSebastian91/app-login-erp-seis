import { Component } from '@angular/core';
import { AuthService } from './service/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'app-login-erp-seis';

  constructor(private authService: AuthService) {
    // Aquí puedes inicializar cualquier cosa que necesites
  }

  login() {
    this.authService.loginWithGoogle()
      .then(() => {
        console.log('Login exitoso');
      }
      )
      .catch((error) => {
        console.error('Error al iniciar sesión:', error);
      }
      );
  }
  logout() {
    this.authService.logout()
      .then(() => {
        console.log('Logout exitoso');
      }
      )
      .catch((error) => {
        console.error('Error al cerrar sesión:', error);
      }
      );
  }
  
}
