import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { servicioAutenticacion } from '@/services/servicioAutenticacion';

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTRASENA_MINIMA = 8;

function extraerParametrosRecuperacion(url: string | null) {
  if (!url) return null;
  try {
    const { queryParams, hostname, path } = Linking.parse(url);
    // El fragmento (#access_token=...) no siempre llega parseado por Linking.parse,
    // así que también se busca a mano después de un "#".
    const fragmento = url.includes('#') ? url.slice(url.indexOf('#') + 1) : '';
    const paramsFragmento = new URLSearchParams(fragmento);

    const code = (queryParams?.code as string | undefined) ?? paramsFragmento.get('code') ?? undefined;
    const accessToken =
      (queryParams?.access_token as string | undefined) ?? paramsFragmento.get('access_token') ?? undefined;
    const refreshToken =
      (queryParams?.refresh_token as string | undefined) ?? paramsFragmento.get('refresh_token') ?? undefined;
    const esRuta = hostname === 'recuperar-contrasena' || path === 'recuperar-contrasena';

    if (!esRuta || (!code && !(accessToken && refreshToken))) return null;
    return { code, accessToken, refreshToken };
  } catch {
    return null;
  }
}

export function useRecuperarContrasena() {
  const [fase, setFase] = useState<'verificando' | 'pedir-correo' | 'nueva-contrasena' | 'lista'>(
    'verificando',
  );
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  // Al abrir la pantalla, revisa si llegó por el link del correo (con tokens de recuperación).
  useEffect(() => {
    let cancelado = false;

    async function verificarLink() {
      const urlInicial = await Linking.getInitialURL();
      const parametros = extraerParametrosRecuperacion(urlInicial);
      if (!parametros) {
        if (!cancelado) setFase('pedir-correo');
        return;
      }
      try {
        await servicioAutenticacion.iniciarSesionDeRecuperacion(parametros);
        if (!cancelado) setFase('nueva-contrasena');
      } catch (error) {
        if (!cancelado) {
          setMensaje(
            error instanceof Error
              ? error.message
              : 'El enlace de recuperación no es válido o ya expiró.',
          );
          setFase('pedir-correo');
        }
      }
    }

    void verificarLink();
    return () => {
      cancelado = true;
    };
  }, []);

  const solicitarCorreo = useCallback(async () => {
    const emailLimpio = email.trim();
    if (!CORREO_VALIDO.test(emailLimpio)) {
      setMensaje('Ingresa un correo válido.');
      return;
    }
    setCargando(true);
    setMensaje('');
    try {
      await servicioAutenticacion.solicitarRecuperacion(emailLimpio);
      setMensaje('Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.');
    } catch {
      setMensaje('No se pudo enviar la solicitud. Inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  }, [email]);

  const guardarNuevaContrasena = useCallback(async () => {
    if (contrasena.length < CONTRASENA_MINIMA) {
      setMensaje(`La contraseña debe tener al menos ${CONTRASENA_MINIMA} caracteres.`);
      return;
    }
    if (contrasena !== confirmacion) {
      setMensaje('Las contraseñas no coinciden.');
      return;
    }
    setCargando(true);
    setMensaje('');
    try {
      await servicioAutenticacion.establecerNuevaContrasena(contrasena);
      setFase('lista');
    } catch {
      setMensaje('No se pudo actualizar la contraseña. Vuelve a solicitar el enlace.');
    } finally {
      setCargando(false);
    }
  }, [contrasena, confirmacion]);

  const irALogin = useCallback(() => router.replace('/(auth)/login'), []);

  return {
    fase,
    email,
    setEmail,
    contrasena,
    setContrasena,
    confirmacion,
    setConfirmacion,
    mensaje,
    cargando,
    solicitarCorreo,
    guardarNuevaContrasena,
    irALogin,
  };
}
