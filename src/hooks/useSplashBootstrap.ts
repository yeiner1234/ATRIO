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
import { servicioAlmacenamiento } from '@/services/storageService';
import { esVersionAnterior } from '@/utils/version';

export type FaseInicio = 'verificando' | 'reintentando' | 'actualizacion-requerida';

interface EstadoInicioAplicacion {
  fase: FaseInicio;
  fuentesListas: boolean;
  abrirTiendaParaActualizar: () => void;
}

const esperar = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms));

SplashScreen.preventAutoHideAsync().catch(() => {});

export function useSplashBootstrap(): EstadoInicioAplicacion {
  const [fuentesListas] = useFonts({
    Archivo_400Regular,
    Archivo_900Black,
    IBMPlexMono_500Medium,
  });

  const [fase, setFase] = useState<FaseInicio>('verificando');

  const abrirTiendaParaActualizar = useCallback(() => {
    Linking.openURL(URL_TIENDA).catch(() => {});
  }, []);

  useEffect(() => {
    if (!fuentesListas) return;

    SplashScreen.hideAsync().catch(() => {});

    let cancelado = false;
    const inicio = Date.now();
    const temporizadorReintento = setTimeout(() => {
      if (!cancelado) {
        setFase((faseActual) => (faseActual === 'verificando' ? 'reintentando' : faseActual));
      }
    }, MS_PARA_REINTENTAR_SPLASH);

    async function verificarYNavegar() {
      const versionActual = Constants.expoConfig?.version ?? '0.0.0';
      if (esVersionAnterior(versionActual, VERSION_MINIMA_APP)) {
        if (!cancelado) setFase('actualizacion-requerida');
        clearTimeout(temporizadorReintento);
        return;
      }

      let destino: '/(tabs)' | '/(auth)/login' = '/(auth)/login';
      const token = await servicioAlmacenamiento.obtenerTokenSesion();
      if (token) destino = '/(tabs)';

      const transcurrido = Date.now() - inicio;
      if (transcurrido < MS_VISUALIZACION_MINIMA_SPLASH) {
        await esperar(MS_VISUALIZACION_MINIMA_SPLASH - transcurrido);
      }

      if (cancelado) return;
      clearTimeout(temporizadorReintento);
      router.replace(destino);
    }

    verificarYNavegar();

    return () => {
      cancelado = true;
      clearTimeout(temporizadorReintento);
    };
  }, [fuentesListas]);

  return { fase, fuentesListas, abrirTiendaParaActualizar };
}
