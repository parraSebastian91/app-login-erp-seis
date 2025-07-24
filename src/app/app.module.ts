import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { environment } from '../environments/environment';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule
  ],
  providers: [
    provideFirebaseApp(() => initializeApp({ 
      projectId: "login-erp-seis", 
      appId: "1:641784311936:web:684fbb779da10a8bd3b665", 
      storageBucket: "login-erp-seis.firebasestorage.app", 
      apiKey: "AIzaSyCfVbHwBV-gm9PnJTONV0sWLzwlqWzteeA", 
      authDomain: "login-erp-seis.firebaseapp.com", 
      messagingSenderId: "641784311936", 
      measurementId: "G-XB5MQ25NSK" }
    )),
    provideAuth(() => getAuth())
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
