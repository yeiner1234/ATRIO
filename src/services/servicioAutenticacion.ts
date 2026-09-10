import { servicioAlmacenamiento } from './storageService';

const CORREO_DEMO = 'hola@atrio.pe';
const CONTRASENA_DEMO = 'atrio1234';

export class ErrorCredencialesInvalidas extends Error {}

export const servicioAutenticacion = {
  async iniciarSesion(correo: string, contrasena: string): Promise<void> {
    await new Promise((resolver) => setTimeout(resolver, 650));
    const valido =
      correo.toLowerCase() === CORREO_DEMO && contrasena === CONTRASENA_DEMO;
    if (!valido) throw new ErrorCredencialesInvalidas();
    await servicioAlmacenamiento.guardarTokenSesion('demo-access-token');
  },
};
