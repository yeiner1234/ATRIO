import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { ESPACIO, TIPOGRAFIA } from '@/constants/theme';

interface PropiedadesPantallaEnConstruccion {
  titulo: string;
}

export function PantallaEnConstruccion({ titulo }: PropiedadesPantallaEnConstruccion) {
  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.centro}>
        <Text style={styles.titulo}>{titulo}</Text>
        <Text style={styles.nota}>EN CONSTRUCCIÓN</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORS.papel },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: ESPACIO.sm },
  titulo: { fontFamily: TIPOGRAFIA.titulo, fontSize: 20, color: COLORS.tinta },
  nota: {
    fontFamily: TIPOGRAFIA.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: COLORS.textoSecundario,
  },
});
