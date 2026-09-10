import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { ESPACIO, TIPOGRAFIA } from '@/constants/theme';
import type { Categoria } from '@/types';
import { MarcadorImagenProducto } from './MarcadorImagenProducto';

interface PropiedadesCirculoCategoria {
  categoria: Categoria;
  alPresionar: () => void;
}

const DIAMETRO = 82;

export function CirculoCategoria({ categoria, alPresionar }: PropiedadesCirculoCategoria) {
  return (
    <Pressable style={styles.contenedor} onPress={alPresionar} accessibilityRole="button">
      <View style={styles.circulo}>
        <MarcadorImagenProducto llenar radio={DIAMETRO / 2} sinEtiqueta />
      </View>
      <Text style={styles.nombre} numberOfLines={1}>
        {categoria.nombre}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenedor: { alignItems: 'center', gap: ESPACIO.sm, width: DIAMETRO },
  circulo: {
    width: DIAMETRO,
    height: DIAMETRO,
    borderRadius: DIAMETRO / 2,
    overflow: 'hidden',
    backgroundColor: COLORS.lino,
  },
  nombre: {
    fontFamily: TIPOGRAFIA.etiqueta,
    fontSize: 11,
    color: COLORS.tinta,
  },
});
