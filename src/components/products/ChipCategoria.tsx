import { Pressable, StyleSheet, Text } from 'react-native';
import { MEDIDAS, RADIO, TIPOGRAFIA } from '@/constants/theme';
import { useTema } from '@/hooks/useTema';

interface PropiedadesChipCategoria {
  texto: string;
  activo: boolean;
  alPresionar: () => void;
}

export function ChipCategoria({ texto, activo, alPresionar }: PropiedadesChipCategoria) {
  const { colores } = useTema();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      onPress={alPresionar}
      style={[
        styles.chip,
        activo
          ? { backgroundColor: colores.tinta }
          : { backgroundColor: colores.lino, borderWidth: 1, borderColor: colores.borde },
      ]}
    >
      <Text style={[styles.texto, { color: activo ? colores.papel : colores.tinta }]}>{texto}</Text>
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
  texto: { fontFamily: TIPOGRAFIA.etiqueta, fontSize: 12 },
});
