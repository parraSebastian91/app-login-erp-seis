import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import Swal from 'sweetalert2'
import { AuthService } from '../../service/auth.service';
import { ThemeService } from '../../core/theming/theme.service';


@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  title = 'app-login-erp-seis';
  loading = false;
  errorMsg = '';
  form: FormGroup;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private themeService: ThemeService
  ) {
    this.form = this.fb.group({
      // username: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')]),
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      // passRecovery: [''],
      remember: [true]
    });
  }


  async login() {
    // Lógica para iniciar sesión
    if (this.form.valid) {
      const { username, password } = this.form.value;
      const response = await this.authService.loginWithEmailPassword(username, password);
      console.log('Respuesta del login:', response);
      // Aquí puedes llamar al servicio de autenticación
    } else {
      Swal.fire({
        title: '',
        text: 'Usuario o contraseña inválidos',
        icon: 'warning',
        confirmButtonText: 'OK'
      })
    }
  }

  logout() {
    // Lógica para cerrar sesión
    console.log('Cerrar sesión');
  }

  getThemeService(): ThemeService {
    return this.themeService;
  }

  switchTheme() {
    this.themeService.toggle();
  }

}
