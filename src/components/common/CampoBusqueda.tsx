import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';
import { ESPACIO, MEDIDAS, RADIO, TIPOGRAFIA } from '@/constants/theme';
import { useTema } from '@/hooks/useTema';

interface PropiedadesCampoBusqueda {
  valor: string;
  alCambiar: (texto: string) => void;
  placeholder: string;
}

export function CampoBusqueda({ valor, alCambiar, placeholder }: PropiedadesCampoBusqueda) {
  const { colores } = useTema();

  return (
    <View style={[styles.contenedor, { backgroundColor: colores.blanco, borderColor: colores.borde }]}>
      <Ionicons name="search" size={18} color={colores.tinta45} />
      <TextInput
        style={[styles.entrada, { color: colores.tinta }]}
        value={valor}
        onChangeText={alCambiar}
        placeholder={placeholder}
        placeholderTextColor={colores.tinta45}
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
    borderWidth: 1,
    borderRadius: RADIO.imagen,
  },
  entrada: {
    flex: 1,
    fontFamily: TIPOGRAFIA.cuerpo,
    fontSize: 14,
    paddingVertical: 0,
  },
});
