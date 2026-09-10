import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { ESPACIO, MEDIDAS, TIPOGRAFIA } from '@/constants/theme';

interface PropiedadesEncabezadoPantalla {
  titulo: string;
  tamanoTitulo?: number;
  subtitulo?: string;
  derecha?: ReactNode;
  conBotonVolver?: boolean;
}

export function EncabezadoPantalla({
  titulo,
  tamanoTitulo = 22,
  subtitulo,
  derecha,
  conBotonVolver = false,
}: PropiedadesEncabezadoPantalla) {
  return (
    <View style={styles.contenedor}>
      <View style={styles.fila}>
        <View style={styles.izquierda}>
          {conBotonVolver ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver"
              hitSlop={12}
              onPress={() => router.back()}
              style={styles.botonVolver}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.tinta} />
            </Pressable>
          ) : null}
          <Text style={[styles.titulo, { fontSize: tamanoTitulo }]}>{titulo}</Text>
        </View>
        {derecha ? <View>{derecha}</View> : null}
      </View>
      {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    paddingHorizontal: MEDIDAS.margenLateral,
    paddingTop: ESPACIO.md,
    paddingBottom: ESPACIO.base,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MEDIDAS.areaTactilMinima,
  },
  izquierda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIO.xs,
    flexShrink: 1,
  },
  botonVolver: {
    width: MEDIDAS.areaTactilMinima,
    height: MEDIDAS.areaTactilMinima,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -ESPACIO.md,
  },
  titulo: {
    fontFamily: TIPOGRAFIA.titulo,
    color: COLORS.tinta,
  },
  subtitulo: {
    marginTop: ESPACIO.xs,
    fontFamily: TIPOGRAFIA.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.textoSecundario,
  },
});
