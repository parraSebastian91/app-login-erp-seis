import { Component } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ThemeService } from '../../core/theming/theme.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfigService } from '../../service/config.service';

import Swal from 'sweetalert2'
import { Router } from '@angular/router';

@Component({
  selector: 'app-restablecer-password',
  standalone: false,
  templateUrl: './restablecer-password.component.html',
  styleUrls: ['./restablecer-password.component.scss']
})
export class RestablecerPasswordComponent {
  loading = false;
  errorMsg = '';
  emailValidate: FormGroup;
  passwordChange: FormGroup;
  nombreBoton = 'Validar Correo';
  emailValid = false;
  bodyRestPass = {
    token: "9241177db8d721ed0e11e5c1325a9cdfd187b3e1cd17e1f4dca4219a2e0744891cf5eca6d4ad925ac2c524632dc20d43",
    uuid: "87a2c75c-0cc8-4f46-8c13-b214c84c2979",
    newPassword: "07112719",
    confirmPassword: "07112719"
  };
  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private themeService: ThemeService,
    private _snackBar: MatSnackBar,
    private config: ConfigService,
    private routing: Router

  ) {
    this.emailValidate = this.fb.group({
      // username: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')]),
      correo: ['', [Validators.required, Validators.email]],
    });

    this.passwordChange = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
    });

  }

  ngOnInit(): void {
    const params = new URLSearchParams(window.location.search);
    this.bodyRestPass.token = params.get('token') || '';
    this.bodyRestPass.uuid = params.get('uuid') || '';
    if (this.bodyRestPass.token && this.bodyRestPass.uuid) {
      this.authService.validateToken(this.bodyRestPass.token, this.bodyRestPass.uuid).then(respuesta => {
        if (respuesta?.valid) {
          this.emailValid = true;
        } else {
          this._snackBar.open('Token inválido. Solicite un nuevo restablecimiento de contraseña.', 'Cerrar', {
            duration: 5000, verticalPosition: 'top', horizontalPosition: 'center'
          });
        }
      }).catch(err => {
        console.error(err);
        this._snackBar.open('Error al verificar el token. Intente nuevamente.', 'Cerrar', {
          duration: 5000, verticalPosition: 'top', horizontalPosition: 'center'
        });
      });
    } else {
      this.emailValid = false;
    }
  }


  async validateEmail() {
    if (!this.emailValidate.valid) {
      this._snackBar.open('Complete los campos requeridos', 'Cerrar', {
        duration: 5000, verticalPosition: 'top', horizontalPosition: 'center'
      });
      return;
    }

    const { correo } = this.emailValidate.value;
    this.loading = true;
    try {
      const url = await this.authService.validateEmail(correo);
      console.log('response login component', url);
      if (!url) {
        this._snackBar.open('Correo electrónico no válido', 'Cerrar', {
          duration: 5000, verticalPosition: 'top', horizontalPosition: 'center'
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Correo enviado',
          text: 'Se ha enviado un correo electrónico con las instrucciones para restablecer su contraseña.',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          this.routing.navigate(['/pages/login']);
        });
      }
    } catch (err) {
      this._snackBar.open('Error al validar el correo electrónico. Intente nuevamente.', 'Cerrar', {
        duration: 5000, verticalPosition: 'top', horizontalPosition: 'center'
      });
    } finally {
      this.loading = false;
    }
  }

  validatePassword() {
    console.log("Validando cambio de contraseña");
    if (!this.passwordChange.valid) {
      this._snackBar.open('Complete los campos requeridos', 'Cerrar', {
        duration: 5000, verticalPosition: 'top', horizontalPosition: 'center'
      });
      return;
    }

    const { password, confirmPassword } = this.passwordChange.value;
    if (password !== confirmPassword) {
      this._snackBar.open('Las contraseñas no coinciden', 'Cerrar', {
        duration: 5000, verticalPosition: 'top', horizontalPosition: 'center'
      });
      return false;
    } else {
      this.bodyRestPass.newPassword = password;
      this.bodyRestPass.confirmPassword = confirmPassword;
      this.authService.resetPassword(this.bodyRestPass).then(respuesta => {
        console.log(respuesta);
        Swal.fire({
          icon: 'success',
          title: 'Proceso exitoso',
          text: 'Se ha restablecido su contraseña correctamente.',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          this.routing.navigate(['/pages/login']);
        });
      }).catch(err => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo restablecer su contraseña. Intente nuevamente.',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          this.routing.navigate(['/pages/login']);
        });
      });
      this.loading = true;
    }

    return true;
  }

  getThemeService(): ThemeService {
    return this.themeService;
  }

  switchTheme() {
    this.themeService.toggle();
  }
}
