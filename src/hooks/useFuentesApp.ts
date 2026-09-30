import { useEffect, useState } from 'react';
import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_900Black,
  useFonts,
} from '@expo-google-fonts/archivo';
import {
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
} from '@expo-google-fonts/ibm-plex-mono';

// `app/_layout.tsx` no renderiza NADA hasta que esto devuelva true — antes
// solo miraba `fuentesListas` e ignoraba el error que useFonts también
// puede devolver. Si la carga fallaba (red lenta/Expo Go, fuente
// corrupta), la app se quedaba con pantalla en blanco para siempre, sin
// ningún aviso. Ahora un error o una demora larga también deja pasar (con
// la fuente del sistema como respaldo) en vez de bloquear la app entera.
const MS_LIMITE_CARGA_FUENTES = 6000;

export function useFuentesApp(): boolean {
  const [fuentesListas, errorFuentes] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_900Black,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
  });
  const [tiempoAgotado, setTiempoAgotado] = useState(false);

  useEffect(() => {
    if (fuentesListas || errorFuentes) return;
    const temporizador = setTimeout(() => setTiempoAgotado(true), MS_LIMITE_CARGA_FUENTES);
    return () => clearTimeout(temporizador);
  }, [fuentesListas, errorFuentes]);

  useEffect(() => {
    if (errorFuentes) {
      console.error('useFuentesApp: no se pudieron cargar las fuentes, se continúa con la fuente del sistema.', errorFuentes);
    }
  }, [errorFuentes]);

  return fuentesListas || !!errorFuentes || tiempoAgotado;
}
