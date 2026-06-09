import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { RegistrationService } from '../registration.service';
import { TipoDocumento } from '../registration.types';

function mayorDeEdadValidator(control: AbstractControl): ValidationErrors | null {
  const val = control.value as string;
  if (!val) return null;
  const birth = new Date(val);
  if (isNaN(birth.getTime())) return { fechaInvalida: true };
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age < 18 ? { menorDeEdad: true } : null;
}

@Component({
  selector: 'app-personal-data-step',
  standalone: false,
  templateUrl: './personal-data-step.component.html',
  styleUrl: './personal-data-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalDataStepComponent {
  private readonly svc = inject(RegistrationService);
  private readonly fb  = inject(FormBuilder);

  /** Max selectable birth date (user must be ≥ 18 years old) */
  readonly maxFechaNacimiento = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  })();

  readonly PHONE_PREFIXES = [
    { code: '+56',  label: '🇨🇱 +56'  },
    { code: '+54',  label: '🇦🇷 +54'  },
    { code: '+55',  label: '🇧🇷 +55'  },
    { code: '+52',  label: '🇲🇽 +52'  },
    { code: '+34',  label: '🇪🇸 +34'  },
    { code: '+1',   label: '🇺🇸 +1'   },
    { code: '+57',  label: '🇨🇴 +57'  },
    { code: '+51',  label: '🇵🇪 +51'  },
    { code: '+598', label: '🇺🇾 +598' },
    { code: '+593', label: '🇪🇨 +593' },
    { code: '+591', label: '🇧🇴 +591' },
    { code: '+595', label: '🇵🇾 +595' },
    { code: '+58',  label: '🇻🇪 +58'  },
  ];

  readonly PAISES = [
    { code: 'CL', name: 'Chile' },
    { code: 'AR', name: 'Argentina' },
    { code: 'BR', name: 'Brasil' },
    { code: 'MX', name: 'México' },
    { code: 'ES', name: 'España' },
    { code: 'US', name: 'Estados Unidos' },
    { code: 'CO', name: 'Colombia' },
    { code: 'PE', name: 'Perú' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'EC', name: 'Ecuador' },
    { code: 'BO', name: 'Bolivia' },
    { code: 'PY', name: 'Paraguay' },
    { code: 'VE', name: 'Venezuela' },
    { code: 'GT', name: 'Guatemala' },
    { code: 'HN', name: 'Honduras' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'PA', name: 'Panamá' },
    { code: 'DO', name: 'Rep. Dominicana' },
  ];

  /* Document number via signals — supports rut-input (CI) and plain input (passport) */
  readonly tipoDoc  = signal<TipoDocumento>('RUT');
  readonly docValue = signal('');
  readonly docValid = signal(false);

  readonly form = this.fb.nonNullable.group({
    nombres:         ['', [Validators.required, Validators.minLength(2)]],
    apellidoPaterno: ['', [Validators.required, Validators.minLength(2)]],
    apellidoMaterno: [''],
    prefijoTelefono: ['+56'],
    telefono:        ['', [Validators.required, Validators.pattern(/^\d{6,12}$/)]],
    tipoDocumento:   ['RUT' as TipoDocumento],
    pais:            ['CL', Validators.required],
    fechaNacimiento: ['', [Validators.required, mayorDeEdadValidator]],
    direccion:       ['', [Validators.required, Validators.minLength(5)]],
  });

  get isCedula(): boolean      { return this.tipoDoc() === 'RUT'; }
  get canContinue(): boolean   { return this.form.valid && this.docValid(); }

  onTipoDocChange(): void {
    const v = this.form.get('tipoDocumento')!.value as TipoDocumento;
    this.tipoDoc.set(v);
    this.docValue.set('');
    this.docValid.set(false);
  }

  onDocChange(value: string): void       { this.docValue.set(value); }
  onDocValidChange(valid: boolean): void { this.docValid.set(valid); }

  onDocumentoInput(e: Event): void {
    const v = (e.target as HTMLInputElement).value.trim();
    this.docValue.set(v);
    this.docValid.set(v.length >= 5);
  }

  onContinue(): void {
    if (!this.canContinue) { this.form.markAllAsTouched(); return; }
    const f = this.form.getRawValue();
    this.svc.patch({
      nombres:         f.nombres,
      apellidoPaterno: f.apellidoPaterno,
      apellidoMaterno: f.apellidoMaterno,
      prefijoTelefono: f.prefijoTelefono,
      telefono:        f.telefono,
      tipoDocumento:   this.tipoDoc(),
      numeroDocumento: this.docValue(),
      pais:            f.pais,
      fechaNacimiento: f.fechaNacimiento,
      direccion:       f.direccion,
    });
    this.svc.goNext();
  }

  onBack(): void { this.svc.goBack(); }

  fieldError(name: string): string {
    const ctrl = this.form.get(name);
    if (!ctrl?.invalid || !ctrl.touched) return '';
    if (ctrl.hasError('required'))      return 'Este campo es requerido.';
    if (ctrl.hasError('minlength'))     return 'Muy corto.';
    if (ctrl.hasError('pattern'))       return 'Solo dígitos, entre 6 y 12.';
    if (ctrl.hasError('menorDeEdad'))   return 'Debes ser mayor de 18 años.';
    if (ctrl.hasError('fechaInvalida')) return 'Fecha inválida.';
    return '';
  }
}
