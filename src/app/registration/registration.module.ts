import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { RegistrationPageComponent }      from './registration-page/registration-page.component';
import { RoleSelectionStepComponent }     from './role-selection-step/role-selection-step.component';
import { ProfileStepComponent }           from './profile-step/profile-step.component';
import { PersonalDataStepComponent }      from './personal-data-step/personal-data-step.component';
import { CredentialsStepComponent }       from './credentials-step/credentials-step.component';
import { EmailVerificationStepComponent } from './email-verification-step/email-verification-step.component';

// Standalone components
import { RutInputComponent }              from '../shared/components/rut-input/rut-input.component';
import { PasswordStrengthMeterComponent } from '../shared/components/password-strength-meter/password-strength-meter.component';
import { OtpInputComponent }              from './otp-input/otp-input.component';

@NgModule({
  declarations: [
    RegistrationPageComponent,
    RoleSelectionStepComponent,
    ProfileStepComponent,
    PersonalDataStepComponent,
    CredentialsStepComponent,
    EmailVerificationStepComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // Standalone components used inside the module
    RutInputComponent,
    PasswordStrengthMeterComponent,
    OtpInputComponent,
    RouterModule.forChild([
      { path: '', component: RegistrationPageComponent },
    ]),
  ],
})
export class RegistrationModule {}
