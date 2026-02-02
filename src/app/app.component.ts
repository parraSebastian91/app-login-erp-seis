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
  
}
