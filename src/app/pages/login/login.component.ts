import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import Swal from 'sweetalert2'
import { AuthService } from '../../service/auth.service';
import { ThemeService } from '../../core/theming/theme.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { ConfigService } from '../../service/config.service';


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
    private themeService: ThemeService,
    private _snackBar: MatSnackBar,
    private config: ConfigService
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
    if (!this.form.valid) {
      this._snackBar.open('Complete los campos requeridos', 'Cerrar', {
        duration: 5000, verticalPosition: 'top', horizontalPosition: 'center'
      });
      return;
    }

    const { username, password } = this.form.value;
    this.loading = true;
    try {
      const url = await this.authService.loginWithEmailPassword(username, password);
      console.log('response login component', url);
      if (!url || url === 'about:blank') {
        this._snackBar.open('Usuario o contraseña inválidos', 'Cerrar', {
          duration: 5000, verticalPosition: 'top', horizontalPosition: 'center'
        });
      } else {
        const base = this.config.getApiBase();
        window.location.href = base + '/portal' +url;
      }
    } catch (err) {
      this._snackBar.open('Error al autenticar. Revise sus credenciales.', 'Cerrar', {
        duration: 5000, verticalPosition: 'top', horizontalPosition: 'center'
      });
    } finally {
      this.loading = false;
    }
  }

  getThemeService(): ThemeService {
    return this.themeService;
  }

  switchTheme() {
    this.themeService.toggle();
  }

}
