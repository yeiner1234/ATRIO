import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EncabezadoPantalla } from '@/components/common/EncabezadoPantalla';
import { ESPACIO, MEDIDAS, RADIO, TIPOGRAFIA } from '@/constants/theme';
import { metodosPago } from '@/data/metodosPago';
import { useConfiguracion } from '@/hooks/useConfiguracion';
import { useTema } from '@/hooks/useTema';

// DECISIÓN DE DISEÑO (sección 12 de la auditoría): no hay pasarela de pago
// real conectada, así que no tiene sentido simular una "tarjeta guardada"
// con número/CVV falsos — eso sería peor que no tenerlo, porque parecería
// una tarjeta real sin serlo. Esta pantalla guarda ÚNICAMENTE cuál de las
// opciones de /pago quieres que se preseleccione la próxima vez que
// compres — una preferencia de UI, nunca un dato bancario. Vive en
// AsyncStorage (vía ConfiguracionContext), igual que "modo oscuro".
export default function PantallaMetodosPago() {
  const { colores } = useTema();
  const { preferencias, elegirMetodoPagoPreferido } = useConfiguracion();

  return (
    <SafeAreaView style={[styles.pantalla, { backgroundColor: colores.papel }]} edges={['top']}>
      <EncabezadoPantalla titulo="Métodos de pago" conBotonVolver />
      <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
        <Text style={[styles.nota, { color: colores.textoSecundario }]}>
          ATRIO todavía no tiene una pasarela de pago real conectada, así que no se guardan
          tarjetas ni ningún dato bancario. Puedes elegir cuál opción prefieres que aparezca ya
          marcada cuando vayas a pagar.
        </Text>

        {metodosPago.map((opcion) => {
          const seleccionado = preferencias.metodoPagoPreferido === opcion.metodo;
          return (
            <Pressable
              key={opcion.metodo}
              style={[styles.opcion, { borderColor: colores.borde, backgroundColor: colores.blanco }, seleccionado && { borderColor: colores.tinta }]}
              onPress={() => elegirMetodoPagoPreferido(seleccionado ? null : opcion.metodo)}
              accessibilityRole="radio"
              accessibilityState={{ selected: seleccionado }}
            >
              <Ionicons
                name={seleccionado ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={seleccionado ? colores.tinta : colores.tinta40}
              />
              <View style={styles.textosOpcion}>
                <Text style={[styles.nombreOpcion, { color: colores.tinta }]}>{opcion.nombre}</Text>
                <Text style={[styles.descripcionOpcion, { color: colores.textoSecundario }]}>
                  {opcion.descripcion}
                </Text>
              </View>
            </Pressable>
          );
        })}

        {preferencias.metodoPagoPreferido ? (
          <Pressable
            style={styles.enlaceQuitar}
            onPress={() => elegirMetodoPagoPreferido(null)}
            accessibilityRole="button"
          >
            <Text style={[styles.textoEnlaceQuitar, { color: colores.arcilla }]}>
              QUITAR PREFERENCIA
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  contenido: {
    paddingHorizontal: MEDIDAS.margenLateral,
    paddingTop: ESPACIO.base,
    paddingBottom: ESPACIO.xxl,
    gap: ESPACIO.sm,
  },
  nota: {
    fontFamily: TIPOGRAFIA.cuerpo,
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: ESPACIO.base,
  },
  opcion: {
    minHeight: MEDIDAS.areaTactilMinima + ESPACIO.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIO.md,
    paddingHorizontal: ESPACIO.base,
    paddingVertical: ESPACIO.md,
    borderWidth: 1,
    borderRadius: RADIO.imagen,
  },
  textosOpcion: { flex: 1, gap: 2 },
  nombreOpcion: { fontFamily: TIPOGRAFIA.titulo, fontSize: 14 },
  descripcionOpcion: { fontFamily: TIPOGRAFIA.mono, fontSize: 11 },
  enlaceQuitar: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', marginTop: ESPACIO.sm },
  textoEnlaceQuitar: { fontFamily: TIPOGRAFIA.etiqueta, fontSize: 11.5, letterSpacing: 0.5 },
});
