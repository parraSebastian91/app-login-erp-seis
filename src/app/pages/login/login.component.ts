import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  title = 'app-login-erp-seis';

  loginForm: FormGroup;

  constructor() {
    this.loginForm = new FormGroup({
      username: new FormControl(''),
      password: new FormControl(''),
    });
  }


  login() {
    // Lógica para iniciar sesión
    console.log('Iniciar sesión');
  }

  logout() {
    // Lógica para cerrar sesión
    console.log('Cerrar sesión');
  }

}
