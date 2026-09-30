import {
  Archivo_400Regular,
  Archivo_900Black,
  useFonts,
} from '@expo-google-fonts/archivo';
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import {
  MS_PARA_REINTENTAR_SPLASH,
  MS_VISUALIZACION_MINIMA_SPLASH,
  URL_TIENDA,
  VERSION_MINIMA_APP,
} from '@/constants/app';
import { servicioAutenticacion } from '@/services/servicioAutenticacion';
import { conLimiteDeTiempo } from '@/utils/promesas';
import { esVersionAnterior } from '@/utils/version';

export type FaseInicio = 'verificando' | 'reintentando' | 'actualizacion-requerida';

interface EstadoInicioAplicacion {
  fase: FaseInicio;
  fuentesListas: boolean;
  abrirTiendaParaActualizar: () => void;
}

const esperar = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms));

// Mismo respaldo que useFuentesApp.ts: si useFonts nunca resuelve (error de
// red, Expo Go lento), esta pantalla no debe quedarse pegada para siempre.
const MS_LIMITE_CARGA_FUENTES = 6000;

// Verificar la sesión implica una consulta real a Supabase (perfiles) que
// puede tardar varios segundos según la latencia del proyecto — sin este
// límite, una respuesta lenta o que nunca llega dejaba el splash pegado
// para siempre, sin ningún aviso. Si se agota el tiempo, se sigue como si
// no hubiera sesión (va a login): más seguro que quedarse esperando.
const MS_LIMITE_VERIFICACION_SESION = 8000;

SplashScreen.preventAutoHideAsync().catch(() => {});

export function useSplashBootstrap(): EstadoInicioAplicacion {
  const [fuentesCargadas, errorFuentes] = useFonts({
    Archivo_400Regular,
    Archivo_900Black,
    IBMPlexMono_500Medium,
  });
  const [tiempoAgotado, setTiempoAgotado] = useState(false);
  const fuentesListas = fuentesCargadas || !!errorFuentes || tiempoAgotado;

  useEffect(() => {
    if (fuentesCargadas || errorFuentes) return;
    const temporizador = setTimeout(() => setTiempoAgotado(true), MS_LIMITE_CARGA_FUENTES);
    return () => clearTimeout(temporizador);
  }, [fuentesCargadas, errorFuentes]);

  const [fase, setFase] = useState<FaseInicio>('verificando');

  const abrirTiendaParaActualizar = useCallback(() => {
    Linking.openURL(URL_TIENDA).catch(() => {});
  }, []);

  useEffect(() => {
    if (!fuentesListas) return;
    console.log('BOOTSTRAP 1: fuentes listas');
    console.log('SPLASH ocultando');

    SplashScreen.hideAsync()
      .then(() => console.log('SPLASH oculto'))
      .catch((err) => console.error('SPLASH: hideAsync falló', err));

    let cancelado = false;
    const inicio = Date.now();
    const temporizadorReintento = setTimeout(() => {
      if (!cancelado) {
        setFase((faseActual) => (faseActual === 'verificando' ? 'reintentando' : faseActual));
      }
    }, MS_PARA_REINTENTAR_SPLASH);

    // Todo el cuerpo va en try/catch/finally: antes, si algo entre medio
    // lanzaba (por ejemplo esVersionAnterior o el propio router), la
    // promesa de verificarYNavegar() rechazaba sin manejar (se llama sin
    // .catch() más abajo) y router.replace() nunca se ejecutaba — la app se
    // quedaba en el splash para siempre, sin ningún log ni aviso. El
    // finally ahora es la única fuente de verdad de "navegar o no": pase lo
    // que pase en el try, siempre intenta salir del splash.
    async function verificarYNavegar() {
      console.log('BOOTSTRAP 2: iniciando verificación de versión/sesión');
      let destino: '/(tabs)' | '/(auth)/login' | '/admin' = '/(auth)/login';
      let requiereActualizacion = false;

      try {
        const versionActual = Constants.expoConfig?.version ?? '0.0.0';
        if (esVersionAnterior(versionActual, VERSION_MINIMA_APP)) {
          requiereActualizacion = true;
          return;
        }

        const usuario = await conLimiteDeTiempo(
          servicioAutenticacion.obtenerUsuarioActual(),
          MS_LIMITE_VERIFICACION_SESION,
          null,
        );
        console.log('SESSION cargada:', usuario ? `usuario ${usuario.rol}` : 'invitado');
        if (usuario) destino = usuario.rol === 'administrador' ? '/admin' : '/(tabs)';
      } catch (err) {
        // Fallback seguro: cualquier error no previsto no debe dejar la
        // app pegada — se trata como invitado y se manda a login.
        console.error('BOOTSTRAP: error inesperado verificando sesión, se continúa como invitado.', err);
      } finally {
        if (cancelado) return;
        clearTimeout(temporizadorReintento);

        if (requiereActualizacion) {
          setFase('actualizacion-requerida');
        } else {
          const transcurrido = Date.now() - inicio;
          if (transcurrido < MS_VISUALIZACION_MINIMA_SPLASH) {
            await esperar(MS_VISUALIZACION_MINIMA_SPLASH - transcurrido);
          }
          if (!cancelado) {
            console.log('BOOTSTRAP 3: navegando a', destino);
            router.replace(destino);
          }
        }
      }
    }

    verificarYNavegar().catch((err) => {
      console.error('BOOTSTRAP: verificarYNavegar rechazó sin manejar (no debería pasar).', err);
    });

    return () => {
      cancelado = true;
      clearTimeout(temporizadorReintento);
    };
  }, [fuentesListas]);

  return { fase, fuentesListas, abrirTiendaParaActualizar };
}
