import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { ESPACIO, MEDIDAS, TIPOGRAFIA } from '@/constants/theme';
import { useTema } from '@/hooks/useTema';
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
  const { colores } = useTema();

  return (
    <View style={styles.contenedor}>
      {icono ? <Ionicons name={icono} size={30} color={colores.tinta20} /> : null}
      <Text style={[styles.titulo, { color: colores.tinta }]}>{titulo}</Text>
      {descripcion ? (
        <Text style={[styles.descripcion, { color: colores.textoSecundario }]}>{descripcion}</Text>
      ) : null}
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
    textAlign: 'center',
  },
  descripcion: {
    fontFamily: TIPOGRAFIA.cuerpo,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 260,
  },
  boton: {
    marginTop: ESPACIO.sm,
    alignSelf: 'stretch',
    maxWidth: 280,
  },
});
