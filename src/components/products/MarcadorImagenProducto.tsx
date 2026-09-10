import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { COLORS } from '@/constants/colors';
import { RADIO, RELACION_IMAGEN, TIPOGRAFIA } from '@/constants/theme';

interface PropiedadesMarcadorImagenProducto {
  relacion?: number;
  etiquetaDimension?: string;
  radio?: number;
  sinEtiqueta?: boolean;
  llenar?: boolean;
  style?: StyleProp<ViewStyle>;
}

const CANTIDAD_RAYAS = 26;

export function MarcadorImagenProducto({
  relacion = RELACION_IMAGEN.producto,
  etiquetaDimension = '900×1200',
  radio = RADIO.imagen,
  sinEtiqueta = false,
  llenar = false,
  style,
}: PropiedadesMarcadorImagenProducto) {
  return (
    <View
      style={[
        styles.contenedor,
        { borderRadius: radio },
        llenar ? styles.lleno : { aspectRatio: relacion },
        style,
      ]}
    >
      <View style={styles.rayas} pointerEvents="none">
        {Array.from({ length: CANTIDAD_RAYAS }).map((_, indice) => (
          <View key={indice} style={[styles.raya, { top: indice * 26 - 160 }]} />
        ))}
      </View>
      {!sinEtiqueta ? <Text style={styles.etiqueta}>{`[ ${etiquetaDimension} ]`}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    width: '100%',
    backgroundColor: COLORS.lino,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lleno: StyleSheet.absoluteFillObject,
  rayas: StyleSheet.absoluteFillObject,
  raya: {
    position: 'absolute',
    left: -200,
    right: -200,
    height: 1.5,
    backgroundColor: COLORS.tinta08,
    transform: [{ rotate: '-45deg' }],
  },
  etiqueta: {
    fontFamily: TIPOGRAFIA.mono,
    fontSize: 11,
    letterSpacing: 1,
    color: COLORS.tinta45,
  },
});
