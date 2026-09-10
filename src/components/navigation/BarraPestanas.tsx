import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { ESPACIO, MEDIDAS, TIPOGRAFIA } from '@/constants/theme';
import { useCarrito } from '@/hooks/useCarrito';

const ICONOS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline',
  catalogo: 'grid-outline',
  favoritos: 'heart-outline',
  carrito: 'bag-outline',
  perfil: 'person-outline',
};

const ETIQUETAS: Record<string, string> = {
  index: 'Inicio',
  catalogo: 'Catálogo',
  favoritos: 'Favoritos',
  carrito: 'Carrito',
  perfil: 'Perfil',
};

export function BarraPestanas({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { contador } = useCarrito();

  return (
    <View style={[styles.contenedor, { paddingBottom: insets.bottom, height: MEDIDAS.alturaBarraPestanas + insets.bottom }]}>
      {state.routes.map((ruta, indice) => {
        const activo = state.index === indice;
        const nombreIcono = ICONOS[ruta.name] ?? 'ellipse-outline';
        const color = activo ? COLORS.tinta : COLORS.tinta42;

        const alPresionar = () => {
          const evento = navigation.emit({
            type: 'tabPress',
            target: ruta.key,
            canPreventDefault: true,
          });
          if (!activo && !evento.defaultPrevented) {
            navigation.navigate(ruta.name);
          }
        };

        return (
          <Pressable
            key={ruta.key}
            style={styles.destino}
            onPress={alPresionar}
            accessibilityRole="button"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={ETIQUETAS[ruta.name]}
          >
            <View>
              <Ionicons name={nombreIcono} size={22} color={color} />
              {ruta.name === 'carrito' && contador > 0 ? (
                <View style={styles.contador}>
                  <Text style={styles.contadorTexto}>{contador}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.etiqueta, { color }]}>{ETIQUETAS[ruta.name]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    backgroundColor: COLORS.papel,
    borderTopWidth: 1,
    borderTopColor: COLORS.borde,
    paddingTop: ESPACIO.md,
  },
  destino: {
    flex: 1,
    alignItems: 'center',
    gap: ESPACIO.xs,
  },
  etiqueta: {
    fontFamily: TIPOGRAFIA.etiqueta,
    fontSize: 9.5,
  },
  contador: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: COLORS.arcilla,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadorTexto: {
    fontFamily: TIPOGRAFIA.monoFuerte,
    fontSize: 9,
    color: COLORS.papel,
  },
});
