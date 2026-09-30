import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MEDIDAS } from '@/constants/theme';
import { useTema } from '@/hooks/useTema';
import type { OrigenAsistente } from '@/types';

const TAMANO_BOTON = 54;

interface BotonAsistenteIAProps {
  origen: OrigenAsistente;
}

export function BotonAsistenteIA({ origen }: BotonAsistenteIAProps) {
  const insets = useSafeAreaInsets();
  const { colores } = useTema();

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/asistente', params: { origen } })}
      accessibilityRole="button"
      accessibilityLabel="Abrir asistente de ATRIO"
      hitSlop={8}
      style={({ pressed }) => [
        styles.boton,
        {
          bottom: MEDIDAS.alturaBarraPestanas + insets.bottom + 16,
          backgroundColor: colores.tinta,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Ionicons name="sparkles" size={24} color={colores.papel} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    position: 'absolute',
    right: 18,
    width: TAMANO_BOTON,
    height: TAMANO_BOTON,
    borderRadius: TAMANO_BOTON / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 20,
  },
});
