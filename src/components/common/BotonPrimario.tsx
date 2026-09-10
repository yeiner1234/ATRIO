import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { COLORS } from '@/constants/colors';
import { MEDIDAS, RADIO, TIPOGRAFIA } from '@/constants/theme';

type VarianteBoton = 'solido' | 'contorno' | 'claro';

interface PropiedadesBotonPrimario {
  texto: string;
  onPress: () => void;
  variante?: VarianteBoton;
  deshabilitado?: boolean;
  cargando?: boolean;
  altura?: number;
  style?: StyleProp<ViewStyle>;
}

export function BotonPrimario({
  texto,
  onPress,
  variante = 'solido',
  deshabilitado = false,
  cargando = false,
  altura = 54,
  style,
}: PropiedadesBotonPrimario) {
  const inactivo = deshabilitado || cargando;
  const colorTexto = variante === 'solido' ? COLORS.papel : COLORS.tinta;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inactivo}
      style={({ pressed }) => [
        styles.base,
        { height: altura },
        variante === 'solido' && styles.solido,
        variante === 'contorno' && styles.contorno,
        variante === 'claro' && styles.claro,
        pressed && !inactivo && styles.presionado,
        inactivo && styles.inactivo,
        style,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={colorTexto} />
      ) : (
        <Text style={[styles.texto, { color: colorTexto }]}>{texto}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MEDIDAS.areaTactilMinima,
    borderRadius: RADIO.imagen,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  solido: { backgroundColor: COLORS.tinta },
  contorno: { borderWidth: 1, borderColor: COLORS.tinta },
  claro: { backgroundColor: COLORS.papel },
  presionado: { opacity: 0.85 },
  inactivo: { opacity: 0.4 },
  texto: {
    fontFamily: TIPOGRAFIA.titulo,
    fontSize: 13,
    letterSpacing: 1.3,
  },
});
