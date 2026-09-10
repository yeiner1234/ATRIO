import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { ESPACIO, MEDIDAS, RADIO, TIPOGRAFIA } from '@/constants/theme';

interface PropiedadesCampoBusqueda {
  valor: string;
  alCambiar: (texto: string) => void;
  placeholder: string;
}

export function CampoBusqueda({ valor, alCambiar, placeholder }: PropiedadesCampoBusqueda) {
  return (
    <View style={styles.contenedor}>
      <Ionicons name="search" size={18} color={COLORS.tinta45} />
      <TextInput
        style={styles.entrada}
        value={valor}
        onChangeText={alCambiar}
        placeholder={placeholder}
        placeholderTextColor={COLORS.tinta45}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    height: MEDIDAS.areaTactilMinima,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIO.sm,
    paddingHorizontal: ESPACIO.md,
    backgroundColor: COLORS.blanco,
    borderWidth: 1,
    borderColor: COLORS.borde,
    borderRadius: RADIO.imagen,
  },
  entrada: {
    flex: 1,
    fontFamily: TIPOGRAFIA.cuerpo,
    fontSize: 14,
    color: COLORS.tinta,
    paddingVertical: 0,
  },
});
