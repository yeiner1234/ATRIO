import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { ESPACIO, TIPOGRAFIA } from '@/constants/theme';
import type { EtiquetaProducto, Producto } from '@/types';
import { formatearSoles } from '@/utils/moneda';
import { MarcadorImagenProducto } from './MarcadorImagenProducto';

interface PropiedadesTarjetaProducto {
  producto: Producto;
  alPresionar: () => void;
  esFavorito: boolean;
  alAlternarFavorito: () => void;
  mostrarEtiquetas?: boolean;
}

function colorEtiqueta(etiqueta: EtiquetaProducto): string {
  return etiqueta === '-15%' ? COLORS.arcilla : COLORS.tinta;
}

export function TarjetaProducto({
  producto,
  alPresionar,
  esFavorito,
  alAlternarFavorito,
  mostrarEtiquetas = false,
}: PropiedadesTarjetaProducto) {
  return (
    <Pressable style={styles.contenedor} onPress={alPresionar} accessibilityRole="button">
      <View>
        <MarcadorImagenProducto />
        {mostrarEtiquetas && producto.etiquetas.length > 0 ? (
          <View style={styles.etiquetas}>
            {producto.etiquetas.map((etiqueta) => (
              <View
                key={etiqueta}
                style={[styles.etiqueta, { backgroundColor: colorEtiqueta(etiqueta) }]}
              >
                <Text style={styles.etiquetaTexto}>{etiqueta}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.filaNombre}>
        <Text style={styles.nombre} numberOfLines={1}>
          {producto.nombre}
        </Text>
        <Pressable
          onPress={alAlternarFavorito}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={esFavorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        >
          <Ionicons
            name={esFavorito ? 'heart' : 'heart-outline'}
            size={18}
            color={esFavorito ? COLORS.arcilla : COLORS.tinta}
          />
        </Pressable>
      </View>

      <View style={styles.filaPrecio}>
        <Text style={styles.precio}>{formatearSoles(producto.precio)}</Text>
        {producto.precioAnterior ? (
          <Text style={styles.precioAnterior}>{formatearSoles(producto.precioAnterior)}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, gap: ESPACIO.sm },
  etiquetas: {
    position: 'absolute',
    top: ESPACIO.sm,
    left: ESPACIO.sm,
    gap: ESPACIO.xs,
    alignItems: 'flex-start',
  },
  etiqueta: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
  },
  etiquetaTexto: {
    fontFamily: TIPOGRAFIA.mono,
    fontSize: 9,
    letterSpacing: 0.5,
    color: COLORS.papel,
  },
  filaNombre: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ESPACIO.sm,
    minHeight: 20,
  },
  nombre: {
    flex: 1,
    fontFamily: TIPOGRAFIA.cuerpo,
    fontSize: 12.5,
    color: COLORS.tinta,
  },
  filaPrecio: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: ESPACIO.sm,
  },
  precio: {
    fontFamily: TIPOGRAFIA.monoFuerte,
    fontSize: 13,
    color: COLORS.tinta,
  },
  precioAnterior: {
    fontFamily: TIPOGRAFIA.mono,
    fontSize: 11,
    color: COLORS.tinta45,
    textDecorationLine: 'line-through',
  },
});
