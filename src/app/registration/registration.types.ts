export type RegistrationRole = 'CEDENTE' | 'EJECUTIVO';
export type TipoDocumento = 'RUT' | 'DNI' | 'PASAPORTE';

export interface RegistrationData {
  role: RegistrationRole | null;
  // Step 1 — perfil
  email: string;
  username: string;
  // Step 2 — datos personales
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  prefijoTelefono: string;
  telefono: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  pais: string;
  fechaNacimiento: string;
  direccion: string;
  // Step 3 — contraseña
  password: string;
  acceptedTerms: boolean;
}

export const REGISTRATION_DATA_INITIAL: RegistrationData = {
  role: null,
  email: '',
  username: '',
  nombres: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  prefijoTelefono: '+56',
  telefono: '',
  tipoDocumento: 'RUT',
  numeroDocumento: '',
  pais: 'CL',
  fechaNacimiento: '',
  direccion: '',
  password: '',
  acceptedTerms: false,
};
