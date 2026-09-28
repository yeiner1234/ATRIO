import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { servicioAutenticacion } from '@/services/servicioAutenticacion';
import type { Usuario } from '@/types/Usuario';

interface AuthContexto {
  usuario: Usuario | null;
  listo: boolean;
  iniciarSesion: (email: string, contrasena: string) => Promise<Usuario>;
  iniciarSesionBiometrica: () => Promise<Usuario>;
  registrar: (datos: {
    nombre: string;
    email: string;
    celular: string;
    contrasena: string;
  }) => Promise<Usuario>;
  cerrarSesion: () => Promise<void>;
}

const ContextoAuth = createContext<AuthContexto | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let cancelado = false;
    servicioAutenticacion
      .obtenerUsuarioActual()
      .then((usuarioActual) => {
        if (!cancelado) setUsuario(usuarioActual);
      })
      .catch((err) => {
        // No debe tumbar el arranque de la app: sin sesión restaurada, se
        // trata igual que "no hay usuario" (va a login), pero el error
        // queda visible en consola, no escondido.
        console.error('AuthContext: no se pudo restaurar la sesión.', err);
      })
      .finally(() => {
        if (!cancelado) setListo(true);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const iniciarSesion = useCallback(async (email: string, contrasena: string) => {
    const usuarioAutenticado = await servicioAutenticacion.iniciarSesion(email, contrasena);
    setUsuario(usuarioAutenticado);
    return usuarioAutenticado;
  }, []);

  const iniciarSesionBiometrica = useCallback(async () => {
    const usuarioAutenticado = await servicioAutenticacion.iniciarSesionBiometrica();
    setUsuario(usuarioAutenticado);
    return usuarioAutenticado;
  }, []);

  const registrar = useCallback(async (datos: {
    nombre: string;
    email: string;
    celular: string;
    contrasena: string;
  }) => {
    const usuarioRegistrado = await servicioAutenticacion.registrar(datos);
    setUsuario(usuarioRegistrado);
    return usuarioRegistrado;
  }, []);

  const cerrarSesion = useCallback(async () => {
    await servicioAutenticacion.cerrarSesion();
    setUsuario(null);
  }, []);

  return (
    <ContextoAuth.Provider value={{ usuario, listo, iniciarSesion, iniciarSesionBiometrica, registrar, cerrarSesion }}>
      {children}
    </ContextoAuth.Provider>
  );
}

export function useAuth(): AuthContexto {
  const contexto = useContext(ContextoAuth);
  if (!contexto) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return contexto;
}