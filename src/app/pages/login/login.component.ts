import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';


import { AuthService } from '../../service/auth.service';
import { ThemeService } from '../../core/theming/theme.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { ConfigService } from '../../service/config.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  title = 'app-login-erp-seis';
  loading = false;
  errorMsg = '';
  form: FormGroup;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private themeService: ThemeService,
    private _snackBar: MatSnackBar,
    private config: ConfigService,
    private router: Router
  ) {
    this.form = this.fb.group({
      // username: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')]),
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      // passRecovery: [''],
      remember: [true]
    });
  }

  ngOnInit(): void {
    const params = new URLSearchParams(window.location.search);
    const message = params.get('message') || params.get('msg');
    const status = params.get('status');
    if (message) {
      this._snackBar.open(decodeURIComponent(message), 'Cerrar', {
        duration: 5000, verticalPosition: 'top', horizontalPosition: 'center'
      });
    } else if (status === 'expired') {
      this._snackBar.open('Sesión expirada. Inicie sesión nuevamente.', 'Cerrar', {
        duration: 5000, verticalPosition: 'top', horizontalPosition: 'center'
      });
    }
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
        window.location.href = base + '/portal' + url;
      }
    } catch (err) {
      this._snackBar.open('Error al autenticar. Revise sus credenciales.', 'Cerrar', {
        duration: 5000, verticalPosition: 'top', horizontalPosition: 'center'
      });
    } finally {
      this.loading = false;
    }
  }

  restablecerpassword() {
    this.router.navigate(['pages','restablecer-password']);
  }

  getThemeService(): ThemeService {
    return this.themeService;
  }

  switchTheme() {
    this.themeService.toggle();
  }

}
