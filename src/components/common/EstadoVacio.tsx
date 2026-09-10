import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { ESPACIO, MEDIDAS, TIPOGRAFIA } from '@/constants/theme';
import { BotonPrimario } from './BotonPrimario';

interface PropiedadesEstadoVacio {
  icono?: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descripcion?: string;
  textoBoton?: string;
  alPresionarBoton?: () => void;
}

export function EstadoVacio({
  icono,
  titulo,
  descripcion,
  textoBoton,
  alPresionarBoton,
}: PropiedadesEstadoVacio) {
  return (
    <View style={styles.contenedor}>
      {icono ? <Ionicons name={icono} size={30} color={COLORS.tinta20} /> : null}
      <Text style={styles.titulo}>{titulo}</Text>
      {descripcion ? <Text style={styles.descripcion}>{descripcion}</Text> : null}
      {textoBoton && alPresionarBoton ? (
        <BotonPrimario
          texto={textoBoton}
          onPress={alPresionarBoton}
          variante="contorno"
          style={styles.boton}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: MEDIDAS.margenLateral,
    paddingVertical: ESPACIO.enorme,
    gap: ESPACIO.md,
  },
  titulo: {
    fontFamily: TIPOGRAFIA.titulo,
    fontSize: 16,
    color: COLORS.tinta,
    textAlign: 'center',
  },
  descripcion: {
    fontFamily: TIPOGRAFIA.cuerpo,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textoSecundario,
    textAlign: 'center',
    maxWidth: 260,
  },
  boton: {
    marginTop: ESPACIO.sm,
    alignSelf: 'stretch',
    maxWidth: 280,
  },
});
