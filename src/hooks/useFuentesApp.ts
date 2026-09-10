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

export function useFuentesApp(): boolean {
  const [fuentesListas] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_900Black,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
  });
  return fuentesListas;
}
