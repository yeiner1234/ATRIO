import { Pressable, StyleSheet, Text } from 'react-native';
import { COLORS } from '@/constants/colors';
import { MEDIDAS, RADIO, TIPOGRAFIA } from '@/constants/theme';

interface PropiedadesChipCategoria {
  texto: string;
  activo: boolean;
  alPresionar: () => void;
}

export function ChipCategoria({ texto, activo, alPresionar }: PropiedadesChipCategoria) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      onPress={alPresionar}
      style={[styles.chip, activo ? styles.activo : styles.inactivo]}
    >
      <Text style={[styles.texto, activo ? styles.textoActivo : styles.textoInactivo]}>
        {texto}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: MEDIDAS.areaTactilMinima,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIO.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activo: { backgroundColor: COLORS.tinta },
  inactivo: { backgroundColor: COLORS.lino, borderWidth: 1, borderColor: COLORS.borde },
  texto: { fontFamily: TIPOGRAFIA.etiqueta, fontSize: 12 },
  textoActivo: { color: COLORS.papel },
  textoInactivo: { color: COLORS.tinta },
});
