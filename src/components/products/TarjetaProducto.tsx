import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ESPACIO, TIPOGRAFIA } from '@/constants/theme';
import { useTema } from '@/hooks/useTema';
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

export function TarjetaProducto({
  producto,
  alPresionar,
  esFavorito,
  alAlternarFavorito,
  mostrarEtiquetas = false,
}: PropiedadesTarjetaProducto) {
  const { colores } = useTema();
  const colorEtiqueta = (etiqueta: EtiquetaProducto) => (etiqueta === '-15%' ? colores.arcilla : colores.tinta);

  return (
    <View style={styles.contenedor}>
      <Pressable
        style={styles.superficiePresionable}
        onPress={alPresionar}
        accessibilityRole="button"
        accessibilityLabel={producto.nombre}
      />

      <View>
        <MarcadorImagenProducto uri={producto.imagenes[0]} />
        {mostrarEtiquetas && producto.etiquetas.length > 0 ? (
          <View style={styles.etiquetas}>
            {producto.etiquetas.map((etiqueta) => (
              <View
                key={etiqueta}
                style={[styles.etiqueta, { backgroundColor: colorEtiqueta(etiqueta) }]}
              >
                <Text style={[styles.etiquetaTexto, { color: colores.papel }]}>{etiqueta}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.filaNombre}>
        <Text style={[styles.nombre, { color: colores.tinta }]} numberOfLines={1}>
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
            color={esFavorito ? colores.arcilla : colores.tinta}
          />
        </Pressable>
      </View>

      <View style={styles.filaPrecio}>
        <Text style={[styles.precio, { color: colores.tinta }]}>{formatearSoles(producto.precio)}</Text>
        {producto.precioAnterior ? (
          <Text style={[styles.precioAnterior, { color: colores.tinta45 }]}>
            {formatearSoles(producto.precioAnterior)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, gap: ESPACIO.sm },
  superficiePresionable: StyleSheet.absoluteFill,
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
  },
  filaPrecio: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: ESPACIO.sm,
  },
  precio: {
    fontFamily: TIPOGRAFIA.monoFuerte,
    fontSize: 13,
  },
  precioAnterior: {
    fontFamily: TIPOGRAFIA.mono,
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
});
